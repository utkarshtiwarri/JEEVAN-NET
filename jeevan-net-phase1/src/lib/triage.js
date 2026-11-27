import RULE from "../data/scoring-rule.json" with { type: "json" };

// The frontend rule engine.
//
// Every weight and threshold comes from data/scoring-rule.json, which the Python
// backend loads too. That is deliberate: this engine and the training labels used
// to disagree (age 50 vs 65, symptoms capped at 12 vs 6 points, HIGH at 9 vs 7),
// which meant the model learned a rule the UI never displayed. Now there is one
// definition and both runtimes read it.
//
// Output shape is unchanged: { score, level, indicators, action }.

const W = RULE.weights;

export function scoreOf(form) {
  let score = 0;

  const glucose = Number(form.glucose);
  const systolic = Number(form.systolic);
  const diastolic = Number(form.diastolic);
  const heartRate = Number(form.heartRate);
  const spo2 = Number(form.spo2);
  const temperature = Number(form.temperature);
  const age = Number(form.age);

  if (glucose >= W.glucose.critical) score += W.glucose.criticalPoints;
  else if (glucose >= W.glucose.elevated) score += W.glucose.elevatedPoints;

  if (systolic >= W.bloodPressure.crisisSystolic || diastolic >= W.bloodPressure.crisisDiastolic) {
    score += W.bloodPressure.crisisPoints;
  } else if (
    systolic >= W.bloodPressure.stage1Systolic ||
    diastolic >= W.bloodPressure.stage1Diastolic
  ) {
    score += W.bloodPressure.stage1Points;
  }

  if (heartRate > W.heartRate.tachycardia) score += W.heartRate.points;

  if (spo2 < W.spo2.critical) score += W.spo2.criticalPoints;
  else if (spo2 < W.spo2.borderline) score += W.spo2.borderlinePoints;

  if (temperature >= W.temperature.high || temperature < W.temperature.low) {
    score += W.temperature.points;
  }

  SYMPTOM_LABELS.forEach(([key]) => {
    if (form[key]) score += W.symptom.pointsEach;
  });

  if (age >= W.age.atLeast) score += W.age.points;

  return Math.min(score, RULE.maxScore);
}

export function levelOf(score) {
  if (score >= RULE.levels.high) return "HIGH";
  if (score >= RULE.levels.moderate) return "MODERATE";
  return "LOW";
}

const SYMPTOM_LABELS = [
  ["confusion", "Acute Confusion / Disorientation"],
  ["thirst", "Polydipsia (Excessive Thirst)"],
  ["sweating", "Diaphoresis (Profuse Sweating)"],
  ["chestPain", "Acute Angina / Chest Pain"],
  ["breathingDifficulty", "Dyspnea / Breathing Difficulty"],
  ["weakness", "Sudden Weakness / Fatigue"],
];

export function localTriage(form) {
  const indicators = [];

  const glucose = Number(form.glucose);
  const systolic = Number(form.systolic);
  const diastolic = Number(form.diastolic);
  const heartRate = Number(form.heartRate);
  const spo2 = Number(form.spo2);
  const temperature = Number(form.temperature);
  const age = Number(form.age);

  if (glucose >= W.glucose.critical) {
    indicators.push(`Severe Hyperglycemia (${form.glucoseType || 'PP'} Glucose ${glucose} mg/dL)`);
  } else if (glucose >= W.glucose.elevated) {
    indicators.push(`Elevated Glucose (${form.glucoseType || 'PP'} Glucose ${glucose} mg/dL)`);
  }

  if (systolic >= W.bloodPressure.crisisSystolic || diastolic >= W.bloodPressure.crisisDiastolic) {
    indicators.push(`Hypertensive Crisis Risk (BP ${systolic}/${diastolic} mmHg)`);
  } else if (
    systolic >= W.bloodPressure.stage1Systolic ||
    diastolic >= W.bloodPressure.stage1Diastolic
  ) {
    indicators.push(`Stage 1 Hypertension (BP ${systolic}/${diastolic} mmHg)`);
  }

  if (heartRate > W.heartRate.tachycardia) {
    indicators.push(`Tachycardia Detected (${heartRate} bpm)`);
  }

  if (spo2 < W.spo2.critical) {
    indicators.push(`Hypoxia Risk (SpO₂ ${spo2}%)`);
  } else if (spo2 < W.spo2.borderline) {
    indicators.push(`Borderline Oxygen Saturation (${spo2}%)`);
  }

  if (temperature >= W.temperature.high || temperature < W.temperature.low) {
    indicators.push(`Fever / Thermal Instability (${temperature} °C)`);
  }

  SYMPTOM_LABELS.forEach(([key, label]) => {
    if (form[key]) indicators.push(label);
  });

  if (age >= W.age.atLeast) {
    indicators.push(`High NCD Risk Age Group (${age} yrs)`);
  }

  const score = scoreOf(form);
  const level = levelOf(score);

  let action = "Routine clinical review recommended.";
  if (level === "MODERATE") {
    action = "Priority clinical assessment recommended. Monitor patient vitals & pre-alert nearest clinic.";
  }
  if (level === "HIGH") {
    action = "CRITICAL: Immediate emergency dispatch & hospital ICU pre-alert recommended.";
  }

  return {
    score,
    level,
    indicators,
    action,
  };
}
