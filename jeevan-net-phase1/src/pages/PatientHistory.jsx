import React, { useState, useEffect } from "react";
import { defaultForm } from "../data/patients.js";
import { RecordItem } from "../components/RecordItem.jsx";

export function PatientHistory({ user, assessmentData, selectedFacility, onNewAssessment, onOpenAuth }) {
  const patient = assessmentData?.form || defaultForm;

  return (
    <div className="history-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">DIGITAL HEALTH RECORD (ABDM CONNECTED)</div>
            <h2>Patient Clinical History</h2>
          </div>
          <button className="secondary-button" onClick={onOpenAuth}>
            Update Profile / OTP
          </button>
        </div>

        <div className="record-header">
          <div className="patient-avatar">{user.name.charAt(0)}</div>
          <div>
            <h3>{user.name}</h3>
            <p className="muted">Verified ABDM ID: {user.abhaId} • Contact: {user.contact}</p>
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
          <div className="section-label">TRIAGE ASSESSMENT</div>
          <div className="record-details">
            <RecordItem label="Blood Pressure" value={`${patient.systolic}/${patient.diastolic} mmHg`} />
            <RecordItem label="Heart Rate" value={`${patient.heartRate} bpm`} />
            <RecordItem label="SpO₂" value={`${patient.spo2}%`} />
            <RecordItem label="Glucose" value={`${patient.glucose} mg/dL (${patient.glucoseType || 'PP'})`} />
          </div>
        </section>
      </div>

      <section className="panel">
        <button className="primary-button" onClick={onNewAssessment}>
          Start New Clinical Assessment →
        </button>
      </section>
    </div>
  );
}
