// One-off: split src/main.jsx into data/, lib/, components/, pages/, modals/.
// Moves each top-level declaration VERBATIM so nothing is retyped, and works out
// the imports each new module needs. Deleted after it has run successfully.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const SRC = "src";
const file = join(SRC, "main.jsx");
const source = readFileSync(file, "utf8");
const lines = source.split(/\r?\n/);

// ---- where each top-level declaration should live -------------------------
const PLAN = {
  API_URL: "lib/api.js",
  DEMO_ABHA_ID: "data/patients.js",
  defaultUser: "data/patients.js",
  defaultForm: "data/patients.js",
  criticalDemoForm: "data/patients.js",
  DOCTORS_LIST: "data/doctors.js",
  facilitiesDatabase: "data/facilities.js",
  INDIAN_LANGUAGES: "data/languages.js",
  GOI_NCD_GUIDELINES: "data/guidelines.js",
  getMandatedTests: "data/guidelines.js",
  localTriage: "lib/triage.js",
  assessPatient: "lib/api.js",
  calculateFacilityMatch: "lib/scoring.js",
  getFacilityMatches: "lib/scoring.js",
  App: "App.jsx",
  AuthModal: "modals/AuthModal.jsx",
  LiveVideoCallModal: "modals/LiveVideoCallModal.jsx",
  AppointmentBookingModal: "modals/AppointmentBookingModal.jsx",
  Field: "components/Field.jsx",
  Checkbox: "components/Checkbox.jsx",
  RecordItem: "components/RecordItem.jsx",
  Dashboard: "pages/Dashboard.jsx",
  DoctorConsultModule: "pages/DoctorConsultModule.jsx",
  AgeChecklistModule: "pages/AgeChecklistModule.jsx",
  VoiceCompanionView: "pages/VoiceCompanionView.jsx",
  PatientAssessment: "pages/PatientAssessment.jsx",
  Result: "pages/Result.jsx",
  FacilityMatching: "pages/FacilityMatching.jsx",
  FacilityCard: "pages/FacilityCard.jsx",
  MedicalStreamsModule: "pages/MedicalStreamsModule.jsx",
  Emergency: "pages/Emergency.jsx",
  PatientHistory: "pages/PatientHistory.jsx",
};

// ---- symbols grouped by the module that should provide them ---------------
const ICONS = [
  "IconDashboard", "IconAssessment", "IconEmergency", "IconHospital", "IconRecord",
  "IconLogo", "IconBell", "IconSearch", "IconUser", "IconMic", "IconPhone", "IconMail",
  "IconCheck", "IconClock", "IconPill", "IconMapPin", "IconBrain", "IconLock",
  "IconRefresh", "IconSparkles", "IconLogOut", "IconVolume2", "IconShield", "IconVideo",
  "IconCalendar", "IconStethoscope", "IconFileText", "IconCheckCircle",
];

const GROUPS = [
  { module: "Icons.jsx", names: ICONS },
  { module: "data/patients.js", names: ["DEMO_ABHA_ID", "defaultUser", "defaultForm", "criticalDemoForm"] },
  { module: "data/doctors.js", names: ["DOCTORS_LIST"] },
  { module: "data/facilities.js", names: ["facilitiesDatabase"] },
  { module: "data/languages.js", names: ["INDIAN_LANGUAGES"] },
  { module: "data/guidelines.js", names: ["GOI_NCD_GUIDELINES", "getMandatedTests"] },
  { module: "lib/triage.js", names: ["localTriage"] },
  { module: "lib/scoring.js", names: ["calculateFacilityMatch", "getFacilityMatches"] },
  { module: "lib/api.js", names: ["API_URL", "assessPatient"] },
];

// Components that must be imported from their own generated file. Only the
// component/page/modal directories qualify - data and lib symbols are already
// covered by GROUPS and would otherwise be imported twice.
const COMPONENT_EXPORTS = Object.entries(PLAN).reduce((acc, [name, target]) => {
  const isComponentDir =
    target.startsWith("pages/") ||
    target.startsWith("modals/") ||
    target.startsWith("components/");
  if (isComponentDir) acc[name] = target;
  return acc;
}, {});

// ---- locate every top-level declaration ----------------------------------
const declRe = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|^const\s+([A-Za-z_$][\w$]*)\s*=/;
const boundaries = [];
let braceDepth = 0;
let inBlockComment = false;

lines.forEach((line, index) => {
  if (braceDepth === 0 && !inBlockComment) {
    const m = declRe.exec(line);
    if (m) boundaries.push({ name: m[1] || m[2], line: index });
  }
  // Extremely small brace tracker: template literals and strings in this file
  // always carry balanced braces, so a raw count is sufficient here.
  const opens = (line.match(/{/g) || []).length;
  const closes = (line.match(/}/g) || []).length;
  braceDepth += opens - closes;

  if (inBlockComment) {
    if (line.includes("*/")) inBlockComment = false;
  } else {
    const openAt = line.indexOf("/*");
    if (openAt !== -1 && !line.slice(openAt).includes("*/")) inBlockComment = true;
  }
});

if (!boundaries.length) throw new Error("No top-level declarations found");

const unmapped = boundaries.map((b) => b.name).filter((n) => !PLAN[n]);
if (unmapped.length) throw new Error(`Unmapped declarations: ${unmapped.join(", ")}`);

const BANNER = /\r?\n?\/\* ={10,}\r?\n[\s\S]*?\r?\n={10,} \*\/\s*$/;

// ---- slice each declaration's source ------------------------------------
const blocks = new Map();
boundaries.forEach((b, i) => {
  const start = b.line;
  const end = i + 1 < boundaries.length ? boundaries[i + 1].line : lines.length;
  let text = lines.slice(start, end).join("\n");
  while (BANNER.test(text)) text = text.replace(BANNER, "");
  blocks.set(b.name, text.trimEnd());
});

const usedIn = (text, symbol) => new RegExp(`(?<![\\w$])${symbol}(?![\\w$])`).test(text);

function relPath(fromFile, toFile) {
  const fromDir = fromFile.split("/").slice(0, -1);
  const toParts = toFile.split("/");
  let i = 0;
  while (i < fromDir.length && i < toParts.length - 1 && fromDir[i] === toParts[i]) i += 1;
  const up = Array.from({ length: fromDir.length - i }, () => "..");
  const down = toParts.slice(i);
  let p = [...up, ...down].join("/");
  if (!p.startsWith(".")) p = `./${p}`;
  return p;
}

function addExport(text) {
  if (/^async function\s/m.test(text)) return text.replace(/^async function\s/, "export async function ");
  if (/^function\s/m.test(text)) return text.replace(/^function\s/, "export function ");
  if (/^const\s/m.test(text)) return text.replace(/^const\s/, "export const ");
  throw new Error(`Cannot export:\n${text.slice(0, 80)}`);
}

// ---- group declarations by destination file ------------------------------
const byTarget = new Map();
for (const [name, target] of Object.entries(PLAN)) {
  if (!byTarget.has(target)) byTarget.set(target, []);
  byTarget.get(target).push(name);
}

const written = [];

for (const [target, names] of byTarget) {
  const body = names.map((n) => addExport(blocks.get(n))).join("\n\n");
  const isJsx = target.endsWith(".jsx");
  const definedHere = new Set(names);

  // Work out what this file needs from elsewhere.
  const importLines = [];
  if (isJsx) {
    importLines.push(`import React, { useState, useEffect } from "react";`);
  }

  const needed = new Map(); // module -> names[]
  const consider = (module, symbol) => {
    if (definedHere.has(symbol)) return;
    if (!usedIn(body, symbol)) return;
    if (module === target) return;
    if (!needed.has(module)) needed.set(module, []);
    const list = needed.get(module);
    if (!list.includes(symbol)) list.push(symbol);
  };

  for (const group of GROUPS) for (const name of group.names) consider(group.module, name);
  for (const [name, module] of Object.entries(COMPONENT_EXPORTS)) consider(module, name);

  for (const [module, symbols] of needed) {
    importLines.push(`import { ${symbols.join(", ")} } from "${relPath(target, module)}";`);
  }

  const header = importLines.length ? `${importLines.join("\n")}\n\n` : "";
  const outPath = join(SRC, target);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${header}${body}\n`, "utf8");
  written.push(`${target}  <-  ${names.join(", ")}`);
}

// ---- the new entry point -------------------------------------------------
writeFileSync(
  join(SRC, "main.jsx"),
  `import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
`,
  "utf8",
);

console.log(written.sort().join("\n"));
console.log(`\n${written.length} modules written; main.jsx reduced to the entry point.`);
