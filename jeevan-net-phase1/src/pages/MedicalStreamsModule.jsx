import React, { useState, useEffect } from "react";
import { Emergency } from "./Emergency.jsx";

export function MedicalStreamsModule() {
  return (
    <div className="streams-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CLINICAL STREAMS & EXPENSE MINIMIZATION</div>
            <h2>Integrated Medical Streams (Allopathy, Ayush & Homeopathy)</h2>
            <p className="muted">
              Minimizes patient out-of-pocket expenses by safely mapping cases to specific clinical streams.
            </p>
          </div>
        </div>

        <div className="medical-streams-progress">
          <div className="stream-bar-allopathy" style={{ width: "55%" }}>
            Allopathy (55%)
          </div>
          <div className="stream-bar-ayurveda" style={{ width: "30%" }}>
            Ayurvedic (30%)
          </div>
          <div className="stream-bar-homeopathy" style={{ width: "15%" }}>
            Homeopathy (15%)
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "20px" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#1d4ed8" }}>Allopathy Stream (55%)</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#1e40af" }}>
              <strong>90% Emergency & Acute allocation</strong>. Mandatory for acute cardiac, stroke, and trauma triage.
            </p>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#15803d" }}>Ayurvedic Stream (30%)</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
              <strong>50% Long-Term / Chronic care allocation</strong>. Specialized for metabolic maintenance & diabetes management.
            </p>
          </div>

          <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#a16207" }}>Homeopathy Stream (15%)</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#854d0e" }}>
              <strong>30% Supportive Wellness allocation</strong>. Non-invasive complementary wellness support.
            </p>
          </div>
        </div>

        {/* ONDC / GENERIC MEDICINE DRUG COST SAVINGS WIDGET */}
        <div className="ondc-savings-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>
                ONDC & JAN AUSHADHI GENERIC DRUG COMPARATOR
              </div>
              <h3 style={{ margin: "4px 0", color: "#0f172a" }}>Illustrative generic-vs-branded cost comparison</h3>
            </div>
            <div style={{ background: "#16a34a", color: "white", padding: "6px 12px", borderRadius: "20px", fontWeight: 700, fontSize: "13px" }}>
              40% Out-of-Pocket Savings
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Branded Diabetes Drug (Januvia Sitagliptin)</div>
              <strong style={{ fontSize: "16px", color: "#dc2626" }}>₹ 350 / strip</strong>
            </div>

            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #86efac" }}>
              <div style={{ fontSize: "12px", color: "#16a34a" }}>Generic Jan Aushadhi Sitagliptin (ONDC Network)</div>
              <strong style={{ fontSize: "16px", color: "#16a34a" }}>₹ 45 / strip (87% less)</strong>
            </div>
          </div>

          <p className="muted" style={{ marginTop: "12px" }}>
            Prices are illustrative placeholders for the demo, not live ONDC or Jan Aushadhi quotes.
          </p>
        </div>
      </section>
    </div>
  );
}
