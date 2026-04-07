create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  screen text,
  severity text not null default 'info' check (severity in ('info', 'warning', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_events_user_created on public.app_events (user_id, created_at desc);
create index if not exists idx_app_events_name_created on public.app_events (event_name, created_at desc);
create index if not exists idx_app_events_screen_created on public.app_events (screen, created_at desc);

alter table public.app_events enable row level security;

create or replace function public.log_app_event(
  event_name text,
  screen text default null,
  severity text default 'info',
  metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.app_events (user_id, event_name, screen, severity, metadata)
  values (auth.uid(), event_name, screen, severity, coalesce(metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.log_app_event(text, text, text, jsonb) to anon, authenticated;
