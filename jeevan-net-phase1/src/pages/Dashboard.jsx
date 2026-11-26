import React, { useState, useEffect } from "react";
import { IconVideo, IconStethoscope } from "../Icons.jsx";
import { DOCTORS_LIST } from "../data/doctors.js";
import { getMandatedTests } from "../data/guidelines.js";

export function Dashboard({ user, assessmentData, selectedFacility, onNavigate, onOpenAuth, onStartVideoCall }) {
  const onlineDoc = DOCTORS_LIST[0];

  return (
    <div className="dashboard-grid">
      {/* HERO PANEL */}
      <section className="hero-panel">
        <div>
          <div className="section-label">ACTIVE CLINICAL MATRIX</div>
          <h2>
            Welcome back, {user.name}.
            <br />
            Coordinated Early Detection Grid.
          </h2>
          <p>
            JEEVAN-NET integrates <strong>Voice Companion (22+ languages)</strong>, <strong>Online Doctor Teleconsultation</strong>, and <strong>Government Age-Screening Protocols</strong>.
          </p>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
            <button className="primary-button" onClick={() => onNavigate("Doctor Consult")}>
              <IconStethoscope size={16} /> Connect Online Doctor →
            </button>
            <button className="secondary-button" onClick={() => onNavigate("Voice Companion")}>
              🎤 Voice Clinical Dictation
            </button>
          </div>
        </div>

        <div className="hero-symbol">+</div>
      </section>

      {/* VERIFIED PATIENT SUMMARY CARD */}
      <section className="panel" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", borderColor: "#bae6fd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="section-label" style={{ color: "#0369a1" }}>VERIFIED USER PROFILE</div>
            <h3 style={{ margin: "4px 0", color: "#0f172a" }}>{user.name} ({user.age} yrs, {user.gender})</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#0369a1" }}>
              Contact: <strong>{user.contact}</strong> • ABDM ID: <strong>{user.abhaId}</strong>
            </p>
          </div>
          <button className="secondary-button" onClick={onOpenAuth} style={{ background: "#ffffff", borderColor: "#38bdf8" }}>
            Edit / Re-verify OTP
          </button>
        </div>

        {/* SUGGESTED MANDATORY TESTS SUMMARY */}
        <div style={{ marginTop: "16px", borderTop: "1px dashed #7dd3fc", paddingTop: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", textTransform: "uppercase", marginBottom: "8px" }}>
            📋 MANDATORY TESTS SUGGESTED AS PER GOVT GUIDELINES (FOR AGE {user.age}, {user.gender.toUpperCase()})
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {getMandatedTests(user.age, user.gender).map((test, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid #7dd3fc", padding: "8px 12px", borderRadius: "8px", fontSize: "12.5px", color: "#0c4a6e" }}>
                <strong>{test.screening}</strong>: {test.testMethod} ({test.frequency})
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTANT ONLINE DOCTOR CALL BANNER */}
      <section className="panel" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderColor: "#86efac" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="section-label" style={{ color: "#15803d" }}>INSTANT TELECONSULTATION</div>
            <h3 style={{ margin: "4px 0", color: "#0f172a" }}>Available Specialist: {onlineDoc.name} ({onlineDoc.title})</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
              Start an instant video consultation or book a clinic slot.
            </p>
          </div>
          <button
            className="primary-button"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
            onClick={() => onStartVideoCall(onlineDoc)}
          >
            <IconVideo size={16} /> Start Video Call Now →
          </button>
        </div>
      </section>

      {/* STROKE JOURNEY COMPARISON SHORTCUT */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CLINICAL STROKE TIMELINE COMPARISON</div>
            <h3>Illustrative stroke timeline: uncoordinated vs coordinated</h3>
            <p className="muted">
              This is a scenario illustration, not a measured result. The timings below are
              modelled assumptions for the demo and have not been validated in a field trial.
            </p>
          </div>
        </div>

        <div className="stroke-comparison-grid">
          <div className="journey-card-baseline">
            <div style={{ color: "#dc2626", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
              ⚠️ BASELINE TRADITIONAL JOURNEY (ILLUSTRATIVE, ~210 MIN)
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#7f1d1d", lineHeight: "1.6" }}>
              <li>Home delays: Symptom confusion handled with home remedies</li>
              <li>Blind Taxi Travel: Transferred to closest basic clinic without CT readiness</li>
              <li>Equipment Fail: Lack of CT/ICU routes patient to ER A</li>
              <li>Severe risk of permanent neurological deficit</li>
            </ul>
          </div>

          <div className="journey-card-jeevan">
            <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
              ⚡ JEEVAN-NET COORDINATED GRID (TARGET, ~45 MIN)
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#14532d", lineHeight: "1.6" }}>
              <li>Instant Onset Timestamp: Companion logs symptom onset immediately</li>
              <li>Oxygen ALS Ambulance: Dispatches nearest capable transport</li>
              <li>Concentric Route: ICU & CT availability locked en-route</li>
              <li>Rapid thrombolytic treatment; high stroke survival</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
