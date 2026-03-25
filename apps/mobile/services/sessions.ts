import { supabase } from '@/lib/supabase';
import type { EvaluationFeedback } from '@/types';

export async function createSession(userId: string, scenarioId: string) {
  return supabase
    .from('practice_sessions')
    .insert({
      user_id: userId,
      scenario_id: scenarioId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single();
}

export async function uploadAttemptAudio(userId: string, sessionId: string, attempt: number, uri: string) {
  const filePath = `${userId}/${sessionId}/attempt-${attempt}.m4a`;
  const response = await fetch(uri);
  const blob = await response.blob();
  const { error } = await supabase.storage.from('session-audio').upload(filePath, blob, {
    upsert: true,
    contentType: 'audio/m4a',
  });
  if (error) return { error };
  return { filePath };
}

export async function evaluateSession(sessionId: string, attempt: number, audioPath: string) {
  return supabase.functions.invoke('evaluate-speaking-session', {
    body: { sessionId, attempt, audioPath },
  });
}

export async function saveAttempt(
  userId: string,
  sessionId: string,
  attempt: number,
  feedback: EvaluationFeedback,
  audioPath: string,
) {
  return supabase.from('session_attempts').insert({
    practice_session_id: sessionId,
    user_id: userId,
    attempt_number: attempt,
    status: 'scored',
    audio_object_path: audioPath,
    overall_score: feedback.score,
    raw_feedback: feedback,
  });
}

export async function completeSession(sessionId: string) {
  return supabase
    .from('practice_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId);
}
