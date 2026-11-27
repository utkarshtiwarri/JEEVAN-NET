-- ============================================================================
-- JEEVAN-NET — COMPLETE DATABASE SETUP
-- ============================================================================
-- ONE file. Paste this whole thing into the Supabase SQL editor and press Run.
--
--   Supabase dashboard -> SQL Editor -> New query -> paste -> Run
--
-- It is safe to run repeatedly: every statement is guarded, so running it a
-- second time changes nothing and errors on nothing.
--
-- This supersedes supabase/02-patient-records.sql and supabase/03-patients.sql,
-- which are kept as the individual steps for reference. If you have already run
-- either, running this is harmless — it fills in whatever is missing.
--
-- WHAT IT CREATES
--   public.profiles     one row per account (name, age, gender, phone, abha_id)
--   public.patients     the register: many patients per account
--   public.assessments  one row per triage run, optionally filed against a patient
--
-- RLS
-- Every table is scoped to the signed-in account with no exceptions: a patient
-- row belongs to one owner, and an assessment may only name a patient that owner
-- created. The anon key ships in the browser, so these policies — not the key —
-- are what protect the data.
--
-- NOT COVERED
-- This is synthetic/demonstration storage. It has no audit log, no consent
-- capture and no access review, so it is not an appropriate home for real patient
-- health records.
-- ============================================================================

-- =============================================================== profiles ===
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  age        integer,
  gender     text,
  phone      text,
  abha_id    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists abha_id text;

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_profiles_updated_at();

-- Create the profile row at sign-up from the metadata the form sends. The
-- exception block is deliberate: a profile row that cannot be written must never
-- abort account creation, or the user could not sign in at all.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
exception
  when others then
    raise warning 'handle_new_user: could not create profile for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================== patients ===
create table if not exists public.patients (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name  text not null,
  age        integer,
  gender     text,
  phone      text,
  abha_id    text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patients enable row level security;

drop policy if exists "patients: read own register" on public.patients;
create policy "patients: read own register"
  on public.patients for select to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "patients: insert own" on public.patients;
create policy "patients: insert own"
  on public.patients for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "patients: update own" on public.patients;
create policy "patients: update own"
  on public.patients for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "patients: delete own" on public.patients;
create policy "patients: delete own"
  on public.patients for delete to authenticated
  using (auth.uid() = owner_id);

create or replace function public.touch_patients_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
  before update on public.patients
  for each row execute function public.touch_patients_updated_at();

-- ============================================================ assessments ===
create table if not exists public.assessments (
  id            bigint generated by default as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  vitals        jsonb not null default '{}'::jsonb,
  symptoms      jsonb not null default '{}'::jsonb,
  triage_result jsonb not null default '{}'::jsonb
);

-- Nullable: a self-assessment has no patient row, and existing rows stay valid.
alter table public.assessments
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;

alter table public.assessments enable row level security;

-- Reading is allowed for your own assessments, or those of a patient you own.
drop policy if exists "assessments: read own" on public.assessments;
create policy "assessments: read own"
  on public.assessments for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.patients p
      where p.id = assessments.patient_id and p.owner_id = auth.uid()
    )
  );

-- Writing must be attributed to you, and may only name a patient you own.
drop policy if exists "assessments: insert own" on public.assessments;
create policy "assessments: insert own"
  on public.assessments for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      patient_id is null
      or exists (
        select 1 from public.patients p
        where p.id = patient_id and p.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "assessments: delete own" on public.assessments;
create policy "assessments: delete own"
  on public.assessments for delete to authenticated
  using (auth.uid() = user_id);

-- ================================================================ indexes ===
create index if not exists assessments_user_created_idx
  on public.assessments (user_id, created_at desc);

create index if not exists patients_owner_created_idx
  on public.patients (owner_id, created_at desc);

create index if not exists assessments_patient_created_idx
  on public.assessments (patient_id, created_at desc);

-- ================================================================= reload ===
-- A newly added column can stay invisible to the API until its schema cache
-- reloads. Without this, `patient_id` may report "column does not exist" even
-- though it was just created.
notify pgrst, 'reload schema';

-- ================================================================= verify ===
-- You should see rowsecurity = true for all three tables, and the column list
-- below should contain abha_id, and patients/assessments should both appear.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'patients', 'assessments')
order by tablename;

select table_name, string_agg(column_name, ', ' order by column_name) as columns
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'patients', 'assessments')
group by table_name
order by table_name;
