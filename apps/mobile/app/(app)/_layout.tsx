import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function ProtectedLayout() {
  const { user, loading, profile } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!profile?.onboarding_complete) return <Redirect href="/onboarding" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
