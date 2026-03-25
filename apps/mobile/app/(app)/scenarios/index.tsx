import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { AppShell, Card, EmptyState, LoadingState, ScreenHeader } from '@/components';
import { listScenarios } from '@/services/scenarios';
import type { Scenario } from '@/types';

export default function ScenariosScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Scenario[]>([]);

  useEffect(() => {
    listScenarios().then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading scenarios..." />;
  if (!items.length) return <EmptyState title="No scenarios" description="Please check back later." />;

  return (
    <AppShell>
      <ScreenHeader title="Scenarios" subtitle="Choose a practice scene and start speaking." />
      <View style={{ gap: 12 }}>
        {items.map((s) => (
          <Card key={s.id}>
            <Text style={{ color: '#fafafa', fontWeight: '800', fontSize: 16, textAlign: 'center' }}>{s.title}</Text>
            <Text style={{ color: '#a1a1aa', textAlign: 'center', lineHeight: 21 }}>{s.description}</Text>
            {s.is_premium ? (
              <Link href="/(app)/paywall">
                <Text style={{ color: '#a1a1aa', textAlign: 'center', fontWeight: '700' }}>Pro access required</Text>
              </Link>
            ) : (
              <Link href={`/(app)/scenarios/${s.slug}`}>
                <Text style={{ color: '#f8fafc', textAlign: 'center', fontWeight: '700' }}>Open scenario</Text>
              </Link>
            )}
          </Card>
        ))}
      </View>
    </AppShell>
  );
}