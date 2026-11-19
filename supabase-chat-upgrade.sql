alter table public.messages add column if not exists reply_to uuid;
alter table public.messages add column if not exists reply_preview text;

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
create index if not exists message_reactions_msg_idx on public.message_reactions (message_id);
alter table public.message_reactions enable row level security;

create or replace function public.in_message_group(p_message uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.messages m
    join public.group_members gm on gm.group_id = m.group_id
    where m.id = p_message and gm.user_id = auth.uid()
  );
$$;
grant execute on function public.in_message_group(uuid) to authenticated;

drop policy if exists "reactions read" on public.message_reactions;
drop policy if exists "reactions insert" on public.message_reactions;
drop policy if exists "reactions delete" on public.message_reactions;
create policy "reactions read" on public.message_reactions for select to authenticated
  using (public.in_message_group(message_id));
create policy "reactions insert" on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.in_message_group(message_id));
create policy "reactions delete" on public.message_reactions for delete to authenticated
  using (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.message_reactions;
exception when others then
  null;
end $$;
