import React, { useState, useEffect } from "react";
import { IconMapPin } from "../Icons.jsx";
import { facilitiesDatabase } from "../data/facilities.js";
import { getFacilityMatches } from "../lib/scoring.js";
import { FacilityCard } from "./FacilityCard.jsx";
import { Emergency } from "./Emergency.jsx";

export function FacilityMatching({ assessmentData, selectedFacility, setSelectedFacility, onBackToAssessment, onOpenEmergency }) {
  const [rangeFilter, setRangeFilter] = useState("ALL");

  const riskLevel = assessmentData?.result?.risk_level || "HIGH";
  const rankedFacilities = getFacilityMatches(riskLevel, rangeFilter);
  const recommended = rankedFacilities[0] || facilitiesDatabase[0];

  return (
    <div className="facility-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CONCENTRIC GEOSPATIAL LOCATOR METRIC</div>
            <h2>Healthcare Facilities Lookup</h2>
            <p className="muted">
              Lookup facilities by concentric radius ranges with real-time bed availability and ratings.
            </p>
          </div>
          <div className="demo-badge">CONCENTRIC RADIAL LOOKUP</div>
        </div>

        {/* RADIUS RANGE SELECTOR TABS */}
        <div className="concentric-range-bar">
          <button
            className={`range-tab-btn ${rangeFilter === "ALL" ? "active" : ""}`}
            onClick={() => setRangeFilter("ALL")}
          >
            <IconMapPin size={15} /> All Ranges (1-6 km)
          </button>

          <button
            className={`range-tab-btn ${rangeFilter === "1-3km" ? "active" : ""}`}
            onClick={() => setRangeFilter("1-3km")}
          >
            Range 1: Within 1km - 3km
          </button>

          <button
            className={`range-tab-btn ${rangeFilter === "3-5km" ? "active" : ""}`}
            onClick={() => setRangeFilter("3-5km")}
          >
            Range 2: Within 3km - 5km
          </button>

          <button
            className={`range-tab-btn ${rangeFilter === "5-6km" ? "active" : ""}`}
            onClick={() => setRangeFilter("5-6km")}
          >
            Range 3: Extended 5km - 6km
          </button>
        </div>
      </section>

      {/* TOP MATCH */}
      {recommended && (
        <section className="panel recommended-facility">
          <div className="recommended-header">
            <div>
              <div className="section-label">TOP CONCENTRIC MATCH</div>
              <h2>{recommended.name}</h2>
              <p className="muted">
                <span className={recommended.sector === "Govt" ? "sector-badge-govt" : "sector-badge-private"}>
                  {recommended.sector}
                </span>{" "}
                • {recommended.type} ({recommended.rangeCategory})
              </p>
            </div>
            <div className="facility-match-score">
              <div>{recommended.match}%</div>
              <span>MATCH</span>
            </div>
          </div>

          <div className="facility-stats">
            <div className="facility-stat">
              <span>Distance</span>
              <strong>{recommended.distance}</strong>
            </div>
            <div className="facility-stat">
              <span>ETA</span>
              <strong>{recommended.eta} min</strong>
            </div>
            <div className="facility-stat">
              <span>Free Beds</span>
              <strong>{recommended.beds} / {recommended.totalBeds}</strong>
            </div>
            <div className="facility-stat">
              <span>Govt / Private Rating</span>
              <strong>⭐ {recommended.rating} / 5.0</strong>
            </div>
          </div>

          <div className="facility-actions">
            <button className="primary-button" onClick={() => setSelectedFacility(recommended)}>
              {selectedFacility?.id === recommended.id ? "✓ Facility Selected" : "Select Facility"}
            </button>
            <button className="secondary-button" onClick={onBackToAssessment}>
              ← Back to Assessment
            </button>
          </div>
        </section>
      )}

      {/* OTHER FACILITIES */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">ALL MATCHED FACILITIES IN RADIUS</div>
            <h3>Government & Private Facilities Matrix</h3>
          </div>
        </div>

        <div className="alternative-list">
          {rankedFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              selected={selectedFacility?.id === facility.id}
              onSelect={() => setSelectedFacility(facility)}
            />
          ))}
        </div>
      </section>

      {selectedFacility && (
        <section className="panel confirmed-panel">
          <div>
            <div className="section-label">DESTINATION CONFIRMED</div>
            <h3>{selectedFacility.name}</h3>
            <p className="muted">Ready to initiate dispatch & pre-alert emergency team.</p>
          </div>
          <button className="primary-button" onClick={onOpenEmergency}>
            Proceed to Emergency Grid →
          </button>
        </section>
      )}
    </div>
  );
}
