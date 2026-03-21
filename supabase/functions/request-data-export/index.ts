import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { getConfig } from "../_shared/config.ts";
import { HttpError, jsonResponse, sanitizeErrorResponse } from "../_shared/errors.ts";

type Deps = {
  createSupabase: (authHeader: string, serviceRoleKey: string, supabaseUrl: string) => SupabaseClient;
  nowIso: () => string;
};

const defaultDeps: Deps = {
  createSupabase: (authHeader, serviceRoleKey, supabaseUrl) => createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  }),
  nowIso: () => new Date().toISOString(),
};

export const handleRequestDataExport = async (req: Request, deps: Deps = defaultDeps): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST is allowed.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new HttpError(401, "unauthorized", "Missing authorization token.");
    }

    const config = getConfig();
    const supabase = deps.createSupabase(authHeader, config.supabaseServiceRoleKey, config.supabaseUrl);

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      throw new HttpError(401, "unauthorized", "Invalid user token.");
    }

    const userId = userData.user.id;

    const [profileRes, sessionsRes, attemptsRes, feedbackRes, mistakesRes, streakRes, subsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("practice_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("session_attempts").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("feedback_items").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("user_mistakes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("user_streaks").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);

    const errored = [profileRes, sessionsRes, attemptsRes, feedbackRes, mistakesRes, streakRes, subsRes].find((x) => x.error);
    if (errored?.error) {
      throw new HttpError(500, "export_query_failed", "Failed to fetch export data.");
    }

    const requestedAt = deps.nowIso();
    const requestId = crypto.randomUUID();
    const bundlePath = `${userId}/${requestId}.json`;

    const exportBundle = {
      metadata: {
        request_id: requestId,
        user_id: userId,
        requested_at: requestedAt,
      },
      profile: profileRes.data,
      sessions: sessionsRes.data ?? [],
      attempts: attemptsRes.data ?? [],
      feedback_items: feedbackRes.data ?? [],
      user_mistakes: mistakesRes.data ?? [],
      streak: streakRes.data,
      subscriptions: subsRes.data ?? [],
    };

    const { error: uploadError } = await supabase.storage
      .from(config.dataExportBucket)
      .upload(bundlePath, JSON.stringify(exportBundle, null, 2), {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      throw new HttpError(500, "export_upload_failed", "Failed to persist export bundle.");
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(config.dataExportBucket)
      .createSignedUrl(bundlePath, 60 * 15);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new HttpError(500, "export_sign_failed", "Failed to sign export bundle.");
    }

    const { error: requestRecordError } = await supabase
      .from("data_export_requests")
      .insert({
        id: requestId,
        user_id: userId,
        status: "completed",
        bundle_path: bundlePath,
        requested_at: requestedAt,
        completed_at: deps.nowIso(),
      });

    if (requestRecordError) {
      throw new HttpError(500, "export_request_record_failed", "Failed to save export request audit.");
    }

    return jsonResponse({
      request_id: requestId,
      download_url: signedUrlData.signedUrl,
      expires_in_seconds: 60 * 15,
    });
  } catch (error) {
    return sanitizeErrorResponse(error);
  }
};

if (import.meta.main) {
  Deno.serve(handleRequestDataExport);
}
