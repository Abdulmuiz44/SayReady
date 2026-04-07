import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://esm.sh/zod@3.23.8";

import { getConfig } from "../_shared/config.ts";
import { HttpError, handleCorsPreflight, jsonResponse, sanitizeErrorResponse } from "../_shared/errors.ts";
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
const isMissingColumnError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return maybeError.code === "42703" || maybeError.code === "PGRST204" || /column/i.test(maybeError.message ?? "");
};

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
  if (!first.error || first.error.code !== "23505") {
    return first;
  }
  await sleep(jitterMs(80));
  return operation();
};

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const startedAt = Date.now();
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  let currentUserId: string | null = null;
  let failureCode: string | null = null;
  let payload: z.infer<typeof requestSchema> | null = null;

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

    let createdAttemptId: string | null = null;
    let cleanedUp = false;
    const cleanupPartialAttempt = async () => {
      if (!createdAttemptId || cleanedUp) return;
      cleanedUp = true;
      const cleanupCurrent = await supabase.from("feedback_items").delete().eq("session_attempt_id", createdAttemptId);
      if (isMissingColumnError(cleanupCurrent.error)) {
        await supabase.from("feedback_items").delete().eq("attempt_id", createdAttemptId);
      }
      await supabase.from("feedback_items").delete().eq("session_attempt_id", createdAttemptId);
      await supabase.from("session_attempts").delete().eq("id", createdAttemptId);
    };

    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .select("id,user_id,scenario_id")
      .eq("id", payload.session_id)
      .maybeSingle();

    if (sessionError) throw new HttpError(500, "session_lookup_failed", "Failed to load session.");
    if (!session || session.user_id !== user.id) throw new HttpError(403, "forbidden", "Session does not belong to user.");

    const existingAttemptCurrent = await supabase
      .from("session_attempts")
      .select("id,status,raw_feedback")
      .select("id,status,overall_score,transcription_confidence,raw_feedback")
      .eq("practice_session_id", session.id)
      .eq("attempt_number", payload.attempt_number)
      .maybeSingle();
    const existingAttemptLegacy = isMissingColumnError(existingAttemptCurrent.error)
      ? await supabase
        .from("session_attempts")
        .select("id,status,raw_feedback")
        .eq("session_id", session.id)
        .eq("attempt_number", payload.attempt_number)
        .maybeSingle()
      : null;
    const existingAttempt = existingAttemptLegacy?.data ?? existingAttemptCurrent.data;

    if (existingAttempt?.status === "scored") {
      await writeFunctionLog("success");
      return jsonResponse({
        attempt_id: existingAttempt.id,
        evaluation: existingAttempt.raw_feedback ?? null,
        feedback: existingAttempt.raw_feedback ?? null,
        idempotent_replay: true,
      });
    }

    const activeSubCurrent = await supabase
      .from("subscriptions")
      .select("id,status,current_period_end")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active"])
      .gte("current_period_end", new Date().toISOString())
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    const activeSubLegacy = isMissingColumnError(activeSubCurrent.error)
      ? await supabase
        .from("subscriptions")
        .select("id,active,entitlement")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("current_period_ends_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      : null;
    const isPremium = Boolean(activeSubCurrent.data ?? activeSubLegacy?.data);

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const todayDate = dayStart.toISOString().slice(0, 10);

    if (!isPremium) {
      const { count, error: limitError } = await supabase
        .from("session_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", dayStart.toISOString())
        .lt("created_at", dayEnd.toISOString());

      if (limitError) throw new HttpError(500, "limit_check_failed", "Failed to verify evaluation limits.");
      if ((count ?? 0) >= config.freeTierDailyEvaluationLimit) throw new HttpError(429, "daily_limit_reached", "Daily free-tier evaluation limit reached.");
    }

    const { data: scenario, error: scenarioError } = await supabase
      .from("scenarios")
      .select("id,rubric,is_premium")
      .eq("id", session.scenario_id)
      .maybeSingle();
    if (scenarioError || !scenario) throw new HttpError(404, "scenario_not_found", "Scenario rubric not found.");
    if (scenario.is_premium && !isPremium) throw new HttpError(402, "premium_required", "This scenario requires a premium subscription.");

    const audioPath = payload.audio_path;
    const audioBucket = payload.audio_bucket ?? "session-audio";
    if (!audioPath) throw new HttpError(400, "audio_missing", "Session audio path is required.");

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
      const raw = await retryMistralTimeout(() => evaluateTranscript({ apiKey: config.mistralApiKey, model: config.evaluationModel, rubric: scenario.rubric, transcript }));
      const parsed = evaluationSchema.safeParse(raw);
      if (parsed.success) {
        evaluated = parsed.data;
        break;
      }
      if (attempt === 1) throw new HttpError(502, "ai_schema_invalid", "Evaluation output failed schema validation.");
    }
    if (!evaluated) throw new HttpError(502, "evaluation_failed", "Could not evaluate session.");

    const now = new Date();
    const idempotencyKey = `${session.id}:${payload.attempt_number}`;

    const baseFeedback = {
      score: evaluated.score,
      summary: evaluated.summary,
      strengths: [],
      mistakes: evaluated.feedback_items.map((item) => ({
        text: item.quote ?? item.category,
        correction: item.suggestion,
        reason: item.explanation,
      })),
      recommendations: evaluated.feedback_items.map((item) => item.suggestion),
    };

    const attemptCurrent = await upsertWithConflictRetry(() =>
      supabase
        .from("session_attempts")
        .upsert({
          user_id: user.id,
          practice_session_id: session.id,
          attempt_number: payload.attempt_number,
          idempotency_key: idempotencyKey,
          transcription_confidence: evaluated.confidence,
          overall_score: evaluated.score,
          raw_feedback: {
            score: evaluated.score,
            summary: evaluated.summary,
            strengths: [],
            mistakes: evaluated.feedback_items.map((item) => ({
              text: item.quote ?? item.category,
              correction: item.suggestion,
              reason: item.explanation,
            })),
            recommendations: evaluated.feedback_items.map((item) => item.suggestion),
          },
          status: "scored",
        }, { onConflict: "practice_session_id,attempt_number" })
        .select("id")
        .single()
    );
    const attemptLegacy = isMissingColumnError(attemptCurrent.error)
      ? await upsertWithConflictRetry(() =>
        supabase
          .from("session_attempts")
          .upsert({
            user_id: user.id,
            session_id: session.id,
            attempt_number: payload.attempt_number,
            idempotency_key: idempotencyKey,
            transcript,
            score: evaluated.score,
            confidence: evaluated.confidence,
            summary: evaluated.summary,
            raw_feedback: baseFeedback,
            status: "scored",
            evaluated_at: now.toISOString(),
          }, { onConflict: "session_id,attempt_number" })
          .select("id")
          .single()
      )
      : null;
    const createdAttempt = attemptLegacy?.data ?? attemptCurrent.data;
    const attemptError = attemptLegacy?.error ?? attemptCurrent.error;

    if (attemptError || !createdAttempt) throw new HttpError(500, "attempt_persist_failed", "Failed to save session attempt.");
    createdAttemptId = createdAttempt.id;

    if (evaluated.feedback_items.length > 0) {
      const feedbackRows = evaluated.feedback_items.map((item) => ({
        session_attempt_id: createdAttempt.id,
        user_id: user.id,
        category: item.category,
        feedback_type: "improvement",
        severity: item.severity === "high" ? "critical" : item.severity === "medium" ? "warning" : "info",
        message: item.explanation,
        evidence: item.quote ?? item.suggestion,
      }));

      const feedbackCurrent = await supabase.from("feedback_items").insert(feedbackRows);
      const feedbackLegacy = isMissingColumnError(feedbackCurrent.error)
        ? await supabase.from("feedback_items").insert(
          evaluated.feedback_items.map((item) => ({
            attempt_id: createdAttempt.id,
            user_id: user.id,
            category: item.category,
            severity: item.severity,
            quote: item.quote ?? null,
            explanation: item.explanation,
            suggestion: item.suggestion,
            mistake_key: item.mistake_key ?? null,
          })),
        )
        : null;
      const feedbackError = feedbackLegacy?.error ?? feedbackCurrent.error;
      if (feedbackError) {
        await cleanupPartialAttempt();
        throw new HttpError(500, "feedback_persist_failed", "Failed to save feedback items.");
      }

      const groupedMistakes = new Map<string, { count: number; severity: string }>();
      for (const item of evaluated.feedback_items) {
        if (!item.mistake_key) continue;
        const current = groupedMistakes.get(item.mistake_key) ?? { count: 0, severity: item.severity };
        groupedMistakes.set(item.mistake_key, { count: current.count + 1, severity: item.severity });
      }

      for (const [mistakeKey, aggregate] of groupedMistakes.entries()) {
        const { error: mistakeError } = await upsertWithConflictRetry(() => supabase.from("user_mistakes").upsert({
          user_id: user.id,
          mistake_key: mistakeKey,
          count: aggregate.count,
          category: aggregate.severity,
          last_seen_at: now.toISOString(),
        }, { onConflict: "user_id,mistake_key" }));
        if (mistakeError) {
          await cleanupPartialAttempt();
          throw new HttpError(500, "mistake_persist_failed", "Failed to save mistake tracking.");
        }
      }
    }

    const updates = [
      supabase.from("practice_sessions").update({
        status: "completed",
        completed_at: now.toISOString(),
        score: evaluated.score,
        summary: evaluated.summary,
      }).eq("id", session.id),
      supabase.from("user_streaks").upsert({
        user_id: user.id,
        current_streak_days: 1,
        best_streak_days: 1,
        last_practiced_on: todayDate,
        freeze_tokens: 0,
      }, { onConflict: "user_id" }),
    ];

    await Promise.all(updates);
    await writeFunctionLog("success");

    trackServerEvent({
      distinctId: user.id,
      event: "session_evaluated",
      properties: {
        session_id: session.id,
        attempt_number: payload.attempt_number,
        score: evaluated.score,
      },
    }).catch(() => undefined);

    return jsonResponse({
      attempt_id: createdAttempt.id,
      evaluation: evaluated,
      session_id: session.id,
      score: evaluated.score,
      feedback: {
        score: evaluated.score,
        summary: evaluated.summary,
        strengths: [],
        mistakes: evaluated.feedback_items.map((item) => ({
          text: item.quote ?? item.category,
          correction: item.suggestion,
          reason: item.explanation,
        })),
        recommendations: evaluated.feedback_items.map((item) => item.suggestion),
      },
    });
  } catch (error) {
    failureCode = error instanceof HttpError ? error.code : "unexpected_error";
    await writeFunctionLog("failed");
    return sanitizeErrorResponse(error);
  }
});
