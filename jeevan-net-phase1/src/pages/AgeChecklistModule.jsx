import React, { useState, useEffect } from "react";
import { GOI_NCD_GUIDELINES, getMandatedTests } from "../data/guidelines.js";

export function AgeChecklistModule({ user }) {
  const userAge = Number(user.age) || 56;
  const userGender = user.gender || "Male";
  const [activeGenderTab, setActiveGenderTab] = useState(
    userGender.toLowerCase().includes("female") ? "Female" : "Male"
  );

  const mandatedForUser = getMandatedTests(userAge, userGender);

  const ageTiers = [
    {
      tier: "20+",
      minAge: 20,
      title: "Age 20+ Baseline Screening",
      mandates: ["Vital Signs Baseline", "BMI & Obesity Checks", "Lifestyle Risk Audit"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "30+",
      minAge: 30,
      title: "Age 30+ Anemia & Hypertension",
      mandates: ["Hemoglobin / Anemia Profile", "BP Baseline Screening (Hypertension)", "Blood Glucose / Glucometer (Diabetes)", "Oral Visual Examination OVE (Oral Cancer)"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "40+",
      minAge: 40,
      title: "Age 40+ Cardiac & Lipid Profile",
      mandates: ["Lipid Profile (Cholesterol / Triglycerides)", "Cardiac ECG Baseline", "Renal Function Pre-panel"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "50+",
      minAge: 50,
      title: "Age 50+ Glucose & Stress Panels",
      mandates: ["Fasting / PP Blood Glucose", "HbA1c Glycated Hemoglobin", "Cardiac Stress Panel"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "60+",
      minAge: 60,
      title: "Age 60+ Metabolic & Bone Scans",
      mandates: ["Full Metabolic Panel", "DEXA Bone Density Scan", "Vision & Hearing Screening"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "70+",
      minAge: 70,
      title: "Age 70+ Cognitive & Holistic Tracking",
      mandates: ["Cognitive Function Tracking", "Fall Risk & Balance Audit", "Comprehensive Geriatric Screening"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
  ];

  return (
    <div className="age-checklist-page">
      {/* HIGHLIGHT BANNER FOR REGISTERED USER */}
      <section className="panel" style={{ background: "linear-gradient(135deg, #0b1727 0%, #0f243e 100%)", color: "#ffffff", border: "1px solid #38bdf8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="section-label" style={{ color: "#38bdf8" }}>REGISTERED USER MANDATED SUGGESTIONS</div>
            <h2 style={{ margin: "4px 0", color: "#ffffff" }}>
              Suggested Mandatory Tests for {user.name} ({userAge} yrs, {userGender})
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#94a3b8" }}>
              Based on your registered age (<strong>{userAge} years</strong>) and gender (<strong>{userGender}</strong>), the Government of India NPCDCS framework mandates the following tests:
            </p>
          </div>
          <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid #38bdf8", padding: "8px 16px", borderRadius: "10px", color: "#38bdf8", fontWeight: 700, fontSize: "13px" }}>
            {mandatedForUser.length} Mandatory Tests Due
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginTop: "20px" }}>
          {mandatedForUser.map((item, idx) => (
            <div key={idx} style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "14px", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>{item.screening}</span>
                <span style={{ background: "#0284c7", color: "#ffffff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{item.frequency}</span>
              </div>
              <strong style={{ fontSize: "14px", color: "#ffffff", display: "block" }}>{item.testMethod}</strong>
              <span style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px", display: "block" }}>Age Category: {item.ageGroup}</span>
            </div>
          ))}
        </div>
      </section>

      {/* OFFICIAL GOVERNMENT TABLES MATRIX */}
      <section className="panel" style={{ marginTop: "24px" }}>
        <div className="panel-header">
          <div>
            <div className="section-label">GOVERNMENT OF INDIA NCD SCREENING MATRIX</div>
            <h2>Mandated Screening Table by Age & Gender</h2>
            <p className="muted">
              Official GoI Population-based NCD Screening Guidelines (NPCDCS).
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className={`secondary-button ${activeGenderTab === "Female" ? "primary-button" : ""}`}
              onClick={() => setActiveGenderTab("Female")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              👩 FEMALE GUIDELINES
            </button>

            <button
              className={`secondary-button ${activeGenderTab === "Male" ? "primary-button" : ""}`}
              onClick={() => setActiveGenderTab("Male")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              👨 MALE GUIDELINES
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Age Group</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Screening</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Test / Method</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Frequency</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Mandate Status</th>
              </tr>
            </thead>
            <tbody>
              {GOI_NCD_GUIDELINES[activeGenderTab].map((row, idx) => {
                const isMatchingUserAge =
                  (userAge < 30 && row.ageGroup === "<30") ||
                  (userAge >= 30 && userAge <= 65 && row.ageGroup === "30–65") ||
                  (userAge > 65 && row.ageGroup === ">65");

                const isCurrentGenderMatch = userGender.toLowerCase().includes(activeGenderTab.toLowerCase());

                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      background: isMatchingUserAge && isCurrentGenderMatch ? "#f0f9ff" : "transparent",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: isMatchingUserAge ? 700 : 500, color: isMatchingUserAge ? "#0284c7" : "#0f172a" }}>
                      {row.ageGroup}
                      {isMatchingUserAge && isCurrentGenderMatch && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", background: "#0284c7", color: "#ffffff", padding: "2px 6px", borderRadius: "4px" }}>
                          YOUR AGE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{row.screening}</td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      <strong>{row.testMethod}</strong>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{row.frequency}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: row.status.includes("Mandatory") ? "#dcfce7" : "#f1f5f9",
                          color: row.status.includes("Mandatory") ? "#15803d" : "#475569",
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
