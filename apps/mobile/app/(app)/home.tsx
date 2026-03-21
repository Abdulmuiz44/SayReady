import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';
import { AppShell, Card, LoadingState, ScreenHeader } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { listScenarios } from '@/services/scenarios';
import type { Scenario } from '@/types';

export default function HomeScreen() {
  const { profile } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    listScenarios().then(({ data }) => setScenarios(data ?? []));
  }, []);

  if (!profile) return <LoadingState message="Loading dashboard..." />;

  return (
    <AppShell>
      <ScreenHeader title="Dashboard" subtitle={`Streak: ${profile.streak ?? 0} days`} />
      <Card><Text style={{ color: '#fff' }}>Recommended: {scenarios[0]?.title ?? 'No recommendation yet'}</Text></Card>
      <Card><Text style={{ color: '#fff' }}>Weak areas: {(profile.weak_areas ?? []).join(', ') || 'None yet'}</Text></Card>
      <Link href="/(app)/scenarios"><Text style={{ color: '#bcbcff' }}>Browse scenarios</Text></Link>
      <Link href="/(app)/history"><Text style={{ color: '#bcbcff' }}>Continue previous session</Text></Link>
    </AppShell>
  );
}
