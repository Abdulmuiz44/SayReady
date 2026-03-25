import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, ScreenHeader } from '@/components';

const levels = [
  { key: 'beginner', label: 'Beginner', helper: 'Starting from the basics' },
  { key: 'intermediate', label: 'Intermediate', helper: 'Building speed and confidence' },
  { key: 'advanced', label: 'Advanced', helper: 'Polishing nuance and fluency' },
] as const;

export default function OnboardingLevel() {
  const { goals } = useLocalSearchParams<{ goals: string }>();
  return (
    <AppShell>
      <View style={styles.hero}>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>Step 3 of 3</Text>
        </View>
        <ScreenHeader title="What’s your level?" subtitle="Pick the starting point that matches where you are today." />
      </View>

      <Card>
        <View style={styles.grid}>
          {levels.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => router.push({ pathname: '/onboarding/profile', params: { goals, level: item.key } })}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <Text style={styles.optionTitle}>{item.label}</Text>
              <Text style={styles.optionSubtitle}>{item.helper}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
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
  grid: {
    gap: 12,
  },
  option: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#27272a',
    backgroundColor: '#09090b',
    padding: 16,
    gap: 4,
  },
  optionPressed: {
    opacity: 0.9,
  },
  optionTitle: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '800',
  },
  optionSubtitle: {
    color: '#a1a1aa',
    lineHeight: 20,
  },
});