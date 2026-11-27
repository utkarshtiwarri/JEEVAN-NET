import dataset from "../data/facilities-osm.json" with { type: "json" };

// Facility matching over REAL data, from any origin.
//
// The dataset holds 129 facilities within 6 km of Connaught Place (OpenStreetMap).
// Distances are no longer baked in: they are recomputed from whatever origin the
// caller supplies, so the locator works from the patient's actual position rather
// than a hardcoded point. See data/facilities-osm.json for the provenance block,
// which records exactly which fields the source does and does not publish.
//
// THE HONEST LIMIT: OSM publishes name, kind, coordinates, and occasionally a
// sector or an emergency tag. It does not publish beds, staffing, equipment or
// ratings. So this ranks facilities by proximity and published capability, NOT by
// verified clinical suitability. A "match" below means "best supported by
// available data", not "will be able to treat this patient".

export const FACILITY_SOURCE = dataset._provenance;

export const DEFAULT_ORIGIN = FACILITY_SOURCE.origin;
export const EARTH_RADIUS_KM = 6371;

// Assumed average urban ambulance speed, used to derive ETA from distance. This
// is an estimate, not a measurement: 20 km/h is a rough Delhi-traffic figure.
const ASSUMED_KM_PER_MIN = 20 / 60;

export function estimateEtaMinutes(distanceKm) {
  return Math.max(1, Math.round(distanceKm / ASSUMED_KM_PER_MIN));
}

/** Great-circle distance in km between two {lat, lon} points. */
export function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Which concentric band a distance falls in. */
export function bandOf(distanceKm) {
  if (distanceKm <= 3) return "1-3km";
  if (distanceKm <= 5) return "3-5km";
  return "5-6km";
}

// Signal weights differ by urgency: for a HIGH-risk patient, whether a facility
// takes emergencies matters as much as proximity; for a routine case distance
// dominates.
const WEIGHTS = {
  HIGH: { proximity: 0.5, emergency: 0.3, kind: 0.15, contact: 0.05 },
  OTHER: { proximity: 0.65, emergency: 0.05, kind: 0.25, contact: 0.05 },
};

const KIND_SCORE = { Hospital: 1, Clinic: 0.6 };

// An unknown emergency capability is NOT scored as neutral. Treating "we do not
// know" as "available" would let an unpublished clinic outrank a hospital that
// declares emergency services; treating it as "not available" would be
// pessimistic. It sits between the two, and is flagged as unpublished.
const EMERGENCY_SCORE = { true: 1, false: 0.1, unknown: 0.35 };

function signalsFor(facility, riskLevel) {
  const weights = riskLevel === "HIGH" ? WEIGHTS.HIGH : WEIGHTS.OTHER;
  const published = facility.emergencyDeclared !== null && facility.emergencyDeclared !== undefined;
  const signals = [];

  // Distance is computed from published coordinates, so it is always real.
  // Linear falloff to zero at the edge of the 6 km search radius.
  signals.push({
    key: "proximity",
    weight: weights.proximity,
    value: Math.max(0, 1 - facility.distanceKm / 6),
    published: true,
    detail: `${facility.distanceKm} km away`,
  });

  signals.push({
    key: "emergency",
    weight: weights.emergency,
    value: published ? EMERGENCY_SCORE[String(facility.emergencyDeclared)] : EMERGENCY_SCORE.unknown,
    published,
    detail: published
      ? facility.emergencyDeclared
        ? "declares emergency services"
        : "declares no emergency services"
      : "emergency capability not published — scored conservatively",
  });

  if (KIND_SCORE[facility.kind] !== undefined) {
    signals.push({
      key: "kind",
      weight: weights.kind,
      value: KIND_SCORE[facility.kind],
      published: true,
      detail: facility.kind,
    });
  }

  const reachable = Boolean(facility.phone || facility.website);
  signals.push({
    key: "contact",
    weight: weights.contact,
    value: reachable ? 1 : 0.4,
    published: reachable,
    detail: reachable ? "contact details published" : "no contact details published",
  });

  return signals;
}

export function calculateFacilityMatch(facility, riskLevel) {
  const signals = signalsFor(facility, riskLevel);
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const weighted = signals.reduce((sum, s) => sum + s.weight * s.value, 0);
  const publishedWeight = signals
    .filter((s) => s.published)
    .reduce((sum, s) => sum + s.weight, 0);

  return {
    // 0-99 keeps the existing UI contract (it appends a % sign).
    match: Math.min(99, Math.round((weighted / totalWeight) * 99)),
    // Fraction of the weighted evidence that came from published data rather than
    // a conservative assumption. A high match at low coverage is a weaker claim.
    coverage: Math.round((publishedWeight / totalWeight) * 100),
    evidence: signals.map((s) => ({ key: s.key, published: s.published, detail: s.detail })),
    unknown: [
      signals.find((s) => s.key === "emergency")?.published ? null : "emergency capability",
      "bed availability",
      "specialist availability",
      "diagnostic equipment",
    ].filter(Boolean),
  };
}

/**
 * Rank facilities around an origin.
 *
 * @param {string} riskLevel  "HIGH" | "MODERATE" | "LOW"
 * @param {string} rangeFilter  "ALL" or "1-3km" | "3-5km" | "5-6km"
 * @param {{lat:number, lon:number}} origin  defaults to the dataset's own origin
 * @returns {Array} ranked facilities, each with a recomputed distanceKm and band
 */
export function getFacilityMatches(riskLevel, rangeFilter = "ALL", origin = DEFAULT_ORIGIN) {
  const withDistance = dataset.facilities
    .map((facility) => {
      const km = haversineKm(origin, { lat: facility.lat, lon: facility.lon });
      return {
        ...facility,
        distanceKm: Number(km.toFixed(2)),
        rangeCategory: bandOf(km),
      };
    })
    // The bundled dataset is a 6 km slice of Delhi. If the patient is elsewhere,
    // showing them Delhi hospitals would be worse than showing nothing.
    .filter((f) => f.distanceKm <= 6)
    .map((facility) => ({
      ...facility,
      etaMinutes: estimateEtaMinutes(facility.distanceKm),
      ...calculateFacilityMatch(facility, riskLevel),
    }));

  const filtered =
    rangeFilter === "ALL"
      ? withDistance
      : withDistance.filter((f) => f.rangeCategory === rangeFilter);

  return filtered.sort((a, b) => b.match - a.match || a.distanceKm - b.distanceKm);
}

/** The full dataset, for consumers that need every facility. */
export const facilitiesDatabase = dataset.facilities;
