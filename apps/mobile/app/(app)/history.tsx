import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { AppShell, Card, EmptyState, LoadingState, ScreenHeader } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('sessions').select('id,status,created_at,scenario:scenarios(title)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setSessions(data ?? []);
      setLoading(false);
    });
  }, [user?.id]);

  if (loading) return <LoadingState message="Loading history..." />;
  if (!sessions.length) return <EmptyState title="No history yet" description="Complete your first scenario to see attempts here." />;

  return (
    <AppShell>
      <ScreenHeader title="History" />
      {sessions.map((s) => <Card key={s.id}><Text style={{ color: '#fff' }}>{s.scenario?.title ?? 'Scenario'} · {s.status}</Text></Card>)}
    </AppShell>
  );
}
