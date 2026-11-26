// One-off guard: confirm every cross-module symbol referenced by a generated
// file is either imported or defined locally. Vite's build does not catch an
// undefined variable, so this stands in for the runtime error it would cause.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const SYMBOLS = [
  // icons
  "IconDashboard", "IconAssessment", "IconEmergency", "IconHospital", "IconRecord",
  "IconLogo", "IconBell", "IconSearch", "IconUser", "IconMic", "IconPhone", "IconMail",
  "IconCheck", "IconClock", "IconPill", "IconMapPin", "IconBrain", "IconLock",
  "IconRefresh", "IconSparkles", "IconLogOut", "IconVolume2", "IconShield", "IconVideo",
  "IconCalendar", "IconStethoscope", "IconFileText", "IconCheckCircle",
  // data + lib
  "API_URL", "DEMO_ABHA_ID", "defaultUser", "defaultForm", "criticalDemoForm",
  "DOCTORS_LIST", "facilitiesDatabase", "INDIAN_LANGUAGES", "GOI_NCD_GUIDELINES",
  "getMandatedTests", "localTriage", "assessPatient", "calculateFacilityMatch",
  "getFacilityMatches",
  // components + pages
  "App", "AuthModal", "LiveVideoCallModal", "AppointmentBookingModal", "Field",
  "Checkbox", "RecordItem", "Dashboard", "DoctorConsultModule", "AgeChecklistModule",
  "VoiceCompanionView", "PatientAssessment", "Result", "FacilityMatching",
  "FacilityCard", "MedicalStreamsModule", "Emergency", "PatientHistory",
];

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith(".jsx") || full.endsWith(".js") ? [full] : [];
  });

let failures = 0;

for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf8");

  const defined = new Set();
  for (const m of text.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) defined.add(m[1]);
  for (const m of text.matchAll(/export\s+const\s+(\w+)/g)) defined.add(m[1]);
  // local, non-exported helpers inside the same file
  for (const m of text.matchAll(/^(?:async\s+)?function\s+(\w+)|^const\s+(\w+)\s*=/gm)) {
    defined.add(m[1] || m[2]);
  }

  const imported = new Set();
  for (const m of text.matchAll(/import\s+(?:React\s*,\s*)?\{([^}]*)\}\s*from/g)) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim();
      if (name) imported.add(name);
    }
  }

  for (const symbol of SYMBOLS) {
    const used = new RegExp(`(?<![\\w$])${symbol}(?![\\w$])`).test(text);
    if (!used) continue;
    if (defined.has(symbol) || imported.has(symbol)) continue;
    console.log(`MISSING  ${file}: ${symbol}`);
    failures += 1;
  }
}

console.log(failures === 0 ? "\nOK - every cross-module reference resolves." : `\n${failures} unresolved reference(s).`);
process.exit(failures === 0 ? 0 : 1);
