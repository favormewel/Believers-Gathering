-- OPTIONAL: morning birthday notifications. Needs the pg_cron extension.
-- In Supabase: Database > Extensions > turn on "pg_cron", then run this.
create or replace function public.push_birthdays()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t date := (now() at time zone 'Africa/Kampala')::date;
  r record;
  ids uuid[];
begin
  for r in
    select b.user_id, b.visible, public.push_name(b.user_id) as nm
    from public.member_birthdays b
    where b.month = extract(month from t)::int and b.day = extract(day from t)::int
  loop
    perform public.push_send(array[r.user_id], false, null, 'Happy birthday!', 'Chen Network wishes you a blessed new year of life.', 'tab:home', 'bday-me-' || r.user_id);
    if r.visible then
      select array_agg(f.follower_id) into ids from public.follows f
       where f.following_id = r.user_id and not public.push_blocked(f.follower_id, r.user_id);
      if ids is not null and cardinality(ids) > 0 then
        perform public.push_send(ids, false, null, 'Birthday today', r.nm || '''s birthday is today. Send a wish!', 'tab:home', 'bday-' || r.user_id);
      end if;
    end if;
  end loop;
end;
$$;
revoke all on function public.push_birthdays() from public, anon, authenticated;

select cron.schedule('chen-birthdays', '0 3 * * *', 'select public.push_birthdays();');
