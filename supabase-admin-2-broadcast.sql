create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 80),
  body text not null check (char_length(body) between 1 and 600),
  audience text not null check (audience in ('all', 'group', 'leaders')),
  group_id uuid,
  sent_by uuid default auth.uid() references auth.users(id) on delete set null,
  sent_at timestamptz not null default now(),
  recipients int not null default 0
);
alter table public.broadcasts enable row level security;

create or replace function public.send_broadcast(p_title text, p_body text, p_audience text, p_group uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid(); ids uuid[]; n int := 0; bid uuid;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  if p_audience = 'group' then
    if p_group is null then raise exception 'choose a group'; end if;
    select array_agg(gm.user_id), count(*)::int into ids, n from public.group_members gm where gm.group_id = p_group and gm.user_id <> me;
  elsif p_audience = 'leaders' then
    select array_agg(v.user_id), count(*)::int into ids, n from public.verified_leaders v where v.user_id <> me;
  elsif p_audience = 'all' then
    select count(*)::int into n from auth.users u where u.id <> me;
  else
    raise exception 'invalid audience';
  end if;
  insert into public.broadcasts (title, body, audience, group_id, recipients)
    values (trim(p_title), trim(p_body), p_audience, case when p_audience = 'group' then p_group else null end, n)
    returning id into bid;
  if p_audience = 'all' then
    perform public.push_send(null, true, array[me], trim(p_title), left(trim(p_body), 140), 'tab:home', 'bc-' || bid);
  elsif ids is not null and cardinality(ids) > 0 then
    perform public.push_send(ids, false, null, trim(p_title), left(trim(p_body), 140), 'tab:home', 'bc-' || bid);
  end if;
  insert into public.admin_actions (admin_id, action, detail) values (me, 'sent announcement', left(trim(p_title), 80));
  return n;
end;
$$;

create or replace function public.my_broadcasts()
returns table (id uuid, title text, body text, audience text, group_name text, sent_at timestamptz, sender_name text, sender_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.title, b.body, b.audience, g.name, b.sent_at,
         coalesce(nullif(trim(p.full_name), ''), 'Admin'),
         b.sent_by
  from public.broadcasts b
  left join public.groups g on g.id = b.group_id
  left join public.profiles p on p.id = b.sent_by
  where auth.uid() is not null
    and b.sent_at > now() - interval '30 days'
    and (
      b.audience = 'all'
      or b.sent_by = auth.uid()
      or (b.audience = 'group' and exists (select 1 from public.group_members gm where gm.group_id = b.group_id and gm.user_id = auth.uid()))
      or (b.audience = 'leaders' and exists (select 1 from public.verified_leaders v where v.user_id = auth.uid()))
    )
  order by b.sent_at desc
  limit 30;
$$;

revoke all on function public.send_broadcast(text, text, text, uuid) from public, anon;
revoke all on function public.my_broadcasts() from public, anon;
grant execute on function public.send_broadcast(text, text, text, uuid) to authenticated;
grant execute on function public.my_broadcasts() to authenticated;
