// Temporary: exercise the Supabase auth logic (src/lib/auth.js) against the
// stub client. Deleted after use.
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { unlinkSync } from "node:fs";

const OUT = "./.tmp-auth-test.mjs";

await build({
  entryPoints: [".tmp-auth-entry.mjs"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: OUT,
  alias: { "@supabase/supabase-js": "./.tmp-sb-stub.mjs" },
  define: {
    // supabase.js reads the whole import.meta.env object, so define that.
    "import.meta.env":
      '{"VITE_SUPABASE_URL":"https://testref.supabase.co","VITE_SUPABASE_ANON_KEY":"eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.sig"}',
  },
  logLevel: "silent",
});

await import(`${pathToFileURL(OUT).href}?t=${Date.now()}`);
unlinkSync(OUT);
