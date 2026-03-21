# Analytics

## Event taxonomy

The mobile app emits the following subscription funnel events to PostHog:

- `paywall_viewed`
- `purchase_started`
- `purchase_completed`
- `restore_purchases_tapped`

### Required properties

For all four events, include:

- `paywall_variant`: `confidence` (Variant A) or `productivity` (Variant B)
- `source`: placement/screen when available (e.g. `home_screen`)

## Query examples (PostHog / HogQL)

### 1) Funnel conversion by paywall variant

```sql
WITH funnel AS (
  SELECT
    distinct_id,
    properties.paywall_variant AS paywall_variant,
    minIf(timestamp, event = 'paywall_viewed') AS viewed_at,
    minIf(timestamp, event = 'purchase_started') AS started_at,
    minIf(timestamp, event = 'purchase_completed') AS completed_at
  FROM events
  WHERE event IN ('paywall_viewed', 'purchase_started', 'purchase_completed')
    AND timestamp >= now() - INTERVAL 30 DAY
  GROUP BY distinct_id, paywall_variant
)
SELECT
  paywall_variant,
  countIf(viewed_at IS NOT NULL) AS viewers,
  countIf(started_at IS NOT NULL) AS purchase_starts,
  countIf(completed_at IS NOT NULL) AS purchases,
  round(100.0 * purchases / nullIf(viewers, 0), 2) AS view_to_purchase_pct,
  round(100.0 * purchases / nullIf(purchase_starts, 0), 2) AS start_to_purchase_pct
FROM funnel
GROUP BY paywall_variant
ORDER BY paywall_variant;
```

### 2) Day-7 retention for users who viewed paywall

```sql
WITH first_paywall_view AS (
  SELECT
    distinct_id,
    min(timestamp) AS cohort_start
  FROM events
  WHERE event = 'paywall_viewed'
    AND timestamp >= now() - INTERVAL 60 DAY
  GROUP BY distinct_id
),
d7 AS (
  SELECT
    fpv.distinct_id,
    fpv.cohort_start,
    countIf(
      e.timestamp >= fpv.cohort_start + INTERVAL 7 DAY
      AND e.timestamp < fpv.cohort_start + INTERVAL 8 DAY
    ) > 0 AS retained_d7
  FROM first_paywall_view fpv
  LEFT JOIN events e ON e.distinct_id = fpv.distinct_id
  GROUP BY fpv.distinct_id, fpv.cohort_start
)
SELECT
  toDate(cohort_start) AS cohort_date,
  count() AS users,
  countIf(retained_d7) AS retained_users_d7,
  round(100.0 * retained_users_d7 / nullIf(users, 0), 2) AS retention_d7_pct
FROM d7
GROUP BY cohort_date
ORDER BY cohort_date DESC;
```

## Local/dev behavior

Analytics calls are intentionally no-op in development whenever `EXPO_PUBLIC_POSTHOG_KEY` is missing.
