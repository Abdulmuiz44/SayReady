import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { AppShell, PrimaryButton, ScreenHeader } from '@/components';
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
      <ScreenHeader title="Sign in" />
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12 }} />
      {error ? <Text style={{ color: '#ff8a8a' }}>{error}</Text> : null}
      <PrimaryButton title="Continue" onPress={onSubmit} />
      <Link href="/(auth)/forgot-password"><Text style={{ color: '#bdbddb' }}>Forgot password?</Text></Link>
    </AppShell>
  );
}
