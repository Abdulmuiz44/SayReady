# SayReady

SayReady is a pnpm monorepo for a mobile speaking-practice app and supporting backend services.

## Repository layout

- `apps/mobile` - Expo/React Native client app.
- `packages/ui` - shared UI package.
- `packages/config` - shared configuration package.
- `supabase/functions` - Supabase Edge Functions.
- `supabase/migrations` - database schema and seed migrations.
- `docs` - project documentation.

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Install dependencies

```bash
pnpm install
```

### Common commands

```bash
pnpm mobile      # Run the mobile app
pnpm lint        # Lint mobile app code
pnpm typecheck   # Run TypeScript checks
pnpm test        # Run tests
```

## Environment

Copy `.env.example` to `.env` and fill in required values for local development.

## Setup
1. Install Node.js 22+.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `POSTHOG_API_KEY`
   - `POSTHOG_HOST`
   - `REVENUECAT_API_KEY`
   - `OPENAI_API_KEY`

## Supabase
- Create a Supabase project and run migrations from `supabase/migrations`.
- Seed test data from `supabase/seed.sql`.
- Keep backend subscription status in a `profiles.subscription_active` column.

## Running the app
```bash
npm run typecheck
npm test
```

## AI pipeline
- Validate AI responses with `src/ai/schema.ts` before persisting.
- Use `src/evaluation/logic.ts` for blended score calculation.

## RevenueCat configuration
- Initialize SDK on app startup.
- Call entitlement refresh using `RevenueCatService.refreshEntitlementsOnStartup`.
- Route purchase and restore through `purchase` / `restore` helpers.

## PostHog configuration
- Initialize analytics with `AnalyticsService.bootstrap`.
- Respect local disable from user opt-in toggle.
- Identify users with `english_level`, `primary_goal`, and `subscription_active`.
