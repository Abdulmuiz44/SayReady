import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function Index() {
  const { user, loading, profile } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile?.onboarding_complete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(app)/home" />;
}
