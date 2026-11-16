create or replace function public.trg_push_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id and not public.push_blocked(owner, new.user_id) then
    perform public.push_send(array[owner], false, null, 'New like', public.push_name(new.user_id) || ' liked your post', 'post:' || new.post_id, 'like-' || new.post_id);
  end if;
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists push_like on public.post_likes;
create trigger push_like after insert on public.post_likes for each row execute function public.trg_push_like();

create or replace function public.trg_push_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id and not public.push_blocked(owner, new.user_id) then
    perform public.push_send(array[owner], false, null, 'New comment', coalesce(new.author_name, public.push_name(new.user_id)) || ': ' || left(new.body, 90), 'post:' || new.post_id, 'cm-' || new.id);
  end if;
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists push_comment on public.post_comments;
create trigger push_comment after insert on public.post_comments for each row execute function public.trg_push_comment();

create or replace function public.trg_push_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.push_blocked(new.following_id, new.follower_id) then
    perform public.push_send(array[new.following_id], false, null, 'New follower', public.push_name(new.follower_id) || ' started following you', 'tab:updates', 'follow-' || new.follower_id);
  end if;
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists push_follow on public.follows;
create trigger push_follow after insert on public.follows for each row execute function public.trg_push_follow();

create or replace function public.trg_push_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(f.follower_id) into ids from public.follows f
   where f.following_id = new.user_id and not public.push_blocked(f.follower_id, new.user_id);
  if ids is not null and cardinality(ids) > 0 then
    perform public.push_send(ids, false, null, coalesce(new.author_name, 'Someone') || ' shared an update', case when length(new.body) > 0 then left(new.body, 110) else 'Shared a photo' end, 'post:' || new.id, 'post-' || new.id);
  end if;
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists push_post on public.posts;
create trigger push_post after insert on public.posts for each row execute function public.trg_push_post();

create or replace function public.trg_push_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.push_send(null, true, array[new.created_by], 'New event', new.title, 'tab:explore', 'event-' || new.id);
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists push_event on public.events;
create trigger push_event after insert on public.events for each row execute function public.trg_push_event();

create or replace function public.trg_push_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare gname text; ids uuid[]; j jsonb; txt text;
begin
  j := to_jsonb(new);
  select name into gname from public.groups where id = new.group_id;
  select array_agg(gm.user_id) into ids from public.group_members gm
   where gm.group_id = new.group_id and gm.user_id <> new.user_id
     and coalesce(gm.muted, false) = false
     and not public.push_blocked(gm.user_id, new.user_id);
  if ids is null or cardinality(ids) = 0 then return new; end if;
  txt := case coalesce(j->>'kind', 'text')
    when 'text' then left(coalesce(j->>'body', ''), 110)
    when 'image' then 'sent a photo'
    when 'voice' then 'sent a voice note'
    when 'file' then 'sent a file'
    else 'sent a message' end;
  perform public.push_send(ids, false, null, coalesce(gname, 'New message'), coalesce(j->>'author_name', 'Someone') || ': ' || txt, new.group_id::text, 'msg-' || new.group_id);
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists push_message on public.messages;
create trigger push_message after insert on public.messages for each row execute function public.trg_push_message();

create or replace function public.trg_push_announcement() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb;
begin
  j := to_jsonb(new);
  perform public.push_send(null, true, null, 'Announcement', coalesce(j->>'title', j->>'body', 'New announcement'), 'tab:updates', 'ann-' || (j->>'id'));
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists push_announcement on public.announcements;
create trigger push_announcement after insert on public.announcements for each row execute function public.trg_push_announcement();
