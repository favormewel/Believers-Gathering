create table if not exists public.referrals (
  invited_id uuid primary key references auth.users(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (invited_id <> referrer_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);
alter table public.referrals enable row level security;
drop policy if exists "referrals read own" on public.referrals;
create policy "referrals read own" on public.referrals for select to authenticated using (referrer_id = auth.uid());

create or replace function public.claim_referral(p_ref uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null or p_ref is null or p_ref = me then return false; end if;
  if not exists (select 1 from auth.users u where u.id = p_ref) then return false; end if;
  if not exists (select 1 from auth.users u where u.id = me and u.created_at > now() - interval '7 days') then return false; end if;
  insert into public.referrals (invited_id, referrer_id) values (me, p_ref) on conflict do nothing;
  if found then
    begin
      perform public.push_send(array[p_ref], false, null, 'A friend joined', public.push_name(me) || ' joined Chen Network through your invite.', 'tab:home', 'ref-' || me);
    exception when others then
      null;
    end;
    return true;
  end if;
  return false;
end;
$$;

create or replace function public.my_referral_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.referrals where referrer_id = auth.uid();
$$;

revoke all on function public.claim_referral(uuid) from public, anon;
revoke all on function public.my_referral_count() from public, anon;
grant execute on function public.claim_referral(uuid) to authenticated;
grant execute on function public.my_referral_count() to authenticated;
