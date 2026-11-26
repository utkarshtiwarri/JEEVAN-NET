export function localTriage(form) {
  let score = 0;
  const indicators = [];

  const glucose = Number(form.glucose);
  const systolic = Number(form.systolic);
  const diastolic = Number(form.diastolic);
  const heartRate = Number(form.heartRate);
  const spo2 = Number(form.spo2);
  const temperature = Number(form.temperature);
  const age = Number(form.age);

  if (glucose >= 300) {
    score += 3;
    indicators.push(`Severe Hyperglycemia (${form.glucoseType || 'PP'} Glucose ${glucose} mg/dL)`);
  } else if (glucose >= 200) {
    score += 2;
    indicators.push(`Elevated Glucose (${form.glucoseType || 'PP'} Glucose ${glucose} mg/dL)`);
  }

  if (systolic >= 160 || diastolic >= 100) {
    score += 2;
    indicators.push(`Hypertensive Crisis Risk (BP ${systolic}/${diastolic} mmHg)`);
  } else if (systolic >= 140 || diastolic >= 90) {
    score += 1;
    indicators.push(`Stage 1 Hypertension (BP ${systolic}/${diastolic} mmHg)`);
  }

  if (heartRate > 100) {
    score += 1;
    indicators.push(`Tachycardia Detected (${heartRate} bpm)`);
  }

  if (spo2 < 94) {
    score += 2;
    indicators.push(`Hypoxia Risk (SpO₂ ${spo2}%)`);
  } else if (spo2 < 96) {
    score += 1;
    indicators.push(`Borderline Oxygen Saturation (${spo2}%)`);
  }

  if (temperature >= 38.5 || temperature < 35) {
    score += 1;
    indicators.push(`Fever / Thermal Instability (${temperature} °C)`);
  }

  const symptoms = [
    ["confusion", "Acute Confusion / Disorientation"],
    ["thirst", "Polydipsia (Excessive Thirst)"],
    ["sweating", "Diaphoresis (Profuse Sweating)"],
    ["chestPain", "Acute Angina / Chest Pain"],
    ["breathingDifficulty", "Dyspnea / Breathing Difficulty"],
    ["weakness", "Sudden Weakness / Fatigue"],
  ];

  symptoms.forEach(([key, label]) => {
    if (form[key]) {
      score += 2;
      indicators.push(label);
    }
  });

  if (age >= 50) {
    score += 1;
    indicators.push(`High NCD Risk Age Group (${age} yrs)`);
  }

  score = Math.min(score, 15);

  let level = "LOW";
  if (score >= 9) {
    level = "HIGH";
  } else if (score >= 5) {
    level = "MODERATE";
  }

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
