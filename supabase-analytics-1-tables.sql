create table if not exists public.daily_seen (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
create index if not exists daily_seen_day_idx on public.daily_seen (day);
alter table public.daily_seen enable row level security;

drop policy if exists "seen insert own" on public.daily_seen;
drop policy if exists "seen read own" on public.daily_seen;
create policy "seen insert own" on public.daily_seen for insert to authenticated with check (user_id = auth.uid());
create policy "seen read own" on public.daily_seen for select to authenticated using (user_id = auth.uid());
