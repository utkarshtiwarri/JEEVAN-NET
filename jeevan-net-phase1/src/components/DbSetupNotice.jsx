import React, { useState, useEffect } from "react";
import { checkDatabaseSetup } from "../lib/health.js";

// Shows exactly which database pieces are missing, and what to run.
//
// This is the answer to a problem that cost several rounds: every failure was a
// setup step reported as a raw PostgREST error. Rather than repeat "run the SQL"
// in prose, the app probes the schema and lists what is absent.
export function DbSetupNotice({ compact = false }) {
  const [state, setState] = useState({ loading: true, result: null });
  const [open, setOpen] = useState(!compact);

  useEffect(() => {
    let active = true;
    checkDatabaseSetup()
      .then((result) => active && setState({ loading: false, result }))
      .catch((e) =>
        active &&
        setState({
          loading: false,
          result: {
            configured: true,
            ready: false,
            checks: [
              {
                id: "probe",
                label: "Could not probe the database",
                ok: false,
                detail: e.message,
              },
            ],
          },
        }),
      );
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return <p className="muted">Checking the database…</p>;
  }

  const { ready, checks, configured } = state.result;
  const missing = checks.filter((c) => !c.ok);

  if (ready) {
    return (
      <div
        style={{
          border: "1px solid #bbf7d0",
          background: "#f0fdf4",
          borderRadius: "10px",
          padding: "10px 12px",
          fontSize: "12.5px",
          color: "#15803d",
        }}
      >
        ✓ Database ready — all {checks.length} checks passed.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #fde68a",
        background: "#fffbeb",
        borderRadius: "10px",
        padding: "12px 14px",
        fontSize: "12.5px",
        color: "#78350f",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
        <strong>
          Database setup incomplete — {missing.length} of {checks.length} checks failing
        </strong>
        {compact && (
          <button
            type="button"
            className="signin-link"
            style={{ color: "#92400e", whiteSpace: "nowrap" }}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide details" : "Show details"}
          </button>
        )}
      </div>

      {open && (
        <>
          <p style={{ margin: "8px 0 10px", lineHeight: 1.5 }}>
            {configured ? (
              <>
                Open <code>jeevan-net-phase1/supabase/setup.sql</code>, copy <strong>all</strong> of
                it, paste it into the Supabase SQL editor and press Run. Then reload this page.
                Paste the file&rsquo;s contents — pasting its <em>path</em> fails with a syntax error.
              </>
            ) : (
              <>Add the Supabase URL and anon key to your env file, then restart the dev server.</>
            )}
          </p>

          <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.6 }}>
            {checks.map((check) => (
              <li key={check.id}>
                <strong style={{ color: check.ok ? "#15803d" : "#b91c1c" }}>
                  {check.ok ? "✓" : "✗"}
                </strong>{" "}
                {check.label} — {check.detail}
                {check.fix && !check.ok ? ` → ${check.fix}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
