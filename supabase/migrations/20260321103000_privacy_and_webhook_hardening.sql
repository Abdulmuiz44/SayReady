-- Privacy, data lifecycle, and webhook hardening additions.

create table if not exists public.revenuecat_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_type text not null,
  app_user_id text not null,
  payload jsonb not null,
  delivered_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id)
);

create index if not exists idx_revenuecat_webhook_events_app_user_created
  on public.revenuecat_webhook_events (app_user_id, created_at desc);

create table if not exists public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'completed' check (status in ('queued', 'completed', 'failed')),
  bundle_path text,
  requested_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  error_message text
);

create index if not exists idx_data_export_requests_user_requested_at
  on public.data_export_requests (user_id, requested_at desc);

alter table public.data_export_requests enable row level security;

create policy "data_export_requests own rows"
on public.data_export_requests
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  failure_reason text
);

create index if not exists idx_account_deletion_requests_user_requested_at
  on public.account_deletion_requests (user_id, requested_at desc);

alter table public.account_deletion_requests enable row level security;

create policy "account_deletion_requests own rows"
on public.account_deletion_requests
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_usage_events_eval_window_user
  on public.usage_events (event_type, user_id, event_at desc)
  where event_type = 'evaluation.request';

create index if not exists idx_usage_events_eval_window_ip
  on public.usage_events (event_type, ((metadata->>'ip')), event_at desc)
  where event_type = 'evaluation.request';
