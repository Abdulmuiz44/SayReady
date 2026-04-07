import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, InputField, PrimaryButton, ScreenHeader } from '@/components';
import { getAuthErrorMessage } from '@/services/auth-errors';
import { signIn } from '@/services/auth';
import { trackError, trackEvent } from '@/services/telemetry';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (loading) return;

    setError('');
    setLoading(true);
    void trackEvent({ eventName: 'sign_in_submitted' });

    try {
      const { error: signInError } = await signIn(email.trim().toLowerCase(), password);
      if (signInError) {
        void trackError('sign_in_failed', signInError);
        setError(signInError.message);
        return;
      }

      void trackEvent({ eventName: 'sign_in_success' });
      router.replace('/');
    } catch (err) {
      void trackError('sign_in_failed', err);
      setError(getAuthErrorMessage(err, 'sign in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <View style={styles.hero}>
        <ScreenHeader title="Welcome back" subtitle="Continue your practice streak with the same calm, centered interface." />
      </View>

      <Card>
        <InputField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <InputField label="Password" placeholder="Your password" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title={loading ? 'Signing in...' : 'Continue'} onPress={onSubmit} disabled={loading} />
        <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
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
  link: {
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 4,
  },
});
