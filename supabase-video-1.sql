alter table public.posts add column if not exists video_url text;
alter table public.posts add column if not exists video_poster text;
alter table public.posts drop constraint if exists posts_has_content;
alter table public.posts add constraint posts_has_content
  check (char_length(body) > 0 or cardinality(image_urls) > 0 or video_url is not null);
