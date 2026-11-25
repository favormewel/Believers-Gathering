create table if not exists public.saved_posts (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists saved_posts_user_idx on public.saved_posts (user_id, created_at desc);
alter table public.saved_posts enable row level security;
drop policy if exists "saved read own" on public.saved_posts;
drop policy if exists "saved insert own" on public.saved_posts;
drop policy if exists "saved delete own" on public.saved_posts;
create policy "saved read own" on public.saved_posts for select to authenticated using (user_id = auth.uid());
create policy "saved insert own" on public.saved_posts for insert to authenticated with check (user_id = auth.uid());
create policy "saved delete own" on public.saved_posts for delete to authenticated using (user_id = auth.uid());

create or replace function public.saved_feed(p_limit int default 50)
returns jsonb
language plpgsql
stable
as $$
declare
  me uuid := auth.uid();
  lim int := least(greatest(coalesce(p_limit, 50), 1), 100);
  res jsonb;
begin
  if me is null then
    return jsonb_build_object('error', 'not signed in');
  end if;
  with p as (
    select po.*
    from public.saved_posts s
    join public.posts po on po.id = s.post_id
    where s.user_id = me
    order by s.created_at desc
    limit lim
  )
  select jsonb_build_object(
    'following', '[]'::jsonb,
    'followers', 0,
    'posts', coalesce((
      select jsonb_agg(
        to_jsonb(p) || jsonb_build_object(
          'like_count', (select count(*) from public.post_likes l where l.post_id = p.id),
          'comment_count', (select count(*) from public.post_comments c where c.post_id = p.id),
          'liked', exists (select 1 from public.post_likes l2 where l2.post_id = p.id and l2.user_id = me)
        ))
      from p), '[]'::jsonb),
    'activities', '[]'::jsonb,
    'avatars', coalesce((select jsonb_object_agg(m.user_id, m.avatar_url) from public.member_avatars m where m.user_id in (select user_id from p) or m.user_id = me), '{}'::jsonb),
    'verified', coalesce((select jsonb_agg(v.user_id) from public.verified_leaders v), '[]'::jsonb)
  ) into res;
  return res;
end;
$$;
revoke all on function public.saved_feed(int) from public, anon;
grant execute on function public.saved_feed(int) to authenticated;
