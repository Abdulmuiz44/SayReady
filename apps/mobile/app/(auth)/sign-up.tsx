import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, InputField, PrimaryButton, ScreenHeader } from '@/components';
import { getAuthErrorMessage } from '@/services/auth-errors';
import { signUp } from '@/services/auth';
import { trackError, trackEvent } from '@/services/telemetry';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit() {
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    setMessage('');
    void trackEvent({ eventName: 'sign_up_submitted' });

    try {
      const { data, error: signUpError } = await signUp(normalizedEmail, password);

      if (signUpError) {
        void trackError('sign_up_failed', signUpError, { email_domain: normalizedEmail.split('@')[1] ?? null });
        const text = signUpError.message.toLowerCase();
        if (text.includes('rate limit')) {
          setMessage('Too many attempts. Wait a moment and try again, or sign in if the account already exists.');
          return;
        }

        setMessage(signUpError.message);
        return;
      }

      if (data.session) {
        void trackEvent({ eventName: 'sign_up_success', metadata: { has_session: true } });
        router.replace('/onboarding');
        return;
      }

      void trackEvent({ eventName: 'sign_up_needs_confirmation' });
      setMessage('Account created, but email confirmation is still enabled in Supabase. Turn off email confirmation in the Supabase Auth settings if you want instant login, then sign up again.');
    } catch (err) {
      void trackError('sign_up_failed', err, { email_domain: normalizedEmail.split('@')[1] ?? null });
      setMessage(getAuthErrorMessage(err, 'sign up'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <View style={styles.hero}>
        <ScreenHeader
          title="Create your account"
          subtitle="Set up a clean practice workspace in under a minute."
        />
      </View>

      <Card>
        <InputField
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <InputField
          label="Password"
          placeholder="Create a password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          hint="Use at least 8 characters so you can sign in confidently later."
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <PrimaryButton title={loading ? 'Creating account...' : 'Create account'} onPress={onSubmit} disabled={loading} />
        <Pressable onPress={() => router.push('/(auth)/sign-in')} disabled={loading}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
  },
  message: {
    color: '#d4d4d8',
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 4,
  },
});
