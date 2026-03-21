export const AnalyticsEvents = {
  APP_OPENED: 'app_opened',
  PAYWALL_SHOWN: 'paywall_shown',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_RESTORED: 'purchase_restored',
  LESSON_EVALUATED: 'lesson_evaluated'
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
