import React, { useState, useEffect } from "react";
import { IconSearch, IconVideo, IconCalendar } from "../Icons.jsx";
import { DOCTORS_LIST } from "../data/doctors.js";

export function DoctorConsultModule({ user, onStartVideoCall, onBookAppointment }) {
  const [search, setSearch] = useState("");

  const filteredDoctors = DOCTORS_LIST.filter(
    (doc) =>
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="doctor-consult-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">TELEMEDICINE & APPOINTMENT GRID</div>
            <h2>Connect with Doctors Online or Book Appointment</h2>
            <p className="muted">
              Consult top verified specialists via instant video call or schedule an in-person / online appointment.
            </p>
          </div>
          <div className="demo-badge">ABDM Telehealth Sandbox</div>
        </div>

        {/* SEARCH BAR */}
        <div style={{ display: "flex", gap: "12px", margin: "16px 0 8px" }}>
          <div className="auth-input-wrapper" style={{ flex: 1 }}>
            <span className="auth-input-icon"><IconSearch size={16} /></span>
            <input
              type="text"
              className="auth-input"
              placeholder="Search doctor by name, cardiology, endocrinology, hospital..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* DOCTORS GRID */}
        <div className="doctor-grid">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="doctor-card">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div className="doctor-avatar-box">{doc.avatar}</div>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "16px", color: "#0f172a" }}>{doc.name}</h3>
                      <span style={{ fontSize: "12.5px", color: "#0284c7", fontWeight: 600 }}>{doc.title}</span>
                      <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>{doc.degree} • {doc.experience}</div>
                    </div>
                  </div>

                  <span className={doc.isOnline ? "doctor-badge-online" : "doctor-badge-scheduled"}>
                    {doc.isOnline ? "● Live Video" : "📅 Scheduled"}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", fontSize: "12.5px", color: "#334155", marginBottom: "14px" }}>
                  <div>🏥 <strong>{doc.hospital}</strong></div>
                  <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                    <span>⭐ Rating: <strong>{doc.rating} / 5.0</strong></span>
                    <span>Fee: <strong style={{ color: "#16a34a" }}>{doc.fee}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {doc.isOnline ? (
                  <button
                    className="primary-button"
                    style={{ flex: 1, padding: "10px", fontSize: "13px", background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
                    onClick={() => onStartVideoCall(doc)}
                  >
                    <IconVideo size={15} /> Instant Video Call →
                  </button>
                ) : (
                  <button
                    className="secondary-button"
                    style={{ flex: 1, padding: "10px", fontSize: "13px" }}
                    onClick={() => onBookAppointment(doc)}
                  >
                    <IconCalendar size={15} /> Book Appointment
                  </button>
                )}

                <button
                  className="secondary-button"
                  style={{ padding: "10px 14px", fontSize: "13px" }}
                  onClick={() => onBookAppointment(doc)}
                  title="Book preferred time slot"
                >
                  📅 Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
