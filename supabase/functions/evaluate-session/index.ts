import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

import { getConfig } from "../_shared/config.ts";
import { HttpError, jsonResponse, sanitizeErrorResponse } from "../_shared/errors.ts";
import { evaluateTranscript, transcribeAudio } from "../_shared/mistral.ts";
import { trackServerEvent } from "../_shared/posthog.ts";

const requestSchema = z.object({
  session_id: z.string().uuid(),
  attempt_number: z.number().int().min(1),
  audio_path: z.string().min(1).optional(),
  audio_bucket: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
});

const evaluationSchema = z.object({
  summary: z.string(),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  feedback_items: z.array(z.object({
    category: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    quote: z.string().optional(),
    explanation: z.string(),
    suggestion: z.string(),
    mistake_key: z.string().optional(),
  })),
});

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const jitterMs = (baseMs: number): number => baseMs + Math.floor(Math.random() * 120);

const severityMap: Record<"low" | "medium" | "high", "info" | "warning" | "critical"> = {
  low: "info",
  medium: "warning",
  high: "critical",
};

const getLocalDateString = (date: Date, timeZone: string): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  return formatter.format(date);
};

const isSameLocalDate = (a: Date, b: Date, timeZone: string): boolean => getLocalDateString(a, timeZone) === getLocalDateString(b, timeZone);

const retryUploadFetch = async <T>(operation: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
      await sleep(jitterMs(150 * (attempt + 1)));
    }
  }
  throw lastError;
};

const retryMistralTimeout = async <T>(operation: () => Promise<T>): Promise<T> => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof HttpError) || !error.code.endsWith("_timeout") || attempt === 1) {
        throw error;
      }
      await sleep(jitterMs(200));
    }
  }
  throw new HttpError(502, "mistral_retry_exhausted", "Mistral retry exhausted.");
};

const upsertWithConflictRetry = async <T extends { error: { code?: string } | null }>(operation: () => Promise<T>): Promise<T> => {
  const first = await operation();
  if (!first.error || first.error.code !== "23505") return first;
  await sleep(jitterMs(80));
  return operation();
};

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  let currentUserId: string | null = null;
  let failureCode: string | null = null;
  let payload: z.infer<typeof requestSchema> | null = null;
  let createdAttemptId: string | null = null;

  const config = getConfig();
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } });

  const writeFunctionLog = async (status: "success" | "failed") => {
    await supabase.from("function_logs").insert({
      request_id: requestId,
      user_id: currentUserId,
      function_name: "evaluate-session",
      status,
      latency_ms: Date.now() - startedAt,
      error_code: failureCode,
    });
  };

  const cleanupPartialAttempt = async () => {
    if (!createdAttemptId) return;
    await supabase.from("feedback_items").delete().eq("session_attempt_id", createdAttemptId);
    await supabase.from("session_attempts").delete().eq("id", createdAttemptId);
  };

  try {
    if (req.method !== "POST") throw new HttpError(405, "method_not_allowed", "Only POST is allowed.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new HttpError(401, "unauthorized", "Missing authorization token.");

    payload = requestSchema.parse(await req.json());
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) throw new HttpError(401, "unauthorized", "Invalid user token.");

    const user = userData.user;
    currentUserId = user.id;

    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .select("id,user_id,scenario_id,status")
      .eq("id", payload.session_id)
      .maybeSingle();

    if (sessionError) throw new HttpError(500, "session_lookup_failed", "Failed to load session.");
    if (!session || session.user_id !== user.id) throw new HttpError(403, "forbidden", "Session does not belong to user.");

    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id,rubric,is_premium")
      .eq("id", session.scenario_id)
      .maybeSingle();

    if (scenarioError || !scenario) throw new HttpError(404, "scenario_not_found", "Scenario rubric not found.");

    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select("id,status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isPremium = Boolean(activeSub?.id);
    if (scenario.is_premium && !isPremium) throw new HttpError(402, "premium_required", "This scenario requires a premium subscription.");

    const timeZone = payload.timezone ?? user.user_metadata?.timezone ?? config.appTimeZoneDefault;
    const todayDate = getLocalDateString(new Date(), timeZone);

    if (!isPremium) {
      const { data: recentAttempts, error: attemptsError } = await supabase
        .from("session_attempts")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (attemptsError) throw new HttpError(500, "limit_check_failed", "Failed to verify evaluation limits.");

      const todayCount = (recentAttempts ?? []).filter((row) => row.created_at && getLocalDateString(new Date(row.created_at), timeZone) === todayDate).length;
      if (todayCount >= config.freeTierDailyEvaluationLimit) {
        throw new HttpError(429, "daily_limit_reached", "Daily free-tier evaluation limit reached.");
      }
    }

    const { data: existingAttempt } = await supabase
      .from("session_attempts")
      .select("id,status,overall_score,raw_feedback,audio_object_path")
      .eq("practice_session_id", session.id)
      .eq("attempt_number", payload.attempt_number)
      .maybeSingle();

    if (existingAttempt?.status === "scored") {
      await writeFunctionLog("success");
      return jsonResponse({
        attempt_id: existingAttempt.id,
        evaluation: existingAttempt.raw_feedback,
        score: existingAttempt.overall_score,
        idempotent_replay: true,
      });
    }

    const audioPath = payload.audio_path ?? existingAttempt?.audio_object_path ?? null;
    const audioBucket = payload.audio_bucket ?? "session-audio";
    if (!audioPath) throw new HttpError(400, "audio_missing", "Session audio path is required.");

    await supabase
      .from("practice_sessions")
      .update({ status: "in_progress", failure_reason_code: null, updated_at: new Date().toISOString() })
      .eq("id", session.id)
      .eq("user_id", user.id);

    const idempotencyKey = `${session.id}:${payload.attempt_number}`;
    const { data: seededAttempt, error: seedAttemptError } = await upsertWithConflictRetry(() =>
      supabase
        .from("session_attempts")
        .upsert({
          user_id: user.id,
          practice_session_id: session.id,
          attempt_number: payload.attempt_number,
          audio_object_path: audioPath,
          idempotency_key: idempotencyKey,
          status: "processing",
        }, { onConflict: "practice_session_id,attempt_number" })
        .select("id")
        .single()
    );

    if (seedAttemptError || !seededAttempt) throw new HttpError(500, "attempt_seed_failed", "Failed to initialize session attempt.");
    createdAttemptId = seededAttempt.id;

    const { data: audioData, error: downloadError } = await retryUploadFetch(() => supabase.storage.from(audioBucket).download(audioPath));
    if (downloadError || !audioData) throw new HttpError(404, "audio_missing", "Unable to access session audio.");

    const bytes = new Uint8Array(await audioData.arrayBuffer());
    const transcript = await retryMistralTimeout(() => transcribeAudio({
      apiKey: config.mistralApiKey,
      model: config.transcriptionModel,
      audioBytes: bytes,
      fileName: audioPath.split("/").pop(),
      mimeType: audioData.type,
    }));

    let evaluated: z.infer<typeof evaluationSchema> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await retryMistralTimeout(() => evaluateTranscript({
        apiKey: config.mistralApiKey,
        model: config.evaluationModel,
        rubric: scenario.rubric,
        transcript,
      }));
      const parsed = evaluationSchema.safeParse(raw);
      if (parsed.success) {
        evaluated = parsed.data;
        break;
      }
      if (attempt === 1) throw new HttpError(502, "ai_schema_invalid", "Evaluation output failed schema validation.");
    }
    if (!evaluated) throw new HttpError(502, "evaluation_failed", "Could not evaluate session.");

    const now = new Date();

    const { error: attemptUpdateError } = await supabase
      .from("session_attempts")
      .update({
        status: "scored",
        overall_score: evaluated.score,
        transcription_confidence: evaluated.confidence,
        raw_feedback: {
          transcript,
          summary: evaluated.summary,
          confidence: evaluated.confidence,
          feedback_items: evaluated.feedback_items,
        },
        updated_at: now.toISOString(),
      })
      .eq("id", createdAttemptId)
      .eq("user_id", user.id);

    if (attemptUpdateError) {
      await cleanupPartialAttempt();
      throw new HttpError(500, "attempt_persist_failed", "Failed to save session attempt.");
    }

    if (evaluated.feedback_items.length > 0) {
      const feedbackRows = evaluated.feedback_items.map((item) => ({
        session_attempt_id: createdAttemptId,
        user_id: user.id,
        feedback_type: "improvement",
        category: item.category,
        severity: severityMap[item.severity],
        message: `${item.explanation} ${item.suggestion}`.trim(),
        evidence: item.quote ?? null,
      }));

      const { error: feedbackError } = await supabase.from("feedback_items").insert(feedbackRows);
      if (feedbackError) {
        await cleanupPartialAttempt();
        throw new HttpError(500, "feedback_persist_failed", "Failed to save feedback items.");
      }

      const groupedMistakes = new Map<string, { count: number; category: string }>();
      for (const item of evaluated.feedback_items) {
        if (!item.mistake_key) continue;
        const current = groupedMistakes.get(item.mistake_key) ?? { count: 0, category: item.category };
        groupedMistakes.set(item.mistake_key, { count: current.count + 1, category: item.category });
      }

      for (const [mistakeKey, aggregate] of groupedMistakes.entries()) {
        const { error: mistakeError } = await upsertWithConflictRetry(() =>
          supabase
            .from("user_mistakes")
            .upsert({
              user_id: user.id,
              scenario_id: scenario.id,
              session_attempt_id: createdAttemptId,
              mistake_key: mistakeKey,
              category: aggregate.category,
              count: aggregate.count,
              last_seen_at: now.toISOString(),
            }, { onConflict: "user_id,mistake_key", ignoreDuplicates: false })
        );

        if (mistakeError) {
          await cleanupPartialAttempt();
          throw new HttpError(500, "mistake_upsert_failed", "Failed to update user mistakes.");
        }
      }
    }

    const { data: previousAttempt } = await supabase
      .from("session_attempts")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("status", "scored")
      .neq("id", createdAttemptId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const shouldIncrementStreak = previousAttempt ? !isSameLocalDate(new Date(previousAttempt.created_at), now, timeZone) : true;

    const { data: streakRow } = await supabase
      .from("user_streaks")
      .select("user_id,current_streak_days,best_streak_days,last_practiced_on")
      .eq("user_id", user.id)
      .maybeSingle();

    let nextStreak = 1;
    let bestStreak = 1;
    if (streakRow?.last_practiced_on) {
      const lastDate = new Date(`${streakRow.last_practiced_on}T00:00:00.000Z`);
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      if (isSameLocalDate(lastDate, now, timeZone)) nextStreak = streakRow.current_streak_days;
      else if (isSameLocalDate(lastDate, yesterday, timeZone) && shouldIncrementStreak) nextStreak = streakRow.current_streak_days + 1;
      else nextStreak = 1;
      bestStreak = Math.max(streakRow.best_streak_days ?? 0, nextStreak);
    }

    const { error: streakError } = await upsertWithConflictRetry(() =>
      supabase
        .from("user_streaks")
        .upsert({
          user_id: user.id,
          current_streak_days: nextStreak,
          best_streak_days: bestStreak,
          last_practiced_on: todayDate,
        }, { onConflict: "user_id" })
    );

    if (streakError) {
      await cleanupPartialAttempt();
      throw new HttpError(500, "streak_update_failed", "Failed to update user streak.");
    }

    const { error: sessionUpdateError } = await supabase
      .from("practice_sessions")
      .update({
        status: "completed",
        score: evaluated.score,
        summary: evaluated.summary,
        transcript,
        completed_at: now.toISOString(),
        failure_reason_code: null,
        updated_at: now.toISOString(),
      })
      .eq("id", session.id)
      .eq("user_id", user.id);

    if (sessionUpdateError) {
      await cleanupPartialAttempt();
      throw new HttpError(500, "session_update_failed", "Failed to update practice session aggregate.");
    }

    await trackServerEvent({
      distinctId: user.id,
      event: "session_evaluated",
      properties: {
        session_id: session.id,
        attempt_id: createdAttemptId,
        attempt_number: payload.attempt_number,
        score: evaluated.score,
        is_premium: isPremium,
        request_id: requestId,
      },
    });

    await writeFunctionLog("success");

    return jsonResponse({
      attempt_id: createdAttemptId,
      transcript,
      evaluation: evaluated,
      streak: nextStreak,
      is_premium: isPremium,
    });
  } catch (error) {
    failureCode = error instanceof HttpError ? error.code : "unhandled_error";

    if (createdAttemptId && currentUserId) {
      await supabase
        .from("session_attempts")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", createdAttemptId)
        .eq("user_id", currentUserId);
    }

    if (payload?.session_id && currentUserId) {
      await supabase
        .from("practice_sessions")
        .update({ status: "failed", failure_reason_code: failureCode, updated_at: new Date().toISOString() })
        .eq("id", payload.session_id)
        .eq("user_id", currentUserId);
    }

    await writeFunctionLog("failed");

    if (error instanceof z.ZodError) return jsonResponse({ error: "invalid_request", message: error.message }, 400);
    return sanitizeErrorResponse(error);
  }
});
