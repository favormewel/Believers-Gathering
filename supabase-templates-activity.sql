-- CHEN NETWORK: post templates + user activity feed
-- Run once in Supabase > SQL Editor. Safe to run again.

alter table public.posts add column if not exists kind text
  check (kind is null or kind in ('prayer','testimony','verse','encourage','thanks','question'));

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  actor_name text,
  type text not null check (type in ('follow','rsvp','event')),
  text text not null check (char_length(text) <= 160),
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists activities_created_idx on public.activities (created_at desc);
alter table public.activities enable row level security;

drop policy if exists "activities read" on public.activities;
drop policy if exists "activities insert" on public.activities;
drop policy if exists "activities delete" on public.activities;
create policy "activities read"   on public.activities for select to authenticated using (true);
create policy "activities insert" on public.activities for insert to authenticated with check (user_id = auth.uid());
create policy "activities delete" on public.activities for delete to authenticated using (user_id = auth.uid());
