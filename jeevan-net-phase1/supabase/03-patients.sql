-- ============================================================================
-- JEEVAN-NET — patient register (multi-patient)
-- ============================================================================
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is guarded.
--
-- WHY THIS EXISTS
-- Until now one account could only ever be one patient: `assessments.user_id`
-- was the signed-in account, so a health worker had nowhere to record a second
-- person. This adds a `patients` table owned by the account, and links each
-- assessment to an optional patient.
--
--   auth.users 1---* patients 1---* assessments
--        \___________________________/  (a self-assessment has patient_id null)
--
-- RLS MODEL
-- An account sees only the patients it created, and only the assessments for
-- those patients or its own. `patient_id` is nullable on purpose: existing rows
-- and "my own health" assessments stay valid without a patient record.
-- ============================================================================

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
  on public.patients for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "patients: insert own" on public.patients;
create policy "patients: insert own"
  on public.patients for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "patients: update own" on public.patients;
create policy "patients: update own"
  on public.patients for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "patients: delete own" on public.patients;
create policy "patients: delete own"
  on public.patients for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Keep updated_at honest without the client having to set it.
create or replace function public.touch_patients_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
  before update on public.patients
  for each row execute function public.touch_patients_updated_at();

-- ------------------------------------------------------------- assessments --
-- Nullable: a self-assessment has no patient row, and existing rows stay valid.
alter table public.assessments
  add column if not exists patient_id uuid references public.patients (id) on delete cascade;

-- REPLACE the single-owner select policy with one that also allows reading the
-- assessments of a patient this account owns. Without this drop, the old policy
-- would still hide every register assessment.
drop policy if exists "assessments: read own" on public.assessments;
create policy "assessments: read own"
  on public.assessments for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.patients p
      where p.id = assessments.patient_id and p.owner_id = auth.uid()
    )
  );

-- Writes must be attributed to the signed-in account, and may only name a
-- patient that account owns. Checking both stops a row being filed under
-- someone else's register.
drop policy if exists "assessments: insert own" on public.assessments;
create policy "assessments: insert own"
  on public.assessments for insert
  to authenticated
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

create index if not exists patients_owner_created_idx
  on public.patients (owner_id, created_at desc);

create index if not exists assessments_patient_created_idx
  on public.assessments (patient_id, created_at desc);

-- Make the new column and table visible to the API immediately.
notify pgrst, 'reload schema';

-- ------------------------------------------------------------------ verify --
-- Expect rowsecurity = true for all three.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'assessments', 'patients');
