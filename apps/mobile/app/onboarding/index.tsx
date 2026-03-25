import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';

export default function OnboardingIntro() {
  return (
    <AppShell>
      <View style={styles.hero}>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>Step 1 of 3</Text>
        </View>
        <ScreenHeader title="Set up your practice plan" subtitle="A short onboarding flow that gets you to your first session quickly." />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>What we&apos;ll personalize</Text>
        {['Speaking goals', 'Current level', 'Profile details'].map((item) => (
          <View key={item} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </Card>

      <PrimaryButton title="Start setup" onPress={() => router.push('/onboarding/goals')} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#111113',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#27272a',
  },
  stepText: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  rowText: {
    color: '#d4d4d8',
    lineHeight: 21,
  },
});
