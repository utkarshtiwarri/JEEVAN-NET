import React from "react";

// One facility row. Renders only fields the data source actually publishes —
// where a value is missing it says so rather than showing a plausible number.
//
// The previous version showed "🛏 12 beds free" and "⭐ 4.8 rating" for every
// facility. Neither exists in the source: bed counts and ratings were invented
// per hospital in the old hand-written fixture.
export function FacilityCard({ facility, selected, onSelect }) {
  const sectorClass =
    facility.sector === "Govt"
      ? "sector-badge-govt"
      : facility.sector === "Private"
        ? "sector-badge-private"
        : null;

  return (
    <div className={`facility-card ${selected ? "selected" : ""}`}>
      <div className="facility-card-header">
        <div>
          <strong>{facility.name}</strong>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {facility.sector ? (
              <span className={sectorClass}>{facility.sector}</span>
            ) : (
              <span className="sector-badge-unknown" title="Ownership not published in the source">
                Sector not published
              </span>
            )}{" "}
            • {facility.kind || "Facility"}
          </span>
        </div>
        <div className="facility-card-match">
          <strong>{facility.match}%</strong>
          <span>MATCH*</span>
        </div>
      </div>

      <div className="facility-card-info">
        <span>📍 {facility.distanceKm} km ({facility.rangeCategory})</span>
        <span>⏱ ETA ~{facility.etaMinutes} min</span>
        <span>
          {facility.emergencyDeclared === true
            ? "🚑 Declares emergency services"
            : facility.emergencyDeclared === false
              ? "No emergency services"
              : "🚑 No published emergency data"}
        </span>
        <span>
          {facility.coverage}% of matching evidence available
        </span>
      </div>

      {facility.address && (
        <div className="facility-card-info" style={{ marginTop: "4px" }}>
          <span>{facility.address}</span>
        </div>
      )}

      <button
        className="secondary-button"
        onClick={onSelect}
        style={{ marginTop: "10px", width: "100%" }}
      >
        {selected ? "✓ Facility Selected" : "Select Facility"}
      </button>
    </div>
  );
}
