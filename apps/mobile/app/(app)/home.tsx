import { useEffect, useState } from 'react';
import { router, Link } from 'expo-router';
import { Text, View } from 'react-native';
import { AppShell, Card, PrimaryButton, ScreenHeader } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { getTodayRecommendation } from '@/services/recommendations';
import { trackError, trackEvent } from '@/services/telemetry';
import type { HomeRecommendation, WeeklyPracticeSummary } from '@/types';

export default function HomeScreen() {
  const { profile } = useAuth();
  const [recommendation, setRecommendation] = useState<HomeRecommendation | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklyPracticeSummary | null>(null);

  useEffect(() => {
    if (!profile) return;

    getTodayRecommendation(profile.goals?.[0])
      .then(({ data, error }) => {
        if (error) throw error;

        const selected = data?.recommendation?.selected;
        const scenario = selected?.scenario;
        const score = selected?.score ?? scenario?.score ?? 0;

        setRecommendation(
          scenario
            ? {
                scenario_id: scenario.scenario_id,
                slug: scenario.slug,
                title: scenario.title,
                category: scenario.category,
                score,
              }
            : null,
        );
        setWeeklySummary(data?.weekly_summary ?? null);
        void trackEvent({ eventName: 'home_recommendation_loaded', metadata: { has_recommendation: Boolean(scenario) } });
      })
      .catch((error) => {
        setRecommendation(null);
        setWeeklySummary(null);
        void trackError('home_recommendation_failed', error);
      });
  }, [profile]);

  if (!profile) return null;

  const topMistakes = weeklySummary?.top_repeated_mistakes ?? [];
  const bestCategory = weeklySummary?.best_category_score?.category;

  return (
    <AppShell>
      <ScreenHeader title="Dashboard" subtitle={`Streak ${profile.streak ?? 0} days - keep the momentum going`} />

      <Card>
        <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '800' }}>Today's focus</Text>
        <Text style={{ color: '#a1a1aa', lineHeight: 21 }}>Pick a scenario, rehearse out loud, then review the score and mistakes in a clean feedback view.</Text>
        <PrimaryButton title="Browse scenarios" onPress={() => router.push('/(app)/scenarios')} />
      </Card>

      <Card>
        <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '800' }}>Recommended</Text>
        <Text style={{ color: '#d4d4d8', lineHeight: 21 }}>{recommendation?.title ?? 'No recommendation yet'}</Text>
        {recommendation?.category ? <Text style={{ color: '#a1a1aa', lineHeight: 21 }}>Category: {recommendation.category}</Text> : null}
        {recommendation?.slug ? (
          <PrimaryButton title="Start recommended scenario" onPress={() => router.push(`/(app)/scenarios/${recommendation.slug}`)} />
        ) : null}
      </Card>

      <Card>
        <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '800' }}>Weak areas</Text>
        <Text style={{ color: '#d4d4d8', lineHeight: 21 }}>{(profile.weak_areas ?? []).join(', ') || 'None yet'}</Text>
      </Card>

      <Card>
        <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '800' }}>This week</Text>
        <Text style={{ color: '#d4d4d8', lineHeight: 21 }}>
          Minutes practiced: {weeklySummary?.minutes_practiced ?? 0}
        </Text>
        <Text style={{ color: '#d4d4d8', lineHeight: 21 }}>
          Best category: {bestCategory ?? 'Not enough data yet'}
        </Text>
        <Text style={{ color: '#d4d4d8', lineHeight: 21 }}>
          Top mistakes: {topMistakes.length ? topMistakes.map((item) => item.mistake_key).join(', ') : 'None yet'}
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        <Link href="/(app)/scenarios">
          <Text style={{ color: '#f8fafc', textAlign: 'center', fontWeight: '700' }}>Browse scenarios</Text>
        </Link>
        <Link href="/(app)/history">
          <Text style={{ color: '#a1a1aa', textAlign: 'center' }}>Continue previous session</Text>
        </Link>
      </View>
    </AppShell>
  );
}
