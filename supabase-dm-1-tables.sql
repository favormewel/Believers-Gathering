create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_at timestamptz,
  last_body text,
  last_sender uuid,
  read_a timestamptz not null default now(),
  read_b timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 10000),
  image_path text,
  created_at timestamptz not null default now(),
  check (char_length(body) > 0 or image_path is not null)
);
create index if not exists dm_messages_thread_idx on public.dm_messages (thread_id, created_at desc);

alter table public.dm_threads enable row level security;
alter table public.dm_messages enable row level security;

create or replace function public.dm_blocked(p_a uuid, p_b uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare b boolean;
begin
  begin
    execute 'select exists (select 1 from public.blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1))' into b using p_a, p_b;
  exception when others then
    b := false;
  end;
  return coalesce(b, false);
end;
$$;

create or replace function public.dm_can_send(p_thread uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare t record;
begin
  select * into t from public.dm_threads where id = p_thread and auth.uid() in (user_a, user_b);
  if not found then return false; end if;
  return not public.dm_blocked(auth.uid(), case when t.user_a = auth.uid() then t.user_b else t.user_a end);
end;
$$;

grant execute on function public.dm_blocked(uuid, uuid) to authenticated;
grant execute on function public.dm_can_send(uuid) to authenticated;

drop policy if exists "dm threads read" on public.dm_threads;
create policy "dm threads read" on public.dm_threads for select to authenticated
  using (auth.uid() in (user_a, user_b));

drop policy if exists "dm messages read" on public.dm_messages;
drop policy if exists "dm messages insert" on public.dm_messages;
drop policy if exists "dm messages delete" on public.dm_messages;
create policy "dm messages read" on public.dm_messages for select to authenticated
  using (exists (select 1 from public.dm_threads t where t.id = dm_messages.thread_id and auth.uid() in (t.user_a, t.user_b)));
create policy "dm messages insert" on public.dm_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.dm_can_send(thread_id));
create policy "dm messages delete" on public.dm_messages for delete to authenticated
  using (sender_id = auth.uid());
