-- CHEN NETWORK: Likes + Comments on community posts
-- Run once in Supabase > SQL Editor. Only adds 2 new tables. Safe to run again.

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

drop policy if exists "likes read" on public.post_likes;
drop policy if exists "likes insert" on public.post_likes;
drop policy if exists "likes delete" on public.post_likes;
create policy "likes read"   on public.post_likes for select to authenticated using (true);
create policy "likes insert" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes delete" on public.post_likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "comments read" on public.post_comments;
drop policy if exists "comments insert" on public.post_comments;
drop policy if exists "comments delete" on public.post_comments;
create policy "comments read"   on public.post_comments for select to authenticated using (true);
create policy "comments insert" on public.post_comments for insert to authenticated with check (user_id = auth.uid());
create policy "comments delete" on public.post_comments for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
