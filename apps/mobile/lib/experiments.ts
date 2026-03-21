export type PaywallVariant = 'confidence' | 'productivity';

const hashUserId = (userId: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i += 1) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const getPaywallVariant = (userId: string): PaywallVariant => {
  return hashUserId(userId) % 2 === 0 ? 'confidence' : 'productivity';
};
