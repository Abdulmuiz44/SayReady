-- Core schema for SayReady practice platform

create extension if not exists pgcrypto;

-- Keep updated_at in sync for mutable tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  timezone text default 'UTC',
  skill_level text not null default 'beginner' check (skill_level in ('beginner', 'intermediate', 'advanced')),
  total_minutes_practiced integer not null default 0 check (total_minutes_practiced >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  is_premium boolean not null default false,
  is_active boolean not null default true,
  estimated_minutes integer not null check (estimated_minutes between 3 and 30),
  description text not null,
  prompt text not null,
  rubric jsonb not null,
  follow_up_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid not null references public.scenarios(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completed', 'abandoned', 'errored')),
  started_at timestamptz,
  completed_at timestamptz,
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  transcript text,
  summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table if not exists public.session_attempts (
  id uuid primary key default gen_random_uuid(),
  practice_session_id uuid not null references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'processing' check (status in ('processing', 'scored', 'failed')),
  audio_object_path text,
  transcription_confidence numeric(4,3) check (transcription_confidence is null or (transcription_confidence >= 0 and transcription_confidence <= 1)),
  overall_score numeric(5,2) check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  raw_feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (practice_session_id, attempt_number)
);

create table if not exists public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  session_attempt_id uuid not null references public.session_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('strength', 'improvement', 'tip', 'rubric_score')),
  category text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  score_delta numeric(5,2),
  message text not null,
  evidence text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid references public.scenarios(id) on delete set null,
  session_attempt_id uuid references public.session_attempts(id) on delete set null,
  mistake_key text not null,
  category text not null,
  count integer not null default 1 check (count > 0),
  last_seen_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, mistake_key)
);

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak_days integer not null default 0 check (current_streak_days >= 0),
  best_streak_days integer not null default 0 check (best_streak_days >= 0),
  last_practiced_on date,
  freeze_tokens integer not null default 0 check (freeze_tokens >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe', 'app_store', 'play_store', 'manual')),
  plan_code text not null,
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  external_customer_id text,
  external_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (current_period_end > current_period_start)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  event_type text not null,
  units integer not null default 1 check (units > 0),
  event_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Updated at triggers on mutable tables.
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger set_scenarios_updated_at
before update on public.scenarios
for each row execute procedure public.set_updated_at();

create trigger set_practice_sessions_updated_at
before update on public.practice_sessions
for each row execute procedure public.set_updated_at();

create trigger set_session_attempts_updated_at
before update on public.session_attempts
for each row execute procedure public.set_updated_at();

create trigger set_feedback_items_updated_at
before update on public.feedback_items
for each row execute procedure public.set_updated_at();

create trigger set_user_mistakes_updated_at
before update on public.user_mistakes
for each row execute procedure public.set_updated_at();

create trigger set_user_streaks_updated_at
before update on public.user_streaks
for each row execute procedure public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

-- Indexes for frequent filters.
create index if not exists idx_scenarios_active_category_created on public.scenarios (is_active, category, created_at desc);
create index if not exists idx_scenarios_premium_difficulty on public.scenarios (is_premium, difficulty);

create index if not exists idx_practice_sessions_user_created on public.practice_sessions (user_id, created_at desc);
create index if not exists idx_practice_sessions_user_status on public.practice_sessions (user_id, status);
create index if not exists idx_practice_sessions_scenario_created on public.practice_sessions (scenario_id, created_at desc);

create index if not exists idx_session_attempts_user_created on public.session_attempts (user_id, created_at desc);
create index if not exists idx_session_attempts_session_created on public.session_attempts (practice_session_id, created_at desc);
create index if not exists idx_session_attempts_status_created on public.session_attempts (status, created_at desc);

create index if not exists idx_feedback_items_user_created on public.feedback_items (user_id, created_at desc);
create index if not exists idx_feedback_items_attempt on public.feedback_items (session_attempt_id);

create index if not exists idx_user_mistakes_user_last_seen on public.user_mistakes (user_id, last_seen_at desc);
create index if not exists idx_user_mistakes_scenario on public.user_mistakes (scenario_id);

create index if not exists idx_subscriptions_user_status on public.subscriptions (user_id, status);
create index if not exists idx_subscriptions_period_end on public.subscriptions (current_period_end);

create index if not exists idx_usage_events_user_event_at on public.usage_events (user_id, event_at desc);
create index if not exists idx_usage_events_subscription_event_at on public.usage_events (subscription_id, event_at desc);
create index if not exists idx_usage_events_type_event_at on public.usage_events (event_type, event_at desc);

-- Row level security setup.
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.session_attempts enable row level security;
alter table public.feedback_items enable row level security;
alter table public.user_mistakes enable row level security;
alter table public.user_streaks enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;

create policy "profiles own rows"
on public.profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "scenarios active read"
on public.scenarios
for select
using (is_active = true);

create policy "practice_sessions own rows"
on public.practice_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "session_attempts own rows"
on public.session_attempts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "feedback_items own rows"
on public.feedback_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_mistakes own rows"
on public.user_mistakes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_streaks own rows"
on public.user_streaks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "subscriptions own rows"
on public.subscriptions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "usage_events own rows"
on public.usage_events
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Storage bucket setup.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('session-audio', 'session-audio', false, 52428800, array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/webm']),
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

create policy "session audio own read"
on storage.objects
for select
using (
  bucket_id = 'session-audio'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "session audio own write"
on storage.objects
for insert
with check (
  bucket_id = 'session-audio'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "session audio own update"
on storage.objects
for update
using (
  bucket_id = 'session-audio'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'session-audio'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "session audio own delete"
on storage.objects
for delete
using (
  bucket_id = 'session-audio'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "avatars public read"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "avatars own write"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "avatars own update"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "avatars own delete"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);
