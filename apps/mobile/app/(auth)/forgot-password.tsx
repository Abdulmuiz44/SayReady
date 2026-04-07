import { useState } from 'react';
import { Text } from 'react-native';
import { AppShell, Card, InputField, PrimaryButton, ScreenHeader } from '@/components';
import { getAuthErrorMessage } from '@/services/auth-errors';
import { requestReset } from '@/services/auth';
import { trackError, trackEvent } from '@/services/telemetry';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (loading) return;

    setLoading(true);
    try {
      const { error } = await requestReset(email.trim().toLowerCase());
      if (error) {
        void trackError('password_reset_failed', error);
        setStatus(error.message);
      } else {
        void trackEvent({ eventName: 'password_reset_requested' });
        setStatus('Reset email sent. Check your inbox.');
      }
    } catch (err) {
      void trackError('password_reset_failed', err);
      setStatus(getAuthErrorMessage(err, 'reset password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <ScreenHeader title="Reset password" subtitle="We&apos;ll send a sign-in link to your inbox." />
      <Card>
        <InputField label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <PrimaryButton title={loading ? 'Sending...' : 'Send reset link'} onPress={onSubmit} disabled={loading} />
        {status ? <Text style={{ color: '#cfcfe2', textAlign: 'center' }}>{status}</Text> : null}
      </Card>
    </AppShell>
  );
}
