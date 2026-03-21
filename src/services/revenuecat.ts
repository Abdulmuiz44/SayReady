import { AnalyticsEvents } from '../analytics/events';
import type { AnalyticsService } from './posthog';

export interface RevenueCatSDK {
  syncPurchases(): Promise<void>;
  getCustomerInfo(): Promise<{ entitlements: Record<string, { isActive: boolean }> }>;
  purchasePackage(packageId: string): Promise<void>;
  restorePurchases(): Promise<void>;
}

export interface BackendSubscriptionAPI {
  updateSubscriptionStatus(active: boolean): Promise<void>;
}

export class RevenueCatService {
  private hasActiveEntitlement = false;

  constructor(
    private readonly sdk: RevenueCatSDK,
    private readonly backend: BackendSubscriptionAPI,
    private readonly analytics: AnalyticsService,
    private readonly entitlementName = 'premium'
  ) {}

  async refreshEntitlementsOnStartup(): Promise<boolean> {
    await this.sdk.syncPurchases();
    const customerInfo = await this.sdk.getCustomerInfo();
    this.hasActiveEntitlement = !!customerInfo.entitlements[this.entitlementName]?.isActive;
    await this.backend.updateSubscriptionStatus(this.hasActiveEntitlement);
    return this.hasActiveEntitlement;
  }

  async purchase(packageId: string): Promise<boolean> {
    this.analytics.track(AnalyticsEvents.PURCHASE_STARTED, { package_id: packageId });
    await this.sdk.purchasePackage(packageId);
    const active = await this.refreshEntitlementsOnStartup();
    if (active) {
      this.analytics.track(AnalyticsEvents.PURCHASE_COMPLETED, { package_id: packageId });
    }
    return active;
  }

  async restore(): Promise<boolean> {
    await this.sdk.restorePurchases();
    const active = await this.refreshEntitlementsOnStartup();
    this.analytics.track(AnalyticsEvents.PURCHASE_RESTORED, { active });
    return active;
  }

  get subscriptionActive(): boolean {
    return this.hasActiveEntitlement;
  }
}
