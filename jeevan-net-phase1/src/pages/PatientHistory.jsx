import React, { useState, useEffect } from "react";
import { RecordItem } from "../components/RecordItem.jsx";
import { getAssessmentHistory } from "../lib/api.js";

export function PatientHistory({ user, assessmentData, selectedFacility, onNewAssessment, onOpenAuth }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Real history for a real account. The demo and guest paths own no server
  // rows, so they show the in-session assessment only — never invented vitals.
  useEffect(() => {
    let active = true;

    if (user?.isDemo) {
      setLoading(false);
      return;
    }

    getAssessmentHistory()
      .then((data) => active && setRows(data || []))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [user?.isDemo]);

  const latest = rows[0] || null;
  const patient = assessmentData?.form || latest?.vitals || null;

  return (
    <div className="history-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">PATIENT PROFILE</div>
            <h2>Patient Clinical History</h2>
          </div>
          <button className="secondary-button" onClick={onOpenAuth}>
            Update Profile
          </button>
        </div>

        <div className="record-header">
          <div className="patient-avatar">{user.name.charAt(0)}</div>
          <div>
            <h3>{user.name}</h3>
            <p className="muted">
              {user.abhaId ? `ABHA ID: ${user.abhaId}` : "No ABHA ID on file"} • Contact:{" "}
              {user.contact || "—"}
            </p>
          </div>
        </div>
      </section>

      <div className="history-grid">
        <section className="panel">
          <div className="section-label">DEMOGRAPHICS</div>
          <div className="record-details">
            <RecordItem label="Age" value={`${user.age} years`} />
            <RecordItem label="Gender" value={user.gender} />
            <RecordItem label="Email" value={user.email} />
            <RecordItem label="Contact" value={user.contact} />
            <RecordItem label="ABDM Health ID" value={user.abhaId} />
          </div>
        </section>

        <section className="panel">
          <div className="section-label">LATEST TRIAGE ASSESSMENT</div>
          {loading ? (
            <p className="muted">Loading your records…</p>
          ) : error ? (
            <p className="muted">Could not load records: {error}</p>
          ) : patient ? (
            <div className="record-details">
              <RecordItem label="Blood Pressure" value={`${patient.systolic}/${patient.diastolic} mmHg`} />
              <RecordItem label="Heart Rate" value={`${patient.heartRate} bpm`} />
              <RecordItem label="SpO₂" value={`${patient.spo2}%`} />
              <RecordItem label="Glucose" value={`${patient.glucose} mg/dL (${patient.glucoseType || "PP"})`} />
            </div>
          ) : (
            <p className="muted">
              No assessment recorded yet. Run one and it will be saved here and to your account.
            </p>
          )}
        </section>
      </div>

      {rows.length > 0 && (
        <section className="panel">
          <div className="section-label">SAVED ASSESSMENTS ({rows.length})</div>
          <div className="record-details">
            {rows.slice(0, 10).map((row) => (
              <RecordItem
                key={row.id}
                label={new Date(row.created_at).toLocaleString()}
                value={`${row.triage_result?.risk_level || "—"} · ${
                  row.triage_result?.localScore ?? row.triage_result?.prototype_rule_score ?? "—"
                }/15`}
              />
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <button className="primary-button" onClick={onNewAssessment}>
          Start New Clinical Assessment →
        </button>
      </section>
    </div>
  );
}
