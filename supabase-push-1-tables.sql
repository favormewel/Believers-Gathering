create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push select own" on public.push_subscriptions;
drop policy if exists "push insert own" on public.push_subscriptions;
drop policy if exists "push update own" on public.push_subscriptions;
drop policy if exists "push delete own" on public.push_subscriptions;
create policy "push select own" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy "push insert own" on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy "push update own" on public.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push delete own" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

create table if not exists public.push_settings (
  id int primary key check (id = 1),
  project_url text not null,
  push_secret text not null
);
alter table public.push_settings enable row level security;
