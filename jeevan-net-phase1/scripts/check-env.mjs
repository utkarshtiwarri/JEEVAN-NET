// Temporary: verify the anon key belongs to the project named in the URL.
// Prints no secret values. Deleted after use.
import { readFileSync } from "node:fs";

const text = readFileSync(".env", "utf8");
const get = (key) => {
  const m = text.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};

const url = get("VITE_SUPABASE_URL");
const key = get("VITE_SUPABASE_ANON_KEY") || get("VITE_SUPABASE_PUBLISHABLE_KEY");

if (!url || !key) {
  console.log("missing url or key");
  process.exit(1);
}

const host = new URL(url).host;
const projectRef = host.split(".")[0];

let keyRef = null;
let role = null;
if (key.startsWith("eyJ")) {
  const payload = key.split(".")[1];
  try {
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    keyRef = json.ref || null;
    role = json.role || null;
  } catch {
    /* not a JWT */
  }
}

console.log("url host            :", host);
console.log("project ref in URL  :", projectRef);
console.log("key role            :", role || "(n/a)");
console.log("project ref in key  :", keyRef || "(not a JWT — likely a new sb_ key)");
console.log("MATCH               :", keyRef ? keyRef === projectRef : "unknown (non-JWT key)");
console.log("role is safe (anon) :", role ? role === "anon" : "unknown");
