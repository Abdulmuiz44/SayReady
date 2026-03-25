import { useEffect, useState } from 'react';
import { router, Link } from 'expo-router';
import { Text, View } from 'react-native';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { listScenarios } from '@/services/scenarios';
import type { Scenario } from '@/types';

export default function HomeScreen() {
  const { profile } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    listScenarios().then(({ data }) => setScenarios(data ?? []));
  }, []);

  if (!profile) return null;

  return (
    <AppShell>
      <ScreenHeader title="Dashboard" subtitle={`Streak ${profile.streak ?? 0} days - keep the momentum going`} />

      <Card>
        <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '800' }}>Today's focus</Text>
        <Text style={{ color: '#a1a1aa', lineHeight: 21 }}>Pick a scenario, rehearse out loud, then review the score and mistakes in a clean feedback view.</Text>
        <PrimaryButton title="Browse scenarios" onPress={() => router.push('/(app)/scenarios')} />
      </Card>

      <Card>
        <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '800' }}>Recommended</Text>
        <Text style={{ color: '#d4d4d8', lineHeight: 21 }}>{scenarios[0]?.title ?? 'No recommendation yet'}</Text>
      </Card>

      <Card>
        <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '800' }}>Weak areas</Text>
        <Text style={{ color: '#d4d4d8', lineHeight: 21 }}>{(profile.weak_areas ?? []).join(', ') || 'None yet'}</Text>
      </Card>

      <View style={{ gap: 10 }}>
        <Link href="/(app)/scenarios">
          <Text style={{ color: '#f8fafc', textAlign: 'center', fontWeight: '700' }}>Browse scenarios</Text>
        </Link>
        <Link href="/(app)/history">
          <Text style={{ color: '#a1a1aa', textAlign: 'center' }}>Continue previous session</Text>
        </Link>
      </View>
    </AppShell>
  );
}