import React, { useState, useEffect } from "react";
import { IconDashboard, IconAssessment, IconEmergency, IconHospital, IconRecord, IconLogo, IconBell, IconPill, IconShield, IconStethoscope, IconLogOut, IconChevronRight, IconUser, IconWifi } from "./Icons.jsx";
import { defaultUser } from "./data/patients.js";
import { AuthModal } from "./modals/AuthModal.jsx";
import { LiveVideoCallModal } from "./modals/LiveVideoCallModal.jsx";
import { AppointmentBookingModal } from "./modals/AppointmentBookingModal.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { DoctorConsultModule } from "./pages/DoctorConsultModule.jsx";
import { AgeChecklistModule } from "./pages/AgeChecklistModule.jsx";
import { VoiceCompanionView } from "./pages/VoiceCompanionView.jsx";
import { PatientAssessment } from "./pages/PatientAssessment.jsx";
import { FacilityMatching } from "./pages/FacilityMatching.jsx";
import { MedicalStreamsModule } from "./pages/MedicalStreamsModule.jsx";
import { Emergency } from "./pages/Emergency.jsx";
import { PatientHistory } from "./pages/PatientHistory.jsx";
import { Patients } from "./pages/Patients.jsx";
import { Setup } from "./pages/Setup.jsx";
import { Login } from "./pages/Login.jsx";
import { restoreSession, onAuthStateChange, signOutOfDatabase, toAppUser } from "./lib/auth.js";

// Local session flag. Used for the demo / guest paths, which deliberately work
// without a database. A real account session is held by Supabase Auth and
// restored through restoreSession() on mount.
const SESSION_KEY = "jeevan-net.session";

const readSession = () => {
  try {
    return window.localStorage.getItem(SESSION_KEY) === "true";
  } catch {
    return false;
  }
};

const writeSession = (value) => {
  try {
    if (value) window.localStorage.setItem(SESSION_KEY, "true");
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable: the session simply will not survive a reload.
  }
};

export function App() {
  const [signedIn, setSignedIn] = useState(readSession);
  const [user, setUser] = useState(defaultUser);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const [assessmentData, setAssessmentData] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeVideoCallDoctor, setActiveVideoCallDoctor] = useState(null);
  const [bookingModalDoctor, setBookingModalDoctor] = useState(null);
  // The patient from the register currently being viewed or assessed, if any.
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Restore a database session on load, then follow sign-in / sign-out events
  // so the UI cannot drift from the real session.
  useEffect(() => {
    let active = true;

    restoreSession()
      .then((restored) => {
        if (!active) return;
        if (restored) {
          setUser(restored);
          setSignedIn(true);
          setSelected("Dashboard");
        }
        setAuthChecked(true);
      })
      .catch(() => active && setAuthChecked(true));

    const unsubscribe = onAuthStateChange((event, authUser) => {
      if (event === "SIGNED_OUT") {
        setSignedIn(false);
        writeSession(false);
      }
      if (event === "SIGNED_IN" && authUser) {
        setUser((current) => (current?.email === authUser.email ? current : toAppUser(authUser)));
        setSignedIn(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSignIn = (signedInUser, keepSignedIn) => {
    setUser(signedInUser);
    setSignedIn(true);
    setSelected("Dashboard");
    // A database account keeps its own Supabase session; the local flag only
    // backs the demo and guest paths.
    writeSession(Boolean(keepSignedIn) && !signedInUser?.email?.includes?.("demo"));
  };

  const handleSignOut = () => {
    setSignedIn(false);
    setShowAuthModal(false);
    setActiveVideoCallDoctor(null);
    setBookingModalDoctor(null);
    setUser(defaultUser);
    setSelected("Dashboard");
    writeSession(false);
    signOutOfDatabase().catch(() => {
      // Already signed out locally; nothing else to do.
    });
  };

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
      : selected === "Patients"
      ? "Patient Register"
      : selected === "Setup"
      ? "Setup & Diagnostics"
      : selected === "Age Checklist"
      ? "GoI Age Preventive Checklist"
      : selected === "Voice Companion"
      ? "Voice Clinical Companion"
      : selected === "Medical Streams"
      ? "Expense Minimization & Streams"
      : selected === "Doctor Consult"
      ? "Online Teleconsultation & Appointments"
      : selected === "Dashboard"
      ? "Home"
      : selected;

  if (!signedIn) {
    return <Login onSignIn={handleSignIn} />;
  }
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
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true">
              <path
                d="M2 13h3.2l1.8-4.4 2.7 8.8 2.3-6.4 1.5 2H22"
                stroke="#ffffff"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="brand-name">JEEVAN-NET</div>
            <div className="brand-subtitle">ArogyaNexus</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${selected === "Dashboard" ? "active" : ""}`}
            onClick={() => setSelected("Dashboard")}
          >
            <span className="nav-icon"><IconDashboard size={18} /></span>
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${selected === "Patient Assessment" ? "active" : ""}`}
            onClick={() => setSelected("Patient Assessment")}
          >
            <span className="nav-icon"><IconAssessment size={18} /></span>
            <span>Health Assessment</span>
          </button>

          <button
            className={`nav-item ${selected === "Hospital Network" ? "active" : ""}`}
            onClick={() => setSelected("Hospital Network")}
          >
            <span className="nav-icon"><IconHospital size={18} /></span>
            <span>Find Hospitals</span>
          </button>

          <button
            className={`nav-item ${selected === "Doctor Consult" ? "active" : ""}`}
            onClick={() => setSelected("Doctor Consult")}
          >
            <span className="nav-icon"><IconStethoscope size={18} /></span>
            <span>Doctor Consult</span>
          </button>

          <button
            className={`nav-item ${selected === "Age Checklist" ? "active" : ""}`}
            onClick={() => setSelected("Age Checklist")}
          >
            <span className="nav-icon"><IconShield size={18} /></span>
            <span>Age-based Screening</span>
          </button>

          <button
            className={`nav-item ${selected === "Medical Streams" ? "active" : ""}`}
            onClick={() => setSelected("Medical Streams")}
          >
            <span className="nav-icon"><IconPill size={18} /></span>
            <span>Expense &amp; Streams</span>
          </button>

          <button
            className={`nav-item ${selected === "Emergency" ? "active" : ""}`}
            onClick={() => setSelected("Emergency")}
          >
            <span className="nav-icon"><IconEmergency size={18} /></span>
            <span>Emergency Assistance</span>
          </button>

          <button
            className={`nav-item ${selected === "Patients" ? "active" : ""}`}
            onClick={() => setSelected("Patients")}
          >
            <span className="nav-icon"><IconUser size={18} /></span>
            <span>Patients</span>
          </button>

          <button
            className={`nav-item ${selected === "Patient History" ? "active" : ""}`}
            onClick={() => setSelected("Patient History")}
          >
            <span className="nav-icon"><IconRecord size={18} /></span>
            <span>Patient Record</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${selected === "Setup" ? "active" : ""}`}
            onClick={() => setSelected("Setup")}
            title="Check whether the database is set up"
          >
            <span className="nav-icon"><IconWifi size={18} /></span>
            <span>Setup status</span>
          </button>
          <div className="network-status">
            <div className="status-dot-container">
              <div className="status-dot"></div>
              <div className="status-dot-pulse"></div>
            </div>
            <div>
              <strong>Offline-ready</strong>
              <span>Local rule fallback available</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <div className="eyebrow">HEALTHCARE INTELLIGENCE &amp; COORDINATION</div>
            {selected !== "Dashboard" && <h1>{pageTitle}</h1>}
          </div>

          <div className="header-right">
            <div className="system-online">
              <span className="status-dot"></span>
              Offline-ready
            </div>

            <button className="header-action-btn" title="Notifications">
              <IconBell size={17} />
              <span className="badge-dot"></span>
            </button>

            <button
              className="header-action-btn"
              onClick={handleSignOut}
              title="Sign out of this session"
            >
              <IconLogOut size={17} />
            </button>

            <button
              className="user-profile-btn"
              onClick={() => setShowAuthModal(true)}
              title="Manage demonstration profile"
            >
              <div className="user-avatar-circle">
                {user.name.charAt(0)}
              </div>
              <div className="user-info-text">
                <span className="user-name-label">{user.name}</span>
                <span className="user-meta-label">
                  {user.age} yrs · {user.gender}
                </span>
              </div>
              <IconChevronRight size={14} />
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
              patient={selectedPatient}
              onAssessmentComplete={handleAssessmentComplete}
              onOpenFacilityMatching={() => setSelected("Hospital Network")}
            />
          )}

          {selected === "Patients" && (
            <Patients
              user={user}
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              onAssessPatient={(patient) => {
                setSelectedPatient(patient);
                setSelected("Patient Assessment");
              }}
            />
          )}

          {selected === "Setup" && <Setup onNavigate={setSelected} />}

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
          <span>JEEVAN-NET / ArogyaNexus</span>
          <span>
            Research prototype • Demonstration data • Not for patient care • Facility data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              OpenStreetMap contributors
            </a>{" "}
            (ODbL)
          </span>
        </footer>
      </main>
    </div>
  );
}
