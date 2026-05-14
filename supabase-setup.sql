create table if not exists public.media_comments (
  id bigint generated always as identity primary key,
  media_type text not null,
  series_key text not null,
  author_name text not null,
  body text not null,
  client_id text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.media_comments enable row level security;

drop policy if exists "Public read comments" on public.media_comments;
create policy "Public read comments"
on public.media_comments
for select
to anon
using (true);

drop policy if exists "Public insert comments" on public.media_comments;
create policy "Public insert comments"
on public.media_comments
for insert
to anon
with check (true);

grant select, insert on public.media_comments to anon;
