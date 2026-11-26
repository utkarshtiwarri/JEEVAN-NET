import React, { useState, useEffect } from "react";
import { IconDashboard, IconAssessment, IconEmergency, IconHospital, IconRecord, IconLogo, IconBell, IconMic, IconPill, IconShield, IconStethoscope } from "./Icons.jsx";
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

export function App() {
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
              <span>Simulated ABDM sandbox</span>
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
