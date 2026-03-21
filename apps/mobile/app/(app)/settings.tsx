import { Text } from 'react-native';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from '@/services/auth';

export default function SettingsScreen() {
  const { user, profile } = useAuth();

  return (
    <AppShell>
      <ScreenHeader title="Settings" />
      <Card>
        <Text style={{ color: '#fff' }}>Email: {user?.email}</Text>
        <Text style={{ color: '#fff' }}>Level: {profile?.level ?? 'Unknown'}</Text>
      </Card>
      <PrimaryButton title="Sign out" onPress={() => signOut()} />
    </AppShell>
  );
}
