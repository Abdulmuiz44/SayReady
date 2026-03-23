# Analytics

## Opt-in model
- User-controlled toggle writes `analytics_disabled_local` to storage.
- When disabled, events are blocked client-side.

## Required events
- `app_opened`
- `paywall_shown`
- `purchase_started`
- `purchase_completed`
- `purchase_restored`
- `lesson_evaluated`

## Identity properties
- `english_level`
- `primary_goal`
- `subscription_active`
