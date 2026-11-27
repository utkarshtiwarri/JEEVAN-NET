// Read-only database probe used by demo/verify-all.mjs.
//
// Confirms the schema the app expects exists, and that row-level security refuses
// anonymous writes. Prints machine-readable lines so the caller can summarise.
//
// Deliberately a real file rather than an inline `node -e` string: shell quoting
// through cmd /C mangles embedded JS (the same trap that breaks `findstr /C:"a b"`
// in this project). A file has no quoting problem.
//
// Exit code 0 always — the caller decides what a failure means.

import { existsSync, readFileSync } from "node:fs";

function loadEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

// .env.local wins over .env, matching Vite's precedence.
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!url || !key) {
  console.log("NO_ENV");
  process.exit(0);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

// Each select names the columns the app actually writes, so this fails if a
// column is missing — not merely if the table is.
const TABLES = [
  ["profiles", "/rest/v1/profiles?select=id,full_name,abha_id&limit=0"],
  ["patients", "/rest/v1/patients?select=id,owner_id,full_name&limit=0"],
  ["assessments", "/rest/v1/assessments?select=id,user_id,patient_id,vitals&limit=0"],
];

let shaped = 0;
for (const [name, path] of TABLES) {
  try {
    const res = await fetch(url + path, { headers, signal: AbortSignal.timeout(15000) });
    if (res.ok) shaped += 1;
    console.log(`SHAPE ${name} ${res.status}`);
  } catch (e) {
    console.log(`SHAPE ${name} ERR ${e.name}`);
  }
}

// RLS: an anonymous insert must be refused. 401/403 means the policy is doing its
// job; 201 would mean the table is open to anyone holding the public key.
//
// Each body must be VALID for its table, or PostgREST rejects the request on
// schema grounds (400) before the policy is ever consulted — which would look
// like a pass while proving nothing. Only a 401/403 demonstrates that RLS is the
// thing refusing it.
const BODIES = {
  profiles: { full_name: "probe", age: 1, gender: "Other", phone: "0", abha_id: "X" },
  patients: { full_name: "probe", age: 1, gender: "Other" },
  assessments: { vitals: {}, symptoms: {}, triage_result: {} },
};

let refused = 0;
for (const name of ["profiles", "patients", "assessments"]) {
  try {
    const res = await fetch(`${url}/rest/v1/${name}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(BODIES[name]),
      signal: AbortSignal.timeout(15000),
    });
    // 401/403 = RLS refused it. Anything else is reported, because a 400 means
    // the probe itself is wrong rather than the database being open.
    if (res.status === 401 || res.status === 403) {
      refused += 1;
      console.log(`RLS ${name} ${res.status} refused`);
    } else {
      console.log(`RLS ${name} ${res.status} NOT-REFUSED`);
    }
  } catch (e) {
    console.log(`RLS ${name} ERR ${e.name}`);
  }
}

console.log(`SUMMARY ${shaped} ${refused}`);
