import React, { useState, useEffect } from "react";
import { IconLogo, IconUser, IconPhone, IconMail, IconClock, IconLock } from "../Icons.jsx";
import { DEMO_ABHA_ID } from "../data/patients.js";

export function AuthModal({ initialUser, onComplete, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: initialUser.name || "",
    age: initialUser.age || "",
    gender: initialUser.gender || "Male",
    email: initialUser.email || "",
    contact: initialUser.contact || "",
  });

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [demoCode] = useState("789210");
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.email || !formData.contact) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    setStep(2);
    setTimer(30);
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleFillDemo = () => {
    setOtpDigits(["7", "8", "9", "2", "1", "0"]);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const entered = otpDigits.join("");
    if (entered.length < 6) {
      setError("Please enter complete 6-digit OTP.");
      return;
    }

    // The code was previously never compared against anything, so any six
    // digits were accepted as "verified".
    if (entered !== demoCode) {
      setError(`Incorrect OTP. This demo accepts ${demoCode}.`);
      return;
    }

    setError("");
    onComplete({
      ...formData,
      abhaId: initialUser.abhaId || DEMO_ABHA_ID,
      isVerified: true,
    });
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
              <span className="brand-subtitle">ArogyaNexus Verification</span>
            </div>
          </div>
          <p>
            {step === 1
              ? "Enter your personal details to initiate secure OTP verification and link with ABDM Sandbox."
              : `Enter the 6-digit OTP code sent to ${formData.contact} and ${formData.email}`}
          </p>
        </div>

        <div className="auth-body">
          {error && (
            <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
              ⚠️ {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="auth-form-grid">
                <div className="auth-field-full">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconUser size={16} /></span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="auth-label">Age (Years)</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconClock size={16} /></span>
                    <input
                      type="number"
                      className="auth-input"
                      placeholder="e.g. 56"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="auth-label">Gender</label>
                  <select
                    className="auth-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender/Other">Other</option>
                  </select>
                </div>

                <div className="auth-field-full">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconMail size={16} /></span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="rajesh.sharma@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field-full">
                  <label className="auth-label">Contact Mobile No.</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconPhone size={16} /></span>
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="+91 98765 43210"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Send Verification OTP →</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="demo-otp-banner">
                <div>
                  <div style={{ fontSize: "11px", color: "#0369a1", fontWeight: 700 }}>DEMO VERIFICATION OTP</div>
                  <div className="demo-otp-code">{demoCode}</div>
                </div>
                <button type="button" className="btn-fill-otp" onClick={handleFillDemo}>
                  Auto-fill 789210
                </button>
              </div>

              <label className="auth-label" style={{ textAlign: "center", display: "block" }}>Enter 6-Digit OTP</label>
              <div className="otp-box-container">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    className="otp-digit-input"
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                  />
                ))}
              </div>

              <div style={{ textAlign: "center", fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                {timer > 0 ? (
                  <span>Resend OTP in <strong>{timer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => setTimer(30)}
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Verify OTP & Sign In ✓</span>
              </button>

              <button
                type="button"
                style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: "12px", fontSize: "13px", cursor: "pointer" }}
                onClick={() => setStep(1)}
              >
                ← Back to Edit Details
              </button>
            </form>
          )}

          <div className="auth-footer-note">
            <IconLock size={13} /> Encrypted via ABDM Health ID Sandbox & Government Protocols
          </div>
        </div>
      </div>
    </div>
  );
}
