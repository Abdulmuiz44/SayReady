import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { AppShell, Card, ErrorState, LoadingState, PrimaryButton, ScreenHeader } from '@/components';
import { getScenario } from '@/services/scenarios';
import { createSession } from '@/services/sessions';
import { useAuth } from '@/providers/AuthProvider';
import type { Scenario } from '@/types';

export default function ScenarioDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const loadScenario = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: loadError } = await getScenario(slug);
      if (loadError) throw loadError;
      setScenario(data);
    } catch (err) {
      console.error('Scenario load failed', err);
      setScenario(null);
      setError(err instanceof Error ? err.message : 'Unable to load scenario.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadScenario();
  }, [loadScenario]);

  async function startSession() {
    if (!user || !scenario || starting) return;

    setStarting(true);
    setError('');

    try {
      const { data, error: createError } = await createSession(user.id, scenario.id);
      if (createError) throw createError;
      router.push(`/(app)/session/${data.id}`);
    } catch (err) {
      console.error('Session creation failed', err);
      setError(err instanceof Error ? err.message : 'Unable to start session.');
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <LoadingState message="Loading scenario..." />;
  if (error && !scenario) return <ErrorState message={error} retry={loadScenario} />;
  if (!scenario) return <ErrorState message="Scenario not found." retry={loadScenario} />;

  return (
    <AppShell>
      <ScreenHeader title={scenario.title} subtitle={scenario.level} />
      <Card>
        <Text style={{ color: '#ddd', lineHeight: 22 }}>{scenario.prompt}</Text>
      </Card>
      {error ? <Text style={{ color: '#fca5a5', textAlign: 'center' }}>{error}</Text> : null}
      <PrimaryButton title={starting ? 'Starting...' : 'Start speaking session'} onPress={startSession} disabled={starting} />
    </AppShell>
  );
}
