insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-images', 'story-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "story images read" on storage.objects;
drop policy if exists "story images insert" on storage.objects;
drop policy if exists "story images delete" on storage.objects;
create policy "story images read" on storage.objects for select
  using (bucket_id = 'story-images');
create policy "story images insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'story-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "story images delete" on storage.objects for delete to authenticated
  using (bucket_id = 'story-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- tidy up: remove expired stories' rows after 3 days (needs pg_cron, already on)
select cron.schedule('chen-clean-stories', '30 3 * * *', 'delete from public.stories where expires_at < now() - interval ''3 days''');
