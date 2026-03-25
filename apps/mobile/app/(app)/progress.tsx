import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { AppShell, Card, ProgressChart, ScreenHeader } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function ProgressScreen() {
  const { user } = useAuth();
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('session_attempts').select('score').eq('user_id', user.id).order('created_at', { ascending: true }).limit(8).then(({ data }) => {
      setPoints((data ?? []).map((row: any) => row.score));
    });
  }, [user?.id]);

  return (
    <AppShell>
      <ScreenHeader title="Progress" subtitle="Recent speaking scores with a simple, centered view." />
      <Card>
        {points.length ? <ProgressChart points={points} /> : <Text style={{ color: '#a1a1aa', textAlign: 'center' }}>No attempts yet.</Text>}
      </Card>
    </AppShell>
  );
}