import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../src/services/posthog';
import { RevenueCatService } from '../src/services/revenuecat';
import { MemoryStorage } from '../src/services/storage';

describe('analytics opt-in and revenuecat flow', () => {
  it('supports local-disable analytics behavior', async () => {
    const capture = vi.fn();
    const identify = vi.fn();
    const client = { capture, identify, optIn: vi.fn(), optOut: vi.fn() };
    const analytics = new AnalyticsService(client, new MemoryStorage());

    await analytics.bootstrap();
    analytics.track('app_opened');
    expect(capture).toHaveBeenCalledTimes(1);

    await analytics.setOptIn(false);
    analytics.track('app_opened');
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it('refreshes entitlements and updates backend', async () => {
    const sdk = {
      syncPurchases: vi.fn(async () => {}),
      getCustomerInfo: vi.fn(async () => ({ entitlements: { premium: { isActive: true } } })),
      purchasePackage: vi.fn(async () => {}),
      restorePurchases: vi.fn(async () => {})
    };
    const backend = { updateSubscriptionStatus: vi.fn(async () => {}) };
    const analytics = new AnalyticsService(
      { capture: vi.fn(), identify: vi.fn(), optIn: vi.fn(), optOut: vi.fn() },
      new MemoryStorage()
    );

    const rc = new RevenueCatService(sdk, backend, analytics);
    await rc.refreshEntitlementsOnStartup();

    expect(backend.updateSubscriptionStatus).toHaveBeenCalledWith(true);
    expect(rc.subscriptionActive).toBe(true);
  });
});
