import { useEffect, useState } from 'react';
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    getScenario(slug).then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message);
      else setScenario(data);
    });
  }, [slug]);

  async function startSession() {
    if (!user || !scenario) return;
    const { data, error: createError } = await createSession(user.id, scenario.id);
    if (createError) setError(createError.message);
    else router.push(`/(app)/session/${data.id}`);
  }

  if (error) return <ErrorState message={error} />;
  if (!scenario) return <LoadingState message="Loading scenario..." />;

  return (
    <AppShell>
      <ScreenHeader title={scenario.title} subtitle={scenario.level} />
      <Card><Text style={{ color: '#ddd' }}>{scenario.prompt}</Text></Card>
      <PrimaryButton title="Start speaking session" onPress={startSession} />
    </AppShell>
  );
}
