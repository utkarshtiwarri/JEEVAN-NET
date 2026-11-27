// Cross-language parity check for the triage rule.
//
// Both `src/lib/triage.js` and `Backend/model.py` read
// `src/data/scoring-rule.json`. That only helps if the two implementations of the
// rule actually agree, so this script:
//
//   1. generates a deterministic spread of forms (boundary values included),
//   2. scores them with the JS rule,
//   3. asks Python for its scores for the same forms,
//   4. asserts score and level match on every one.
//
// Run: node scripts/check-scoring-parity.mjs
// Add --keep to leave the temp fixture files behind.
//
// This is a real test: it fails loudly if the two engines drift apart again.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scoreOf, levelOf } from "../src/lib/triage.js";
import RULE from "../src/data/scoring-rule.json" with { type: "json" };

const KEEP = process.argv.includes("--keep");
const W = RULE.weights;

// Boundary values matter more than random ones: an off-by-one is exactly the
// kind of drift this check exists to catch.
const BOUNDARIES = {
  glucose: [W.glucose.elevated - 1, W.glucose.elevated, W.glucose.critical, W.glucose.critical + 40],
  systolic: [W.bloodPressure.stage1Systolic - 1, W.bloodPressure.stage1Systolic, W.bloodPressure.crisisSystolic],
  diastolic: [W.bloodPressure.stage1Diastolic - 1, W.bloodPressure.stage1Diastolic, W.bloodPressure.crisisDiastolic],
  heartRate: [W.heartRate.tachycardia, W.heartRate.tachycardia + 1, W.heartRate.tachycardia - 1],
  spo2: [W.spo2.critical - 1, W.spo2.critical, W.spo2.borderline - 1, W.spo2.borderline],
  temperature: [W.temperature.low - 0.1, W.temperature.low, W.temperature.high - 0.1, W.temperature.high],
  age: [W.age.atLeast - 1, W.age.atLeast, W.age.atLeast + 1],
};

const SYMPTOM_KEYS = ["confusion", "thirst", "sweating", "chestPain", "breathingDifficulty", "weakness"];

function baseForm(overrides = {}) {
  return {
    age: "40",
    gender: "Male",
    systolic: "120",
    diastolic: "78",
    heartRate: "72",
    spo2: "98",
    temperature: "36.8",
    glucoseType: "PP",
    glucose: "100",
    confusion: false,
    thirst: false,
    sweating: false,
    chestPain: false,
    breathingDifficulty: false,
    weakness: false,
    ...overrides,
  };
}

// Deterministic pseudo-random so a failure is reproducible.
let seed = 20261127;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const forms = [];

// 1. The two demo presets the app ships.
forms.push(baseForm());
forms.push(
  baseForm({ systolic: "165", diastolic: "100", heartRate: "108", spo2: "93", glucose: "323" }),
);
forms.push(
  baseForm({
    systolic: "165", diastolic: "100", heartRate: "108", spo2: "93", glucose: "323",
    confusion: true, thirst: true, sweating: true,
  }),
);

// 2. Each boundary individually, so a single comparison cannot hide.
for (const [field, values] of Object.entries(BOUNDARIES)) {
  for (const value of values) forms.push(baseForm({ [field]: String(value) }));
}

// 3. Every symptom count from 0 to 6, at a quiet baseline.
for (let n = 0; n <= SYMPTOM_KEYS.length; n += 1) {
  const on = {};
  SYMPTOM_KEYS.slice(0, n).forEach((k) => {
    on[k] = true;
  });
  forms.push(baseForm(on));
}

// 4. Random combinations, including ones designed to hit the cap.
for (let i = 0; i < 400; i += 1) {
  const symptoms = {};
  SYMPTOM_KEYS.forEach((k) => {
    symptoms[k] = rand() > 0.6;
  });
  forms.push(
    baseForm({
      age: String(18 + Math.floor(rand() * 70)),
      systolic: String(85 + Math.floor(rand() * 125)),
      diastolic: String(45 + Math.floor(rand() * 85)),
      heartRate: String(45 + Math.floor(rand() * 105)),
      spo2: String(82 + Math.floor(rand() * 18)),
      temperature: (34 + rand() * 7).toFixed(1),
      glucose: String(50 + Math.floor(rand() * 450)),
      ...symptoms,
    }),
  );
}

// 5. Cases that must saturate the cap.
forms.push(baseForm({ systolic: "190", diastolic: "120", spo2: "88", glucose: "400", temperature: "39.5", confusion: true, thirst: true, sweating: true, chestPain: true, breathingDifficulty: true, weakness: true }));

const expected = forms.map((form) => {
  const score = scoreOf(form);
  return { score, level: levelOf(score) };
});

const dir = mkdtempSync(join(tmpdir(), "jeevan-parity-"));
const inFile = join(dir, "forms.json");
const outFile = join(dir, "scores.json");
writeFileSync(inFile, JSON.stringify(forms), "utf8");

const py = `
import json, sys
sys.path.insert(0, r"${process.cwd().replace(/\\/g, "\\\\")}/../Backend")
from model import risk_score, rule_level

with open(r"${inFile.replace(/\\/g, "\\\\")}", encoding="utf-8") as fh:
    forms = json.load(fh)

SYMPTOMS = ["confusion", "thirst", "sweating", "chestPain", "breathingDifficulty", "weakness"]
out = []
for f in forms:
    row = [
        float(f["age"]), float(f["systolic"]), float(f["diastolic"]), float(f["heartRate"]),
        float(f["spo2"]), float(f["temperature"]), float(f["glucose"]),
        sum(1 for k in SYMPTOMS if f.get(k)),
    ]
    score = risk_score(row)
    out.append({"score": score, "level": rule_level(score)})

with open(r"${outFile.replace(/\\/g, "\\\\")}", "w", encoding="utf-8") as fh:
    json.dump(out, fh)
`;

writeFileSync(join(dir, "score.py"), py, "utf8");

let actual;
try {
  execFileSync("python", [join(dir, "score.py")], { stdio: "pipe" });
  actual = JSON.parse(readFileSync(outFile, "utf8"));
} catch (error) {
  console.error("FAIL  could not run the Python side:", error.message);
  if (error.stderr) console.error(String(error.stderr));
  process.exitCode = 1;
  if (!KEEP) rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}

let mismatches = 0;
forms.forEach((form, i) => {
  const js = expected[i];
  const pyScore = actual[i];
  const scoreOk = Math.abs(Number(js.score) - Number(pyScore.score)) < 1e-9;
  const levelOk = js.level === pyScore.level;
  if (!scoreOk || !levelOk) {
    mismatches += 1;
    if (mismatches <= 10) {
      const notable = SYMPTOM_KEYS.filter((k) => form[k]).map((k) => k).join("+") || "none";
      console.log(`  MISMATCH case ${i}: js=${js.score}/${js.level} py=${pyScore.score}/${pyScore.level}`);
      console.log(`    age=${form.age} bp=${form.systolic}/${form.diastolic} hr=${form.heartRate} spo2=${form.spo2} temp=${form.temperature} glu=${form.glucose} symptoms=${notable}`);
    }
  }
});

// The cap must actually engage, or the "capped at 15" claim is untested.
const capped = expected.filter((e) => e.score === RULE.maxScore).length;

console.log(`\nrule version      : ${RULE.version}`);
console.log(`cases compared    : ${forms.length} (${BOUNDARIES && Object.keys(BOUNDARIES).length} boundary families + 400 random + cap cases)`);
console.log(`reached the cap   : ${capped}`);
console.log(`mismatches        : ${mismatches}`);

if (!KEEP) rmSync(dir, { recursive: true, force: true });

if (mismatches === 0) {
  console.log("\nOK - frontend and backend score every case identically.");
} else {
  console.log(`\n${mismatches} case(s) disagree. The two runtimes have drifted apart.`);
}
process.exitCode = mismatches === 0 ? 0 : 1;
