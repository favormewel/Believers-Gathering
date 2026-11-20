create table if not exists public.member_birthdays (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  visible boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.member_birthdays enable row level security;
drop policy if exists "bday select own" on public.member_birthdays;
drop policy if exists "bday insert own" on public.member_birthdays;
drop policy if exists "bday update own" on public.member_birthdays;
drop policy if exists "bday delete own" on public.member_birthdays;
create policy "bday select own" on public.member_birthdays for select to authenticated using (user_id = auth.uid());
create policy "bday insert own" on public.member_birthdays for insert to authenticated with check (user_id = auth.uid());
create policy "bday update own" on public.member_birthdays for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bday delete own" on public.member_birthdays for delete to authenticated using (user_id = auth.uid());

create or replace function public.bday_date(p_year int, p_month int, p_day int)
returns date
language sql
immutable
as $$
  select make_date(p_year, p_month, least(p_day, extract(day from (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day'))::int));
$$;

create or replace function public.upcoming_birthdays(p_days int default 7)
returns table (user_id uuid, full_name text, month int, day int, days_until int)
language sql
stable
security definer
set search_path = public
as $$
  select q.user_id, q.full_name, q.month, q.day, q.days_until
  from (
    select b.user_id,
           coalesce(nullif(trim(p.full_name), ''), 'Member') as full_name,
           b.month::int as month,
           b.day::int as day,
           ((case when public.bday_date(t.y, b.month, b.day) >= t.d then public.bday_date(t.y, b.month, b.day) else public.bday_date(t.y + 1, b.month, b.day) end) - t.d)::int as days_until
    from public.member_birthdays b
    join public.profiles p on p.id = b.user_id
    cross join (select (now() at time zone 'Africa/Kampala')::date as d, extract(year from (now() at time zone 'Africa/Kampala'))::int as y) t
    where b.visible
      and b.user_id <> auth.uid()
      and not public.dm_blocked(auth.uid(), b.user_id)
  ) q
  where q.days_until <= least(greatest(coalesce(p_days, 7), 0), 30)
  order by q.days_until, q.full_name
  limit 30;
$$;

revoke all on function public.upcoming_birthdays(int) from public, anon;
grant execute on function public.upcoming_birthdays(int) to authenticated;
