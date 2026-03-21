const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

const analyticsEnabled = Boolean(posthogKey) && (!__DEV__ || Boolean(posthogKey));

export type FunnelEvent =
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_completed'
  | 'restore_purchases_tapped';

export const trackEvent = async (
  event: FunnelEvent,
  distinctId: string,
  properties: Record<string, string | number | boolean | undefined> = {},
): Promise<void> => {
  if (__DEV__ && !posthogKey) {
    return;
  }

  if (!analyticsEnabled || !posthogKey) {
    return;
  }

  try {
    await fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: posthogKey,
        event,
        distinct_id: distinctId,
        properties,
      }),
    });
  } catch {
    // Ignore analytics failures so product UX is not blocked.
  }
};
