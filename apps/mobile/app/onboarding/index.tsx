import { router } from 'expo-router';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';

export default function OnboardingIntro() {
  return (
    <AppShell>
      <ScreenHeader title="Welcome aboard" subtitle="Let's personalize your learning plan" />
      <Card />
      <PrimaryButton title="Start" onPress={() => router.push('/onboarding/goals')} />
    </AppShell>
  );
}
