import { router } from 'expo-router';
import { Text } from 'react-native';
import { AppShell, Card, PrimaryButton, SecondaryButton, ScreenHeader } from '@/components';

export default function WelcomeScreen() {
  return (
    <AppShell>
      <ScreenHeader title="SayReady" subtitle="Practice real speaking scenarios" />
      <Card>
        <Text style={{ color: '#d6d6e3' }}>Train with AI feedback, track your progress, and improve confidence.</Text>
      </Card>
      <PrimaryButton title="Sign in" onPress={() => router.push('/(auth)/sign-in')} />
      <SecondaryButton title="Create account" onPress={() => router.push('/(auth)/sign-up')} />
    </AppShell>
  );
}
