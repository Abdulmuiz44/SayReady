import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

import { getConfig } from "../_shared/config.ts";
import { HttpError, jsonResponse, sanitizeErrorResponse } from "../_shared/errors.ts";
import { buildScenarioRecommendation } from "../../../packages/config/src/recommendation.mjs";

const requestSchema = z.object({
  primary_goal: z.string().min(1).max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "Only POST is allowed.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new HttpError(401, "unauthorized", "Missing authorization token.");
    }

    const config = getConfig();

    const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      throw new HttpError(401, "unauthorized", "Invalid user token.");
    }

    const payload = requestSchema.parse(req.body ? await req.json() : {});
    const targetDate = payload.date ?? new Date().toISOString().slice(0, 10);

    const { data: activeSub, error: subError } = await supabase
      .from("subscriptions")
      .select("id,status,current_period_end")
      .eq("user_id", userData.user.id)
      .in("status", ["trialing", "active"])
      .gte("current_period_end", new Date().toISOString())
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      throw new HttpError(500, "subscription_lookup_failed", "Failed to determine subscription entitlement.");
    }

    const { data: categoryRows, error: categoryError } = await supabase
      .from("practice_sessions")
      .select("scenario:scenarios(category)")
      .eq("user_id", userData.user.id)
      .gte("created_at", new Date(Date.now() - (28 * 24 * 60 * 60 * 1000)).toISOString());

    if (categoryError) {
      throw new HttpError(500, "category_history_query_failed", "Failed to load category history.");
    }

    const categoryCounts = new Map<string, number>();
    for (const row of categoryRows ?? []) {
      const category = (row as { scenario?: { category?: string } | null }).scenario?.category;
      if (!category) continue;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    const averages = [...categoryCounts.values()];
    const averageCount = averages.length > 0
      ? averages.reduce((sum, current) => sum + current, 0) / averages.length
      : 0;

    const underPracticedCategories = [...categoryCounts.entries()]
      .filter(([, count]) => count <= averageCount)
      .map(([category]) => category);

    const { data: mistakeRows, error: mistakesError } = await supabase
      .from("user_mistakes")
      .select("mistake_key")
      .eq("user_id", userData.user.id)
      .order("count", { ascending: false })
      .order("last_seen_at", { ascending: false })
      .limit(5);

    if (mistakesError) {
      throw new HttpError(500, "mistakes_query_failed", "Failed to load repeated mistakes.");
    }

    const repeatedMistakeKeys = (mistakeRows ?? []).map((row) => row.mistake_key);

    const { data: scenarios, error: scenariosError } = await supabase
      .from("scenarios")
      .select("id,slug,title,category,is_premium,metadata")
      .eq("is_active", true);

    if (scenariosError) {
      throw new HttpError(500, "scenarios_query_failed", "Failed to load scenarios.");
    }

    const normalizedScenarios = (scenarios ?? []).map((scenario) => ({
      ...scenario,
      goal_tags: Array.isArray((scenario.metadata as Record<string, unknown>)?.goal_tags)
        ? (scenario.metadata as Record<string, unknown>).goal_tags as string[]
        : [],
      mistake_keys: Array.isArray((scenario.metadata as Record<string, unknown>)?.mistake_keys)
        ? (scenario.metadata as Record<string, unknown>).mistake_keys as string[]
        : [],
    }));

    const recommendation = buildScenarioRecommendation(normalizedScenarios, {
      user_id: userData.user.id,
      date: targetDate,
      primary_goal: payload.primary_goal ?? "",
      under_practiced_categories: underPracticedCategories,
      repeated_mistake_keys: repeatedMistakeKeys,
      is_premium_user: Boolean(activeSub),
    });

    const { data: weeklySummary, error: weeklyError } = await supabase.rpc("get_weekly_summary", {
      p_user_id: userData.user.id,
      p_target_date: payload.date ?? null,
    });

    if (weeklyError) {
      throw new HttpError(500, "weekly_summary_query_failed", "Failed to load weekly summary.");
    }

    return jsonResponse({
      recommendation,
      weekly_summary: weeklySummary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: "invalid_request", message: error.message }, 400);
    }
    return sanitizeErrorResponse(error);
  }
});
