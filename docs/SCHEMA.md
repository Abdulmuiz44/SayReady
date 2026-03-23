# Schema

## AI evaluation schema
See `src/ai/schema.ts`.

Fields:
- `overallScore` (0-100)
- `summary` (string)
- `strengths` (string[])
- `improvements` (string[])
- `cefrLevel` (`A1`-`C2`)

## Suggested Supabase profile columns
- `id uuid primary key`
- `english_level text`
- `primary_goal text`
- `subscription_active boolean`
