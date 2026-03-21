import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { AppShell, AudioRecorder, ErrorState, LoadingState, MistakeList, PrimaryButton, ScreenHeader, SessionFeedbackCard } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { completeSession, evaluateSession, saveAttempt, uploadAttemptAudio } from '@/services/sessions';
import type { EvaluationFeedback } from '@/types';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(1);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EvaluationFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitAttempt() {
    if (!user || !id || !audioUri) return;
    setLoading(true);
    setError('');
    const audio = await uploadAttemptAudio(user.id, id, attempt, audioUri);
    if ('error' in audio && audio.error) {
      setError(audio.error.message);
      setLoading(false);
      return;
    }
    const evalResponse = await evaluateSession(id, attempt, audio.filePath);
    if (evalResponse.error) {
      setError(evalResponse.error.message);
      setLoading(false);
      return;
    }
    const responseFeedback = evalResponse.data.feedback as EvaluationFeedback;
    setFeedback(responseFeedback);
    await saveAttempt(id, attempt, responseFeedback, audio.filePath);
    setLoading(false);
  }

  async function retry() {
    setAttempt(2);
    setAudioUri(null);
    setFeedback(null);
  }

  async function finish() {
    if (!id) return;
    await completeSession(id);
  }

  if (!id) return <ErrorState message="Missing session id" />;

  return (
    <AppShell>
      <ScreenHeader title={`Session ${id}`} subtitle={`Attempt ${attempt} / 2`} />
      {!feedback ? (
        <>
          <AudioRecorder onRecorded={setAudioUri} />
          <PrimaryButton title="Evaluate recording" onPress={submitAttempt} disabled={!audioUri || loading} />
          {loading ? <LoadingState message="Evaluating your speaking..." /> : null}
        </>
      ) : (
        <>
          <SessionFeedbackCard feedback={feedback} />
          <MistakeList mistakes={feedback.mistakes} />
          {attempt === 1 ? <PrimaryButton title="Retry once" onPress={retry} /> : null}
          <PrimaryButton title="Finish session" onPress={finish} />
        </>
      )}
      {error ? <Text style={{ color: '#ff8a8a' }}>{error}</Text> : null}
    </AppShell>
  );
}
