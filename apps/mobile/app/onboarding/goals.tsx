import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';

const options = ['Job interviews', 'Daily conversations', 'Presentations'];

export default function OnboardingGoals() {
  const [goals, setGoals] = useState<string[]>([]);

  return (
    <AppShell>
      <View style={styles.hero}>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>Step 2 of 3</Text>
        </View>
        <ScreenHeader title="Choose your goals" subtitle="Select the conversations you want to feel better at." />
      </View>

      <Card>
        <View style={styles.grid}>
          {options.map((goal) => {
            const selected = goals.includes(goal);
            return (
              <Pressable
                key={goal}
                onPress={() =>
                  setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
                }
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text style={styles.optionTitle}>{goal}</Text>
                <Text style={styles.optionSubtitle}>{selected ? 'Selected' : 'Tap to include this in your plan'}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <PrimaryButton title="Continue" onPress={() => router.push({ pathname: '/onboarding/level', params: { goals: JSON.stringify(goals) } })} />
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
  optionSelected: {
    backgroundColor: '#f8fafc',
    borderColor: '#f8fafc',
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