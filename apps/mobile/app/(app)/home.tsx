import { useEffect, useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

import { getPaywallVariant } from '../../lib/experiments';
import { trackEvent } from '../../lib/analytics';
import { getRetentionNudges } from '../../lib/retention';

const demoUserId = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? 'anonymous-user';

export default function HomeScreen() {
  const [sessionsThisWeek] = useState(3);
  const paywallVariant = useMemo(() => getPaywallVariant(demoUserId), []);
  const nudges = useMemo(() => getRetentionNudges(sessionsThisWeek), [sessionsThisWeek]);

  useEffect(() => {
    void trackEvent('paywall_viewed', demoUserId, {
      paywall_variant: paywallVariant,
      source: 'home_screen',
    });
  }, [paywallVariant]);

  const paywallHeadline = paywallVariant === 'confidence'
    ? 'Build confidence before your next high-stakes conversation.'
    : 'Get more productive and land better job outcomes with focused feedback.';

  const paywallBody = paywallVariant === 'confidence'
    ? 'Practice consistently and track confidence gains session by session.'
    : 'Use targeted drills to improve interview performance and workplace clarity.';

  const handlePurchaseStart = async () => {
    await trackEvent('purchase_started', demoUserId, { paywall_variant: paywallVariant });
  };

  const handlePurchaseCompleted = async () => {
    await trackEvent('purchase_completed', demoUserId, { paywall_variant: paywallVariant });
  };

  const handleRestorePurchases = async () => {
    await trackEvent('restore_purchases_tapped', demoUserId, { paywall_variant: paywallVariant });
  };

  return (
    <SafeAreaView>
      <View style={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>App Home</Text>

        <View style={{ borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Premium</Text>
          <Text>{paywallHeadline}</Text>
          <Text>{paywallBody}</Text>
          <Text style={{ fontSize: 12, opacity: 0.7 }}>
            Variant: {paywallVariant === 'confidence' ? 'A (Confidence)' : 'B (Productivity/Jobs)'}
          </Text>

          <Pressable onPress={handlePurchaseStart} style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Start Purchase</Text>
          </Pressable>
          <Pressable onPress={handlePurchaseCompleted} style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#15803d', fontWeight: '600' }}>Complete Purchase</Text>
          </Pressable>
          <Pressable onPress={handleRestorePurchases} style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#7c3aed', fontWeight: '600' }}>Restore Purchases</Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Retention nudges</Text>
          {nudges.map((nudge) => (
            <Text key={nudge}>• {nudge}</Text>
          ))}
        </View>

        <Link href="/(auth)/sign-in">Sign out</Link>
      </View>
    </SafeAreaView>
  );
}
