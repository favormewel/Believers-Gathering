alter table public.profiles add column if not exists suspended boolean not null default false;

create table if not exists public.verified_leaders (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verified_at timestamptz not null default now()
);
alter table public.verified_leaders enable row level security;
drop policy if exists "leaders read" on public.verified_leaders;
create policy "leaders read" on public.verified_leaders for select to authenticated using (true);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_id uuid,
  detail text,
  created_at timestamptz not null default now()
);
alter table public.admin_actions enable row level security;

create or replace function public.is_suspended(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.suspended from public.profiles p where p.id = p_user), false);
$$;
grant execute on function public.is_suspended(uuid) to authenticated;

create or replace function public.admin_members(p_q text default '', p_limit int default 30)
returns table (id uuid, full_name text, created_at timestamptz, last_seen date, verified boolean, suspended boolean, is_admin boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return query
  select p.id,
         coalesce(nullif(trim(p.full_name), ''), 'Member'),
         u.created_at,
         (select max(s.day) from public.daily_seen s where s.user_id = p.id),
         exists (select 1 from public.verified_leaders v where v.user_id = p.id),
         coalesce(p.suspended, false),
         coalesce(p.is_admin, false)
  from public.profiles p
  join auth.users u on u.id = p.id
  where char_length(trim(coalesce(p_q, ''))) = 0
     or p.full_name ilike '%' || replace(replace(trim(p_q), '%', ''), '_', '') || '%'
  order by u.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
end;
$$;

create or replace function public.admin_set_verified(p_user uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  if p_on then
    insert into public.verified_leaders (user_id) values (p_user) on conflict do nothing;
  else
    delete from public.verified_leaders where user_id = p_user;
  end if;
  insert into public.admin_actions (admin_id, action, target_id) values (auth.uid(), case when p_on then 'verified leader' else 'removed leader badge' end, p_user);
end;
$$;

create or replace function public.admin_set_suspended(p_user uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  if p_user = auth.uid() then raise exception 'you cannot suspend yourself'; end if;
  if exists (select 1 from public.profiles p where p.id = p_user and coalesce(p.is_admin, false)) then raise exception 'you cannot suspend an admin'; end if;
  update public.profiles set suspended = coalesce(p_on, false) where id = p_user;
  insert into public.admin_actions (admin_id, action, target_id) values (auth.uid(), case when p_on then 'suspended member' else 'restored member' end, p_user);
end;
$$;

create or replace function public.admin_recent_actions()
returns table (action text, admin_name text, target_name text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return query
  select a.action,
         coalesce(nullif(trim(pa.full_name), ''), 'Admin'),
         coalesce(nullif(trim(pt.full_name), ''), 'Member'),
         a.created_at
  from public.admin_actions a
  left join public.profiles pa on pa.id = a.admin_id
  left join public.profiles pt on pt.id = a.target_id
  order by a.created_at desc
  limit 15;
end;
$$;

revoke all on function public.admin_members(text, int) from public, anon;
revoke all on function public.admin_set_verified(uuid, boolean) from public, anon;
revoke all on function public.admin_set_suspended(uuid, boolean) from public, anon;
revoke all on function public.admin_recent_actions() from public, anon;
grant execute on function public.admin_members(text, int) to authenticated;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;
grant execute on function public.admin_recent_actions() to authenticated;

create or replace function public.trg_block_suspended() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public.is_suspended(auth.uid()) then
    raise exception 'account suspended';
  end if;
  return new;
end;
$$;
drop trigger if exists block_suspended on public.posts;
create trigger block_suspended before insert on public.posts for each row execute function public.trg_block_suspended();
drop trigger if exists block_suspended on public.post_comments;
create trigger block_suspended before insert on public.post_comments for each row execute function public.trg_block_suspended();
drop trigger if exists block_suspended on public.dm_messages;
create trigger block_suspended before insert on public.dm_messages for each row execute function public.trg_block_suspended();
drop trigger if exists block_suspended on public.messages;
create trigger block_suspended before insert on public.messages for each row execute function public.trg_block_suspended();
