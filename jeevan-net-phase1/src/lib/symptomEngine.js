// ============================================================================
// JEEVAN-NET — Symptom Matching Engine
// ============================================================================
// Replaces the old hardcoded if/else chain in the voice companion view.
//
// What it does, in order:
//   1. Normalise the transcript (case, punctuation, spacing).
//   2. Pull structured vitals out of free speech ("bp 180/110", "sugar 323").
//   3. Score every condition in data/conditions.js against the words spoken.
//   4. Apply vitals as extra weight — a number outranks a description.
//   5. Escalate if a universal red flag matched, no matter what else scored.
//   6. Return the top-3 differential, not one guess.
//
// Order of words in a sentence must not matter: "chhati me dard" and
// "chhati me bohot tez dard" both have to hit the heart attack condition.
// So a multi-word keyword matches when ALL of its words are present.
// ============================================================================

import { CONDITIONS, UNIVERSAL_RED_FLAGS, HINDI_KEYWORDS, DISCLAIMER } from "../data/conditions.js";
import { DOCTORS_LIST } from "../data/doctors.js";

const NEGATION_TOKENS = [
  "no", "not", "without", "never", "nahi", "nahin",
  "नहीं", "नही", "बिना", "बिना", "न", "bina", "mat", "मत",
];
const MIN_SCORE = 2;

// ---------------------------------------------------------------------------
// Text preparation
// ---------------------------------------------------------------------------
export function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[।,;:!?'"()\[\]{}]/g, " | ")
    .replace(/\.(?=\s|$)/g, " | ")
    .replace(/\s+/g, " ")
    .trim();
}

// " | " is a clause boundary, so a "nahi" in one clause can never cancel a
// symptom reported in the next one. Without this, "chhati me dard nahi hai,
// pet me dard hai" cancels the wrong half of the sentence.
const CLAUSE_BREAK = "|";

function tokenize(text) {
  return normalize(text).split(" ").filter(Boolean);
}

// A keyword matches when every one of its words is present in the utterance.
// Single-word keywords therefore behave exactly as before.
function phraseMatches(term, tokenSet) {
  const words = term.split(" ").filter(Boolean);
  if (words.length === 0) return false;
  return words.every((w) => tokenSet.has(w));
}

// Like phraseMatches, but the words must sit close together rather than merely
// appear somewhere in the sentence. This matters for danger signs: in "peshab
// peela hai aur bhookh nahi lagti", the words "peshab" and "nahi" are both
// present but describe two different things.
function windowMatches(term, tokens, maxSpan = 6) {
  const words = term.split(" ").filter(Boolean);
  if (words.length === 0) return false;
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] !== words[0]) continue;
    const window = tokens.slice(i, i + maxSpan + 1);
    if (window.includes(CLAUSE_BREAK)) continue;
    if (words.every((w) => window.includes(w))) return true;
  }
  return false;
}
// Only tokens inside the same clause as the keyword are considered.
function looksNegated(term, text) {
  const words = term.split(" ").filter(Boolean);
  const tokens = text.split(" ");
  for (let i = 0; i < tokens.length; i += 1) {
    if (!words.every((w, k) => tokens[i + k] === w)) continue;

    const rawBefore = tokens.slice(Math.max(0, i - 3), i);
    const cutBefore = rawBefore.lastIndexOf(CLAUSE_BREAK);
    const before = cutBefore === -1 ? rawBefore : rawBefore.slice(cutBefore + 1);

    const rawAfter = tokens.slice(i + words.length, i + words.length + 2);
    const cutAfter = rawAfter.indexOf(CLAUSE_BREAK);
    const after = cutAfter === -1 ? rawAfter : rawAfter.slice(0, cutAfter);

    if ([...before, ...after].some((t) => NEGATION_TOKENS.includes(t))) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Vitals spoken out loud
// ---------------------------------------------------------------------------
export function extractVitals(text) {
  const t = normalize(text).replace(/°\s*/g, "");
  const vitals = {};

  const bp = t.match(/\b(?:bp|blood pressure)\D{0,10}(\d{2,3})(?:\s*\/\s*(\d{2,3}))?/);
  if (bp) {
    vitals.systolic = Number(bp[1]);
    if (bp[2]) vitals.diastolic = Number(bp[2]);
  }

  const glucose = t.match(/\b(?:sugar|glucose|shugar)\D{0,14}(\d{2,3})\b/);
  if (glucose) vitals.glucose = Number(glucose[1]);

  const spo2 = t.match(/\b(?:spo2|oxygen|o2|pulse ox)\D{0,12}(\d{2,3})\b/);
  if (spo2) vitals.spo2 = Number(spo2[1]);

  const feverF = t.match(/\b(\d{2,3}(?:\.\d)?)\s*f\b/);
  const feverC = t.match(/\b(3\d(?:\.\d)?)\s*c\b/);
  if (feverF) {
    const f = Number(feverF[1]);
    if (f > 45) vitals.temperature = Math.round((((f - 32) * 5) / 9) * 10) / 10;
  } else if (feverC) {
    vitals.temperature = Number(feverC[1]);
  }

  return vitals;
}

// A measured number is stronger evidence than a spoken adjective.
function vitalWeights(vitals) {
  const boosts = [];
  const add = (id, weight, label) => boosts.push({ id, weight, label });

  if (typeof vitals.glucose === "number") {
    if (vitals.glucose >= 300) add("hyperglycemia", 6, `Blood glucose ${vitals.glucose} mg/dL — very high`);
    else if (vitals.glucose >= 200) add("hyperglycemia", 3, `Blood glucose ${vitals.glucose} mg/dL — high`);
    else if (vitals.glucose <= 70) add("hypoglycemia", 5, `Blood glucose ${vitals.glucose} mg/dL — low`);
  }

  if (typeof vitals.systolic === "number") {
    const dia = vitals.diastolic || 0;
    if (vitals.systolic >= 180 || dia >= 120) add("hypertension_crisis", 5, `Blood pressure ${vitals.systolic}/${dia || "?"} mmHg — crisis range`);
    else if (vitals.systolic >= 140 || dia >= 90) add("hypertension_crisis", 2, `Blood pressure ${vitals.systolic}/${dia || "?"} mmHg — raised`);
  }

  if (typeof vitals.spo2 === "number") {
    if (vitals.spo2 < 92) add("asthma_exacerbation", 4, `SpO2 ${vitals.spo2}% — low oxygen`);
    else if (vitals.spo2 < 95) add("asthma_exacerbation", 2, `SpO2 ${vitals.spo2}% — borderline`);
  }

  if (typeof vitals.temperature === "number" && vitals.temperature >= 39.5) {
    add("sepsis", 2, `Temperature ${vitals.temperature}°C — high fever`);
  }

  return boosts;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
function scoreConditions(text, vitals) {
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const boosts = vitalWeights(vitals);
  const boostLabels = new Map();

  const scored = CONDITIONS.map((condition) => {
    let score = 0;
    const hits = [];

    // Romanised (typed) keywords merged with the Devanagari pack, because a
    // real hi-IN microphone returns Devanagari no matter how it is typed.
    const keywords = { ...(condition.keywords || {}), ...(HINDI_KEYWORDS[condition.id] || {}) };

    Object.entries(keywords).forEach(([term, weight]) => {
      if (!phraseMatches(term, tokenSet)) return;
      if (looksNegated(term, text)) return;
      score += weight;
      hits.push({ term, weight });
    });

    boosts
      .filter((b) => b.id === condition.id)
      .forEach((b) => {
        score += b.weight;
        if (!boostLabels.has(condition.id)) boostLabels.set(condition.id, []);
        boostLabels.get(condition.id).push(b.label);
      });

    // Danger signs escalate a condition on their own, but only when the
    // condition is actually present (score floor) — otherwise a stray "ulti"
    // in a stomach-bug sentence would call an ambulance for a fall injury.
    const escalateLabel = (condition.escalateOn || []).find(
      (term) => windowMatches(term, tokens) && !looksNegated(term, text)
    );
    const escalated = Boolean(escalateLabel);

    return { condition, score, hits, escalated, escalateLabel, vitalLabels: boostLabels.get(condition.id) || [] };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.hits.length - a.hits.length);

  return scored;
}

// ---------------------------------------------------------------------------
// Doctor routing — specialty key from the condition, resolved against doctors.js
// ---------------------------------------------------------------------------
export function resolveDoctor(specialty) {
  const bySpecialty = DOCTORS_LIST.find((d) => d.specialty === specialty);
  const general = DOCTORS_LIST.find((d) => d.specialty === "general");
  return bySpecialty || general || DOCTORS_LIST[0];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function analyzeSymptoms(rawText) {
  const text = normalize(rawText);
  const vitals = extractVitals(rawText);
  const ranked = scoreConditions(text, vitals);

  // 1. Universal red flags outrank every score.
  const redFlags = Object.entries(UNIVERSAL_RED_FLAGS)
    .filter(([term]) => phraseMatches(term, new Set(tokenize(text))))
    .map(([, label]) => label);

  // 2. Highest-ranked condition that qualifies as an emergency — either because
  //    it scored past its emergencyAt threshold, or because one of its explicit
  //    warning signs (escalateOn) was spoken.
  const critical = ranked.find(
    (entry) =>
      entry.condition.emergency &&
      (entry.score >= (entry.condition.emergencyAt ?? 4) ||
        (entry.escalated && entry.score >= 2))
  );

  const isEmergency = Boolean(critical) || redFlags.length > 0;
  const primaryEntry = critical || ranked[0] || null;

  const differentials = ranked.slice(0, 3).map((entry, index) => ({
    id: entry.condition.id,
    name: entry.condition.name,
    icd10: entry.condition.icd10,
    specialty: entry.condition.specialty,
    score: entry.score,
    likelihood: index === 0 ? "Most likely" : index === 1 ? "Also possible" : "Less likely",
  }));

  const detectedSymptoms = primaryEntry
    ? dedupe([
        ...primaryEntry.vitalLabels,
        ...(primaryEntry.escalateLabel
          ? [`Warning sign: ${titleCase(primaryEntry.escalateLabel)}`]
          : []),
        ...primaryEntry.hits
          .sort((a, b) => b.weight - a.weight)
          .map((h) => titleCase(h.term)),
      ]).slice(0, 6)
    : [];

  // 3. Nothing matched — fall back to a general physician review, never to silence.
  if (!primaryEntry) {
    return {
      transcript: rawText,
      detectedSymptoms: redFlags,
      severity: isEmergency ? "CRITICAL" : "MODERATE",
      diagnosis: "Unrecognised Symptom Pattern",
      nameHi: null,
      conditionId: null,
      icd10: null,
      firstAidRemedies: [
        "1. Write down when the symptoms started and whether they are getting worse.",
        "2. Note temperature, blood pressure, sugar and pulse if you can measure them.",
        "3. Keep drinking water and avoid self-medication until a doctor reviews you.",
      ],
      clarificationQuestions: [
        "Where exactly is the problem, and how many days has it been going on?",
        "Is there fever, breathlessness, or vomiting along with it?",
        "Any existing condition like diabetes, BP, or pregnancy?",
      ],
      recommendedAction: "Online physician teleconsultation recommended.",
      suggestedDoctor: resolveDoctor("general"),
      isEmergency,
      redFlags,
      vitals,
      differentials,
      disclaimer: DISCLAIMER,
    };
  }

  const condition = primaryEntry.condition;
  const severity = isEmergency ? "CRITICAL" : condition.severity;

  const action = isEmergency
    ? condition.emergency
      ? condition.action
      : `Red flag detected: ${redFlags[0]}. Escalating to emergency care.`
    : condition.action;

  return {
    transcript: rawText,
    detectedSymptoms,
    severity,
    diagnosis: condition.name,
    nameHi: condition.nameHi,
    conditionId: condition.id,
    icd10: condition.icd10,
    firstAidRemedies: condition.firstAid,
    clarificationQuestions: condition.questions,
    recommendedAction: action,
    suggestedDoctor: resolveDoctor(condition.specialty),
    isEmergency,
    redFlags,
    vitals,
    differentials,
    disclaimer: DISCLAIMER,
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function titleCase(term) {
  return term
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function dedupe(list) {
  return [...new Set(list)];
}

export { DISCLAIMER };
