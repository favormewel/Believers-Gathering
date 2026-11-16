create or replace function public.push_send(p_users uuid[], p_all boolean, p_exclude uuid[], p_title text, p_body text, p_open text, p_tag text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare s record;
begin
  select * into s from public.push_settings where id = 1;
  if not found then return; end if;
  perform net.http_post(
    url := rtrim(s.project_url, '/') || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', s.push_secret),
    body := jsonb_build_object(
      'user_ids', coalesce(to_jsonb(p_users), '[]'::jsonb),
      'all', coalesce(p_all, false),
      'exclude', coalesce(to_jsonb(p_exclude), '[]'::jsonb),
      'title', p_title,
      'body', p_body,
      'open', p_open,
      'tag', p_tag
    )
  );
exception when others then
  null;
end;
$$;

revoke all on function public.push_send(uuid[], boolean, uuid[], text, text, text, text) from public, anon, authenticated;

create or replace function public.push_name(p_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare n text;
begin
  begin
    execute 'select full_name from public.profiles where id = $1' into n using p_user;
  exception when others then
    n := null;
  end;
  return coalesce(nullif(trim(n), ''), 'Someone');
end;
$$;

create or replace function public.push_blocked(p_recipient uuid, p_sender uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare b boolean;
begin
  begin
    execute 'select exists (select 1 from public.blocks where blocker_id = $1 and blocked_id = $2)' into b using p_recipient, p_sender;
  exception when others then
    b := false;
  end;
  return coalesce(b, false);
end;
$$;

revoke all on function public.push_name(uuid) from public, anon, authenticated;
revoke all on function public.push_blocked(uuid, uuid) from public, anon, authenticated;
