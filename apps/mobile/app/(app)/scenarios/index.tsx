import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';
import { AppShell, Card, EmptyState, LoadingState, PaywallCard, ScreenHeader } from '@/components';
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
      <ScreenHeader title="Scenarios" />
      {items.map((s) => (
        <Card key={s.id}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{s.title}</Text>
          <Text style={{ color: '#aaa' }}>{s.description}</Text>
          {s.is_premium ? <PaywallCard /> : <Link href={`/(app)/scenarios/${s.slug}`}><Text style={{ color: '#bcbcff' }}>Open scenario</Text></Link>}
        </Card>
      ))}
    </AppShell>
  );
}
