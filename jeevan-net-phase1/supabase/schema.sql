-- JEEVAN-NET — patient profiles for Supabase auth
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Sign-up itself is handled by Supabase's built-in auth (auth.users). This table
-- holds the patient details the sign-up form collects. If you skip this file the
-- app still creates accounts and still signs in — it keeps the details in the
-- account metadata instead — but the table is what makes them queryable.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  age         integer,
  gender      text,
  phone       text,
  abha_id     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A patient may read and write only their own row.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at honest without the client having to set it.
create or replace function public.touch_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_profiles_updated_at();

-- Create the profile row automatically at sign-up, from the metadata the form
-- sends. SECURITY DEFINER so the insert happens even before a session exists
-- (the default with "Confirm email" enabled).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, age, gender, phone, abha_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'age', '')::integer,
    new.raw_user_meta_data ->> 'gender',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'abha_id'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
