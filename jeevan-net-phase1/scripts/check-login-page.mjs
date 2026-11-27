// Temporary: confirm the login page renders and that the real .env is picked up
// by Vite. Deleted after use.
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { unlinkSync, readFileSync } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";

// Mirror what Vite injects from .env so the check exercises the real values.
const envText = readFileSync(".env", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const OUT = "./.tmp-login-check.mjs";
await build({
  entryPoints: ["src/pages/Login.jsx"],
  bundle: true,
  format: "esm",
  jsx: "automatic",
  outfile: OUT,
  external: ["react", "react/jsx-runtime"],
  define: { "import.meta.env": JSON.stringify(env) },
  logLevel: "silent",
});

const { Login } = await import(`${pathToFileURL(OUT).href}?t=${Date.now()}`);
const html = renderToString(React.createElement(Login, { onSignIn: () => {} }));

let problems = 0;
const expect = (cond, label) => {
  if (cond) console.log(`  OK   ${label}`);
  else {
    problems += 1;
    console.log(`  FAIL ${label}`);
  }
};

console.log("sign-in view");
for (const t of [
  "Sign in to JEEVAN-NET",
  "Access your healthcare dashboard.",
  "you@example.com",
  "Remember me",
  "Sign In",
  "Create account",
  "Use Demo Account",
  "Continue as guest",
  "Database connected",
]) {
  expect(html.includes(t), `contains: ${t}`);
}
expect(html.includes('role="tablist"'), "tabs exposed as a tablist");
expect(html.includes('aria-selected="true"'), "active tab marked");
expect(html.includes('type="email"'), "email field present");
expect(html.includes('autoComplete="current-password"'), "password autocomplete set");
expect(html.includes("never stored by this app"), "privacy note reflects real storage");

console.log("env detection");
expect(
  !html.includes("Database not connected"),
  "configured env is detected (no 'not connected' banner)",
);
expect(Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY), "both env vars present in .env");

unlinkSync(OUT);
console.log(problems === 0 ? "\nOK - login page renders with the real env." : `\n${problems} problem(s).`);
process.exit(problems === 0 ? 0 : 1);
