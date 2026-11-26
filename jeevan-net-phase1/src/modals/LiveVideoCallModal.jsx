import React, { useState, useEffect } from "react";
import { IconFileText } from "../Icons.jsx";

export function LiveVideoCallModal({ doctor, user, onClose }) {
  const [callDuration, setCallDuration] = useState(0);
  const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-window">
        <div className="video-call-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
            <div>
              <strong style={{ fontSize: "16px", color: "#ffffff", display: "block" }}>{doctor.name} ({doctor.title})</strong>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Encrypted ABDM Video Consultation • Duration: {formatTime(callDuration)}</span>
            </div>
          </div>
          <button className="btn-end-call" onClick={onClose}>
            End Call 📵
          </button>
        </div>

        <div className="video-feed-grid">
          {/* DOCTOR VIDEO FEED */}
          <div className="doctor-video-box">
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, marginBottom: "12px", boxShadow: "0 0 30px rgba(56, 189, 248, 0.4)" }}>
              {doctor.avatar}
            </div>
            <h4 style={{ margin: "0 0 4px", fontSize: "18px", color: "#ffffff" }}>{doctor.name}</h4>
            <span style={{ fontSize: "13px", color: "#38bdf8" }}>Consultation Live • Video Connected HD</span>

            <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: "#38bdf8" }}>
              💬 Doctor: "Hello {user.name}, I reviewed your vitals and symptom log. How can I help you today?"
            </div>
          </div>

          {/* PATIENT VIDEO FEED & DIGITAL PRESCRIPTION PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="patient-video-box" style={{ height: "160px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700 }}>
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "6px" }}>You ({user.name})</span>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>E-PRESCRIPTION ENGINE</div>
                {prescriptionGenerated ? (
                  <div style={{ marginTop: "8px", fontSize: "12.5px", color: "#86efac", background: "rgba(22, 163, 74, 0.2)", padding: "10px", borderRadius: "8px", border: "1px solid #22c55e" }}>
                    ✓ <strong>Digital Rx Generated (FHIR-RX-884102)</strong>
                    <div style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "4px" }}>1. Tab Sitagliptin 50mg (1-0-0)</div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>2. Tab Metformin 500mg (1-0-1)</div>
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: "6px 0" }}>Doctor can push instant digital prescriptions directly to your ABDM record.</p>
                )}
              </div>

              <button
                className="secondary-button"
                style={{ width: "100%", padding: "8px", fontSize: "12px", background: "#0284c7", color: "#ffffff", border: "none" }}
                onClick={() => setPrescriptionGenerated(true)}
              >
                <IconFileText size={14} /> {prescriptionGenerated ? "Prescription Saved ✓" : "Generate Digital Rx"}
              </button>
            </div>
          </div>
        </div>

        <div className="video-controls-bar">
          <button className="secondary-button" style={{ color: "white", borderColor: "rgba(255,255,255,0.2)" }}>🎤 Mute Mic</button>
          <button className="secondary-button" style={{ color: "white", borderColor: "rgba(255,255,255,0.2)" }}>📹 Mute Cam</button>
          <button className="btn-end-call" onClick={onClose}>End Call 📵</button>
        </div>
      </div>
    </div>
  );
}
