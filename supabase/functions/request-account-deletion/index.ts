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

export const handleRequestAccountDeletion = async (req: Request, deps: Deps = defaultDeps): Promise<Response> => {
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

    const deletionRequestId = crypto.randomUUID();
    const now = deps.nowIso();

    const { error: queueError } = await supabase
      .from("account_deletion_requests")
      .insert({
        id: deletionRequestId,
        user_id: userId,
        status: "queued",
        requested_at: now,
      });

    if (queueError) {
      throw new HttpError(500, "deletion_queue_failed", "Failed to queue account deletion request.");
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("session_attempts")
      .select("audio_object_path")
      .eq("user_id", userId)
      .not("audio_object_path", "is", null);

    if (attemptsError) {
      throw new HttpError(500, "deletion_audio_lookup_failed", "Failed to lookup account audio assets.");
    }

    await supabase
      .from("account_deletion_requests")
      .update({ status: "processing" })
      .eq("id", deletionRequestId);

    const audioPaths = (attempts ?? [])
      .map((row) => row.audio_object_path as string)
      .filter((value): value is string => Boolean(value));

    if (audioPaths.length > 0) {
      const { error: removeAudioError } = await supabase.storage
        .from(config.sessionAudioBucket)
        .remove(audioPaths);

      if (removeAudioError) {
        throw new HttpError(500, "deletion_audio_remove_failed", "Failed to remove account audio assets.");
      }
    }

    const linkedTables = [
      "feedback_items",
      "user_mistakes",
      "session_attempts",
      "practice_sessions",
      "usage_events",
      "subscriptions",
      "user_streaks",
      "profiles",
      "data_export_requests",
    ];

    for (const table of linkedTables) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) {
        throw new HttpError(500, "deletion_row_delete_failed", `Failed deleting rows in ${table}.`);
      }
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      throw new HttpError(500, "deletion_auth_user_delete_failed", "Failed to delete auth user.");
    }

    const { error: completeError } = await supabase
      .from("account_deletion_requests")
      .update({
        status: "completed",
        completed_at: deps.nowIso(),
      })
      .eq("id", deletionRequestId);

    if (completeError) {
      throw new HttpError(500, "deletion_finalize_failed", "Failed to finalize account deletion request.");
    }

    return jsonResponse({
      deletion_request_id: deletionRequestId,
      status: "completed",
    });
  } catch (error) {
    return sanitizeErrorResponse(error);
  }
};

if (import.meta.main) {
  Deno.serve(handleRequestAccountDeletion);
}
