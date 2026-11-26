export const GOI_NCD_GUIDELINES = {
  Female: [
    { ageGroup: "<30", ageMin: 0, ageMax: 29, screening: "Routine population NCD screening", testMethod: "Not in the 30+ population-based package", frequency: "—", status: "Baseline Audit" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Hypertension", testMethod: "Blood pressure", frequency: "Every year", status: "Mandatory" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Diabetes", testMethod: "Blood glucose / glucometer", frequency: "Every year", status: "Mandatory" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Oral cancer", testMethod: "Oral Visual Examination (OVE)", frequency: "Every 5 years", status: "Mandatory" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Breast cancer", testMethod: "Clinical Breast Examination (CBE)", frequency: "Every 5 years", status: "Mandatory (Female)" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Cervical cancer", testMethod: "Visual Inspection with Acetic Acid (VIA)", frequency: "Every 5 years", status: "Mandatory (Female)" },
    { ageGroup: ">65", ageMin: 66, ageMax: 120, screening: "Hypertension", testMethod: "Blood pressure", frequency: "Continue regular monitoring", status: "Mandatory" },
    { ageGroup: ">65", ageMin: 66, ageMax: 120, screening: "Diabetes", testMethod: "Blood glucose", frequency: "Continue regular monitoring", status: "Mandatory" },
    { ageGroup: ">65", ageMin: 66, ageMax: 120, screening: "Other conditions", testMethod: "Clinical assessment as indicated", frequency: "Doctor-dependent", status: "Doctor-dependent" },
  ],
  Male: [
    { ageGroup: "<30", ageMin: 0, ageMax: 29, screening: "Routine population NCD screening", testMethod: "Not in the 30+ population-based package", frequency: "—", status: "Baseline Audit" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Hypertension", testMethod: "Blood pressure", frequency: "Every year", status: "Mandatory" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Diabetes", testMethod: "Blood glucose / glucometer", frequency: "Every year", status: "Mandatory" },
    { ageGroup: "30–65", ageMin: 30, ageMax: 65, screening: "Oral cancer", testMethod: "Oral Visual Examination (OVE)", frequency: "Every 5 years", status: "Mandatory" },
    { ageGroup: ">65", ageMin: 66, ageMax: 120, screening: "Hypertension", testMethod: "Blood pressure", frequency: "Continue regular monitoring", status: "Mandatory" },
    { ageGroup: ">65", ageMin: 66, ageMax: 120, screening: "Diabetes", testMethod: "Blood glucose", frequency: "Continue regular monitoring", status: "Mandatory" },
    { ageGroup: ">65", ageMin: 66, ageMax: 120, screening: "Other conditions", testMethod: "Clinical assessment as indicated", frequency: "Doctor-dependent", status: "Doctor-dependent" },
  ],
};

export function getMandatedTests(age, gender) {
  const numAge = Number(age) || 30;
  const isFemale = (gender || "").toLowerCase().includes("female");
  const list = isFemale ? GOI_NCD_GUIDELINES.Female : GOI_NCD_GUIDELINES.Male;

  return list.filter((item) => {
    if (numAge < 30) return item.ageGroup === "<30";
    if (numAge >= 30 && numAge <= 65) return item.ageGroup === "30–65";
    return item.ageGroup === ">65";
  });
}
