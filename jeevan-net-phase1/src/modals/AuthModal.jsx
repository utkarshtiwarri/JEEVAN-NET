import React, { useState } from "react";
import { IconLogo, IconUser, IconPhone, IconMail, IconClock, IconLock } from "../Icons.jsx";
import { updateMyProfile, authAvailable } from "../lib/auth.js";
import { supabaseConfigError } from "../lib/supabase.js";

// A plain profile editor — deliberately no one-time code.
//
// An earlier version emailed a 6-digit code and refused to save without it. That
// step could not be completed while the project's mail sender was failing, so
// editing your own name or age was impossible. Verification is not worth blocking
// a profile edit on: the row is already scoped to the signed-in account by RLS,
// and writing it proves nothing extra.
//
// Genders are kept to the three values the rest of the app understands; the old
// "Transgender/Other" option produced a value no other screen recognised.
const GENDERS = ["Male", "Female", "Other"];

export function AuthModal({ initialUser, onComplete, onClose }) {
  const [formData, setFormData] = useState({
    name: initialUser.name || "",
    age: initialUser.age === "—" ? "" : initialUser.age || "",
    gender: GENDERS.includes(initialUser.gender) ? initialUser.gender : "Male",
    email: initialUser.email || "",
    contact: initialUser.contact || "",
    abhaId: initialUser.abhaId || "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (!formData.name.trim()) return setError("Enter your full name.");
    if (!formData.age || Number(formData.age) < 1 || Number(formData.age) > 120) {
      return setError("Enter an age between 1 and 120.");
    }

    // The demo and guest paths own no database row, so there is nothing to write
    // to. Update the in-memory profile and say so, rather than pretending to save.
    if (initialUser?.isDemo) {
      onComplete({ ...initialUser, ...formData, age: String(formData.age) });
      return;
    }

    if (!authAvailable) {
      setError(supabaseConfigError || "The database is not configured.");
      return;
    }

    setError("");
    setBusy(true);
    const result = await updateMyProfile({
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      contact: formData.contact,
      abhaId: formData.abhaId,
    });
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onComplete(result.user);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-logo">
              <IconLogo size={22} color="#ffffff" />
            </div>
            <div>
              <h2>JEEVAN-NET Patient Portal</h2>
              <span className="brand-subtitle">ArogyaNexus Patient Profile</span>
            </div>
          </div>
          <p>
            {initialUser?.isDemo
              ? "You are signed in as the demo patient, so changes here stay in this session and are not saved to a database."
              : "Update the details stored against your account. Changes apply to your own record only."}
          </p>
        </div>

        <div className="auth-body">
          {error && (
            <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="auth-form-grid">
              <div className="auth-field-full">
                <label className="auth-label" htmlFor="profile-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconUser size={16} /></span>
                  <input
                    id="profile-name"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="auth-label" htmlFor="profile-age">Age (Years)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconClock size={16} /></span>
                  <input
                    id="profile-age"
                    type="number"
                    min="1"
                    max="120"
                    className="auth-input"
                    placeholder="e.g. 56"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="auth-label" htmlFor="profile-gender">Gender</label>
                <select
                  id="profile-gender"
                  className="auth-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div className="auth-field-full">
                <label className="auth-label" htmlFor="profile-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconMail size={16} /></span>
                  <input
                    id="profile-email"
                    type="email"
                    className="auth-input"
                    value={formData.email}
                    readOnly
                    title="The address you signed in with. Changing it needs a separate confirmation flow."
                  />
                </div>
              </div>

              <div className="auth-field-full">
                <label className="auth-label" htmlFor="profile-contact">Contact Mobile No.</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconPhone size={16} /></span>
                  <input
                    id="profile-contact"
                    type="tel"
                    className="auth-input"
                    placeholder="+91 98765 43210"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-field-full">
                <label className="auth-label" htmlFor="profile-abha">ABHA ID (optional)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><IconLock size={16} /></span>
                  <input
                    id="profile-abha"
                    type="text"
                    className="auth-input"
                    placeholder="ABHA-0000-0000-0000"
                    value={formData.abhaId}
                    onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              <span>{busy ? "Saving…" : "Save Profile"}</span>
            </button>

            <button
              type="button"
              style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: "12px", fontSize: "13px", cursor: "pointer" }}
              onClick={onClose}
            >
              Cancel
            </button>
          </form>

          <div className="auth-footer-note">
            <IconLock size={13} /> Stored in your own patient record. Not an ABDM integration.
          </div>
        </div>
      </div>
    </div>
  );
}
