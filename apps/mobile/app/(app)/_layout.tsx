import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function ProtectedLayout() {
  const { user, loading, profile } = useAuth();
  const onboardingComplete = profile?.onboarding_complete ?? Boolean(profile);

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!onboardingComplete) return <Redirect href="/onboarding" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
