import React, { useState, useEffect } from "react";
import { IconCheckCircle } from "../Icons.jsx";

export function AppointmentBookingModal({ doctor, user, onClose }) {
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedSlot, setSelectedSlot] = useState("03:30 PM");
  const [consultType, setConsultType] = useState("Online Video Call");
  const [isBooked, setIsBooked] = useState(false);

  const handleConfirm = (e) => {
    e.preventDefault();
    setIsBooked(true);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card" style={{ maxWidth: "460px" }}>
        <div className="auth-header" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}>
          <h2 style={{ fontSize: "20px" }}>Book Doctor Appointment</h2>
          <p style={{ color: "#e0f2fe" }}>With {doctor.name} ({doctor.title})</p>
        </div>

        <div className="auth-body">
          {isBooked ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <IconCheckCircle size={36} />
              </div>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Appointment Confirmed!</h3>
              <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
                Scheduled for <strong>{user.name}</strong> with <strong>{doctor.name}</strong> on <strong>{selectedDate} at {selectedSlot}</strong> via <strong>{consultType}</strong>.
              </p>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", marginTop: "16px", fontSize: "12px", color: "#0369a1", border: "1px solid #bae6fd" }}>
                📅 Calendar Invite & SMS notification sent to {user.contact}
              </div>
              <button className="auth-submit-btn" style={{ marginTop: "20px" }} onClick={onClose}>
                Done ✓
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirm}>
              <div style={{ marginBottom: "16px" }}>
                <label className="auth-label">Select Date</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Today", "Tomorrow", "Day After"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`range-tab-btn ${selectedDate === d ? "active" : ""}`}
                      style={{ flex: 1, padding: "8px", justifyContent: "center" }}
                      onClick={() => setSelectedDate(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="auth-label">Select Time Slot</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {["10:00 AM", "01:30 PM", "03:30 PM", "05:00 PM", "06:30 PM", "08:00 PM"].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`range-tab-btn ${selectedSlot === slot ? "active" : ""}`}
                      style={{ padding: "8px", justifyContent: "center", fontSize: "12px" }}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="auth-label">Consultation Mode</label>
                <select
                  className="auth-select"
                  value={consultType}
                  onChange={(e) => setConsultType(e.target.value)}
                >
                  <option value="Online Video Call">📹 Online Video Call (Teleconsultation)</option>
                  <option value="In-Person Clinic Visit">🏥 In-Person Clinic Visit ({doctor.hospital})</option>
                </select>
              </div>

              <button type="submit" className="auth-submit-btn">
                Confirm Appointment ({doctor.fee}) →
              </button>

              <button
                type="button"
                style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: "12px", fontSize: "13px", cursor: "pointer" }}
                onClick={onClose}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
