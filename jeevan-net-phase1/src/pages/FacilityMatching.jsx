import React, { useState } from "react";
import { IconMapPin, IconLocate } from "../Icons.jsx";
import { getFacilityMatches, FACILITY_SOURCE, DEFAULT_ORIGIN } from "../lib/scoring.js";
import { useLocation } from "../lib/useLocation.js";
import { FacilityCard } from "./FacilityCard.jsx";

// Facilities are ranked from the patient's real position when the browser will
// give it, and from the dataset's origin otherwise. The difference is always
// labelled, because a distance is only meaningful if you know what it is measured
// from.
export function FacilityMatching({ assessmentData, selectedFacility, setSelectedFacility, onBackToAssessment, onOpenEmergency }) {
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const { origin, source, status, error, locate, reset } = useLocation();

  const riskLevel = assessmentData?.result?.risk_level || "HIGH";
  const rankedFacilities = getFacilityMatches(riskLevel, rangeFilter, origin);
  const allInRange = getFacilityMatches(riskLevel, "ALL", origin);
  const recommended = rankedFacilities[0] || null;

  const originLabel =
    source === "device" ? `your location (${origin.lat}, ${origin.lon})` : DEFAULT_ORIGIN.name;

  return (
    <div className="facility-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CONCENTRIC GEOSPATIAL LOCATOR</div>
            <h2>Healthcare Facilities Lookup</h2>
            <p className="muted">
              Ranked from {originLabel}. Distances are computed from published coordinates;
              ETAs are estimated from distance.
            </p>
          </div>
          <div className="demo-badge">OPENSTREETMAP DATA</div>
        </div>

        {/* ORIGIN CONTROL — the distance is only meaningful if it says from where */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
            padding: "10px 12px",
            marginTop: "14px",
            borderRadius: "10px",
            border: "1px solid #e2eaf0",
            background: "#f8fafc",
            fontSize: "12.5px",
            color: "#334155",
          }}
        >
          <strong style={{ color: "#173c53" }}>Measuring from:</strong>
          <span>{originLabel}</span>
          {source === "device" ? (
            <button type="button" className="secondary-button" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={reset}>
              Reset to default
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={locate}
              disabled={status === "locating"}
            >
              <IconLocate size={14} /> {status === "locating" ? "Locating…" : "Use my location"}
            </button>
          )}
        </div>

        {error && (
          <div
            role="status"
            style={{
              marginTop: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#78350f",
              fontSize: "12.5px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

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

      {/* Nothing in range: say so plainly rather than showing an unrelated city */}
      {rankedFacilities.length === 0 ? (
        <section className="panel">
          <div className="section-label">NO FACILITIES IN RANGE</div>
          <h3>
            {allInRange.length === 0
              ? "No facility from this dataset is within 6 km of the origin above."
              : `No facility in the selected band. There are ${allInRange.length} within 6 km — try "All Ranges".`}
          </h3>
          <p className="muted">
            This build bundles {FACILITY_SOURCE.query}. A different region needs its own import:
            <code> node scripts/fetch-facilities.mjs</code>.
          </p>
        </section>
      ) : (
        recommended && (
          <section className="panel recommended-facility">
            <div className="recommended-header">
              <div>
                <div className="section-label">TOP CONCENTRIC MATCH</div>
                <h2>{recommended.name}</h2>
                <p className="muted">
                  <span
                    className={
                      recommended.sector === "Govt"
                        ? "sector-badge-govt"
                        : recommended.sector === "Private"
                          ? "sector-badge-private"
                          : "sector-badge-unknown"
                    }
                  >
                    {recommended.sector || "Sector not published"}
                  </span>{" "}
                  • {recommended.kind || "Facility"} ({recommended.rangeCategory})
                </p>
              </div>
              <div className="facility-match-score">
                <div>{recommended.match}%</div>
                <span>MATCH*</span>
              </div>
            </div>

            <div className="facility-stats">
              <div className="facility-stat">
                <span>Distance</span>
                <strong>{recommended.distanceKm} km</strong>
              </div>
              <div className="facility-stat">
                <span>ETA (estimated)</span>
                <strong>~{recommended.etaMinutes} min</strong>
              </div>
              <div className="facility-stat">
                <span>Declares emergency services</span>
                <strong>
                  {recommended.emergencyDeclared === true
                    ? "Declared"
                    : recommended.emergencyDeclared === false
                      ? "Not offered"
                      : "Not published"}
                </strong>
              </div>
              <div className="facility-stat">
                <span>Matching evidence</span>
                <strong>{recommended.coverage}% available</strong>
              </div>
            </div>

            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                padding: "10px 12px",
                marginTop: "12px",
                fontSize: "12.5px",
                color: "#78350f",
              }}
            >
              <strong>What this ranking does and does not know.</strong> Distance comes from published
              coordinates. Bed counts, staffing, equipment and ratings are not published by the
              source, so they are not shown rather than guessed. A high match means “best supported
              by available data”, not “able to treat this patient”.
              {recommended.unknown.length > 0 && (
                <> Unknown here: {recommended.unknown.join(", ")}.</>
              )}
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
        )
      )}

      {/* OTHER FACILITIES */}
      {rankedFacilities.length > 1 && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="section-label">ALL MATCHED FACILITIES IN RADIUS</div>
              <h3>Government &amp; Private Facilities Matrix</h3>
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

          <p className="muted" style={{ marginTop: "14px", fontSize: "11.5px" }}>
            Facility names, types and coordinates from OpenStreetMap (© OpenStreetMap contributors,
            ODbL 1.0), retrieved {FACILITY_SOURCE.fetchedAt.slice(0, 10)}. Distances are computed
            from published coordinates; ETAs are estimated from distance. Nothing here is a live
            feed, and bed availability is not published in the source.
          </p>
        </section>
      )}

      {selectedFacility && (
        <section className="panel confirmed-panel">
          <div>
            <div className="section-label">DESTINATION CONFIRMED</div>
            <h3>{selectedFacility.name}</h3>
            <p className="muted">Ready to initiate dispatch &amp; pre-alert the receiving team.</p>
          </div>
          <button className="primary-button" onClick={onOpenEmergency}>
            Proceed to dispatch →
          </button>
        </section>
      )}
    </div>
  );
}
