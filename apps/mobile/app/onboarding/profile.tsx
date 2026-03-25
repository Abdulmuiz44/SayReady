import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, InputField, PrimaryButton, ScreenHeader } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { upsertOnboarding } from '@/services/profiles';

export default function OnboardingProfile() {
  const { user, setProfile, reloadProfile } = useAuth();
  const { goals, level } = useLocalSearchParams<{ goals: string; level: string }>();
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    if (!user || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const parsedGoals = goals ? JSON.parse(goals) : [];
      const trimmedName = fullName.trim();
      const nextProfile = {
        id: user.id,
        full_name: trimmedName || undefined,
        goals: Array.isArray(parsedGoals) ? parsedGoals : [],
        level: level ?? 'beginner',
        onboarding_complete: true,
      };

      const { error: saveError } = await upsertOnboarding(user.id, {
        ...(trimmedName ? { full_name: trimmedName } : {}),
        goals: Array.isArray(parsedGoals) ? parsedGoals : [],
        level: level ?? 'beginner',
      });

      if (saveError) throw saveError;

      setProfile(nextProfile);
      await reloadProfile();
      router.replace('/(app)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to finish onboarding.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <View style={styles.hero}>
        <ScreenHeader title="Your profile" subtitle="A few details so we can tailor your practice sessions." />
      </View>

      <Card>
        <InputField
          label="Full name"
          placeholder="Abdulmuiz"
          value={fullName}
          onChangeText={setFullName}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title={submitting ? 'Saving...' : 'Finish onboarding'} onPress={finish} disabled={submitting} />
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
  },
  error: {
    color: '#fda4af',
    textAlign: 'center',
  },
});
