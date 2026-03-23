export interface SubscriptionState {
  active: boolean;
  source: 'backend' | 'device';
}

export const canAccessPremiumFeature = (state: SubscriptionState): boolean => state.active;

export const gateFeature = <T>(state: SubscriptionState, premiumAction: () => T, fallback: () => T): T => {
  if (canAccessPremiumFeature(state)) return premiumAction();
  return fallback();
};
