create or replace function public.trg_dm_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare t record; other uuid;
begin
  select * into t from public.dm_threads where id = new.thread_id;
  if not found then return new; end if;
  other := case when t.user_a = new.sender_id then t.user_b else t.user_a end;
  update public.dm_threads
     set last_at = new.created_at,
         last_sender = new.sender_id,
         last_body = case when length(new.body) > 0 then left(new.body, 100) else 'Photo' end,
         read_a = case when user_a = new.sender_id then new.created_at else read_a end,
         read_b = case when user_b = new.sender_id then new.created_at else read_b end
   where id = new.thread_id;
  begin
    if not public.push_blocked(other, new.sender_id) then
      perform public.push_send(array[other], false, null, public.push_name(new.sender_id),
        case when length(new.body) > 0 then left(new.body, 110) else 'Sent a photo' end,
        'dm:' || new.thread_id, 'dm-' || new.thread_id);
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;
drop trigger if exists dm_message_after on public.dm_messages;
create trigger dm_message_after after insert on public.dm_messages for each row execute function public.trg_dm_message();

do $$
begin
  alter publication supabase_realtime add table public.dm_messages;
exception when others then
  null;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dm-images', 'dm-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "dm images read" on storage.objects;
drop policy if exists "dm images insert" on storage.objects;
drop policy if exists "dm images delete" on storage.objects;
create policy "dm images read" on storage.objects for select to authenticated
  using (bucket_id = 'dm-images' and exists (select 1 from public.dm_threads t where t.id::text = (storage.foldername(name))[1] and auth.uid() in (t.user_a, t.user_b)));
create policy "dm images insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'dm-images' and exists (select 1 from public.dm_threads t where t.id::text = (storage.foldername(name))[1] and auth.uid() in (t.user_a, t.user_b)));
create policy "dm images delete" on storage.objects for delete to authenticated
  using (bucket_id = 'dm-images' and exists (select 1 from public.dm_threads t where t.id::text = (storage.foldername(name))[1] and auth.uid() in (t.user_a, t.user_b)));
