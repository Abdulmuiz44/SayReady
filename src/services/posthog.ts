import type { UserProfile } from '../types/profile';
import type { KeyValueStorage } from './storage';

const POSTHOG_DISABLED_KEY = 'analytics_disabled_local';

export interface PostHogClient {
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, properties: Record<string, unknown>): void;
  optIn(): void;
  optOut(): void;
}

export class AnalyticsService {
  private enabled = true;

  constructor(
    private readonly client: PostHogClient,
    private readonly storage: KeyValueStorage
  ) {}

  async bootstrap(): Promise<void> {
    const locallyDisabled = await this.storage.getBoolean(POSTHOG_DISABLED_KEY);
    if (locallyDisabled) {
      this.enabled = false;
      this.client.optOut();
      return;
    }

    this.enabled = true;
    this.client.optIn();
  }

  async setOptIn(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await this.storage.setBoolean(POSTHOG_DISABLED_KEY, !enabled);
    if (enabled) {
      this.client.optIn();
    } else {
      this.client.optOut();
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.client.capture(event, properties);
  }

  identify(profile: UserProfile): void {
    if (!this.enabled) return;
    this.client.identify(profile.id, {
      english_level: profile.englishLevel,
      primary_goal: profile.primaryGoal,
      subscription_active: profile.subscriptionActive
    });
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}
