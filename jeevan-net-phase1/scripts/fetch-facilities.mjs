// Fetch a real healthcare-facility dataset from OpenStreetMap.
//
//   node scripts/fetch-facilities.mjs
//
// Writes src/data/facilities-osm.json. Re-run it to refresh; it is a one-way
// import and never touches the curated demo fixture in data/facilities.js.
//
// WHY THIS EXISTS
// The original `facilitiesDatabase` was hand-written: every bed count, rating,
// ETA and capability score in it was invented. This script replaces the *list of
// facilities* with real ones and computes the one thing OSM genuinely supports —
// distance from a fixed origin. It does NOT invent the rest.
//
// WHAT OSM ACTUALLY GIVES US (measured over a 6 km radius of Connaught Place)
//   name          ~98% of facilities
//   healthcare    ~70%
//   emergency     ~2%      <- almost never published
//   beds          0%       <- never published
//   operator:type 0%       <- never published
//   phone/website ~5%
//
// So this file carries name, kind, coordinates and a real distance. Anything the
// source does not have is left null rather than filled with a plausible number.
// `docs/limitations.md` records the consequence for the matching score.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "src", "data", "facilities-osm.json");

// The origin is a fixed point because the app has no geolocation. Connaught
// Place, New Delhi — chosen because the app's concentric bands are 1–6 km and
// this puts a realistic number of facilities inside each ring.
const ORIGIN = { name: "Connaught Place, New Delhi", lat: 28.6315, lon: 77.2167 };
const RADIUS_M = 6000;

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const QUERY = `
[out:json][timeout:40];
(
  node["amenity"~"^(hospital|clinic)$"](around:${RADIUS_M},${ORIGIN.lat},${ORIGIN.lon});
  way["amenity"~"^(hospital|clinic)$"](around:${RADIUS_M},${ORIGIN.lat},${ORIGIN.lon});
);
out tags center;
`;

async function fetchOverpass() {
  let lastError;
  for (const url of MIRRORS) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      process.stdout.write(`  ${url} (attempt ${attempt}) ... `);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "JEEVAN-NET-research-prototype/0.1 (facility import, one-off)",
          },
          body: "data=" + encodeURIComponent(QUERY),
          signal: AbortSignal.timeout(60000),
        });
        if (!res.ok) {
          console.log(`HTTP ${res.status}`);
          lastError = new Error(`${url} returned ${res.status}`);
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        const json = await res.json();
        console.log(`OK - ${json.elements?.length ?? 0} elements`);
        return json;
      } catch (e) {
        console.log(`${e.name}`);
        lastError = e;
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }
  throw lastError ?? new Error("all mirrors failed");
}

// Haversine, in kilometres.
function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

// Only claims the source supports. No defaults, no guesses.
function sectorOf(tags) {
  const operator = `${tags.operator || ""} ${tags["operator:type"] || ""} ${tags.name || ""}`.toLowerCase();
  if (/govt|government|municipal|state|central|railway|esic|cgHS|dda|mcd|public hospital/i.test(operator)) {
    return "Govt";
  }
  if (/private|trust|society|ngo|charitable/i.test(operator)) return "Private";
  return null;
}

function kindOf(tags) {
  if (tags.amenity === "hospital") return "Hospital";
  if (tags.amenity === "clinic") return "Clinic";
  return null;
}

function bandOf(km) {
  if (km <= 3) return "1-3km";
  if (km <= 5) return "3-5km";
  return "5-6km";
}

const raw = await fetchOverpass();
const elements = raw.elements || [];
console.log(`\nNormalising ${elements.length} elements...`);

const seen = new Set();
const facilities = [];

for (const el of elements) {
  const tags = el.tags || {};
  const name = (tags.name || tags["name:en"] || "").trim();
  if (!name) continue; // an unnamed pin is not a facility a patient can be routed to

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") continue;

  const km = distanceKm(ORIGIN, { lat, lon });
  if (km > RADIUS_M / 1000) continue;

  const id = slug(`${name}-${el.id}`);
  if (seen.has(id)) continue;
  seen.add(id);

  facilities.push({
    id,
    name,
    kind: kindOf(tags),
    sector: sectorOf(tags),
    emergencyDeclared: tags.emergency === "yes" ? true : tags.emergency === "no" ? false : null,
    healthcare: tags.healthcare || null,
    phone: tags.phone || tags["contact:phone"] || null,
    website: tags.website || tags["contact:website"] || null,
    address: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || null,
    lat: Number(lat.toFixed(5)),
    lon: Number(lon.toFixed(5)),
    distanceKm: Number(km.toFixed(2)),
    rangeCategory: bandOf(km),
    osm: `${el.type}/${el.id}`,
  });
}

facilities.sort((a, b) => a.distanceKm - b.distanceKm);

const byBand = facilities.reduce((acc, f) => {
  acc[f.rangeCategory] = (acc[f.rangeCategory] || 0) + 1;
  return acc;
}, {});

const payload = {
  _provenance: {
    source: "OpenStreetMap via the Overpass API",
    sourceUrl: "https://overpass-api.de/api/interpreter",
    query: `amenity in (hospital, clinic) within ${RADIUS_M} m of ${ORIGIN.name}`,
    origin: ORIGIN,
    radiusMetres: RADIUS_M,
    fetchedAt: new Date().toISOString(),
    licence: "OpenStreetMap contributors, ODbL 1.0 — attribution required",
    regeneratedBy: "node scripts/fetch-facilities.mjs",
    fieldsNotInSource: [
      "beds / totalBeds — OSM does not publish these for this area",
      "rating — not an OSM concept",
      "capabilityScore / capacityScore / specialistScore / diagnosticsScore — derived",
      "eta — estimated from distance, not measured",
    ],
  },
  counts: {
    total: facilities.length,
    byBand,
    withKind: facilities.filter((f) => f.kind).length,
    withEmergencyDeclared: facilities.filter((f) => f.emergencyDeclared !== null).length,
    withSector: facilities.filter((f) => f.sector).length,
  },
  facilities,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`\nwrote ${OUT}`);
console.log(`  facilities       : ${facilities.length}`);
console.log(`  within 1-3 km    : ${byBand["1-3km"] || 0}`);
console.log(`  within 3-5 km    : ${byBand["3-5km"] || 0}`);
console.log(`  within 5-6 km    : ${byBand["5-6km"] || 0}`);
console.log(`  kind published   : ${payload.counts.withKind}/${facilities.length}`);
console.log(`  emergency tag    : ${payload.counts.withEmergencyDeclared}/${facilities.length}`);
console.log(`  sector published : ${payload.counts.withSector}/${facilities.length}`);
console.log("\nlicence: OpenStreetMap contributors, ODbL 1.0 — attribution required in the UI.");
