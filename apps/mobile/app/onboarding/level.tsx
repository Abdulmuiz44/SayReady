import { useLocalSearchParams, router } from 'expo-router';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';

export default function OnboardingLevel() {
  const { goals } = useLocalSearchParams<{ goals: string }>();
  return (
    <AppShell>
      <ScreenHeader title="Current level" />
      <Card>
        <PrimaryButton title="Beginner" onPress={() => router.push({ pathname: '/onboarding/profile', params: { goals, level: 'beginner' } })} />
        <PrimaryButton title="Intermediate" onPress={() => router.push({ pathname: '/onboarding/profile', params: { goals, level: 'intermediate' } })} />
        <PrimaryButton title="Advanced" onPress={() => router.push({ pathname: '/onboarding/profile', params: { goals, level: 'advanced' } })} />
      </Card>
    </AppShell>
  );
}
