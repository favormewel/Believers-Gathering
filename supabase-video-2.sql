insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-videos', 'post-videos', true, 52428800,
  array['video/mp4','video/quicktime','video/webm','video/x-m4v','video/3gpp'])
on conflict (id) do update set public = true, file_size_limit = 52428800,
  allowed_mime_types = array['video/mp4','video/quicktime','video/webm','video/x-m4v','video/3gpp'];

drop policy if exists "chen videos read" on storage.objects;
drop policy if exists "chen videos insert" on storage.objects;
drop policy if exists "chen videos delete" on storage.objects;
create policy "chen videos read" on storage.objects for select
  using (bucket_id = 'post-videos');
create policy "chen videos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "chen videos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'post-videos' and (storage.foldername(name))[1] = auth.uid()::text);
