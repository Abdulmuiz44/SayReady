# Release Checklist

Use this checklist for every mobile app release.

## 1) Environment verification

- Confirm required environment variables are set for the target environment (`development`, `preview`, or `production`).
- Validate Supabase project URL/keys, Expo credentials, and RevenueCat keys.
- Ensure build profiles in `apps/mobile/eas.json` match intended release target.

## 2) Database migrations applied

- Review pending SQL migrations in `supabase/migrations/`.
- Apply migrations to staging first, then production.
- Verify schema compatibility with the mobile app version being shipped.

## 3) Smoke test script

Run this smoke test before promoting a build:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Then perform basic runtime checks on the release candidate build:

- Sign-in flow works.
- Onboarding and home screens load.
- Critical edge function calls return successful responses.

## 4) Rollback steps

If release health degrades after deployment:

1. Halt phased rollout / stop promotion of the current build in Expo/EAS.
2. Re-publish or promote the previous known-good build.
3. If a migration caused regression, apply a documented down migration or hotfix migration.
4. Monitor logs and key metrics until error rate returns to baseline.
5. Record incident summary and follow-up actions in changelog/ops notes.

## 5) Crash and error triage playbook (free logging first)

### Supabase (database + edge functions)

- Use Supabase project logs to inspect Postgres errors and edge function exceptions.
- Correlate spikes by timestamp and endpoint/function name.
- Capture failing request identifiers and SQL error messages.
- Classify severity:
  - **P0**: auth/data loss/outage
  - **P1**: major user flow broken
  - **P2**: degraded but recoverable

### Expo / EAS

- Check EAS build logs for failed release pipelines.
- Check Expo runtime logs (where available for the deployed runtime) for client-side crashes.
- Compare failures by build profile (`development`, `preview`, `production`) to isolate config-only issues.

### Triage workflow

1. Reproduce with the same app version + environment.
2. Identify top failing path and owner.
3. Ship minimal mitigation (feature flag/config rollback/hotfix).
4. Verify fix in `preview` profile before `production`.
5. Add root-cause + preventive action notes to changelog.

## 6) Semantic versioning and changelog policy

### Versioning model

- Follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`).
- **MAJOR**: incompatible API/behavior changes.
- **MINOR**: backward-compatible feature additions.
- **PATCH**: backward-compatible fixes only.

### Changelog policy

- Maintain `CHANGELOG.md` at repo root.
- Use sections for each release version and date.
- Include at minimum:
  - Added
  - Changed
  - Fixed
  - Security (if applicable)
- Every production release must include a changelog entry before rollout.
