create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  body text not null check (char_length(body) between 1 and 5000),
  kind text,
  publish_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'cancelled')),
  published_post_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists scheduled_posts_due_idx on public.scheduled_posts (status, publish_at);
alter table public.scheduled_posts enable row level security;

create or replace function public.schedule_post(p_body text, p_kind text, p_publish_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare sid uuid; nm text;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  if p_publish_at < now() + interval '1 minute' then raise exception 'choose a future time'; end if;
  select coalesce(nullif(trim(p.full_name), ''), 'Chen Network') into nm from public.profiles p where p.id = auth.uid();
  insert into public.scheduled_posts (author_name, body, kind, publish_at)
    values (coalesce(nm, 'Chen Network'), trim(p_body), nullif(trim(coalesce(p_kind, '')), ''), p_publish_at)
    returning id into sid;
  insert into public.admin_actions (admin_id, action, detail) values (auth.uid(), 'scheduled a post', to_char(p_publish_at at time zone 'Africa/Kampala', 'DD Mon HH24:MI'));
  return sid;
end;
$$;

create or replace function public.list_scheduled()
returns table (id uuid, body text, kind text, publish_at timestamptz, status text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return query
  select s.id, left(s.body, 160), s.kind, s.publish_at, s.status
  from public.scheduled_posts s
  where s.status = 'pending' or s.publish_at > now() - interval '7 days'
  order by (s.status = 'pending') desc, s.publish_at
  limit 30;
end;
$$;

create or replace function public.cancel_scheduled(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.scheduled_posts set status = 'cancelled' where id = p_id and status = 'pending';
end;
$$;

create or replace function public.publish_due_posts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare r record; pid uuid; n int := 0;
begin
  for r in select * from public.scheduled_posts where status = 'pending' and publish_at <= now() order by publish_at limit 20 for update skip locked loop
    begin
      insert into public.posts (user_id, author_name, body, kind)
        values (r.author_id, r.author_name, r.body, r.kind)
        returning id into pid;
      update public.scheduled_posts set status = 'published', published_post_id = pid where id = r.id;
      n := n + 1;
    exception when others then
      update public.scheduled_posts set status = 'cancelled' where id = r.id;
    end;
  end loop;
  return n;
end;
$$;

revoke all on function public.schedule_post(text, text, timestamptz) from public, anon;
revoke all on function public.list_scheduled() from public, anon;
revoke all on function public.cancel_scheduled(uuid) from public, anon;
revoke all on function public.publish_due_posts() from public, anon, authenticated;
grant execute on function public.schedule_post(text, text, timestamptz) to authenticated;
grant execute on function public.list_scheduled() to authenticated;
grant execute on function public.cancel_scheduled(uuid) to authenticated;
