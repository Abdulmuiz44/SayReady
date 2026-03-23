import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { AppShell, PrimaryButton, ScreenHeader } from '@/components';
import { requestReset } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  async function onSubmit() {
    const { error } = await requestReset(email);
    setStatus(error ? error.message : 'Reset email sent. Check your inbox.');
  }

  return (
    <AppShell>
      <ScreenHeader title="Reset password" />
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12 }} />
      <PrimaryButton title="Send reset link" onPress={onSubmit} />
      {status ? <Text style={{ color: '#cfcfe2' }}>{status}</Text> : null}
    </AppShell>
  );
}
