
import { localTriage } from "./triage.js";
import { supabase } from "./supabase.js";

export const API_URL = "http://127.0.0.1:8000";

// The Supabase client is `null` whenever the env vars are absent, which is a
// supported way to run this app. Calling supabase.auth.* without this guard
// throws a TypeError instead of the message the caller is meant to see.
function requireDatabase() {
  if (!supabase) {
    throw new Error(
      "The database is not configured, so patient records cannot be saved or read.",
    );
  }
}

/* =========================================================
   1. ASSESS PATIENT USING PYTHON BACKEND
========================================================= */

export async function assessPatient(form) {
  const payload = {
    age: Number(form.age),
    systolic: Number(form.systolic),
    diastolic: Number(form.diastolic),
    heartRate: Number(form.heartRate),
    spo2: Number(form.spo2),
    temperature: Number(form.temperature),
    glucose: Number(form.glucose),

    symptoms: {
      confusion: form.confusion,
      thirst: form.thirst,
      sweating: form.sweating,
      chestPain: form.chestPain,
      breathingDifficulty: form.breathingDifficulty,
      weakness: form.weakness,
    },
  };

  try {
    const response = await fetch(`${API_URL}/api/assess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;

      try {
        const body = await response.json();

        if (body && body.detail) {
          detail =
            typeof body.detail === "string"
              ? body.detail
              : JSON.stringify(body.detail);
        }
      } catch {
        // Keep original error details.
      }

      throw new Error(
        `Backend rejected the request (${detail})`
      );
    }

    const data = await response.json();

    return {
      ...data,
      backendOnline: true,
      backendError: null,
    };
  } catch (error) {
    const local = localTriage(form);

    return {
      engine: "Offline rule estimate",
      classical_probability: null,
      hybrid_probability: null,
      risk_level: local.level,
      prototype_rule_score: local.score,
      symptom_count: Object.values(form).filter(
        (val) => val === true
      ).length,
      backendOnline: false,
      backendError:
        error?.message ||
        "Could not reach the assessment service.",
      disclaimer:
        "Backend unreachable - these values come from the local rule engine, not the ML model.",
    };
  }
}

/* =========================================================
   2. SAVE PATIENT PROFILE TO SUPABASE
========================================================= */

export async function saveProfile(profile) {
  requireDatabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in before saving your profile.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: profile.full_name,
        age: Number(profile.age),
        gender: profile.gender,
        phone: profile.phone,
      },
      {
        onConflict: "id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Profile save failed: ${error.message}`);
  }

  return data;
}

/* =========================================================
   3. GET LOGGED-IN USER PROFILE
========================================================= */

export async function getProfile() {
  requireDatabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in to access your profile.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not fetch profile: ${error.message}`);
  }

  return data;
}

/* =========================================================
   4. SAVE HEALTH ASSESSMENT TO SUPABASE
========================================================= */

export async function saveAssessment(form, triageResult, patientId = null) {
  requireDatabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in before saving an assessment.");
  }

  const assessment = {
    user_id: user.id,
    // Null for a self-assessment, set when an account records on behalf of a
    // patient in its register. RLS checks the patient belongs to this account.
    patient_id: patientId || null,

    vitals: {
      age: Number(form.age),
      systolic: Number(form.systolic),
      diastolic: Number(form.diastolic),
      heartRate: Number(form.heartRate),
      spo2: Number(form.spo2),
      temperature: Number(form.temperature),
      glucose: Number(form.glucose),
      // Was dropped on save, so a fasting reading came back labelled PP.
      glucoseType: form.glucoseType || "PP",
    },

    symptoms: {
      confusion: form.confusion,
      thirst: form.thirst,
      sweating: form.sweating,
      chestPain: form.chestPain,
      breathingDifficulty: form.breathingDifficulty,
      weakness: form.weakness,
    },

    triage_result: triageResult,
  };

  let { data, error } = await supabase
    .from("assessments")
    .insert(assessment)
    .select()
    .single();

  // `patient_id` is added by supabase/03-patients.sql. If that has not been run,
  // the column is unknown to PostgREST and the insert fails. Dropping it keeps
  // assessment saving working, but the row will not be filed against a patient —
  // so this is reported rather than hidden.
  if (error && /patient_id/i.test(error.message || "")) {
    const { patient_id: _dropped, ...withoutPatient } = assessment;
    const retry = await supabase.from("assessments").insert(withoutPatient).select().single();
    if (!retry.error) {
      return { ...retry.data, _warning: "patient_id column missing — run supabase/03-patients.sql" };
    }
    error = retry.error;
  }

  if (error) {
    throw new Error(`Assessment save failed: ${error.message}`);
  }

  return data;
}

/* =========================================================
   5. GET PATIENT ASSESSMENT HISTORY
========================================================= */

export async function getAssessmentHistory() {
  requireDatabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in to view assessment history.");
  }

  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`History retrieval failed: ${error.message}`);
  }

  return data;
}

/* =========================================================
   6. DELETE AN ASSESSMENT
========================================================= */

export async function deleteAssessment(assessmentId) {
  requireDatabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in before deleting an assessment.");
  }

  const { error } = await supabase
    .from("assessments")
    .delete()
    .eq("id", assessmentId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Assessment deletion failed: ${error.message}`);
  }

  return true;
}
