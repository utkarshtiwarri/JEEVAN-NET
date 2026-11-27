import React, { useState } from "react";
import { facilitiesDatabase, LOW_RISK_FALLBACK } from "../data/facilities.js";
import { estimateEtaMinutes } from "../lib/scoring.js";

export function Emergency({ assessmentData, selectedFacility, onOpenPatientRecord }) {
  const [status, setStatus] = useState("Awaiting Dispatch");
  const facility = selectedFacility || LOW_RISK_FALLBACK || facilitiesDatabase[0];
  const eta = facility.etaMinutes ?? estimateEtaMinutes(facility.distanceKm);

  const dispatch = () => {
    setStatus("Requested");
    setTimeout(() => {
      setStatus("Dispatched");
      setTimeout(() => {
        setStatus("En Route");
        setTimeout(() => {
          setStatus("Arrived at ER");
        }, 3500);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="emergency-page">
      <section className="panel emergency-header-panel">
        <div>
          <div className="section-label">EMERGENCY COORDINATION GRID</div>
          <h2>Oxygen ALS Ambulance Dispatch</h2>
          <p className="muted">
            Destination: <strong>{facility.name}</strong> ({facility.distanceKm} km, ETA ~{eta} mins)
          </p>
        </div>
        <div className="demo-badge">LIVE SIMULATION MODE</div>
      </section>

      <section className="panel dispatch-panel">
        <div className="panel-header">
          <div>
            <div className="section-label">DISPATCH TIMELINE</div>
            <h3>Status: {status}</h3>
          </div>
        </div>

        <div className="dispatch-actions" style={{ marginTop: "16px" }}>
          {status === "Awaiting Dispatch" ? (
            <button className="primary-button" onClick={dispatch}>
              🚑 Dispatch Oxygen ALS Ambulance →
            </button>
          ) : status === "Arrived at ER" ? (
            <button className="primary-button" onClick={onOpenPatientRecord}>
              Open Patient Digital Record →
            </button>
          ) : (
            <div style={{ color: "#0284c7", fontWeight: 600 }}>
              Dispatch En-route... Pre-booking ICU Bed at {facility.name}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
