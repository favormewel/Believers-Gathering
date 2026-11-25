create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  kind text not null check (kind in ('photo', 'text')),
  body text check (body is null or char_length(body) <= 300),
  bg text,
  image_path text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  check ((kind = 'photo' and image_path is not null) or (kind = 'text' and char_length(coalesce(body, '')) > 0))
);
create index if not exists stories_expires_idx on public.stories (expires_at);
create index if not exists stories_user_idx on public.stories (user_id);
alter table public.stories enable row level security;
drop policy if exists "stories read" on public.stories;
drop policy if exists "stories insert" on public.stories;
drop policy if exists "stories delete" on public.stories;
create policy "stories read" on public.stories for select to authenticated using (expires_at > now() or user_id = auth.uid());
create policy "stories insert" on public.stories for insert to authenticated with check (user_id = auth.uid());
create policy "stories delete" on public.stories for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);
alter table public.story_views enable row level security;
drop policy if exists "views insert" on public.story_views;
drop policy if exists "views read" on public.story_views;
create policy "views insert" on public.story_views for insert to authenticated with check (viewer_id = auth.uid());
create policy "views read" on public.story_views for select to authenticated
  using (viewer_id = auth.uid() or exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid()));

create or replace function public.active_stories()
returns jsonb
language plpgsql
stable
as $$
declare me uuid := auth.uid(); res jsonb; av jsonb;
begin
  if me is null then
    return jsonb_build_object('groups', '[]'::jsonb, 'avatars', '{}'::jsonb);
  end if;
  select coalesce(jsonb_agg(to_jsonb(g) order by g.is_me desc, g.has_unseen desc, g.latest desc), '[]'::jsonb) into res
  from (
    select s.user_id,
           max(s.author_name) as author_name,
           (s.user_id = me) as is_me,
           bool_or(not exists (select 1 from public.story_views v where v.story_id = s.id and v.viewer_id = me)) as has_unseen,
           max(s.created_at) as latest,
           jsonb_agg(jsonb_build_object(
             'id', s.id, 'kind', s.kind, 'body', s.body, 'bg', s.bg, 'image_path', s.image_path, 'created_at', s.created_at,
             'viewed', exists (select 1 from public.story_views v where v.story_id = s.id and v.viewer_id = me),
             'views', case when s.user_id = me then (select count(*) from public.story_views v2 where v2.story_id = s.id) else null end
           ) order by s.created_at) as stories
    from public.stories s
    where s.expires_at > now() and not public.dm_blocked(me, s.user_id)
    group by s.user_id
  ) g;
  select coalesce(jsonb_object_agg(m.user_id, m.avatar_url), '{}'::jsonb) into av
  from public.member_avatars m
  where m.user_id in (select s2.user_id from public.stories s2 where s2.expires_at > now());
  return jsonb_build_object('groups', res, 'avatars', av);
end;
$$;

create or replace function public.story_viewers(p_story uuid)
returns table (user_id uuid, full_name text, viewed_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.stories s where s.id = p_story and s.user_id = auth.uid()) then
    raise exception 'not your story';
  end if;
  return query
  select v.viewer_id, coalesce(nullif(trim(p.full_name), ''), 'Member'), v.viewed_at
  from public.story_views v
  left join public.profiles p on p.id = v.viewer_id
  where v.story_id = p_story
  order by v.viewed_at desc
  limit 100;
end;
$$;

revoke all on function public.active_stories() from public, anon;
revoke all on function public.story_viewers(uuid) from public, anon;
grant execute on function public.active_stories() to authenticated;
grant execute on function public.story_viewers(uuid) to authenticated;
