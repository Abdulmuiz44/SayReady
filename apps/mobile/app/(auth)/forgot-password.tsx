import { useState } from 'react';
import { Text } from 'react-native';
import { AppShell, Card, InputField, PrimaryButton, ScreenHeader } from '@/components';
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
      <ScreenHeader title="Reset password" subtitle="We&apos;ll send a sign-in link to your inbox." />
      <Card>
        <InputField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <PrimaryButton title="Send reset link" onPress={onSubmit} />
        {status ? <Text style={{ color: '#cfcfe2', textAlign: 'center' }}>{status}</Text> : null}
      </Card>
    </AppShell>
  );
}
