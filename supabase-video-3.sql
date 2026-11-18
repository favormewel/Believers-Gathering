create or replace function public.trg_push_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(f.follower_id) into ids from public.follows f
   where f.following_id = new.user_id and not public.push_blocked(f.follower_id, new.user_id);
  if ids is not null and cardinality(ids) > 0 then
    perform public.push_send(ids, false, null, coalesce(new.author_name, 'Someone') || ' shared an update',
      case when length(new.body) > 0 then left(new.body, 110)
           when new.video_url is not null then 'Shared a video'
           else 'Shared a photo' end,
      'post:' || new.id, 'post-' || new.id);
  end if;
  return new;
exception when others then
  return new;
end;
$$;
