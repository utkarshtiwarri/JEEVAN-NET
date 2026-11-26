import { localTriage } from "./triage.js";

export const API_URL = "http://127.0.0.1:8000";

/* =========================================================
   DEFAULT PATIENT & INITIAL USER STATE
========================================================= */

// Fixed synthetic id. This was previously generated with Math.random(), which
// minted a fresh "verified ABDM id" every time the profile modal was saved.

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Surface the real reason (a 422 validation error is not "offline").
      let detail = `${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        if (body && body.detail) {
          detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        }
      } catch {
        // Non-JSON error body - keep the status line.
      }
      throw new Error(`Backend rejected the request (${detail})`);
    }

    const data = await response.json();
    return { ...data, backendOnline: true, backendError: null };
  } catch (error) {
    // Still return something usable so the demo survives a dead backend, but
    // report no model probabilities at all rather than inventing 99.9%.
    const local = localTriage(form);
    return {
      engine: "Offline rule estimate",
      classical_probability: null,
      hybrid_probability: null,
      risk_level: local.level,
      prototype_rule_score: local.score,
      symptom_count: Object.values(form).filter((val) => val === true).length,
      backendOnline: false,
      backendError: (error && error.message) || "Could not reach the assessment service.",
      disclaimer: "Backend unreachable - these values come from the local rule engine, not the ML model.",
    };
  }
}
