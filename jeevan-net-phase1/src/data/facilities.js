import dataset from "./facilities-osm.json" with { type: "json" };
import { Emergency } from "../pages/Emergency.jsx";

// Real facility data, imported from OpenStreetMap and committed as generated JSON.
//
// Refresh it with:  node scripts/fetch-facilities.mjs
//
// The previous `facilitiesDatabase` in this file was six hand-written hospitals
// with invented bed counts, ratings, ETAs and capability scores. Those numbers are
// gone: this module now carries what the source actually publishes (name, kind,
// coordinates, a real distance from a fixed origin, and occasionally a sector or
// an emergency tag) and nothing else. See `_provenance` in the JSON for the field
// coverage, and `lib/scoring.js` for how the missing pieces are handled.
//
// Licence: OpenStreetMap contributors, ODbL 1.0. Attribution is required and is
// shown on the facility screen.

export const FACILITY_PROVENANCE = dataset._provenance;
export const FACILITY_COUNTS = dataset.counts;

export const facilitiesDatabase = dataset.facilities;

export const LOW_RISK_FALLBACK =
  facilitiesDatabase.find((f) => f.kind === "Hospital") || facilitiesDatabase[0];

// Sentinel import for the project's word-scanning import check: this file names
// the "Emergency" screen, and that checker reports the bare word as an unresolved
// symbol. Same convention as before this file carried real data.
export const __emergencyScreen = Emergency;
