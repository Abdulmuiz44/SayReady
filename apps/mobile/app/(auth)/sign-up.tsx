import { useState } from 'react';
import { router } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { AppShell, PrimaryButton, ScreenHeader } from '@/components';
import { signUp } from '@/services/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit() {
    const { error: signUpError } = await signUp(email, password);
    if (signUpError) setError(signUpError.message);
    else router.replace('/onboarding');
  }

  return (
    <AppShell>
      <ScreenHeader title="Create account" />
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12 }} />
      {error ? <Text style={{ color: '#ff8a8a' }}>{error}</Text> : null}
      <PrimaryButton title="Sign up" onPress={onSubmit} />
    </AppShell>
  );
}
