import React, { useState, useEffect } from "react";

export function FacilityCard({ facility, selected, onSelect }) {
  return (
    <div className={`facility-card ${selected ? "selected" : ""}`}>
      <div className="facility-card-header">
        <div>
          <strong>{facility.name}</strong>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            <span className={facility.sector === "Govt" ? "sector-badge-govt" : "sector-badge-private"}>
              {facility.sector}
            </span>{" "}
            • {facility.type}
          </span>
        </div>
        <div className="facility-card-match">
          <strong>{facility.match}%</strong>
          <span>MATCH</span>
        </div>
      </div>

      <div className="facility-card-info">
        <span>📍 {facility.distance} ({facility.rangeCategory})</span>
        <span>⏱ ETA {facility.eta} min</span>
        <span>🛏 {facility.beds} beds free</span>
        <span>⭐ {facility.rating} rating</span>
      </div>

      <button className="secondary-button" onClick={onSelect} style={{ marginTop: "10px", width: "100%" }}>
        {selected ? "✓ Facility Selected" : "Select Facility"}
      </button>
    </div>
  );
}
