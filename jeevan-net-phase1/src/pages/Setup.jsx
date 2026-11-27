import React from "react";
import { DbSetupNotice } from "../components/DbSetupNotice.jsx";

// A read-only page answering "is this deployment wired up correctly?".
//
// Every problem hit during this project's setup was a missing table, column or
// policy that surfaced as an opaque database error. This page removes the
// guesswork: it probes the schema and says what is there.
export function Setup({ onNavigate }) {
  return (
    <div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">SYSTEM CHECK</div>
            <h2>Setup status</h2>
            <p className="muted">
              What the app needs from Supabase, and whether it is there. Read-only — this page
              never writes anything.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <DbSetupNotice />
        </div>
      </section>

      <section className="panel" style={{ marginTop: "18px" }}>
        <div className="section-label">WHAT EACH PIECE IS FOR</div>
        <div className="record-details">
          <div className="record-item">
            <span>profiles</span>
            <strong>Your own account details — name, age, gender, phone, ABHA id</strong>
          </div>
          <div className="record-item">
            <span>patients</span>
            <strong>The register: other people you record under your login</strong>
          </div>
          <div className="record-item">
            <span>assessments</span>
            <strong>One row per triage run, optionally filed against a patient</strong>
          </div>
          <div className="record-item">
            <span>row-level security</span>
            <strong>Scopes every row to its owner, so one account cannot read another&rsquo;s</strong>
          </div>
        </div>

        <p className="muted" style={{ marginTop: "14px", fontSize: "12px" }}>
          The check confirms that tables and columns exist. It cannot list policies, because
          row-level security hides them from the browser key — so a passing check means the shape
          is right, not that every rule is enforced.
        </p>
      </section>

      <section className="panel" style={{ marginTop: "18px" }}>
        <div className="section-label">SERVICES</div>
        <div className="record-details">
          <div className="record-item">
            <span>Scoring API</span>
            <strong>Optional. Without it, triage falls back to the local rule engine.</strong>
          </div>
          <div className="record-item">
            <span>Facility data</span>
            <strong>129 OpenStreetMap facilities, bundled — no network needed</strong>
          </div>
          <div className="record-item">
            <span>Email</span>
            <strong>Not required. Sign-in is email + password only.</strong>
          </div>
        </div>

        {onNavigate && (
          <button
            className="secondary-button"
            style={{ marginTop: "16px" }}
            onClick={() => onNavigate("Home")}
          >
            Back to home
          </button>
        )}
      </section>
    </div>
  );
}
