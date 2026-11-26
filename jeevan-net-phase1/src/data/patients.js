export const DEMO_ABHA_ID = "ABHA-8921-7740-9281";

export const defaultUser = {
  name: "Rajesh Sharma",
  age: "56",
  gender: "Male",
  email: "rajesh.sharma@example.com",
  contact: "+91 98765 43210",
  abhaId: DEMO_ABHA_ID,
  isVerified: true,
};

// The form opens on a stable, low-risk patient. It previously shipped
// pre-filled with glucose 323 / BP 165-100, so the very first click always
// produced a HIGH verdict and the normal path was impossible to demonstrate.

export const defaultForm = {
  age: "56",
  gender: "Male",
  systolic: "122",
  diastolic: "78",
  heartRate: "76",
  spo2: "98",
  temperature: "36.8",
  glucoseType: "PP", // Fasting, PP, Regular
  glucose: "108",

  confusion: false,
  thirst: false,
  sweating: false,
  chestPain: false,
  breathingDifficulty: false,
  weakness: false,
};

// One-click reproduction of the hyperglycaemic-crisis scenario used in the demo.

export const criticalDemoForm = {
  age: "56",
  gender: "Male",
  systolic: "165",
  diastolic: "100",
  heartRate: "108",
  spo2: "93",
  temperature: "37.2",
  glucoseType: "PP",
  glucose: "323",

  confusion: true,
  thirst: true,
  sweating: true,
  chestPain: false,
  breathingDifficulty: false,
  weakness: false,
};
