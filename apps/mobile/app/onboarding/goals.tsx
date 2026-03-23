import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { AppShell, Card, PrimaryButton, SecondaryButton, ScreenHeader } from '@/components';

const options = ['Job interviews', 'Daily conversations', 'Presentations'];

export default function OnboardingGoals() {
  const [goals, setGoals] = useState<string[]>([]);

  return (
    <AppShell>
      <ScreenHeader title="Your goals" />
      {options.map((goal) => (
        <Card key={goal}>
          <Text style={{ color: '#fff' }}>{goal}</Text>
          <SecondaryButton title={goals.includes(goal) ? 'Selected' : 'Select'} onPress={() => setGoals((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal])} />
        </Card>
      ))}
      <PrimaryButton title="Continue" onPress={() => router.push({ pathname: '/onboarding/level', params: { goals: JSON.stringify(goals) } })} />
    </AppShell>
  );
}
