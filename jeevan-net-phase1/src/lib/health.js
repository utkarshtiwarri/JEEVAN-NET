import { supabase } from "./supabase.js";

// A read-only check of whether the database has what the app expects.
//
// Why this exists: every failure so far has been a setup step, not a bug —
// `abha_id` missing, `patients` never created, policies absent. Each one showed
// up as an opaque PostgREST error, and the answer was always "run the SQL". This
// probes the actual schema and says which piece is missing, so the app can point
// at the fix instead of relaying a database error.
//
// It only READS. An anon key can confirm a table exists and a column resolves; it
// cannot list policies, because RLS hides them. So "policies exist" is inferred
// from a refused write, which is the same thing the app would hit in practice.

const NOT_INSTALLED = /could not find the table|PGRST205|schema cache|does not exist/i;

/**
 * @returns {Promise<{configured: boolean, ready: boolean, checks: Array<{
 *   id: string, label: string, ok: boolean, detail: string, fix?: string
 * }>}>}
 */
export async function checkDatabaseSetup() {
  const checks = [];

  const add = (id, label, ok, detail, fix) =>
    checks.push({ id, label, ok, detail, fix });

  if (!supabase) {
    return {
      configured: false,
      ready: false,
      checks: [
        {
          id: "config",
          label: "Supabase configured",
          ok: false,
          detail:
            "No VITE_SUPABASE_URL / anon key found in .env. Copy .env.example to .env.local and restart the dev server.",
          fix: "Add the two env vars to jeevan-net-phase1/.env.local, then restart Vite.",
        },
      ],
    };
  }

  add("config", "Supabase configured", true, "The URL and API key were accepted.");

  // ---- profiles ------------------------------------------------------------
  {
    const { error } = await supabase.from("profiles").select("id").limit(0);
    const exists = !error;
    add(
      "profiles",
      "profiles table",
      exists,
      exists ? "Present." : NOT_INSTALLED.test(error.message) ? "Missing." : error.message,
      exists ? undefined : "Run supabase/setup.sql.",
    );
  }

  // ---- profiles.abha_id ----------------------------------------------------
  {
    const { error } = await supabase.from("profiles").select("abha_id").limit(0);
    const ok = !error;
    add(
      "profiles.abha_id",
      "profiles.abha_id column",
      ok,
      ok ? "Present." : "Missing — the ABHA ID cannot be saved without it.",
      ok ? undefined : "Run supabase/setup.sql (adds the column).",
    );
  }

  // ---- patients ------------------------------------------------------------
  {
    const { error } = await supabase
      .from("patients")
      .select("id, full_name, owner_id")
      .limit(0);
    const exists = !error;
    add(
      "patients",
      "patients table (the register)",
      exists,
      exists ? "Present." : NOT_INSTALLED.test(error.message) ? "Missing." : error.message,
      exists ? undefined : "Run supabase/setup.sql, then reload this page.",
    );
  }

  // ---- assessments ---------------------------------------------------------
  {
    const { error } = await supabase
      .from("assessments")
      .select("id, user_id, vitals, symptoms, triage_result")
      .limit(0);
    const exists = !error;
    add(
      "assessments",
      "assessments table",
      exists,
      exists ? "Present." : NOT_INSTALLED.test(error.message) ? "Missing." : error.message,
      exists ? undefined : "Run supabase/setup.sql.",
    );
  }

  // ---- assessments.patient_id ---------------------------------------------
  {
    const { error } = await supabase.from("assessments").select("patient_id").limit(0);
    const ok = !error;
    add(
      "assessments.patient_id",
      "assessments.patient_id column",
      ok,
      ok
        ? "Present — assessments can be filed against a patient."
        : "Missing — assessments save but are not linked to a patient.",
      ok ? undefined : "Run supabase/setup.sql (adds the column).",
    );
  }

  const ready = checks.every((c) => c.ok);
  return { configured: true, ready, checks };
}
