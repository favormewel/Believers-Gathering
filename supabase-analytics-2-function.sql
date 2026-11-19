create or replace function public.stat_count(p_sql text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare n bigint;
begin
  execute p_sql into n;
  return coalesce(n, 0);
exception when others then
  return 0;
end;
$$;

create or replace function public.stat_series(p_table text, p_col text, p_days int, p_where text default 'true')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb; today date := (now() at time zone 'Africa/Kampala')::date;
begin
  execute format(
    'select coalesce(jsonb_agg(jsonb_build_object(''day'', g.day, ''n'', coalesce(s.n, 0)) order by g.day), ''[]''::jsonb) from (select generate_series(%L::date - %s, %L::date, interval ''1 day'')::date as day) g left join (select (%I at time zone ''Africa/Kampala'')::date as day, count(*) as n from public.%I where %s group by 1) s on s.day = g.day',
    today, p_days - 1, today, p_col, p_table, p_where
  ) into r;
  return r;
exception when others then
  return '[]'::jsonb;
end;
$$;

revoke all on function public.stat_count(text) from public, anon, authenticated;
revoke all on function public.stat_series(text, text, int, text) from public, anon, authenticated;

create or replace function public.admin_stats(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  d int := least(greatest(coalesce(p_days, 30), 7), 180);
  ok boolean;
  today date := (now() at time zone 'Africa/Kampala')::date;
  members bigint; new_today bigint; new_7 bigint; new_30 bigint;
  dau bigint; wau bigint; mau bigint; ret int;
  signups jsonb; active jsonb; top_posts jsonb; top_groups jsonb;
begin
  select coalesce(p.is_admin, false) into ok from public.profiles p where p.id = auth.uid();
  if not coalesce(ok, false) then
    raise exception 'admins only';
  end if;

  select count(*) into members from auth.users;
  select count(*) into new_today from auth.users u where (u.created_at at time zone 'Africa/Kampala')::date = today;
  select count(*) into new_7 from auth.users u where u.created_at >= now() - interval '7 days';
  select count(*) into new_30 from auth.users u where u.created_at >= now() - interval '30 days';

  select count(distinct s.user_id) into dau from public.daily_seen s where s.day = today;
  select count(distinct s.user_id) into wau from public.daily_seen s where s.day > today - 7;
  select count(distinct s.user_id) into mau from public.daily_seen s where s.day > today - 30;

  select coalesce(jsonb_agg(jsonb_build_object('day', g.day, 'n', coalesce(x.n, 0)) order by g.day), '[]'::jsonb) into signups
    from (select generate_series(today - (d - 1), today, interval '1 day')::date as day) g
    left join (select (u.created_at at time zone 'Africa/Kampala')::date as day, count(*) as n from auth.users u group by 1) x on x.day = g.day;

  select coalesce(jsonb_agg(jsonb_build_object('day', g.day, 'n', coalesce(x.n, 0)) order by g.day), '[]'::jsonb) into active
    from (select generate_series(today - (d - 1), today, interval '1 day')::date as day) g
    left join (select s.day, count(*) as n from public.daily_seen s group by s.day) x on x.day = g.day;

  begin
    select case when c = 0 then null else round(100.0 * a / c)::int end into ret from (
      select count(*) as c,
             count(*) filter (where exists (select 1 from public.daily_seen s where s.user_id = u.id and s.day > today - 7)) as a
      from auth.users u
      where u.created_at between now() - interval '14 days' and now() - interval '7 days') q;
  exception when others then
    ret := null;
  end;

  begin
    select coalesce(jsonb_agg(t), '[]'::jsonb) into top_posts from (
      select p.id, p.author_name, left(p.body, 90) as body,
             (select count(*) from public.post_likes l where l.post_id = p.id) as likes,
             (select count(*) from public.post_comments c where c.post_id = p.id) as comments
      from public.posts p
      where p.created_at >= now() - (d || ' days')::interval
      order by (select count(*) from public.post_likes l where l.post_id = p.id) + (select count(*) from public.post_comments c where c.post_id = p.id) desc, p.created_at desc
      limit 5) t;
  exception when others then
    top_posts := '[]'::jsonb;
  end;

  begin
    select coalesce(jsonb_agg(t), '[]'::jsonb) into top_groups from (
      select g.name, count(m.id) as messages,
             (select count(*) from public.group_members gm where gm.group_id = g.id) as members
      from public.messages m join public.groups g on g.id = m.group_id
      where m.created_at >= now() - (d || ' days')::interval
      group by g.id, g.name
      order by count(m.id) desc
      limit 5) t;
  exception when others then
    top_groups := '[]'::jsonb;
  end;

  return jsonb_build_object(
    'generated_at', now(),
    'days', d,
    'members_total', members,
    'new_today', new_today,
    'new_7d', new_7,
    'new_30d', new_30,
    'dau', dau, 'wau', wau, 'mau', mau,
    'retention_d7', ret,
    'signups', signups,
    'active', active,
    'posts', public.stat_series('posts', 'created_at', d),
    'comments', public.stat_series('post_comments', 'created_at', d),
    'likes', public.stat_series('post_likes', 'created_at', d),
    'messages', public.stat_series('messages', 'created_at', d),
    'dms', public.stat_series('dm_messages', 'created_at', d),
    'photos_posts', public.stat_count('select count(*) from public.posts where cardinality(image_urls) > 0 and created_at >= now() - interval ''' || d || ' days'''),
    'video_posts', public.stat_count('select count(*) from public.posts where video_url is not null and created_at >= now() - interval ''' || d || ' days'''),
    'push_members', public.stat_count('select count(distinct user_id) from public.push_subscriptions'),
    'avatar_members', public.stat_count('select count(*) from public.member_avatars'),
    'groups_total', public.stat_count('select count(*) from public.groups'),
    'follows_total', public.stat_count('select count(*) from public.follows'),
    'top_posts', top_posts,
    'top_groups', top_groups
  );
end;
$$;

revoke all on function public.admin_stats(int) from public, anon;
grant execute on function public.admin_stats(int) to authenticated;
