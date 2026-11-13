-- CHRIST HUB: Events + Posts + Followers
-- Run this ONCE in Supabase > SQL Editor. It only ADDS 4 new tables; it does not touch your existing ones.
-- Safe to run again: it skips what already exists.

-- ============ EVENTS ============
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  description text check (char_length(description) <= 600),
  location text check (char_length(location) <= 160),
  starts_at timestamptz not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creator_name text,
  created_at timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events (starts_at);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ============ POSTS ============
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_user_idx on public.posts (user_id);

-- ============ FOLLOWS ============
create table if not exists public.follows (
  follower_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

-- ============ ROW LEVEL SECURITY ============
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;

drop policy if exists "events read" on public.events;
drop policy if exists "events insert" on public.events;
drop policy if exists "events update" on public.events;
drop policy if exists "events delete" on public.events;
create policy "events read"   on public.events for select to authenticated using (true);
create policy "events insert" on public.events for insert to authenticated with check (created_by = auth.uid());
create policy "events update" on public.events for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "events delete" on public.events for delete to authenticated using (created_by = auth.uid());

drop policy if exists "rsvps read" on public.event_rsvps;
drop policy if exists "rsvps insert" on public.event_rsvps;
drop policy if exists "rsvps delete" on public.event_rsvps;
create policy "rsvps read"   on public.event_rsvps for select to authenticated using (true);
create policy "rsvps insert" on public.event_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "rsvps delete" on public.event_rsvps for delete to authenticated using (user_id = auth.uid());

drop policy if exists "posts read" on public.posts;
drop policy if exists "posts insert" on public.posts;
drop policy if exists "posts delete" on public.posts;
create policy "posts read"   on public.posts for select to authenticated using (true);
create policy "posts insert" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "posts delete" on public.posts for delete to authenticated using (user_id = auth.uid());

drop policy if exists "follows read" on public.follows;
drop policy if exists "follows insert" on public.follows;
drop policy if exists "follows delete" on public.follows;
create policy "follows read"   on public.follows for select to authenticated using (true);
create policy "follows insert" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "follows delete" on public.follows for delete to authenticated using (follower_id = auth.uid());
