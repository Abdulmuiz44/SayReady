import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, PrimaryButton, SecondaryButton, ScreenHeader } from '@/components';

const bullets = ['Shadcn-inspired forms', 'Centered layout on every device', 'Fast onboarding to your first scenario'];

export default function WelcomeScreen() {
  return (
    <AppShell>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI speaking coach</Text>
        </View>
        <ScreenHeader title="Speak with confidence" subtitle="A focused practice app with a clean shadcn-style interface." />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>What you get</Text>
        {bullets.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.dot} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Sign in" onPress={() => router.push('/(auth)/sign-in')} />
        <SecondaryButton title="Create account" onPress={() => router.push('/(auth)/sign-up')} />
      </View>

      <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.link}>Need to reset your password?</Text>
      </Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#27272a',
    backgroundColor: '#111113',
  },
  badgeText: {
    color: '#fafafa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#fafafa',
    fontWeight: '800',
    fontSize: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  bulletText: {
    color: '#d4d4d8',
    flex: 1,
    lineHeight: 21,
  },
  actions: {
    gap: 10,
  },
  link: {
    color: '#a1a1aa',
    textAlign: 'center',
  },
});