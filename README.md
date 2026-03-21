# SayReady

SayReady is a pnpm monorepo for a mobile speaking-practice app and supporting backend services.

## Repository layout

- `apps/mobile` — Expo/React Native client app.
- `packages/ui` — shared UI package.
- `packages/config` — shared configuration package.
- `supabase/functions` — Supabase Edge Functions.
- `supabase/migrations` — database schema and seed migrations.
- `docs` — project documentation.

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
