import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { AppShell, AudioRecorder, ErrorState, LoadingState, MistakeList, PrimaryButton, ScreenHeader, SessionFeedbackCard } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { completeSession, evaluateSession, saveAttempt, uploadAttemptAudio } from '@/services/sessions';
import { trackError, trackEvent } from '@/services/telemetry';
import type { EvaluationFeedback } from '@/types';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(1);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EvaluationFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  async function submitAttempt() {
    if (!user || !id || !audioUri || submitting) return;

    setSubmitting(true);
    setError('');
    void trackEvent({ eventName: 'evaluation_started', metadata: { session_id: id, attempt } });

    try {
      const audio = await uploadAttemptAudio(user.id, id, attempt, audioUri);
      if ('error' in audio && audio.error) throw audio.error;

      const evalResponse = await evaluateSession(id, attempt, audio.filePath);
      if (evalResponse.error) throw new Error(evalResponse.error.message);

      const responseFeedback = evalResponse.data.feedback as EvaluationFeedback;
      setFeedback(responseFeedback);

      const { error: saveError } = await saveAttempt(user.id, id, attempt, responseFeedback, audio.filePath);
      if (saveError) throw saveError;

      void trackEvent({ eventName: 'evaluation_succeeded', metadata: { session_id: id, attempt, score: responseFeedback.score } });
    } catch (err) {
      console.error('Session evaluation failed', err);
      void trackError('evaluation_failed', err, { session_id: id, attempt });
      setError(err instanceof Error ? err.message : 'Unable to evaluate recording.');
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAttempt((current) => current + 1);
    setAudioUri(null);
    setFeedback(null);
    setError('');
    void trackEvent({ eventName: 'evaluation_retry_requested', metadata: { session_id: id, next_attempt: attempt + 1 } });
  }

  async function finish() {
    if (!id || finishing) return;

    setFinishing(true);
    setError('');
    void trackEvent({ eventName: 'session_finish_started', metadata: { session_id: id } });

    try {
      const { error: completeError } = await completeSession(id);
      if (completeError) throw completeError;
      void trackEvent({ eventName: 'session_finished', metadata: { session_id: id } });
    } catch (err) {
      console.error('Session completion failed', err);
      void trackError('session_finish_failed', err, { session_id: id });
      setError(err instanceof Error ? err.message : 'Unable to finish session.');
    } finally {
      setFinishing(false);
    }
  }

  if (!id) return <ErrorState message="Missing session id" />;

  return (
    <AppShell>
      <ScreenHeader title={`Session ${id}`} subtitle={`Attempt ${attempt} / 2`} />
      {!feedback ? (
        <>
          <AudioRecorder onRecorded={setAudioUri} />
          <PrimaryButton title={submitting ? 'Evaluating...' : 'Evaluate recording'} onPress={submitAttempt} disabled={!audioUri || submitting} />
          {submitting ? <LoadingState message="Evaluating your speaking..." /> : null}
        </>
      ) : (
        <>
          <SessionFeedbackCard feedback={feedback} />
          <MistakeList mistakes={feedback.mistakes} />
          {attempt === 1 ? <PrimaryButton title="Retry once" onPress={retry} /> : null}
          <PrimaryButton title={finishing ? 'Finishing...' : 'Finish session'} onPress={finish} disabled={finishing} />
        </>
      )}
      {error ? <Text style={{ color: '#ff8a8a', textAlign: 'center' }}>{error}</Text> : null}
    </AppShell>
  );
}
