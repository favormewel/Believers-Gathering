create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  url text not null check (url ~* '^https://' and char_length(url) <= 600),
  started_by uuid not null default auth.uid() references auth.users(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table public.live_streams enable row level security;
drop policy if exists "live read" on public.live_streams;
create policy "live read" on public.live_streams for select to authenticated using (true);

create or replace function public.start_live(p_title text, p_url text, p_notify boolean default true)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.live_streams set ended_at = now() where ended_at is null;
  insert into public.live_streams (title, url) values (trim(p_title), trim(p_url)) returning id into new_id;
  if coalesce(p_notify, true) then
    perform public.push_send(null, true, array[auth.uid()], 'Live now: ' || left(trim(p_title), 60), 'Tap to watch', 'tab:home', 'live-' || new_id);
  end if;
  return new_id;
end;
$$;

create or replace function public.end_live()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  update public.live_streams set ended_at = now() where ended_at is null;
end;
$$;

revoke all on function public.start_live(text, text, boolean) from public, anon;
revoke all on function public.end_live() from public, anon;
grant execute on function public.start_live(text, text, boolean) to authenticated;
grant execute on function public.end_live() to authenticated;
