import React, { useState } from "react";
import { IconUser, IconPhone, IconClock, IconLock } from "../Icons.jsx";
import { createPatient, updatePatient } from "../lib/patients.js";

// Add or edit one patient in the register. Reuses the auth-modal styling so it
// matches the profile editor rather than inventing a second form look.
const GENDERS = ["Male", "Female", "Other"];

const blank = { name: "", age: "", gender: "Male", phone: "", abhaId: "", notes: "" };

export function PatientFormModal({ patient = null, onSaved, onClose }) {
  const isEdit = Boolean(patient?.id);

  const [fields, setFields] = useState(
    patient
      ? {
          name: patient.name || "",
          age: patient.age || "",
          gender: GENDERS.includes(patient.gender) ? patient.gender : "Male",
          phone: patient.phone || "",
          abhaId: patient.abhaId || "",
          notes: patient.notes || "",
        }
      : { ...blank },
  );

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setFields({ ...fields, [key]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    if (!fields.name.trim()) return setError("Enter the patient's name.");
    if (fields.age !== "" && (Number(fields.age) < 0 || Number(fields.age) > 120)) {
      return setError("Enter an age between 0 and 120.");
    }

    setError("");
    setBusy(true);
    try {
      const saved = isEdit
        ? await updatePatient(patient.id, fields)
        : await createPatient(fields);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-logo">
              <IconLock size={20} color="#ffffff" />
            </div>
            <div>
              <h2>{isEdit ? "Edit Patient" : "Add Patient"}</h2>
              <span className="brand-subtitle">Patient Register</span>
            </div>
          </div>
          <p>
            {isEdit
              ? "Update this patient's details. Only you can see or change this record."
              : "Record a patient's details. Only you can see or change this record."}
          </p>
        </div>

        <div className="auth-body">
          {error && (
            <div
              role="alert"
              style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-grid">
              <div className="auth-field-full">
                <label className="auth-label" htmlFor="patient-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconUser size={16} /></span>
                  <input
                    id="patient-name"
                    className="auth-input"
                    type="text"
                    placeholder="e.g. Asha Rao"
                    value={fields.name}
                    onChange={set("name")}
                  />
                </div>
              </div>

              <div>
                <label className="auth-label" htmlFor="patient-age">Age (Years)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconClock size={16} /></span>
                  <input
                    id="patient-age"
                    className="auth-input"
                    type="number"
                    min="0"
                    max="120"
                    placeholder="e.g. 34"
                    value={fields.age}
                    onChange={set("age")}
                  />
                </div>
              </div>

              <div>
                <label className="auth-label" htmlFor="patient-gender">Gender</label>
                <select
                  id="patient-gender"
                  className="auth-select"
                  value={fields.gender}
                  onChange={set("gender")}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="auth-field-full">
                <label className="auth-label" htmlFor="patient-phone">Contact Mobile No.</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconPhone size={16} /></span>
                  <input
                    id="patient-phone"
                    className="auth-input"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={fields.phone}
                    onChange={set("phone")}
                  />
                </div>
              </div>

              <div className="auth-field-full">
                <label className="auth-label" htmlFor="patient-abha">ABHA ID (optional)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconLock size={16} /></span>
                  <input
                    id="patient-abha"
                    className="auth-input"
                    type="text"
                    placeholder="ABHA-0000-0000-0000"
                    value={fields.abhaId}
                    onChange={set("abhaId")}
                  />
                </div>
              </div>

              <div className="auth-field-full">
                <label className="auth-label" htmlFor="patient-notes">Notes (optional)</label>
                <textarea
                  id="patient-notes"
                  className="auth-input"
                  rows={3}
                  placeholder="Known conditions, allergies, anything the next review needs."
                  value={fields.notes}
                  onChange={set("notes")}
                  style={{ paddingLeft: "13px", resize: "vertical" }}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              <span>{busy ? "Saving…" : isEdit ? "Save Changes" : "Add to Register"}</span>
            </button>

            <button
              type="button"
              style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: "12px", fontSize: "13px", cursor: "pointer" }}
              onClick={onClose}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
