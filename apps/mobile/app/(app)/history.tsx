import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { AppShell, Card, EmptyState, LoadingState, ScreenHeader } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

type HistoryItem = {
  id: string;
  status: string;
  created_at: string;
  scenario?: { title?: string } | null;
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    supabase
      .from('practice_sessions')
      .select('id,status,created_at,scenario:scenarios(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setSessions([]);
        } else {
          setSessions((data as HistoryItem[]) ?? []);
        }
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) return <LoadingState message="Loading history..." />;
  if (!sessions.length) return <EmptyState title="No history yet" description="Complete your first scenario to see attempts here." />;

  return (
    <AppShell>
      <ScreenHeader title="History" subtitle="Recent sessions in a calmer, centered layout." />
      {sessions.map((s) => (
        <Card key={s.id}>
          <Text style={{ color: '#fafafa', fontWeight: '800', textAlign: 'center' }}>{s.scenario?.title ?? 'Scenario'} · {s.status}</Text>
        </Card>
      ))}
    </AppShell>
  );
}
