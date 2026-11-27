// Temporary: rename NEXT_PUBLIC_SUPABASE_URL -> VITE_SUPABASE_URL in .env,
// preserving the value exactly. Vite only exposes VITE_-prefixed variables, so
// the existing name kept the URL invisible to the app. Prints no secret.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const FILE = ".env";
const original = readFileSync(FILE, "utf8");

if (/^VITE_SUPABASE_URL\s*=/m.test(original)) {
  console.log("already correct — no change needed");
  process.exit(0);
}
if (!/^NEXT_PUBLIC_SUPABASE_URL\s*=/m.test(original)) {
  console.log("NEXT_PUBLIC_SUPABASE_URL not found — nothing renamed");
  process.exit(0);
}

copyFileSync(FILE, ".env.bak");
const updated = original.replace(/^NEXT_PUBLIC_SUPABASE_URL(\s*=)/m, "VITE_SUPABASE_URL$1");
writeFileSync(FILE, updated);

const stillHasOld = /^NEXT_PUBLIC_SUPABASE_URL\s*=/m.test(updated);
const nowHasNew = /^VITE_SUPABASE_URL\s*=/m.test(updated);
console.log(`renamed: ${!stillHasOld && nowHasNew} (backup written to .env.bak)`);
console.log(`value length preserved: ${original.length === updated.length}`);
