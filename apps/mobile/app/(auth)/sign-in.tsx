import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, InputField, PrimaryButton, ScreenHeader } from '@/components';
import { signIn } from '@/services/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit() {
    setError('');
    const { error: signInError } = await signIn(email, password);
    if (signInError) setError(signInError.message);
    else router.replace('/');
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
        <PrimaryButton title="Continue" onPress={onSubmit} />
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