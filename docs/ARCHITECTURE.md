# Architecture

## Modules
- `src/services/posthog.ts`: analytics bootstrap, opt-in toggle, local-disable behavior.
- `src/services/revenuecat.ts`: entitlement refresh, purchase flow, restore purchases, backend sync.
- `src/services/subscription.ts`: feature gating helpers driven by backend subscription state.
- `src/evaluation/logic.ts`: evaluation blending between AI and learner model score.

## Data Flow
1. App startup refreshes RevenueCat entitlements.
2. Backend subscription flag is updated.
3. Feature gates consume backend state.
4. Analytics tracking runs only when opt-in is enabled.
