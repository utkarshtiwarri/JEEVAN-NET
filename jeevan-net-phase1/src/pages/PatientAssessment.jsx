import React, { useState, useEffect } from "react";
import { IconShield } from "../Icons.jsx";
import { defaultForm, criticalDemoForm } from "../data/patients.js";
import { getMandatedTests } from "../data/guidelines.js";
import { localTriage } from "../lib/triage.js";
import { assessPatient, saveAssessment } from "../lib/api.js";
import { Field } from "../components/Field.jsx";
import { Checkbox } from "../components/Checkbox.jsx";
import { Result } from "./Result.jsx";

export function PatientAssessment({ user, patient = null, onAssessmentComplete, onOpenFacilityMatching }) {
  // Assess either a patient from the register or the signed-in user themselves.
  // A patient row can carry no age, and a real account with no profile row
  // yields age "—" and gender "Not specified". None of those are valid inputs:
  // "—" becomes NaN in the triage math and a gender outside the select leaves it
  // blank. Fall back to the stable baseline instead.
  const source = patient || user;
  const seedAge = /^\d+$/.test(String(source?.age ?? "")) ? String(source.age) : defaultForm.age;
  const seedGender = ["Male", "Female", "Other"].includes(source?.gender)
    ? source.gender
    : defaultForm.gender;

  const [form, setForm] = useState({
    ...defaultForm,
    age: seedAge,
    gender: seedGender,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState(null);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const analyze = async () => {
    setLoading(true);
    const local = localTriage(form);
    const backend = await assessPatient(form);

    const modelLevel = backend.backendOnline ? backend.risk_level : null;

    const combined = {
      ...backend,
      localScore: local.score,
      localLevel: local.level,
      modelLevel,
      // The effective verdict: the model's whenever we actually have one, and
      // the local rule engine's only as an explicitly-labelled fallback. This
      // line used to unconditionally overwrite the model with the rule score.
      risk_level: modelLevel || local.level,
      indicators: local.indicators,
      action: local.action,
    };

    setResult(combined);
    onAssessmentComplete({
      form: { ...form },
      result: combined,
      assessedAt: new Date().toLocaleString(),
    });

    // Real accounts persist the assessment. The demo and guest paths never do,
    // so no invented record lands in a shared table.
    if (user?.isDemo) {
      setSaveState(null);
    } else {
      try {
        const saved = await saveAssessment(form, combined, patient?.id || null);
        setSaveState(
          saved?._warning
            ? { ok: false, message: `${saved._warning} — saved without a patient link.` }
            : { ok: true, message: "Saved to your patient record." },
        );
      } catch (error) {
        setSaveState({ ok: false, message: error.message });
      }
    }

    setLoading(false);
  };

  return (
    <div className="assessment-layout">
      <section className="panel assessment-panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CLINICAL TRIAGE & REMEDY PIPELINE</div>
            <h2>Patient Parameter Intake</h2>
            <p className="muted">
              {patient
                ? `Assessing ${patient.name}. Age and gender come from the register; the assessment is filed against this patient.`
                : "Assessing yourself. Age and gender come from your profile."}{" "}
              Vitals start at a stable baseline — use a preset below to load a specific scenario.
            </p>
          </div>
          <div className="demo-badge">LIVE CLINICAL LOOP</div>
        </div>

        <div className="preset-row">
          <span className="preset-label">Demo presets</span>
          <button
            type="button"
            className="secondary-button preset-button"
            onClick={() => setForm({ ...defaultForm, age: seedAge, gender: seedGender })}
          >
            Stable patient
          </button>
          <button
            type="button"
            className="secondary-button preset-button"
            onClick={() => setForm({ ...criticalDemoForm, age: seedAge, gender: seedGender })}
          >
            Critical crisis patient
          </button>
        </div>

        {/* SUGGESTED MANDATORY TESTS ALERT BOX */}
        <div style={{ background: "#f0f9ff", border: "1.5px solid #0284c7", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#0369a1", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <IconShield size={14} /> MANDATORY GOVT NCD TESTS SUGGESTED (AGE {form.age}, {form.gender.toUpperCase()})
          </div>
          <div style={{ fontSize: "13px", color: "#0c4a6e" }}>
            As per Government guidelines for <strong>{form.gender}</strong> aged <strong>{form.age} years</strong>:
            <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
              {getMandatedTests(form.age, form.gender).map((test, i) => (
                <li key={i} style={{ margin: "3px 0" }}>
                  <strong>{test.screening}</strong> ({test.testMethod}) — <span style={{ color: "#0284c7", fontWeight: 600 }}>{test.frequency}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="form-grid">
          <Field label="Age" value={form.age} onChange={(v) => updateField("age", v)} />

          <div className="field">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <Field label="Systolic BP (mmHg)" value={form.systolic} onChange={(v) => updateField("systolic", v)} />
          <Field label="Diastolic BP (mmHg)" value={form.diastolic} onChange={(v) => updateField("diastolic", v)} />
          <Field label="Heart Rate (bpm)" value={form.heartRate} onChange={(v) => updateField("heartRate", v)} />
          <Field label="SpO₂ (%)" value={form.spo2} onChange={(v) => updateField("spo2", v)} />
          <Field label="Temperature (°C)" value={form.temperature} onChange={(v) => updateField("temperature", v)} />

          <div className="field">
            <label>Glucose Test Type</label>
            <select value={form.glucoseType} onChange={(e) => updateField("glucoseType", e.target.value)}>
              <option value="PP">Post-Prandial (PP)</option>
              <option value="Fasting">Fasting</option>
              <option value="Regular">Regular / Random</option>
            </select>
          </div>

          <Field label="Blood Glucose (mg/dL)" value={form.glucose} onChange={(v) => updateField("glucose", v)} />
        </div>

        <div className="symptoms-section">
          <div className="section-label">REPORTED SYMPTOMS AUDIT</div>
          <div className="symptoms-grid">
            <Checkbox label="Confusion / Disorientation" checked={form.confusion} onChange={(v) => updateField("confusion", v)} />
            <Checkbox label="Excessive Thirst (Polydipsia)" checked={form.thirst} onChange={(v) => updateField("thirst", v)} />
            <Checkbox label="Profuse Sweating" checked={form.sweating} onChange={(v) => updateField("sweating", v)} />
            <Checkbox label="Chest Pain (Angina)" checked={form.chestPain} onChange={(v) => updateField("chestPain", v)} />
            <Checkbox label="Breathing Difficulty" checked={form.breathingDifficulty} onChange={(v) => updateField("breathingDifficulty", v)} />
            <Checkbox label="Sudden Weakness" checked={form.weakness} onChange={(v) => updateField("weakness", v)} />
          </div>
        </div>

        <button className="primary-button analyze-button" onClick={analyze} disabled={loading}>
          {loading ? "Processing Quantum ML Triage..." : "Analyze Patient Triage →"}
        </button>

        {saveState && (
          <p
            className="muted"
            style={{
              marginTop: "10px",
              fontSize: "12.5px",
              color: saveState.ok ? "#15803d" : "#b91c1c",
            }}
          >
            {saveState.ok ? `✓ ${saveState.message}` : `Not saved: ${saveState.message}`}
          </p>
        )}
      </section>

      {result && <Result result={result} onOpenFacilityMatching={onOpenFacilityMatching} />}
    </div>
  );
}
