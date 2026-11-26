import { facilitiesDatabase } from "../data/facilities.js";

export function calculateFacilityMatch(facility, riskLevel) {
  let score =
    facility.capabilityScore * 0.3 +
    facility.capacityScore * 0.25 +
    facility.etaScore * 0.2 +
    facility.specialistScore * 0.15 +
    facility.diagnosticsScore * 0.1;

  if (riskLevel === "HIGH") {
    if (facility.icu) score += 1;
    if (facility.emergency) score += 1;
  }
  return Math.min(99, Math.round(score));
}

export function getFacilityMatches(riskLevel, rangeFilter = "ALL") {
  let list = facilitiesDatabase;
  if (rangeFilter !== "ALL") {
    list = facilitiesDatabase.filter((f) => f.rangeCategory === rangeFilter);
  }
  return list
    .map((facility) => ({
      ...facility,
      match: calculateFacilityMatch(facility, riskLevel),
    }))
    .sort((a, b) => b.match - a.match);
}
