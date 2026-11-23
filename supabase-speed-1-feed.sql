-- One request that returns everything a feed screen needs (posts, like and comment counts,
-- who you follow, activity, profile photos, verified leaders). Runs with the member's own
-- permissions, so nothing becomes visible that was not visible before.
create or replace function public.feed_bundle(p_mode text default 'all', p_limit int default 30)
returns jsonb
language plpgsql
stable
as $$
declare
  me uuid := auth.uid();
  ids uuid[];
  lim int := least(greatest(coalesce(p_limit, 30), 1), 60);
  res jsonb;
begin
  if me is null then
    return jsonb_build_object('error', 'not signed in');
  end if;
  select coalesce(array_agg(f.following_id), '{}') into ids from public.follows f where f.follower_id = me;

  with p as (
    select * from public.posts
    where (p_mode <> 'following' or user_id = any(ids))
    order by created_at desc
    limit lim
  ), a as (
    select * from public.activities
    where (p_mode <> 'following' or user_id = any(ids))
    order by created_at desc
    limit 25
  )
  select jsonb_build_object(
    'following', to_jsonb(ids),
    'followers', (select count(*) from public.follows f2 where f2.following_id = me),
    'posts', coalesce((
      select jsonb_agg(
        to_jsonb(p) || jsonb_build_object(
          'like_count', (select count(*) from public.post_likes l where l.post_id = p.id),
          'comment_count', (select count(*) from public.post_comments c where c.post_id = p.id),
          'liked', exists (select 1 from public.post_likes l2 where l2.post_id = p.id and l2.user_id = me)
        ) order by p.created_at desc)
      from p), '[]'::jsonb),
    'activities', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from a), '[]'::jsonb),
    'avatars', coalesce((
      select jsonb_object_agg(m.user_id, m.avatar_url)
      from public.member_avatars m
      where m.user_id in (select user_id from p) or m.user_id in (select user_id from a) or m.user_id = any(ids) or m.user_id = me), '{}'::jsonb),
    'verified', coalesce((select jsonb_agg(v.user_id) from public.verified_leaders v), '[]'::jsonb)
  ) into res;

  return res;
end;
$$;

revoke all on function public.feed_bundle(text, int) from public, anon;
grant execute on function public.feed_bundle(text, int) to authenticated;
