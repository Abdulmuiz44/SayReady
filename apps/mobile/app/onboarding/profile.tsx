import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { TextInput } from 'react-native';
import { AppShell, PrimaryButton, ScreenHeader } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { upsertOnboarding } from '@/services/profiles';

export default function OnboardingProfile() {
  const { user, reloadProfile } = useAuth();
  const { goals, level } = useLocalSearchParams<{ goals: string; level: string }>();
  const [fullName, setFullName] = useState('');

  async function finish() {
    if (!user) return;
    await upsertOnboarding(user.id, {
      full_name: fullName,
      goals: goals ? JSON.parse(goals) : [],
      level,
    });
    await reloadProfile();
    router.replace('/(app)/home');
  }

  return (
    <AppShell>
      <ScreenHeader title="Your profile" />
      <TextInput placeholder="Full name" value={fullName} onChangeText={setFullName} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12 }} />
      <PrimaryButton title="Finish onboarding" onPress={finish} />
    </AppShell>
  );
}
