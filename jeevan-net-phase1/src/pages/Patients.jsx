import React, { useState, useEffect, useCallback } from "react";
import { IconSearch, IconUser } from "../Icons.jsx";
import { listPatients, deletePatient, getPatientAssessments } from "../lib/patients.js";
import { DbSetupNotice } from "../components/DbSetupNotice.jsx";
import { PatientFormModal } from "../modals/PatientFormModal.jsx";
import { RecordItem } from "../components/RecordItem.jsx";

// The patient register: a list of people this account has recorded, plus one
// selected patient's details and triage history. Deliberately separate from
// "Patient Record", which is the signed-in user's own health record.

const riskColour = (level) =>
  level === "HIGH" ? "#b91c1c" : level === "MODERATE" ? "#a16207" : "#15803d";

export function Patients({ user, selectedPatient, setSelectedPatient, onAssessPatient }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [assessments, setAssessments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const isDemo = Boolean(user?.isDemo);

  const load = useCallback(async () => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setPatients(await listPatients());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  // One selected patient's assessments.
  useEffect(() => {
    let active = true;

    if (!selectedPatient?.id || isDemo) {
      setAssessments([]);
      return () => {
        active = false;
      };
    }

    setHistoryLoading(true);
    setHistoryError("");
    getPatientAssessments(selectedPatient.id)
      .then((rows) => active && setAssessments(rows))
      .catch((e) => active && setHistoryError(e.message))
      .finally(() => active && setHistoryLoading(false));

    return () => {
      active = false;
    };
  }, [selectedPatient?.id, isDemo]);

  const refreshHistory = useCallback(async (patientId) => {
    if (!patientId) return;
    try {
      setAssessments(await getPatientAssessments(patientId));
    } catch (e) {
      setHistoryError(e.message);
    }
  }, []);

  const handleSaved = async (patient) => {
    setFormOpen(false);
    setEditing(null);
    setSelectedPatient(patient);
    await load();
    refreshHistory(patient.id);
  };

  const handleDelete = async (patient) => {
    const confirmed = window.confirm(
      `Remove ${patient.name} from the register? Their assessments are removed with them. This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deletePatient(patient.id);
      if (selectedPatient?.id === patient.id) setSelectedPatient(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = term
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.phone || "").toLowerCase().includes(term) ||
          (p.abhaId || "").toLowerCase().includes(term),
      )
    : patients;

  if (isDemo) {
    return (
      <div className="panel">
        <div className="section-label">PATIENT REGISTER</div>
        <h2>Sign in to use the register</h2>
        <p className="muted">
          You are signed in as the demo patient, which owns no database records, so the register
          is empty by design. Create a real account (email and password) to record patients.
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">PATIENT REGISTER</div>
            <h2>Patients you have recorded</h2>
            <p className="muted">
              Only you can see these records. Each assessment you run is filed against the patient
              you select.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <IconUser size={15} /> Add Patient
          </button>
        </div>

        {error && (
          <div style={{ margin: "12px 0" }}>
            <div
              role="alert"
              style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}
            >
              {error}
            </div>
            {/* A register that will not load is almost always an unrun migration.
                Probe the schema and name the missing piece instead of repeating
                "run the SQL" in prose. */}
            <div style={{ marginTop: "10px" }}>
              <DbSetupNotice />
            </div>
          </div>
        )}

        <div className="auth-input-wrapper" style={{ marginTop: "16px" }}>
          <span className="auth-input-icon"><IconSearch size={16} /></span>
          <input
            className="auth-input"
            type="search"
            placeholder="Search by name, phone or ABHA ID"
            aria-label="Search patients"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)", gap: "18px", marginTop: "18px", alignItems: "start" }}>
        {/* ---------------- list ---------------- */}
        <section className="panel">
          <div className="section-label">
            {term ? `${visible.length} MATCHING` : `${patients.length} ON FILE`}
          </div>

          {loading ? (
            <p className="muted">Loading the register…</p>
          ) : visible.length === 0 ? (
            <p className="muted">
              {patients.length === 0
                ? "No patients yet. Use “Add Patient” to record the first one."
                : "No patient matches that search."}
            </p>
          ) : (
            <ul className="patient-list">
              {visible.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    className={`patient-row ${selectedPatient?.id === patient.id ? "is-active" : ""}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <span className="patient-row-main">{patient.name}</span>
                    <span className="patient-row-meta">
                      {patient.age ? `${patient.age} yrs` : "age not recorded"}
                      {patient.gender ? ` · ${patient.gender}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------------- detail ---------------- */}
        <section className="panel">
          {!selectedPatient ? (
            <>
              <div className="section-label">PATIENT DETAILS</div>
              <p className="muted">Select a patient to see their details and triage history.</p>
            </>
          ) : (
            <>
              <div className="panel-header">
                <div>
                  <div className="section-label">PATIENT DETAILS</div>
                  <h2>{selectedPatient.name}</h2>
                  <p className="muted">
                    {selectedPatient.abhaId ? `ABHA ID: ${selectedPatient.abhaId}` : "No ABHA ID on file"}
                    {selectedPatient.phone ? ` • ${selectedPatient.phone}` : ""}
                  </p>
                </div>
              </div>

              <div className="record-details">
                <RecordItem label="Age" value={selectedPatient.age ? `${selectedPatient.age} years` : "—"} />
                <RecordItem label="Gender" value={selectedPatient.gender || "—"} />
                <RecordItem label="Contact" value={selectedPatient.phone || "—"} />
                <RecordItem label="ABHA ID" value={selectedPatient.abhaId || "—"} />
                <RecordItem label="Added" value={
                  selectedPatient.createdAt
                    ? new Date(selectedPatient.createdAt).toLocaleDateString()
                    : "—"
                } />
              </div>

              {selectedPatient.notes && (
                <div style={{ marginTop: "14px" }}>
                  <div className="section-label">NOTES</div>
                  <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{selectedPatient.notes}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
                <button className="primary-button" onClick={() => onAssessPatient(selectedPatient)}>
                  Run Assessment for {selectedPatient.name.split(" ")[0]}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditing(selectedPatient);
                    setFormOpen(true);
                  }}
                >
                  Edit Details
                </button>
                <button
                  className="secondary-button"
                  style={{ color: "#b91c1c", borderColor: "#fecaca" }}
                  onClick={() => handleDelete(selectedPatient)}
                >
                  Remove
                </button>
              </div>

              <div style={{ marginTop: "24px" }}>
                <div className="section-label">TRIAGE HISTORY</div>
                {historyLoading ? (
                  <p className="muted">Loading assessments…</p>
                ) : historyError ? (
                  <p className="muted">{historyError}</p>
                ) : assessments.length === 0 ? (
                  <p className="muted">
                    No assessments recorded for this patient yet. Use “Run Assessment” above.
                  </p>
                ) : (
                  <div className="record-details">
                    {assessments.map((row) => {
                      const level = row.triage_result?.risk_level || "—";
                      const score =
                        row.triage_result?.localScore ??
                        row.triage_result?.prototype_rule_score ??
                        "—";
                      return (
                        <RecordItem
                          key={row.id}
                          label={new Date(row.created_at).toLocaleString()}
                          value={
                            <span style={{ color: riskColour(level) }}>
                              {level} · {score}/15
                            </span>
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {formOpen && (
        <PatientFormModal
          patient={editing}
          onSaved={handleSaved}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
