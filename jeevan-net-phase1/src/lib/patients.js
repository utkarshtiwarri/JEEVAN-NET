import { supabase } from "./supabase.js";

// CRUD for the patient register.
//
// Every row is owned by the signed-in account and the policies in
// supabase/03-patients.sql make that ownership the only thing visible to it, so
// nothing here needs to pass an owner id: the table defaults `owner_id` to
// auth.uid() and RLS rejects any other value.

const TABLE = "patients";

function client() {
  if (!supabase) {
    throw new Error(
      "The database is not configured, so the patient register is unavailable.",
    );
  }
  return supabase;
}

// Database rows are snake_case; the UI speaks camelCase.
export const toPatient = (row) => ({
  id: row.id,
  name: row.full_name || "",
  age: row.age == null ? "" : String(row.age),
  gender: row.gender || "",
  phone: row.phone || "",
  abhaId: row.abha_id || "",
  notes: row.notes || "",
  createdAt: row.created_at,
});

const toRow = (fields) => ({
  full_name: fields.name.trim(),
  age: fields.age === "" || fields.age == null ? null : Number(fields.age),
  gender: fields.gender || null,
  phone: fields.contact || fields.phone || null,
  abha_id: fields.abhaId || null,
  notes: fields.notes || null,
});

// PostgREST says "could not find the table ... in the schema cache" when the table
// does not exist. That is a setup step, not a bug, so say which step.
const MISSING_TABLE = /could not find the table|PGRST205|schema cache/i;

const fail = (what, error) => {
  if (MISSING_TABLE.test(error.message || "")) {
    throw new Error(
      `The patient register table does not exist yet. Open supabase/03-patients.sql, ` +
        `copy its contents into the Supabase SQL editor and run it, then reload this page.`,
    );
  }
  if (/permission denied|row-level security|RLS/i.test(error.message || "")) {
    throw new Error(
      `The database refused access to the patient register. Re-run ` +
        `supabase/03-patients.sql so the owner policies are created.`,
    );
  }
  throw new Error(`${what}: ${error.message}`);
};

export async function listPatients() {
  const { data, error } = await client()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) fail("Could not load the patient register", error);
  return (data || []).map(toPatient);
}

export async function createPatient(fields) {
  const { data, error } = await client()
    .from(TABLE)
    .insert(toRow(fields))
    .select()
    .single();

  if (error) fail("Could not add the patient", error);
  return toPatient(data);
}

export async function updatePatient(id, fields) {
  const { data, error } = await client()
    .from(TABLE)
    .update(toRow(fields))
    .eq("id", id)
    .select()
    .single();

  if (error) fail("Could not update the patient", error);
  return toPatient(data);
}

export async function deletePatient(id) {
  const { error } = await client().from(TABLE).delete().eq("id", id);
  if (error) fail("Could not delete the patient", error);
  return true;
}

// One patient's triage history, newest first.
export async function getPatientAssessments(patientId) {
  const { data, error } = await client()
    .from("assessments")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) fail("Could not load this patient's assessments", error);
  return data || [];
}
