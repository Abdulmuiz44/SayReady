import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { getConfig } from "../_shared/config.ts";
import { HttpError, jsonResponse, sanitizeErrorResponse } from "../_shared/errors.ts";

type RevenueCatEvent = {
  id?: string;
  event_timestamp_ms?: number;
  app_user_id?: string;
  entitlement_ids?: string[];
  product_id?: string;
  expiration_at_ms?: number | null;
  type?: string;
};

type RevenueCatPayload = {
  event?: RevenueCatEvent;
};

type Deps = {
  createSupabase: (serviceRoleKey: string, supabaseUrl: string) => SupabaseClient;
};

const defaultDeps: Deps = {
  createSupabase: (serviceRoleKey, supabaseUrl) => createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  }),
};

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

export const handleRevenuecatWebhook = async (req: Request, deps: Deps = defaultDeps): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST is allowed.");
    }

    const config = getConfig();
    if (!config.revenueCatWebhookSecret) {
      throw new HttpError(500, "webhook_not_configured", "RevenueCat webhook secret is not configured.");
    }

    const providedSecret = req.headers.get("X-Authorization") ?? req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!providedSecret || !timingSafeEqual(providedSecret, config.revenueCatWebhookSecret)) {
      throw new HttpError(401, "unauthorized", "Invalid webhook secret.");
    }

    const bodyText = await req.text();
    const payload = JSON.parse(bodyText) as RevenueCatPayload;
    const event = payload.event;

    if (!event?.id || !event.app_user_id) {
      throw new HttpError(400, "invalid_payload", "Missing required RevenueCat event fields.");
    }

    const supabase = deps.createSupabase(config.supabaseServiceRoleKey, config.supabaseUrl);

    const { error: eventInsertError } = await supabase
      .from("revenuecat_webhook_events")
      .insert({
        event_id: event.id,
        event_type: event.type ?? "unknown",
        app_user_id: event.app_user_id,
        payload: payload,
        delivered_at: new Date(event.event_timestamp_ms ?? Date.now()).toISOString(),
      });

    if (eventInsertError) {
      if (eventInsertError.code === "23505") {
        return jsonResponse({ received: true, deduplicated: true });
      }
      throw new HttpError(500, "webhook_event_persist_failed", "Failed to persist webhook event.");
    }

    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
    const active = expiresAt ? new Date(expiresAt) > new Date() : ["INITIAL_PURCHASE", "RENEWAL"].includes(event.type ?? "");

    const entitlement = event.entitlement_ids?.[0] ?? null;

    const { error: subscriptionUpsertError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: event.app_user_id,
        entitlement,
        product_id: event.product_id ?? null,
        current_period_ends_at: expiresAt,
        active,
        source: "revenuecat",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,source" });

    if (subscriptionUpsertError) {
      throw new HttpError(500, "subscription_upsert_failed", "Failed to update subscription from webhook.");
    }

    return jsonResponse({ received: true, deduplicated: false });
  } catch (error) {
    return sanitizeErrorResponse(error);
  }
};

if (import.meta.main) {
  Deno.serve(handleRevenuecatWebhook);
}
