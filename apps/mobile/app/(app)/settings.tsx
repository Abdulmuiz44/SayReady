import { Text, View } from 'react-native';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from '@/services/auth';

export default function SettingsScreen() {
  const { user, profile } = useAuth();

  return (
    <AppShell>
      <ScreenHeader title="Settings" subtitle="Manage your account and practice profile." />
      <Card>
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#fafafa', fontWeight: '700' }}>Email</Text>
          <Text style={{ color: '#a1a1aa' }}>{user?.email}</Text>
        </View>
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#fafafa', fontWeight: '700' }}>Level</Text>
          <Text style={{ color: '#a1a1aa' }}>{profile?.level ?? 'Unknown'}</Text>
        </View>
      </Card>
      <PrimaryButton title="Sign out" onPress={() => signOut()} />
    </AppShell>
  );
}