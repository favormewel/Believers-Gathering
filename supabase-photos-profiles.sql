-- CHEN NETWORK: photos on posts, profile pictures, unlimited post/comment length
-- Run once in Supabase > SQL Editor. Safe to run again.

-- 1. Posts: photos + no 500-letter limit
alter table public.posts add column if not exists image_urls text[] not null default '{}';
alter table public.posts drop constraint if exists posts_body_check;
alter table public.posts drop constraint if exists posts_body_len;
alter table public.posts drop constraint if exists posts_has_content;
alter table public.posts add constraint posts_body_len check (char_length(body) <= 100000);
alter table public.posts add constraint posts_has_content check (char_length(body) > 0 or cardinality(image_urls) > 0);

-- 2. Comments: no 300-letter limit (skipped if the comments table does not exist yet)
do $$
begin
  if to_regclass('public.post_comments') is not null then
    alter table public.post_comments drop constraint if exists post_comments_body_check;
    alter table public.post_comments drop constraint if exists post_comments_body_len;
    alter table public.post_comments add constraint post_comments_body_len check (char_length(body) between 1 and 100000);
  end if;
end $$;

-- 3. Profile pictures
create table if not exists public.member_avatars (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  avatar_url text not null,
  updated_at timestamptz not null default now()
);
alter table public.member_avatars enable row level security;
drop policy if exists "avatars read" on public.member_avatars;
drop policy if exists "avatars insert" on public.member_avatars;
drop policy if exists "avatars update" on public.member_avatars;
drop policy if exists "avatars delete" on public.member_avatars;
create policy "avatars read"   on public.member_avatars for select to authenticated using (true);
create policy "avatars insert" on public.member_avatars for insert to authenticated with check (user_id = auth.uid());
create policy "avatars update" on public.member_avatars for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "avatars delete" on public.member_avatars for delete to authenticated using (user_id = auth.uid());

-- 4. Photo storage (public pictures, each member can only write inside their own folder)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('post-images', 'post-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars',     'avatars',     true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "chen images read" on storage.objects;
drop policy if exists "chen images insert" on storage.objects;
drop policy if exists "chen images update" on storage.objects;
drop policy if exists "chen images delete" on storage.objects;
create policy "chen images read" on storage.objects for select
  using (bucket_id in ('post-images','avatars'));
create policy "chen images insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('post-images','avatars') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "chen images update" on storage.objects for update to authenticated
  using (bucket_id in ('post-images','avatars') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('post-images','avatars') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "chen images delete" on storage.objects for delete to authenticated
  using (bucket_id in ('post-images','avatars') and (storage.foldername(name))[1] = auth.uid()::text);
