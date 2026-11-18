create or replace function public.start_dm(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid(); tid uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_other is null or p_other = me then raise exception 'invalid person'; end if;
  if not exists (select 1 from auth.users u where u.id = p_other) then raise exception 'invalid person'; end if;
  if public.dm_blocked(me, p_other) then raise exception 'blocked'; end if;
  insert into public.dm_threads (user_a, user_b) values (least(me, p_other), greatest(me, p_other))
    on conflict (user_a, user_b) do nothing;
  select t.id into tid from public.dm_threads t where t.user_a = least(me, p_other) and t.user_b = greatest(me, p_other);
  return tid;
end;
$$;

create or replace function public.my_dms()
returns table (thread_id uuid, other_id uuid, other_name text, last_body text, last_at timestamptz, last_sender uuid, unread bigint)
language sql
stable
security definer
set search_path = public
as $$
  select t.id,
         case when t.user_a = auth.uid() then t.user_b else t.user_a end,
         coalesce(nullif(trim(p.full_name), ''), 'Member'),
         t.last_body,
         t.last_at,
         t.last_sender,
         (select count(*) from public.dm_messages m
           where m.thread_id = t.id and m.sender_id <> auth.uid()
             and m.created_at > case when t.user_a = auth.uid() then t.read_a else t.read_b end)
  from public.dm_threads t
  left join public.profiles p on p.id = (case when t.user_a = auth.uid() then t.user_b else t.user_a end)
  where auth.uid() in (t.user_a, t.user_b)
    and t.last_at is not null
    and not public.dm_blocked(auth.uid(), case when t.user_a = auth.uid() then t.user_b else t.user_a end)
  order by t.last_at desc
  limit 100;
$$;

create or replace function public.dm_mark_read(p_thread uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.dm_threads
     set read_a = case when user_a = auth.uid() then now() else read_a end,
         read_b = case when user_b = auth.uid() then now() else read_b end
   where id = p_thread and auth.uid() in (user_a, user_b);
$$;

create or replace function public.find_members(p_q text)
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name
  from public.profiles p
  where auth.uid() is not null
    and char_length(trim(coalesce(p_q, ''))) >= 2
    and p.full_name ilike '%' || replace(replace(trim(p_q), '%', ''), '_', '') || '%'
    and p.id <> auth.uid()
    and not public.dm_blocked(auth.uid(), p.id)
  order by p.full_name
  limit 20;
$$;

revoke all on function public.start_dm(uuid) from public, anon;
revoke all on function public.my_dms() from public, anon;
revoke all on function public.dm_mark_read(uuid) from public, anon;
revoke all on function public.find_members(text) from public, anon;
grant execute on function public.start_dm(uuid) to authenticated;
grant execute on function public.my_dms() to authenticated;
grant execute on function public.dm_mark_read(uuid) to authenticated;
grant execute on function public.find_members(text) to authenticated;
