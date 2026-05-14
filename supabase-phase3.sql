create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create table if not exists public.site_config (
  key text primary key,
  value text not null
);

alter table public.site_config enable row level security;

create policy "Anyone can read site_config"
  on public.site_config for select
  using (true);

insert into public.site_config (key, value)
values ('max_users', '1000')
on conflict (key) do nothing;

create or replace function get_user_count()
returns integer
language sql
security definer
as $$
  select count(*)::integer
  from auth.users
  where email_confirmed_at is not null;
$$;
