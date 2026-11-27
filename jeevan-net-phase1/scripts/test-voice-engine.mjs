// Read-only sanity harness for the symptom engine.
// Run: node scripts/test-voice-engine.mjs
//
// This is not a unit-test framework. It is a demo script: it feeds the engine
// real spoken utterances and prints which condition won. If a line prints the
// WRONG condition, the keyword weights in data/conditions.js need adjusting.

import { analyzeSymptoms } from "../src/lib/symptomEngine.js";
import { CONDITIONS, SAMPLE_UTTERANCES } from "../src/data/conditions.js";
import { DOCTORS_LIST } from "../src/data/doctors.js";

const CASES = [
  // [utterance, expected condition id, expected emergency?]
  ["Chhati me bohot tez dard hai aur saans lene me takleef ho rahi hai", "acs", true],
  ["Chhati me bohot tez dard", "acs", true],
  ["Bohot chakkaar aa raha hai, bolne me dikkat aur ek taraf kamzori hai", "stroke", true],
  ["Mera sugar kam ho gaya hai, khanpani ho rahi hai aur kapkapi aa rahi hai", "hypoglycemia", true],
  ["Mera PP blood sugar 323 mg/dL hai, bohot pyaas aur pasina aa raha hai", "hyperglycemia", true],
  ["Teen hafte se khansi hai, raat me pasina aata hai aur vajan kam ho raha hai", "tuberculosis", false],
  ["Teen din se tez bukhar hai, haddi dard hai aur aankhon ke peeche dard ho raha hai", "dengue", false],
  ["Bukhar ke sath gum se khoon aa raha hai aur kala pakhana hai", "dengue", true],
  ["Bahut thakaan rehti hai, chakkaar aata hai, chehra peela lagta hai aur periods zyada aate hain", "anemia", false],
  ["Do din se dast aur ulti ho rahi hai, pet kharab hai", "gastroenteritis", false],
  ["Aath ghante se peshab nahi hua, aankh dhansi hai", "gastroenteritis", true],
  ["Saans lene me takleef ho rahi hai, seeti ki awaaz aati hai, inhaler nahi chala", "asthma_exacerbation", true],
  ["Zukam hai, gala kharab hai aur naak band hai", "urti", false],
  ["Peshab me jalan ho rahi hai aur baar baar peshab aata hai", "uti", false],
  ["Aadha sir dard hai, tez roshni se dikkat hoti hai", "migraine", false],
  ["Garbhvati hoon aur pet me bachche ki halchal kam ho gayi hai", "pregnancy_emergency", true],
  ["Nau mahine pregnant hoon, paer soojna hai aur tez sir dard hai", "pregnancy_emergency", true],
  ["Udaas rehta hoon, mann nahi lagta, neend nahi aati", "depression_anxiety", false],
  ["Khud ko nuksan karne ka mann karta hai", "depression_anxiety", true],
  ["Khujli bahut hai, raat me khujli badh jaati hai", "skin_fungal_scabies", false],
  ["Aankh laal ho gayi hai aur aankh se paani aa raha hai", "conjunctivitis", false],
  ["Dhoop me kaam kiya, loo lag gayi, jism bahut garam hai", "heat_stroke", true],
  ["Gir gaya tha, haddi toot gayi hai aur sujan aayi hai", "fall_injury", false],
  ["Aankh peeli lag rahi hai, peshab peela hai aur bhookh nahi lagti", "jaundice_hepatitis", false],
  ["BP 185/118 hai aur sir dard ho raha hai", "hypertension_crisis", true],
  ["Fits aaye the, body jerking hui", "seizure", true],
  ["Hoth sooj gaye hain aur gala band ho raha hai, allergy hai", "anaphylaxis", true],

  // Negation: must NOT fire the cardiac condition.
  ["Chhati me dard nahi hai, sirf pet me dard hai", "gastroenteritis", false],

  // ---- The real microphone case -------------------------------------------------
  // The Web Speech API with lang="hi-IN" returns Devanagari, not Romanised
  // Hindi. These cases are what a Hindi speaker actually produces, and the
  // first one is literally what the browser transcribed in manual testing.
  ["बुख़ार है।", "undifferentiated_fever", false],
  ["बुखार है और कमजोरी लग रही है", "undifferentiated_fever", false],
  ["छाती में दर्द है और साँस लेने में तकलीफ है", "acs", true],
  ["एक तरफ कमजोरी है और बोलने में दिक्कत है", "stroke", true],
  ["तीन हफ्ते से खांसी है और रात में पसीना आता है", "tuberculosis", false],
  ["कम शुगर हो गई है और कंपकंपी आ रही है", "hypoglycemia", true],
  ["बहुत प्यास लग रही है और बार बार पेशाब आता है", "hyperglycemia", false],
  ["दो दिन से दस्त और उल्टी हो रही है", "gastroenteritis", false],
  ["पेशाब में जलन हो रही है और बार बार पेशाब आता है", "uti", false],
  ["आंख लाल हो गई है और आंख से पानी आ रहा है", "conjunctivitis", false],
  ["खुजली बहुत है और रात में बढ़ जाती है", "skin_fungal_scabies", false],
  ["आंख पीली लग रही है और भूख नहीं लगती", "jaundice_hepatitis", false],
  ["साँस लेने में तकलीफ है और घरघराहट हो रही है", "asthma_exacerbation", false],
  ["डेंगू के साथ मसूड़े से खून आ रहा है", "dengue", true],
  ["खुद को नुकसान पहुँचाने का मन करता है", "depression_anxiety", true],
  ["गर्भवती हूँ और बच्चे की हलचल कम हो गई है", "pregnancy_emergency", true],

  // Devanagari negation: the clause boundary must still stop the cancel leaking.
  ["छाती में दर्द नहीं है, पेट में दर्द है", "gastroenteritis", false],
];

// Conditions referenced by the case list must actually exist.
const knownIds = new Set(CONDITIONS.map((c) => c.id));
const missingConditions = [...new Set(CASES.map((c) => c[1]))].filter((id) => !knownIds.has(id));
if (missingConditions.length) {
  console.log(`\n!! Test references conditions that do not exist: ${missingConditions.join(", ")}`);
}

// Every condition must route to a real doctor.
const specialties = new Set(DOCTORS_LIST.map((d) => d.specialty));
const unrouted = CONDITIONS.filter((c) => !specialties.has(c.specialty));
if (unrouted.length) {
  console.log(`\n!! Conditions with no matching doctor: ${unrouted.map((c) => `${c.id}(${c.specialty})`).join(", ")}`);
}

let pass = 0;
const failures = [];

console.log(`\n=== Symptom engine — ${CASES.length} spoken cases ===\n`);

for (const [utterance, expectedId, expectedEmergency] of CASES) {
  const r = analyzeSymptoms(utterance);
  const condOk = r.conditionId === expectedId;
  const emergOk = r.isEmergency === expectedEmergency;
  const ok = condOk && emergOk;

  if (ok) pass += 1;
  else {
    failures.push({
      utterance,
      expected: `${expectedId} / emergency=${expectedEmergency}`,
      got: `${r.conditionId} / emergency=${r.isEmergency}`,
    });
  }

  const mark = ok ? "PASS" : "FAIL";
  console.log(
    `${mark}  ${String(r.conditionId).padEnd(22)} score=${String(r.differentials[0]?.score ?? 0).padEnd(3)} ` +
      `emerg=${String(r.isEmergency).padEnd(5)} sev=${String(r.severity).padEnd(8)} doctor=${r.suggestedDoctor.name}`
  );
  console.log(`      "${utterance}"`);
  if (!ok) console.log(`      expected ${expectedId} / emergency=${expectedEmergency}`);
}

console.log(`\n--- ${pass}/${CASES.length} passed ---`);

if (failures.length) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  * expected ${f.expected}\n    got      ${f.got}\n    text: "${f.utterance}"`));
}

console.log("\n=== Demo quick-prompt chips ===");
SAMPLE_UTTERANCES.forEach((s) => {
  const r = analyzeSymptoms(s.text);
  const ok = r.conditionId ? "" : "  <-- NO MATCH";
  console.log(`  ${s.label.padEnd(28)} -> ${String(r.conditionId).padEnd(22)} emerg=${r.isEmergency}${ok}`);
});

console.log(`\n=== Knowledge base: ${CONDITIONS.length} conditions, ${DOCTORS_LIST.length} specialists ===\n`);

process.exitCode = pass === CASES.length ? 0 : 1;
