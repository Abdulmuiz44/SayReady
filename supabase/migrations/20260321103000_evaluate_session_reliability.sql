alter table public.practice_sessions
  add column if not exists failure_reason_code text;

-- Ensure failed is available as terminal status.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'practice_sessions_status_check'
      and conrelid = 'public.practice_sessions'::regclass
  ) then
    alter table public.practice_sessions drop constraint practice_sessions_status_check;
  end if;
end $$;

alter table public.practice_sessions
  add constraint practice_sessions_status_check
  check (status in ('queued', 'in_progress', 'completed', 'abandoned', 'errored', 'failed'));

alter table public.session_attempts
  add column if not exists idempotency_key text;

create unique index if not exists idx_session_attempts_idempotency_key
  on public.session_attempts (idempotency_key)
  where idempotency_key is not null;

create table if not exists public.function_logs (
  id bigint generated always as identity primary key,
  request_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  function_name text not null,
  status text not null check (status in ('success', 'failed')),
  latency_ms integer not null check (latency_ms >= 0),
  error_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_function_logs_created_at on public.function_logs (created_at desc);
create index if not exists idx_function_logs_function_created on public.function_logs (function_name, created_at desc);

alter table public.function_logs enable row level security;

create policy "function_logs service-role only"
on public.function_logs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
