-- Align public.profiles with the mobile onboarding flow.

alter table public.profiles rename column user_id to id;
alter table public.profiles rename column display_name to full_name;
alter table public.profiles rename column skill_level to level;

alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists goals text[] not null default '{}'::text[],
  add column if not exists streak integer not null default 0,
  add column if not exists weak_areas text[] not null default '{}'::text[];

alter table public.profiles
  drop constraint if exists profiles_streak_check;

alter table public.profiles
  add constraint profiles_streak_check check (streak >= 0);

drop policy if exists "profiles own rows" on public.profiles;

create policy "profiles own rows"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);
