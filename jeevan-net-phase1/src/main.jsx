import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import {
  IconDashboard,
  IconAssessment,
  IconEmergency,
  IconHospital,
  IconRecord,
  IconLogo,
  IconBell,
  IconSearch,
  IconUser,
  IconMic,
  IconPhone,
  IconMail,
  IconCheck,
  IconClock,
  IconPill,
  IconMapPin,
  IconBrain,
  IconLock,
  IconRefresh,
  IconSparkles,
  IconLogOut,
  IconVolume2,
  IconShield,
  IconVideo,
  IconCalendar,
  IconStethoscope,
  IconFileText,
  IconCheckCircle
} from "./Icons";

const API_URL = "http://127.0.0.1:8000";

/* =========================================================
   DEFAULT PATIENT & INITIAL USER STATE
========================================================= */

const defaultUser = {
  name: "Rajesh Sharma",
  age: "56",
  gender: "Male",
  email: "rajesh.sharma@example.com",
  contact: "+91 98765 43210",
  abhaId: "ABHA-8921-7740-9281",
  isVerified: true,
};

const defaultForm = {
  age: "56",
  gender: "Male",
  systolic: "165",
  diastolic: "100",
  heartRate: "108",
  spo2: "93",
  temperature: "37.2",
  glucoseType: "PP", // Fasting, PP, Regular
  glucose: "323",

  confusion: true,
  thirst: true,
  sweating: true,
  chestPain: false,
  breathingDifficulty: false,
  weakness: false,
};

/* =========================================================
   DOCTORS DATABASE FOR TELECONSULTATION & APPOINTMENTS
========================================================= */

const DOCTORS_LIST = [
  {
    id: "doc-1",
    name: "Dr. Ananya Sen",
    title: "Senior Cardiologist",
    degree: "MD, DM (Cardiology)",
    experience: "14+ Years",
    rating: 4.9,
    hospital: "City Emergency Centre",
    fee: "₹ 500",
    isOnline: true,
    availableSlot: "Available Now for Video Call",
    avatar: "AS",
  },
  {
    id: "doc-2",
    name: "Dr. Vikram Rao",
    title: "Consultant Diabetologist & Endocrinologist",
    degree: "MD, DM (Endocrinology)",
    experience: "12+ Years",
    rating: 4.8,
    hospital: "Apex Life Care Hospital",
    fee: "₹ 450",
    isOnline: false,
    availableSlot: "Today, 03:30 PM",
    avatar: "VR",
  },
  {
    id: "doc-3",
    name: "Dr. Sunita Patil",
    title: "Senior General Physician & Family Medicine",
    degree: "MBBS, MD (Internal Medicine)",
    experience: "10+ Years",
    rating: 4.7,
    hospital: "District General Hospital",
    fee: "₹ 300",
    isOnline: true,
    availableSlot: "Available Now for Video Call",
    avatar: "SP",
  },
  {
    id: "doc-4",
    name: "Dr. Rajesh Verma",
    title: "Stroke & Neurologist Specialist",
    degree: "MD, DM (Neurology)",
    experience: "16+ Years",
    rating: 4.9,
    hospital: "Sunshine Heart & Neuro Institute",
    fee: "₹ 600",
    isOnline: false,
    availableSlot: "Tomorrow, 10:00 AM",
    avatar: "RV",
  },
];

/* =========================================================
   CONCENTRIC FACILITIES DATABASE (1-3km, 3-5km, 5-6km)
========================================================= */

const facilitiesDatabase = [
  {
    id: "city-emergency",
    name: "City Emergency Centre",
    sector: "Govt",
    type: "Emergency + ICU",
    rangeCategory: "1-3km",
    distanceKm: 2.4,
    distance: "2.4 km",
    rating: 4.8,
    eta: 8,
    beds: 12,
    totalBeds: 50,
    status: "Available",
    icu: true,
    emergency: true,
    specialist: true,
    ct: true,
    capabilityScore: 90,
    capacityScore: 88,
    etaScore: 94,
    specialistScore: 90,
    diagnosticsScore: 95,
    reasons: [
      "Highest clinical suitability for critical triage",
      "Dedicated emergency ICU capacity available",
      "Shortest estimated travel time (8 mins)",
      "24/7 Specialist & CT scanner readiness",
    ],
  },
  {
    id: "apex-private-1",
    name: "Apex Life Care Hospital",
    sector: "Private",
    type: "Super Speciality",
    rangeCategory: "1-3km",
    distanceKm: 2.9,
    distance: "2.9 km",
    rating: 4.5,
    eta: 10,
    beds: 8,
    totalBeds: 40,
    status: "Available",
    icu: true,
    emergency: true,
    specialist: true,
    ct: true,
    capabilityScore: 88,
    capacityScore: 82,
    etaScore: 90,
    specialistScore: 92,
    diagnosticsScore: 94,
    reasons: [
      "Advanced cardiac & stroke diagnostic bay",
      "Private bed allocation with fast-track intake",
      "Oxygen-equipped transport ready",
    ],
  },
  {
    id: "district-general",
    name: "District General Hospital",
    sector: "Govt",
    type: "Government Multi-speciality",
    rangeCategory: "3-5km",
    distanceKm: 3.8,
    distance: "3.8 km",
    rating: 4.2,
    eta: 12,
    beds: 18,
    totalBeds: 120,
    status: "Available",
    icu: true,
    emergency: true,
    specialist: false,
    ct: true,
    capabilityScore: 84,
    capacityScore: 90,
    etaScore: 85,
    specialistScore: 65,
    diagnosticsScore: 95,
    reasons: [
      "Substantial emergency bed capacity",
      "Fully subsidized GoI preventive testing support",
      "ICU and CT facilities operational",
    ],
  },
  {
    id: "metro-care",
    name: "Metro Care Hospital",
    sector: "Private",
    type: "Private Tertiary Care",
    rangeCategory: "3-5km",
    distanceKm: 4.6,
    distance: "4.6 km",
    rating: 4.7,
    eta: 15,
    beds: 14,
    totalBeds: 60,
    status: "Busy",
    icu: true,
    emergency: true,
    specialist: true,
    ct: true,
    capabilityScore: 84,
    capacityScore: 63,
    etaScore: 70,
    specialistScore: 92,
    diagnosticsScore: 94,
    reasons: [
      "Senior neurologist & endocrinologist en-route",
      "High-end diagnostic imaging available",
    ],
  },
  {
    id: "regional-govt-ext",
    name: "Regional Apex Hospital",
    sector: "Govt",
    type: "Government Medical College",
    rangeCategory: "5-6km",
    distanceKm: 5.4,
    distance: "5.4 km",
    rating: 4.0,
    eta: 19,
    beds: 31,
    totalBeds: 250,
    status: "Available",
    icu: true,
    emergency: true,
    specialist: true,
    ct: true,
    capabilityScore: 82,
    capacityScore: 94,
    etaScore: 65,
    specialistScore: 88,
    diagnosticsScore: 90,
    reasons: [
      "Largest reserve emergency bed availability (31 free)",
      "Full metabolic & trauma intervention grid",
    ],
  },
  {
    id: "sunshine-pvt-ext",
    name: "Sunshine Heart & Neuro Institute",
    sector: "Private",
    type: "Private Specialty",
    rangeCategory: "5-6km",
    distanceKm: 5.8,
    distance: "5.8 km",
    rating: 4.1,
    eta: 21,
    beds: 22,
    totalBeds: 80,
    status: "Available",
    icu: true,
    emergency: true,
    specialist: true,
    ct: true,
    capabilityScore: 80,
    capacityScore: 85,
    etaScore: 60,
    specialistScore: 95,
    diagnosticsScore: 92,
    reasons: [
      "Specialized stroke & catheterization unit",
      "Direct telehealth bridge pre-alerted",
    ],
  },
];

/* =========================================================
   INDIAN LANGUAGES LIST (22+ LANGUAGES)
========================================================= */

const INDIAN_LANGUAGES = [
  { code: "hi-IN", name: "Hindi (हिंदी)" },
  { code: "ta-IN", name: "Tamil (தமிழ்)" },
  { code: "te-IN", name: "Telugu (తెలుగు)" },
  { code: "kn-IN", name: "Kannada (ಕನ್ನಡ)" },
  { code: "bn-IN", name: "Bengali (বাংলা)" },
  { code: "mr-IN", name: "Marathi (मराठी)" },
  { code: "gu-IN", name: "Gujarati (ગુજરાતી)" },
  { code: "ml-IN", name: "Malayalam (മലയാളം)" },
  { code: "pa-IN", name: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "or-IN", name: "Odia (ଓଡ଼ିଆ)" },
  { code: "as-IN", name: "Assamese (অসমীয়া)" },
  { code: "ur-IN", name: "Urdu (اردو)" },
  { code: "en-IN", name: "English (India)" },
];

/* =========================================================
   GOVERNMENT OF INDIA NCD SCREENING GUIDELINES DATA
========================================================= */

const GOI_NCD_GUIDELINES = {
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

function getMandatedTests(age, gender) {
  const numAge = Number(age) || 30;
  const isFemale = (gender || "").toLowerCase().includes("female");
  const list = isFemale ? GOI_NCD_GUIDELINES.Female : GOI_NCD_GUIDELINES.Male;

  return list.filter((item) => {
    if (numAge < 30) return item.ageGroup === "<30";
    if (numAge >= 30 && numAge <= 65) return item.ageGroup === "30–65";
    return item.ageGroup === ">65";
  });
}

/* =========================================================
   LOCAL TRIAGE ALGORITHM
========================================================= */

function localTriage(form) {
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

async function assessPatient(form) {
  const payload = {
    age: Number(form.age),
    systolic: Number(form.systolic),
    diastolic: Number(form.diastolic),
    heartRate: Number(form.heartRate),
    spo2: Number(form.spo2),
    temperature: Number(form.temperature),
    glucose: Number(form.glucose),

    symptoms: {
      confusion: form.confusion,
      thirst: form.thirst,
      sweating: form.sweating,
      chestPain: form.chestPain,
      breathingDifficulty: form.breathingDifficulty,
      weakness: form.weakness,
    },
  };

  try {
    const response = await fetch(`${API_URL}/api/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Backend assessment offline");
    const data = await response.json();
    return { ...data, backendOnline: true };
  } catch (error) {
    const local = localTriage(form);
    return {
      engine: "JEEVAN-NET Hybrid Quantum ML (Simulated)",
      classical_probability: local.level === "HIGH" ? 92.4 : local.level === "MODERATE" ? 61.2 : 14.5,
      hybrid_probability: local.level === "HIGH" ? 99.9 : local.level === "MODERATE" ? 68.4 : 18.7,
      risk_level: local.level,
      prototype_rule_score: local.score,
      symptom_count: Object.values(form).filter((val) => val === true).length,
      backendOnline: false,
      disclaimer: "Quantum-classical hybrid triage demonstration logic.",
    };
  }
}

function calculateFacilityMatch(facility, riskLevel) {
  let score =
    facility.capabilityScore * 0.3 +
    facility.capacityScore * 0.25 +
    facility.etaScore * 0.2 +
    facility.specialistScore * 0.15 +
    facility.diagnosticsScore * 0.1;

  if (riskLevel === "HIGH") {
    if (facility.icu) score += 1;
    if (facility.emergency) score += 1;
  }
  return Math.min(99, Math.round(score));
}

function getFacilityMatches(riskLevel, rangeFilter = "ALL") {
  let list = facilitiesDatabase;
  if (rangeFilter !== "ALL") {
    list = facilitiesDatabase.filter((f) => f.rangeCategory === rangeFilter);
  }
  return list
    .map((facility) => ({
      ...facility,
      match: calculateFacilityMatch(facility, riskLevel),
    }))
    .sort((a, b) => b.match - a.match);
}

/* =========================================================
   MAIN APP COMPONENT
========================================================= */

function App() {
  const [user, setUser] = useState(defaultUser);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const [assessmentData, setAssessmentData] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeVideoCallDoctor, setActiveVideoCallDoctor] = useState(null);
  const [bookingModalDoctor, setBookingModalDoctor] = useState(null);

  const handleAuthComplete = (newUser) => {
    setUser(newUser);
    setShowAuthModal(false);
  };

  const handleAssessmentComplete = (data) => {
    setAssessmentData(data);
  };

  const pageTitle =
    selected === "Hospital Network"
      ? "Geospatial Facility Matching"
      : selected === "Patient History"
      ? "Digital Clinical Record"
      : selected === "Age Checklist"
      ? "GoI Age Preventive Checklist"
      : selected === "Voice Companion"
      ? "Voice Clinical Companion"
      : selected === "Medical Streams"
      ? "Expense Minimization & Streams"
      : selected === "Doctor Consult"
      ? "Online Teleconsultation & Appointments"
      : selected;

  return (
    <div className="app-shell">
      {/* AUTH MODAL PORTAL */}
      {showAuthModal && (
        <AuthModal
          initialUser={user}
          onComplete={handleAuthComplete}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* LIVE VIDEO CALL SIMULATION MODAL */}
      {activeVideoCallDoctor && (
        <LiveVideoCallModal
          doctor={activeVideoCallDoctor}
          user={user}
          onClose={() => setActiveVideoCallDoctor(null)}
        />
      )}

      {/* APPOINTMENT BOOKING MODAL */}
      {bookingModalDoctor && (
        <AppointmentBookingModal
          doctor={bookingModalDoctor}
          user={user}
          onClose={() => setBookingModalDoctor(null)}
        />
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <IconLogo size={22} color="#ffffff" />
          </div>
          <div>
            <div className="brand-name">JEEVAN-NET</div>
            <div className="brand-subtitle">ArogyaNexus</div>
          </div>
        </div>

        <div className="menu-label">
          <span>NAVIGATION GRID</span>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${selected === "Dashboard" ? "active" : ""}`}
            onClick={() => setSelected("Dashboard")}
          >
            <span className="nav-icon"><IconDashboard size={19} /></span>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${selected === "Doctor Consult" ? "active" : ""}`}
            onClick={() => setSelected("Doctor Consult")}
          >
            <span className="nav-icon"><IconStethoscope size={19} /></span>
            <span>Doctor Consult</span>
          </button>

          <button
            className={`nav-item ${selected === "Voice Companion" ? "active" : ""}`}
            onClick={() => setSelected("Voice Companion")}
          >
            <span className="nav-icon"><IconMic size={19} /></span>
            <span>Voice Companion</span>
          </button>

          <button
            className={`nav-item ${selected === "Patient Assessment" ? "active" : ""}`}
            onClick={() => setSelected("Patient Assessment")}
          >
            <span className="nav-icon"><IconAssessment size={19} /></span>
            <span>Clinical Triage</span>
          </button>

          <button
            className={`nav-item ${selected === "Age Checklist" ? "active" : ""}`}
            onClick={() => setSelected("Age Checklist")}
          >
            <span className="nav-icon"><IconShield size={19} /></span>
            <span>Age Checklist</span>
          </button>

          <button
            className={`nav-item ${selected === "Hospital Network" ? "active" : ""}`}
            onClick={() => setSelected("Hospital Network")}
          >
            <span className="nav-icon"><IconHospital size={19} /></span>
            <span>Concentric Locator</span>
          </button>

          <button
            className={`nav-item ${selected === "Medical Streams" ? "active" : ""}`}
            onClick={() => setSelected("Medical Streams")}
          >
            <span className="nav-icon"><IconPill size={19} /></span>
            <span>Expense & Streams</span>
          </button>

          <button
            className={`nav-item ${selected === "Emergency" ? "active" : ""}`}
            onClick={() => setSelected("Emergency")}
          >
            <span className="nav-icon"><IconEmergency size={19} /></span>
            <span>Emergency Grid</span>
          </button>

          <button
            className={`nav-item ${selected === "Patient History" ? "active" : ""}`}
            onClick={() => setSelected("Patient History")}
          >
            <span className="nav-icon"><IconRecord size={19} /></span>
            <span>Patient Record</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="network-status">
            <div className="status-dot-container">
              <div className="status-dot"></div>
              <div className="status-dot-pulse"></div>
            </div>
            <div>
              <strong>Offline-First (2G Sync)</strong>
              <span>ABDM Sandbox Connected</span>
            </div>
          </div>

          <div className="copyright">SIH 2026 • SteelBrains</div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-header">
          <div>
            <div className="eyebrow">SIH 2026 • HEALTHCARE INTELLIGENCE & COORDINATION</div>
            <h1>{pageTitle}</h1>
          </div>

          <div className="header-right">
            <div className="system-online">
              <span className="status-dot"></span>
              2G Cache Active
            </div>

            <button className="header-action-btn" title="Notifications">
              <IconBell size={18} />
              <span className="badge-dot"></span>
            </button>

            {/* VERIFIED USER PROFILE BUTTON */}
            <button
              className="user-profile-btn"
              onClick={() => setShowAuthModal(true)}
              title="Click to manage profile or re-authenticate via OTP"
            >
              <div className="user-avatar-circle">
                {user.name.charAt(0)}
              </div>
              <div className="user-info-text">
                <span className="user-name-label">{user.name}</span>
                <span className="user-meta-label">
                  {user.age} yrs • {user.gender} • OTP Verified ✓
                </span>
              </div>
            </button>
          </div>
        </header>

        <div className="content-area">
          {selected === "Dashboard" && (
            <Dashboard
              user={user}
              assessmentData={assessmentData}
              selectedFacility={selectedFacility}
              onNavigate={setSelected}
              onOpenAuth={() => setShowAuthModal(true)}
              onStartVideoCall={(doc) => setActiveVideoCallDoctor(doc)}
            />
          )}

          {selected === "Doctor Consult" && (
            <DoctorConsultModule
              user={user}
              onStartVideoCall={(doc) => setActiveVideoCallDoctor(doc)}
              onBookAppointment={(doc) => setBookingModalDoctor(doc)}
            />
          )}

          {selected === "Patient Assessment" && (
            <PatientAssessment
              user={user}
              onAssessmentComplete={handleAssessmentComplete}
              onOpenFacilityMatching={() => setSelected("Hospital Network")}
            />
          )}

          {selected === "Voice Companion" && (
            <VoiceCompanionView
              user={user}
              onStartVideoCall={(doc) => setActiveVideoCallDoctor(doc)}
              onBookAppointment={(doc) => setBookingModalDoctor(doc)}
              onNavigate={setSelected}
            />
          )}

          {selected === "Age Checklist" && (
            <AgeChecklistModule user={user} />
          )}

          {selected === "Hospital Network" && (
            <FacilityMatching
              assessmentData={assessmentData}
              selectedFacility={selectedFacility}
              setSelectedFacility={setSelectedFacility}
              onBackToAssessment={() => setSelected("Patient Assessment")}
              onOpenEmergency={() => setSelected("Emergency")}
            />
          )}

          {selected === "Medical Streams" && (
            <MedicalStreamsModule />
          )}

          {selected === "Emergency" && (
            <Emergency
              assessmentData={assessmentData}
              selectedFacility={selectedFacility}
              onOpenPatientRecord={() => setSelected("Patient History")}
            />
          )}

          {selected === "Patient History" && (
            <PatientHistory
              user={user}
              assessmentData={assessmentData}
              selectedFacility={selectedFacility}
              onNewAssessment={() => setSelected("Patient Assessment")}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}
        </div>

        <footer className="page-footer">
          <span>JEEVAN-NET / ArogyaNexus • Team SteelBrains</span>
          <span>SIH 2026 Prototype • Verified ABDM Health ID: {user.abhaId}</span>
        </footer>
      </main>
    </div>
  );
}

/* =========================================================
   OTP VERIFICATION & LOGIN MODAL PORTAL
========================================================= */

function AuthModal({ initialUser, onComplete, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: initialUser.name || "",
    age: initialUser.age || "",
    gender: initialUser.gender || "Male",
    email: initialUser.email || "",
    contact: initialUser.contact || "",
  });

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [demoCode] = useState("789210");
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.email || !formData.contact) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    setStep(2);
    setTimer(30);
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleFillDemo = () => {
    setOtpDigits(["7", "8", "9", "2", "1", "0"]);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const entered = otpDigits.join("");
    if (entered.length < 6) {
      setError("Please enter complete 6-digit OTP.");
      return;
    }

    setError("");
    const abhaNumber = `ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    onComplete({
      ...formData,
      abhaId: initialUser.abhaId || abhaNumber,
      isVerified: true,
    });
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-logo">
              <IconLogo size={22} color="#ffffff" />
            </div>
            <div>
              <h2>JEEVAN-NET Patient Portal</h2>
              <span className="brand-subtitle">ArogyaNexus Verification</span>
            </div>
          </div>
          <p>
            {step === 1
              ? "Enter your personal details to initiate secure OTP verification and link with ABDM Sandbox."
              : `Enter the 6-digit OTP code sent to ${formData.contact} and ${formData.email}`}
          </p>
        </div>

        <div className="auth-body">
          {error && (
            <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
              ⚠️ {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="auth-form-grid">
                <div className="auth-field-full">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconUser size={16} /></span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="auth-label">Age (Years)</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconClock size={16} /></span>
                    <input
                      type="number"
                      className="auth-input"
                      placeholder="e.g. 56"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="auth-label">Gender</label>
                  <select
                    className="auth-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender/Other">Other</option>
                  </select>
                </div>

                <div className="auth-field-full">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconMail size={16} /></span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="rajesh.sharma@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field-full">
                  <label className="auth-label">Contact Mobile No.</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><IconPhone size={16} /></span>
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="+91 98765 43210"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Send Verification OTP →</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="demo-otp-banner">
                <div>
                  <div style={{ fontSize: "11px", color: "#0369a1", fontWeight: 700 }}>DEMO VERIFICATION OTP</div>
                  <div className="demo-otp-code">{demoCode}</div>
                </div>
                <button type="button" className="btn-fill-otp" onClick={handleFillDemo}>
                  Auto-fill 789210
                </button>
              </div>

              <label className="auth-label" style={{ textAlign: "center", display: "block" }}>Enter 6-Digit OTP</label>
              <div className="otp-box-container">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    className="otp-digit-input"
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                  />
                ))}
              </div>

              <div style={{ textAlign: "center", fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                {timer > 0 ? (
                  <span>Resend OTP in <strong>{timer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => setTimer(30)}
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Verify OTP & Sign In ✓</span>
              </button>

              <button
                type="button"
                style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: "12px", fontSize: "13px", cursor: "pointer" }}
                onClick={() => setStep(1)}
              >
                ← Back to Edit Details
              </button>
            </form>
          )}

          <div className="auth-footer-note">
            <IconLock size={13} /> Encrypted via ABDM Health ID Sandbox & Government Protocols
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DOCTOR TELECONSULTATION & APPOINTMENT BOOKING MODULE
========================================================= */

function DoctorConsultModule({ user, onStartVideoCall, onBookAppointment }) {
  const [search, setSearch] = useState("");

  const filteredDoctors = DOCTORS_LIST.filter(
    (doc) =>
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="doctor-consult-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">TELEMEDICINE & APPOINTMENT GRID</div>
            <h2>Connect with Doctors Online or Book Appointment</h2>
            <p className="muted">
              Consult top verified specialists via instant video call or schedule an in-person / online appointment.
            </p>
          </div>
          <div className="demo-badge">ABDM Telehealth Sandbox</div>
        </div>

        {/* SEARCH BAR */}
        <div style={{ display: "flex", gap: "12px", margin: "16px 0 8px" }}>
          <div className="auth-input-wrapper" style={{ flex: 1 }}>
            <span className="auth-input-icon"><IconSearch size={16} /></span>
            <input
              type="text"
              className="auth-input"
              placeholder="Search doctor by name, cardiology, endocrinology, hospital..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* DOCTORS GRID */}
        <div className="doctor-grid">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="doctor-card">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div className="doctor-avatar-box">{doc.avatar}</div>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "16px", color: "#0f172a" }}>{doc.name}</h3>
                      <span style={{ fontSize: "12.5px", color: "#0284c7", fontWeight: 600 }}>{doc.title}</span>
                      <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>{doc.degree} • {doc.experience}</div>
                    </div>
                  </div>

                  <span className={doc.isOnline ? "doctor-badge-online" : "doctor-badge-scheduled"}>
                    {doc.isOnline ? "● Live Video" : "📅 Scheduled"}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", fontSize: "12.5px", color: "#334155", marginBottom: "14px" }}>
                  <div>🏥 <strong>{doc.hospital}</strong></div>
                  <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                    <span>⭐ Rating: <strong>{doc.rating} / 5.0</strong></span>
                    <span>Fee: <strong style={{ color: "#16a34a" }}>{doc.fee}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {doc.isOnline ? (
                  <button
                    className="primary-button"
                    style={{ flex: 1, padding: "10px", fontSize: "13px", background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
                    onClick={() => onStartVideoCall(doc)}
                  >
                    <IconVideo size={15} /> Instant Video Call →
                  </button>
                ) : (
                  <button
                    className="secondary-button"
                    style={{ flex: 1, padding: "10px", fontSize: "13px" }}
                    onClick={() => onBookAppointment(doc)}
                  >
                    <IconCalendar size={15} /> Book Appointment
                  </button>
                )}

                <button
                  className="secondary-button"
                  style={{ padding: "10px 14px", fontSize: "13px" }}
                  onClick={() => onBookAppointment(doc)}
                  title="Book preferred time slot"
                >
                  📅 Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   LIVE VIDEO CALL SIMULATOR MODAL
========================================================= */

function LiveVideoCallModal({ doctor, user, onClose }) {
  const [callDuration, setCallDuration] = useState(0);
  const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-window">
        <div className="video-call-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
            <div>
              <strong style={{ fontSize: "16px", color: "#ffffff", display: "block" }}>{doctor.name} ({doctor.title})</strong>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Encrypted ABDM Video Consultation • Duration: {formatTime(callDuration)}</span>
            </div>
          </div>
          <button className="btn-end-call" onClick={onClose}>
            End Call 📵
          </button>
        </div>

        <div className="video-feed-grid">
          {/* DOCTOR VIDEO FEED */}
          <div className="doctor-video-box">
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)", display: "flex", alignItems: "center", justify: "center", fontSize: "28px", fontWeight: 700, marginBottom: "12px", boxShadow: "0 0 30px rgba(56, 189, 248, 0.4)" }}>
              {doctor.avatar}
            </div>
            <h4 style={{ margin: "0 0 4px", fontSize: "18px", color: "#ffffff" }}>{doctor.name}</h4>
            <span style={{ fontSize: "13px", color: "#38bdf8" }}>Consultation Live • Video Connected HD</span>

            <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: "#38bdf8" }}>
              💬 Doctor: "Hello {user.name}, I reviewed your vitals and symptom log. How can I help you today?"
            </div>
          </div>

          {/* PATIENT VIDEO FEED & DIGITAL PRESCRIPTION PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="patient-video-box" style={{ height: "160px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justify: "center", fontSize: "16px", fontWeight: 700 }}>
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "6px" }}>You ({user.name})</span>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>E-PRESCRIPTION ENGINE</div>
                {prescriptionGenerated ? (
                  <div style={{ marginTop: "8px", fontSize: "12.5px", color: "#86efac", background: "rgba(22, 163, 74, 0.2)", padding: "10px", borderRadius: "8px", border: "1px solid #22c55e" }}>
                    ✓ <strong>Digital Rx Generated (FHIR-RX-884102)</strong>
                    <div style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "4px" }}>1. Tab Sitagliptin 50mg (1-0-0)</div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>2. Tab Metformin 500mg (1-0-1)</div>
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: "6px 0" }}>Doctor can push instant digital prescriptions directly to your ABDM record.</p>
                )}
              </div>

              <button
                className="secondary-button"
                style={{ width: "100%", padding: "8px", fontSize: "12px", background: "#0284c7", color: "#ffffff", border: "none" }}
                onClick={() => setPrescriptionGenerated(true)}
              >
                <IconFileText size={14} /> {prescriptionGenerated ? "Prescription Saved ✓" : "Generate Digital Rx"}
              </button>
            </div>
          </div>
        </div>

        <div className="video-controls-bar">
          <button className="secondary-button" style={{ color: "white", borderColor: "rgba(255,255,255,0.2)" }}>🎤 Mute Mic</button>
          <button className="secondary-button" style={{ color: "white", borderColor: "rgba(255,255,255,0.2)" }}>📹 Mute Cam</button>
          <button className="btn-end-call" onClick={onClose}>End Call 📵</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   APPOINTMENT BOOKING MODAL
========================================================= */

function AppointmentBookingModal({ doctor, user, onClose }) {
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedSlot, setSelectedSlot] = useState("03:30 PM");
  const [consultType, setConsultType] = useState("Online Video Call");
  const [isBooked, setIsBooked] = useState(false);

  const handleConfirm = (e) => {
    e.preventDefault();
    setIsBooked(true);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card" style={{ maxWidth: "460px" }}>
        <div className="auth-header" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}>
          <h2 style={{ fontSize: "20px" }}>Book Doctor Appointment</h2>
          <p style={{ color: "#e0f2fe" }}>With {doctor.name} ({doctor.title})</p>
        </div>

        <div className="auth-body">
          {isBooked ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justify: "center", margin: "0 auto 16px" }}>
                <IconCheckCircle size={36} />
              </div>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Appointment Confirmed!</h3>
              <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
                Scheduled for <strong>{user.name}</strong> with <strong>{doctor.name}</strong> on <strong>{selectedDate} at {selectedSlot}</strong> via <strong>{consultType}</strong>.
              </p>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", marginTop: "16px", fontSize: "12px", color: "#0369a1", border: "1px solid #bae6fd" }}>
                📅 Calendar Invite & SMS notification sent to {user.contact}
              </div>
              <button className="auth-submit-btn" style={{ marginTop: "20px" }} onClick={onClose}>
                Done ✓
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirm}>
              <div style={{ marginBottom: "16px" }}>
                <label className="auth-label">Select Date</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Today", "Tomorrow", "Day After"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`range-tab-btn ${selectedDate === d ? "active" : ""}`}
                      style={{ flex: 1, padding: "8px", justifyContent: "center" }}
                      onClick={() => setSelectedDate(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="auth-label">Select Time Slot</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {["10:00 AM", "01:30 PM", "03:30 PM", "05:00 PM", "06:30 PM", "08:00 PM"].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`range-tab-btn ${selectedSlot === slot ? "active" : ""}`}
                      style={{ padding: "8px", justifyContent: "center", fontSize: "12px" }}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label className="auth-label">Consultation Mode</label>
                <select
                  className="auth-select"
                  value={consultType}
                  onChange={(e) => setConsultType(e.target.value)}
                >
                  <option value="Online Video Call">📹 Online Video Call (Teleconsultation)</option>
                  <option value="In-Person Clinic Visit">🏥 In-Person Clinic Visit ({doctor.hospital})</option>
                </select>
              </div>

              <button type="submit" className="auth-submit-btn">
                Confirm Appointment ({doctor.fee}) →
              </button>

              <button
                type="button"
                style={{ width: "100%", background: "none", border: "none", color: "#64748b", marginTop: "12px", fontSize: "13px", cursor: "pointer" }}
                onClick={onClose}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD COMPONENT
========================================================= */

function Dashboard({ user, assessmentData, selectedFacility, onNavigate, onOpenAuth, onStartVideoCall }) {
  const onlineDoc = DOCTORS_LIST[0];

  return (
    <div className="dashboard-grid">
      {/* HERO PANEL */}
      <section className="hero-panel">
        <div>
          <div className="section-label">ACTIVE CLINICAL MATRIX</div>
          <h2>
            Welcome back, {user.name}.
            <br />
            Coordinated Early Detection Grid.
          </h2>
          <p>
            JEEVAN-NET integrates <strong>Voice Companion (22+ languages)</strong>, <strong>Online Doctor Teleconsultation</strong>, and <strong>Government Age-Screening Protocols</strong>.
          </p>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
            <button className="primary-button" onClick={() => onNavigate("Doctor Consult")}>
              <IconStethoscope size={16} /> Connect Online Doctor →
            </button>
            <button className="secondary-button" onClick={() => onNavigate("Voice Companion")}>
              🎤 Voice Clinical Dictation
            </button>
          </div>
        </div>

        <div className="hero-symbol">+</div>
      </section>

      {/* VERIFIED PATIENT SUMMARY CARD */}
      <section className="panel" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", borderColor: "#bae6fd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="section-label" style={{ color: "#0369a1" }}>VERIFIED USER PROFILE</div>
            <h3 style={{ margin: "4px 0", color: "#0f172a" }}>{user.name} ({user.age} yrs, {user.gender})</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#0369a1" }}>
              Contact: <strong>{user.contact}</strong> • ABDM ID: <strong>{user.abhaId}</strong>
            </p>
          </div>
          <button className="secondary-button" onClick={onOpenAuth} style={{ background: "#ffffff", borderColor: "#38bdf8" }}>
            Edit / Re-verify OTP
          </button>
        </div>

        {/* SUGGESTED MANDATORY TESTS SUMMARY */}
        <div style={{ marginTop: "16px", borderTop: "1px dashed #7dd3fc", paddingTop: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", textTransform: "uppercase", marginBottom: "8px" }}>
            📋 MANDATORY TESTS SUGGESTED AS PER GOVT GUIDELINES (FOR AGE {user.age}, {user.gender.toUpperCase()})
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {getMandatedTests(user.age, user.gender).map((test, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid #7dd3fc", padding: "8px 12px", borderRadius: "8px", fontSize: "12.5px", color: "#0c4a6e" }}>
                <strong>{test.screening}</strong>: {test.testMethod} ({test.frequency})
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTANT ONLINE DOCTOR CALL BANNER */}
      <section className="panel" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderColor: "#86efac" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="section-label" style={{ color: "#15803d" }}>INSTANT TELECONSULTATION</div>
            <h3 style={{ margin: "4px 0", color: "#0f172a" }}>Available Specialist: {onlineDoc.name} ({onlineDoc.title})</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
              Start an instant video consultation or book a clinic slot.
            </p>
          </div>
          <button
            className="primary-button"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
            onClick={() => onStartVideoCall(onlineDoc)}
          >
            <IconVideo size={16} /> Start Video Call Now →
          </button>
        </div>
      </section>

      {/* STROKE JOURNEY COMPARISON SHORTCUT */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CLINICAL STROKE TIMELINE COMPARISON</div>
            <h3>Traditional 210 Mins Delay vs JEEVAN-NET 45 Mins Grid</h3>
          </div>
        </div>

        <div className="stroke-comparison-grid">
          <div className="journey-card-baseline">
            <div style={{ color: "#dc2626", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
              ⚠️ BASELINE TRADITIONAL JOURNEY (210 MINS DELAY)
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#7f1d1d", lineHeight: "1.6" }}>
              <li>Home delays: Symptom confusion handled with home remedies</li>
              <li>Blind Taxi Travel: Transferred to closest basic clinic without CT readiness</li>
              <li>Equipment Fail: Lack of CT/ICU routes patient to ER A</li>
              <li>Severe risk of permanent neurological deficit</li>
            </ul>
          </div>

          <div className="journey-card-jeevan">
            <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
              ⚡ JEEVAN-NET COORDINATED GRID (45 MINS TO ER)
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#14532d", lineHeight: "1.6" }}>
              <li>Instant Onset Timestamp: Companion logs symptom onset immediately</li>
              <li>Oxygen ALS Ambulance: Dispatches nearest capable transport</li>
              <li>Concentric Route: ICU & CT availability locked en-route</li>
              <li>Rapid thrombolytic treatment; high stroke survival</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   GOVT-COMPLIANT AGE CHECKLIST MODULE
========================================================= */

function AgeChecklistModule({ user }) {
  const userAge = Number(user.age) || 56;
  const userGender = user.gender || "Male";
  const [activeGenderTab, setActiveGenderTab] = useState(
    userGender.toLowerCase().includes("female") ? "Female" : "Male"
  );

  const mandatedForUser = getMandatedTests(userAge, userGender);

  const ageTiers = [
    {
      tier: "20+",
      minAge: 20,
      title: "Age 20+ Baseline Screening",
      mandates: ["Vital Signs Baseline", "BMI & Obesity Checks", "Lifestyle Risk Audit"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "30+",
      minAge: 30,
      title: "Age 30+ Anemia & Hypertension",
      mandates: ["Hemoglobin / Anemia Profile", "BP Baseline Screening (Hypertension)", "Blood Glucose / Glucometer (Diabetes)", "Oral Visual Examination OVE (Oral Cancer)"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "40+",
      minAge: 40,
      title: "Age 40+ Cardiac & Lipid Profile",
      mandates: ["Lipid Profile (Cholesterol / Triglycerides)", "Cardiac ECG Baseline", "Renal Function Pre-panel"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "50+",
      minAge: 50,
      title: "Age 50+ Glucose & Stress Panels",
      mandates: ["Fasting / PP Blood Glucose", "HbA1c Glycated Hemoglobin", "Cardiac Stress Panel"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "60+",
      minAge: 60,
      title: "Age 60+ Metabolic & Bone Scans",
      mandates: ["Full Metabolic Panel", "DEXA Bone Density Scan", "Vision & Hearing Screening"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
    {
      tier: "70+",
      minAge: 70,
      title: "Age 70+ Cognitive & Holistic Tracking",
      mandates: ["Cognitive Function Tracking", "Fall Risk & Balance Audit", "Comprehensive Geriatric Screening"],
      guideline: "Mandated under Government of India Preventive Healthcare Guidelines.",
    },
  ];

  return (
    <div className="age-checklist-page">
      {/* HIGHLIGHT BANNER FOR REGISTERED USER */}
      <section className="panel" style={{ background: "linear-gradient(135deg, #0b1727 0%, #0f243e 100%)", color: "#ffffff", border: "1px solid #38bdf8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="section-label" style={{ color: "#38bdf8" }}>REGISTERED USER MANDATED SUGGESTIONS</div>
            <h2 style={{ margin: "4px 0", color: "#ffffff" }}>
              Suggested Mandatory Tests for {user.name} ({userAge} yrs, {userGender})
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "#94a3b8" }}>
              Based on your registered age (<strong>{userAge} years</strong>) and gender (<strong>{userGender}</strong>), the Government of India NPCDCS framework mandates the following tests:
            </p>
          </div>
          <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid #38bdf8", padding: "8px 16px", borderRadius: "10px", color: "#38bdf8", fontWeight: 700, fontSize: "13px" }}>
            {mandatedForUser.length} Mandatory Tests Due
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginTop: "20px" }}>
          {mandatedForUser.map((item, idx) => (
            <div key={idx} style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "14px", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>{item.screening}</span>
                <span style={{ background: "#0284c7", color: "#ffffff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>{item.frequency}</span>
              </div>
              <strong style={{ fontSize: "14px", color: "#ffffff", display: "block" }}>{item.testMethod}</strong>
              <span style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px", display: "block" }}>Age Category: {item.ageGroup}</span>
            </div>
          ))}
        </div>
      </section>

      {/* OFFICIAL GOVERNMENT TABLES MATRIX */}
      <section className="panel" style={{ marginTop: "24px" }}>
        <div className="panel-header">
          <div>
            <div className="section-label">GOVERNMENT OF INDIA NCD SCREENING MATRIX</div>
            <h2>Mandated Screening Table by Age & Gender</h2>
            <p className="muted">
              Official GoI Population-based NCD Screening Guidelines (NPCDCS).
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className={`secondary-button ${activeGenderTab === "Female" ? "primary-button" : ""}`}
              onClick={() => setActiveGenderTab("Female")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              👩 FEMALE GUIDELINES
            </button>

            <button
              className={`secondary-button ${activeGenderTab === "Male" ? "primary-button" : ""}`}
              onClick={() => setActiveGenderTab("Male")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              👨 MALE GUIDELINES
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Age Group</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Screening</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Test / Method</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Frequency</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Mandate Status</th>
              </tr>
            </thead>
            <tbody>
              {GOI_NCD_GUIDELINES[activeGenderTab].map((row, idx) => {
                const isMatchingUserAge =
                  (userAge < 30 && row.ageGroup === "<30") ||
                  (userAge >= 30 && userAge <= 65 && row.ageGroup === "30–65") ||
                  (userAge > 65 && row.ageGroup === ">65");

                const isCurrentGenderMatch = userGender.toLowerCase().includes(activeGenderTab.toLowerCase());

                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      background: isMatchingUserAge && isCurrentGenderMatch ? "#f0f9ff" : "transparent",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: isMatchingUserAge ? 700 : 500, color: isMatchingUserAge ? "#0284c7" : "#0f172a" }}>
                      {row.ageGroup}
                      {isMatchingUserAge && isCurrentGenderMatch && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", background: "#0284c7", color: "#ffffff", padding: "2px 6px", borderRadius: "4px" }}>
                          YOUR AGE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{row.screening}</td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>
                      <strong>{row.testMethod}</strong>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{row.frequency}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: row.status.includes("Mandatory") ? "#dcfce7" : "#f1f5f9",
                          color: row.status.includes("Mandatory") ? "#15803d" : "#475569",
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   INTERACTIVE VOICE COMPANION MODULE (WITH SYMPTOM REASONING)
========================================================= */

function VoiceCompanionView({ user, onStartVideoCall, onBookAppointment, onNavigate }) {
  const [selectedLang, setSelectedLang] = useState("hi-IN");
  const [isListening, setIsListening] = useState(false);
  const [inputSpeech, setInputSpeech] = useState("");
  const [clinicalResponse, setClinicalResponse] = useState(null);

  const samplePrompts = [
    { text: "Mera PP blood sugar 323 mg/dL hai, bohot pyaas aur pasina aa raha hai", label: "Glucose 323 + Thirst + Sweating" },
    { text: "Chhati me bohot tez dard hai aur saans lene me takleef ho rahi hai", label: "Chest Pain + Dyspnea" },
    { text: "Bohot chakkaar aa raha hai, bolne me dikkat aur ek taraf kamzori hai", label: "Dizziness + Slurred Speech (Stroke)" },
    { text: "Bohot tez bukhar 102F hai aur sharir me dard hai", label: "High Fever 102°F" },
  ];

  const processSymptoms = (text) => {
    setInputSpeech(text);
    const lower = text.toLowerCase();

    let res = {
      detectedSymptoms: [],
      severity: "MODERATE",
      diagnosis: "General Clinical Assessment Required",
      firstAidRemedies: [],
      clarificationQuestions: [],
      recommendedAction: "",
      suggestedDoctor: DOCTORS_LIST[0],
      isEmergency: false,
    };

    if (lower.includes("sugar") || lower.includes("323") || lower.includes("pyaas") || lower.includes("pasina") || lower.includes("glucose")) {
      res.detectedSymptoms = ["Severe Hyperglycemia (PP Glucose 323 mg/dL)", "Polydipsia (Excessive Thirst)", "Diaphoresis (Sweating)"];
      res.severity = "HIGH";
      res.diagnosis = "Acute Hyperglycemic Crisis / Diabetes Triage Alert";
      res.firstAidRemedies = [
        "1. Sip 500ml water immediately to aid glucose renal clearance.",
        "2. Rest in a cool shaded room and avoid high-carb intake.",
        "3. Administer prescribed insulin/medication if recommended by your endocrinologist.",
        "4. Conduct urine ketone check if available.",
      ];
      res.clarificationQuestions = [
        "Are you experiencing any nausea, vomiting, or fruity breath odor?",
        "Is your vision blurred or disoriented?",
      ];
      res.recommendedAction = "Urgent Video Teleconsultation with Endocrinologist or Hospital Intake.";
      res.suggestedDoctor = DOCTORS_LIST[1]; // Dr. Vikram Rao
    } else if (lower.includes("dard") || lower.includes("chhati") || lower.includes("chest") || lower.includes("saans")) {
      res.detectedSymptoms = ["Acute Chest Pain (Angina Risk)", "Shortness of Breath (Dyspnea)"];
      res.severity = "CRITICAL HIGH";
      res.diagnosis = "Possible Acute Coronary Syndrome / Cardiac Triage";
      res.firstAidRemedies = [
        "1. Stop all physical activity immediately and sit upright.",
        "2. Loosen tight clothing around chest and neck.",
        "3. Take sublingual nitroglycerin if previously prescribed.",
        "4. Prepare for immediate emergency hospital dispatch.",
      ];
      res.clarificationQuestions = [
        "Does the pain radiate to your left jaw, neck, or left arm?",
        "Are you experiencing cold sweats?",
      ];
      res.recommendedAction = "CRITICAL: Immediate ALS Ambulance Dispatch & Senior Cardiologist Pre-alert.";
      res.suggestedDoctor = DOCTORS_LIST[0]; // Dr. Ananya Sen
      res.isEmergency = true;
    } else if (lower.includes("chakkaar") || lower.includes("kamzori") || lower.includes("stroke") || lower.includes("bolne")) {
      res.detectedSymptoms = ["Sudden Dizziness", "Unilateral Weakness", "Speech Difficulty"];
      res.severity = "CRITICAL HIGH";
      res.diagnosis = "Possible Acute Ischemic Stroke (FAST Protocol Active)";
      res.firstAidRemedies = [
        "1. Note the EXACT onset time immediately.",
        "2. Keep patient lying down with head slightly elevated.",
        "3. Do NOT give food, fluids, or blood pressure lowering pills by mouth.",
        "4. Dispatch emergency ambulance immediately.",
      ];
      res.clarificationQuestions = [
        "Can the patient smile symmetrically?",
        "Can the patient raise both arms equally?",
      ];
      res.recommendedAction = "CRITICAL STROKE ALERT: Dispatch ALS Oxygen Transport to Stroke Unit.";
      res.suggestedDoctor = DOCTORS_LIST[3]; // Dr. Rajesh Verma
      res.isEmergency = true;
    } else {
      res.detectedSymptoms = ["Fever / General Maladaptive Symptoms"];
      res.severity = "MODERATE";
      res.diagnosis = "Infectious / Inflammatory Evaluation Required";
      res.firstAidRemedies = [
        "1. Stay hydrated with ORS or warm water.",
        "2. Use cold compress on forehead if fever > 101°F.",
        "3. Monitor temperature every 4 hours.",
      ];
      res.clarificationQuestions = ["How many days have you had this fever?", "Any chills or rash?"];
      res.recommendedAction = "Online Physician Teleconsultation Suggested.";
      res.suggestedDoctor = DOCTORS_LIST[2]; // Dr. Sunita Patil
    }

    setClinicalResponse(res);

    // Speak audio output via SpeechSynthesis
    if ("speechSynthesis" in window) {
      const speechText = `Triage Assessment: ${res.diagnosis}. ${res.recommendedAction}. Remedies: ${res.firstAidRemedies.join(" ")}`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = selectedLang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceMic = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        processSymptoms("Mera PP blood sugar 323 mg/dL hai, bohot pyaas aur pasina aa raha hai");
      }, 2000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      processSymptoms(text);
    };

    recognition.start();
  };

  return (
    <div className="voice-companion-page">
      <div className="voice-companion-box">
        <div className="voice-header">
          <div>
            <div className="section-label" style={{ color: "#38bdf8" }}>AI VOICE CLINICAL COMPANION</div>
            <h3 style={{ margin: "4px 0 0" }}>Interactive Voice Symptom Assessment</h3>
          </div>

          <select
            className="lang-select-dropdown"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            {INDIAN_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        <p style={{ fontSize: "13.5px", color: "#94a3b8", textAlign: "center", marginBottom: "16px" }}>
          Speak or type your symptoms. The companion analyzes symptoms, provides first-aid remedies, asks follow-up questions, and connects you with online doctors!
        </p>

        {/* QUICK PROMPT SAMPLE BUTTONS */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              className="secondary-button"
              style={{ fontSize: "11.5px", padding: "6px 12px", background: "rgba(255,255,255,0.08)", color: "#38bdf8", borderColor: "rgba(56,189,248,0.3)" }}
              onClick={() => processSymptoms(p.text)}
            >
              🎤 {p.label}
            </button>
          ))}
        </div>

        <button
          className={`voice-mic-btn ${isListening ? "listening" : ""}`}
          onClick={handleVoiceMic}
        >
          <IconMic size={28} />
        </button>

        <div style={{ textAlign: "center", fontSize: "13px", fontWeight: 600, color: isListening ? "#ef4444" : "#cbd5e1" }}>
          {isListening ? "Listening... Speak your symptoms clearly" : "Tap Microphone to Speak Symptoms"}
        </div>

        {/* INPUT SPEECH TRANSCRIPT & CLINICAL AI RESPONSE */}
        {inputSpeech && (
          <div style={{ marginTop: "24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>SPOKEN SYMPTOM TRANSCRIPT</div>
            <p style={{ margin: "6px 0 16px", fontSize: "15px", color: "#ffffff", fontWeight: 600 }}>"{inputSpeech}"</p>

            {clinicalResponse && (
              <div>
                <div style={{ background: clinicalResponse.isEmergency ? "rgba(239,68,68,0.2)" : "rgba(2,132,199,0.2)", border: `1px solid ${clinicalResponse.isEmergency ? "#ef4444" : "#38bdf8"}`, padding: "14px", borderRadius: "12px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: clinicalResponse.isEmergency ? "#fca5a5" : "#7dd3fc", textTransform: "uppercase" }}>
                    AI CLINICAL ASSESSMENT • {clinicalResponse.severity}
                  </div>
                  <h3 style={{ margin: "4px 0", color: "#ffffff" }}>{clinicalResponse.diagnosis}</h3>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#e2e8f0" }}>{clinicalResponse.recommendedAction}</p>
                </div>

                {/* FIRST AID & REMEDIES */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", marginBottom: "8px" }}>
                    🩺 RECOMMENDED FIRST-AID & REMEDIES
                  </div>
                  {clinicalResponse.firstAidRemedies.map((rem, i) => (
                    <div key={i} style={{ fontSize: "13px", color: "#f8fafc", margin: "4px 0" }}>{rem}</div>
                  ))}
                </div>

                {/* FOLLOW UP CLARIFICATION QUESTIONS */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "10px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11.5px", color: "#fbbf24", fontWeight: 700, textTransform: "uppercase" }}>
                    ❓ FOLLOW-UP CLINICAL CLARIFICATION QUESTIONS
                  </div>
                  {clinicalResponse.clarificationQuestions.map((q, i) => (
                    <div key={i} style={{ fontSize: "12.5px", color: "#fef08a", marginTop: "4px" }}>• {q}</div>
                  ))}
                </div>

                {/* ACTION CONNECTORS */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                  <button
                    className="primary-button"
                    style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", fontSize: "13px" }}
                    onClick={() => onStartVideoCall(clinicalResponse.suggestedDoctor)}
                  >
                    <IconVideo size={16} /> Instant Video Call with {clinicalResponse.suggestedDoctor.name} →
                  </button>

                  <button
                    className="secondary-button"
                    style={{ color: "#ffffff", borderColor: "#38bdf8", background: "transparent", fontSize: "13px" }}
                    onClick={() => onBookAppointment(clinicalResponse.suggestedDoctor)}
                  >
                    <IconCalendar size={16} /> Book Appointment
                  </button>

                  {clinicalResponse.isEmergency && (
                    <button
                      className="primary-button"
                      style={{ background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)", fontSize: "13px" }}
                      onClick={() => onNavigate("Emergency")}
                    >
                      🚑 Dispatch Emergency Ambulance →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PATIENT CLINICAL ASSESSMENT FORM
========================================================= */

function PatientAssessment({ user, onAssessmentComplete, onOpenFacilityMatching }) {
  const [form, setForm] = useState({
    ...defaultForm,
    age: user.age || "56",
    gender: user.gender || "Male",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const analyze = async () => {
    setLoading(true);
    const local = localTriage(form);
    const backend = await assessPatient(form);

    const combined = {
      ...backend,
      localScore: local.score,
      localLevel: local.level,
      indicators: local.indicators,
      action: local.action,
      risk_level: local.level,
    };

    setResult(combined);
    onAssessmentComplete({
      form: { ...form },
      result: combined,
      assessedAt: new Date().toLocaleString(),
    });
    setLoading(false);
  };

  return (
    <div className="assessment-layout">
      <section className="panel assessment-panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CLINICAL TRIAGE & REMEDY PIPELINE</div>
            <h2>Patient Parameter Intake</h2>
            <p className="muted">
              Pre-filled from verified user profile ({user.name}, {user.age} yrs, {user.gender}).
            </p>
          </div>
          <div className="demo-badge">LIVE CLINICAL LOOP</div>
        </div>

        {/* SUGGESTED MANDATORY TESTS ALERT BOX */}
        <div style={{ background: "#f0f9ff", border: "1.5px solid #0284c7", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#0369a1", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <IconShield size={14} /> MANDATORY GOVT NCD TESTS SUGGESTED (AGE {form.age}, {form.gender.toUpperCase()})
          </div>
          <div style={{ fontSize: "13px", color: "#0c4a6e" }}>
            As per Government guidelines for <strong>{form.gender}</strong> aged <strong>{form.age} years</strong>:
            <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
              {getMandatedTests(form.age, form.gender).map((test, i) => (
                <li key={i} style={{ margin: "3px 0" }}>
                  <strong>{test.screening}</strong> ({test.testMethod}) — <span style={{ color: "#0284c7", fontWeight: 600 }}>{test.frequency}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="form-grid">
          <Field label="Age" value={form.age} onChange={(v) => updateField("age", v)} />

          <div className="field">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <Field label="Systolic BP (mmHg)" value={form.systolic} onChange={(v) => updateField("systolic", v)} />
          <Field label="Diastolic BP (mmHg)" value={form.diastolic} onChange={(v) => updateField("diastolic", v)} />
          <Field label="Heart Rate (bpm)" value={form.heartRate} onChange={(v) => updateField("heartRate", v)} />
          <Field label="SpO₂ (%)" value={form.spo2} onChange={(v) => updateField("spo2", v)} />
          <Field label="Temperature (°C)" value={form.temperature} onChange={(v) => updateField("temperature", v)} />

          <div className="field">
            <label>Glucose Test Type</label>
            <select value={form.glucoseType} onChange={(e) => updateField("glucoseType", e.target.value)}>
              <option value="PP">Post-Prandial (PP)</option>
              <option value="Fasting">Fasting</option>
              <option value="Regular">Regular / Random</option>
            </select>
          </div>

          <Field label="Blood Glucose (mg/dL)" value={form.glucose} onChange={(v) => updateField("glucose", v)} />
        </div>

        <div className="symptoms-section">
          <div className="section-label">REPORTED SYMPTOMS AUDIT</div>
          <div className="symptoms-grid">
            <Checkbox label="Confusion / Disorientation" checked={form.confusion} onChange={(v) => updateField("confusion", v)} />
            <Checkbox label="Excessive Thirst (Polydipsia)" checked={form.thirst} onChange={(v) => updateField("thirst", v)} />
            <Checkbox label="Profuse Sweating" checked={form.sweating} onChange={(v) => updateField("sweating", v)} />
            <Checkbox label="Chest Pain (Angina)" checked={form.chestPain} onChange={(v) => updateField("chestPain", v)} />
            <Checkbox label="Breathing Difficulty" checked={form.breathingDifficulty} onChange={(v) => updateField("breathingDifficulty", v)} />
            <Checkbox label="Sudden Weakness" checked={form.weakness} onChange={(v) => updateField("weakness", v)} />
          </div>
        </div>

        <button className="primary-button analyze-button" onClick={analyze} disabled={loading}>
          {loading ? "Processing Quantum ML Triage..." : "Analyze Patient Triage →"}
        </button>
      </section>

      {result && <Result result={result} onOpenFacilityMatching={onOpenFacilityMatching} />}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Result({ result, onOpenFacilityMatching }) {
  const isHigh = result.risk_level === "HIGH";

  return (
    <section className="panel result-panel">
      <div className="section-label">HYBRID TRIAGE OUTPUT</div>
      <div className={`risk-banner ${isHigh ? "risk-high" : "risk-normal"}`}>
        <div>
          <span>RISK LEVEL</span>
          <strong>{result.risk_level} RISK</strong>
        </div>
        <div className="risk-score">
          {result.localScore ?? result.prototype_rule_score}
          <small>/15</small>
        </div>
      </div>

      <div className="result-section">
        <h4>Risk Indicators & Clinical Outcomes</h4>
        <div className="indicator-list">
          {(result.indicators || []).map((indicator, index) => (
            <div className="indicator" key={index}>
              <span>✓</span> {indicator}
            </div>
          ))}
        </div>
      </div>

      <div className="action-box">
        <span>RECOMMENDED CLINICAL FIRST-AID & REMEDY</span>
        <strong>{result.action}</strong>
      </div>

      <div className="hybrid-box">
        <div className="section-label">HYBRID QUANTUM MACHINE LEARNING CONFIDENCE</div>
        <div className="model-grid">
          <div>
            <span>Classical Model</span>
            <strong>{result.classical_probability != null ? `${result.classical_probability}%` : "88.2%"}</strong>
          </div>
          <div>
            <span>Quantum-Classical Model</span>
            <strong>{result.hybrid_probability}%</strong>
          </div>
        </div>
      </div>

      <button className="primary-button facility-next-button" onClick={onOpenFacilityMatching}>
        Match Concentric Facilities →
      </button>
    </section>
  );
}

/* =========================================================
   CONCENTRIC FACILITY LOCATOR
========================================================= */

function FacilityMatching({ assessmentData, selectedFacility, setSelectedFacility, onBackToAssessment, onOpenEmergency }) {
  const [rangeFilter, setRangeFilter] = useState("ALL");

  const riskLevel = assessmentData?.result?.risk_level || "HIGH";
  const rankedFacilities = getFacilityMatches(riskLevel, rangeFilter);
  const recommended = rankedFacilities[0] || facilitiesDatabase[0];

  return (
    <div className="facility-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CONCENTRIC GEOSPATIAL LOCATOR METRIC</div>
            <h2>Healthcare Facilities Lookup</h2>
            <p className="muted">
              Lookup facilities by concentric radius ranges with real-time bed availability and ratings.
            </p>
          </div>
          <div className="demo-badge">CONCENTRIC RADIAL LOOKUP</div>
        </div>

        {/* RADIUS RANGE SELECTOR TABS */}
        <div className="concentric-range-bar">
          <button
            className={`range-tab-btn ${rangeFilter === "ALL" ? "active" : ""}`}
            onClick={() => setRangeFilter("ALL")}
          >
            <IconMapPin size={15} /> All Ranges (1-6 km)
          </button>

          <button
            className={`range-tab-btn ${rangeFilter === "1-3km" ? "active" : ""}`}
            onClick={() => setRangeFilter("1-3km")}
          >
            Range 1: Within 1km - 3km
          </button>

          <button
            className={`range-tab-btn ${rangeFilter === "3-5km" ? "active" : ""}`}
            onClick={() => setRangeFilter("3-5km")}
          >
            Range 2: Within 3km - 5km
          </button>

          <button
            className={`range-tab-btn ${rangeFilter === "5-6km" ? "active" : ""}`}
            onClick={() => setRangeFilter("5-6km")}
          >
            Range 3: Extended 5km - 6km
          </button>
        </div>
      </section>

      {/* TOP MATCH */}
      {recommended && (
        <section className="panel recommended-facility">
          <div className="recommended-header">
            <div>
              <div className="section-label">TOP CONCENTRIC MATCH</div>
              <h2>{recommended.name}</h2>
              <p className="muted">
                <span className={recommended.sector === "Govt" ? "sector-badge-govt" : "sector-badge-private"}>
                  {recommended.sector}
                </span>{" "}
                • {recommended.type} ({recommended.rangeCategory})
              </p>
            </div>
            <div className="facility-match-score">
              <div>{recommended.match}%</div>
              <span>MATCH</span>
            </div>
          </div>

          <div className="facility-stats">
            <div className="facility-stat">
              <span>Distance</span>
              <strong>{recommended.distance}</strong>
            </div>
            <div className="facility-stat">
              <span>ETA</span>
              <strong>{recommended.eta} min</strong>
            </div>
            <div className="facility-stat">
              <span>Free Beds</span>
              <strong>{recommended.beds} / {recommended.totalBeds}</strong>
            </div>
            <div className="facility-stat">
              <span>Govt / Private Rating</span>
              <strong>⭐ {recommended.rating} / 5.0</strong>
            </div>
          </div>

          <div className="facility-actions">
            <button className="primary-button" onClick={() => setSelectedFacility(recommended)}>
              {selectedFacility?.id === recommended.id ? "✓ Facility Selected" : "Select Facility"}
            </button>
            <button className="secondary-button" onClick={onBackToAssessment}>
              ← Back to Assessment
            </button>
          </div>
        </section>
      )}

      {/* OTHER FACILITIES */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">ALL MATCHED FACILITIES IN RADIUS</div>
            <h3>Government & Private Facilities Matrix</h3>
          </div>
        </div>

        <div className="alternative-list">
          {rankedFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              selected={selectedFacility?.id === facility.id}
              onSelect={() => setSelectedFacility(facility)}
            />
          ))}
        </div>
      </section>

      {selectedFacility && (
        <section className="panel confirmed-panel">
          <div>
            <div className="section-label">DESTINATION CONFIRMED</div>
            <h3>{selectedFacility.name}</h3>
            <p className="muted">Ready to initiate dispatch & pre-alert emergency team.</p>
          </div>
          <button className="primary-button" onClick={onOpenEmergency}>
            Proceed to Emergency Grid →
          </button>
        </section>
      )}
    </div>
  );
}

function FacilityCard({ facility, selected, onSelect }) {
  return (
    <div className={`facility-card ${selected ? "selected" : ""}`}>
      <div className="facility-card-header">
        <div>
          <strong>{facility.name}</strong>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            <span className={facility.sector === "Govt" ? "sector-badge-govt" : "sector-badge-private"}>
              {facility.sector}
            </span>{" "}
            • {facility.type}
          </span>
        </div>
        <div className="facility-card-match">
          <strong>{facility.match}%</strong>
          <span>MATCH</span>
        </div>
      </div>

      <div className="facility-card-info">
        <span>📍 {facility.distance} ({facility.rangeCategory})</span>
        <span>⏱ ETA {facility.eta} min</span>
        <span>🛏 {facility.beds} beds free</span>
        <span>⭐ {facility.rating} rating</span>
      </div>

      <button className="secondary-button" onClick={onSelect} style={{ marginTop: "10px", width: "100%" }}>
        {selected ? "✓ Facility Selected" : "Select Facility"}
      </button>
    </div>
  );
}

/* =========================================================
   MEDICAL STREAMS & EXPENSE MINIMIZATION
========================================================= */

function MedicalStreamsModule() {
  return (
    <div className="streams-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">CLINICAL STREAMS & EXPENSE MINIMIZATION</div>
            <h2>Integrated Medical Streams (Allopathy, Ayush & Homeopathy)</h2>
            <p className="muted">
              Minimizes patient out-of-pocket expenses by safely mapping cases to specific clinical streams.
            </p>
          </div>
        </div>

        <div className="medical-streams-progress">
          <div className="stream-bar-allopathy" style={{ width: "55%" }}>
            Allopathy (55%)
          </div>
          <div className="stream-bar-ayurveda" style={{ width: "30%" }}>
            Ayurvedic (30%)
          </div>
          <div className="stream-bar-homeopathy" style={{ width: "15%" }}>
            Homeopathy (15%)
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "20px" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#1d4ed8" }}>Allopathy Stream (55%)</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#1e40af" }}>
              <strong>90% Emergency & Acute allocation</strong>. Mandatory for acute cardiac, stroke, and trauma triage.
            </p>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#15803d" }}>Ayurvedic Stream (30%)</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
              <strong>50% Long-Term / Chronic care allocation</strong>. Specialized for metabolic maintenance & diabetes management.
            </p>
          </div>

          <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 6px", color: "#a16207" }}>Homeopathy Stream (15%)</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#854d0e" }}>
              <strong>30% Supportive Wellness allocation</strong>. Non-invasive complementary wellness support.
            </p>
          </div>
        </div>

        {/* ONDC / GENERIC MEDICINE DRUG COST SAVINGS WIDGET */}
        <div className="ondc-savings-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>
                ONDC & JAN AUSHADHI GENERIC DRUG COMPARATOR
              </div>
              <h3 style={{ margin: "4px 0", color: "#0f172a" }}>40% Reduction in Out-of-Pocket Patient Costs</h3>
            </div>
            <div style={{ background: "#16a34a", color: "white", padding: "6px 12px", borderRadius: "20px", fontWeight: 700, fontSize: "13px" }}>
              40% Out-of-Pocket Savings
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Branded Diabetes Drug (Januvia Sitagliptin)</div>
              <strong style={{ fontSize: "16px", color: "#dc2626" }}>₹ 350 / strip</strong>
            </div>

            <div style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #86efac" }}>
              <div style={{ fontSize: "12px", color: "#16a34a" }}>Generic Jan Aushadhi Sitagliptin (ONDC Network)</div>
              <strong style={{ fontSize: "16px", color: "#16a34a" }}>₹ 45 / strip (87% Savings)</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   EMERGENCY DISPATCH WORKFLOW
========================================================= */

function Emergency({ assessmentData, selectedFacility, onOpenPatientRecord }) {
  const [status, setStatus] = useState("Awaiting Dispatch");
  const facility = selectedFacility || facilitiesDatabase[0];

  const dispatch = () => {
    setStatus("Requested");
    setTimeout(() => {
      setStatus("Dispatched");
      setTimeout(() => {
        setStatus("En Route");
        setTimeout(() => {
          setStatus("Arrived at ER");
        }, 3500);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="emergency-page">
      <section className="panel emergency-header-panel">
        <div>
          <div className="section-label">EMERGENCY COORDINATION GRID</div>
          <h2>Oxygen ALS Ambulance Dispatch</h2>
          <p className="muted">Destination: <strong>{facility.name}</strong> ({facility.distance}, ETA {facility.eta} mins)</p>
        </div>
        <div className="demo-badge">LIVE SIMULATION MODE</div>
      </section>

      <section className="panel dispatch-panel">
        <div className="panel-header">
          <div>
            <div className="section-label">DISPATCH TIMELINE</div>
            <h3>Status: {status}</h3>
          </div>
        </div>

        <div className="dispatch-actions" style={{ marginTop: "16px" }}>
          {status === "Awaiting Dispatch" ? (
            <button className="primary-button" onClick={dispatch}>
              🚑 Dispatch Oxygen ALS Ambulance →
            </button>
          ) : status === "Arrived at ER" ? (
            <button className="primary-button" onClick={onOpenPatientRecord}>
              Open Patient Digital Record →
            </button>
          ) : (
            <div style={{ color: "#0284c7", fontWeight: 600 }}>
              Dispatch En-route... Pre-booking ICU Bed at {facility.name}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   PATIENT HISTORY / DIGITAL RECORD
========================================================= */

function PatientHistory({ user, assessmentData, selectedFacility, onNewAssessment, onOpenAuth }) {
  const patient = assessmentData?.form || defaultForm;

  return (
    <div className="history-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="section-label">DIGITAL HEALTH RECORD (ABDM CONNECTED)</div>
            <h2>Patient Clinical History</h2>
          </div>
          <button className="secondary-button" onClick={onOpenAuth}>
            Update Profile / OTP
          </button>
        </div>

        <div className="record-header">
          <div className="patient-avatar">{user.name.charAt(0)}</div>
          <div>
            <h3>{user.name}</h3>
            <p className="muted">Verified ABDM ID: {user.abhaId} • Contact: {user.contact}</p>
          </div>
        </div>
      </section>

      <div className="history-grid">
        <section className="panel">
          <div className="section-label">DEMOGRAPHICS</div>
          <div className="record-details">
            <RecordItem label="Age" value={`${user.age} years`} />
            <RecordItem label="Gender" value={user.gender} />
            <RecordItem label="Email" value={user.email} />
            <RecordItem label="Contact" value={user.contact} />
            <RecordItem label="ABDM Health ID" value={user.abhaId} />
          </div>
        </section>

        <section className="panel">
          <div className="section-label">TRIAGE ASSESSMENT</div>
          <div className="record-details">
            <RecordItem label="Blood Pressure" value={`${patient.systolic}/${patient.diastolic} mmHg`} />
            <RecordItem label="Heart Rate" value={`${patient.heartRate} bpm`} />
            <RecordItem label="SpO₂" value={`${patient.spo2}%`} />
            <RecordItem label="Glucose" value={`${patient.glucose} mg/dL (${patient.glucoseType || 'PP'})`} />
          </div>
        </section>
      </div>

      <section className="panel">
        <button className="primary-button" onClick={onNewAssessment}>
          Start New Clinical Assessment →
        </button>
      </section>
    </div>
  );
}

function RecordItem({ label, value }) {
  return (
    <div className="record-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   MOUNT ROOT
========================================================= */

createRoot(document.getElementById("root")).render(<App />);