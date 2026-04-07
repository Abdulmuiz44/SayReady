import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AppShell, Card, EmptyState, ErrorState, LoadingState, ScreenHeader } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { trackError, trackEvent } from '@/services/telemetry';

type HistoryItem = {
  id: string;
  status: string;
  created_at: string;
  scenario?: { title?: string } | null;
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: loadError } = await supabase
        .from('practice_sessions')
        .select('id,status,created_at,scenario:scenarios(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (loadError) throw loadError;
      setSessions((data as HistoryItem[]) ?? []);
      void trackEvent({ eventName: 'history_loaded', metadata: { count: (data ?? []).length } });
    } catch (err) {
      console.error('History load failed', err);
      void trackError('history_load_failed', err, { user_id: user.id });
      setSessions([]);
      setError(err instanceof Error ? err.message : 'Unable to load history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (loading) return <LoadingState message="Loading history..." />;
  if (error) return <ErrorState message={error} retry={loadHistory} />;
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
