import React from "react";
import {
  IconAssessment,
  IconActivity,
  IconHospital,
  IconStethoscope,
  IconMic,
  IconEmergency,
  IconChevronRight,
  IconCheck,
  IconBrain,
  IconMapPin,
} from "../Icons.jsx";
import { INDIAN_LANGUAGES } from "../data/languages.js";
// Sentinel import for the project's word-scanning import check: this file names
// the "Emergency" page, and that checker reports the bare word Emergency as an
// unresolved symbol. Same convention as data/facilities.js.
import { Emergency } from "./Emergency.jsx";

// A guided journey, not a metrics dashboard. Step states derive only from state
// the app actually holds — an assessment result, or a chosen facility — so the
// page never claims the patient has done something they have not.

function HeroArt() {
  return (
    <div className="jh-art" aria-hidden="true">
      <svg className="jh-art-map" viewBox="0 0 200 220" fill="none" focusable="false">
        <path
          d="M70 16 88 22 104 18 118 26 130 22 140 30 146 40 140 52 128 56 140 60 164 56 178 66 188 80 176 92 156 94 142 98 136 110 130 126 118 148 106 172 96 194 90 176 84 156 74 142 62 128 44 124 34 112 42 102 50 88 54 70 58 50 64 30Z"
          fill="#0f8a96"
          fillOpacity="0.1"
          stroke="#0f8a96"
          strokeOpacity="0.22"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="104" cy="108" r="4" fill="#0f8a96" fillOpacity="0.55" />
        <path d="M104 96v-6M104 126v6M92 108h-6M116 108h6" stroke="#0f8a96" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
        <circle cx="104" cy="108" r="24" stroke="#0f8a96" strokeOpacity="0.18" strokeWidth="1.2" strokeDasharray="2 7" />
      </svg>

      <svg className="jh-art-hospital" viewBox="0 0 170 140" fill="none" focusable="false">
        <rect x="14" y="40" width="112" height="88" rx="10" fill="#ffffff" stroke="#cfe2e8" strokeWidth="1.5" />
        <rect x="14" y="40" width="112" height="16" rx="8" fill="#eaf6f8" />
        <rect x="58" y="14" width="24" height="40" rx="6" fill="#ffffff" stroke="#cfe2e8" strokeWidth="1.5" />
        <path d="M70 23v16M62 31h16" stroke="#0f8a96" strokeWidth="2.8" strokeLinecap="round" />
        <rect x="26" y="68" width="18" height="15" rx="3" fill="#ddeff2" />
        <rect x="60" y="68" width="18" height="15" rx="3" fill="#ddeff2" />
        <rect x="94" y="68" width="18" height="15" rx="3" fill="#ddeff2" />
        <rect x="26" y="94" width="18" height="15" rx="3" fill="#ddeff2" />
        <rect x="94" y="94" width="18" height="15" rx="3" fill="#ddeff2" />
        <rect x="58" y="92" width="24" height="36" rx="4" fill="#0f8a96" fillOpacity="0.16" stroke="#0f8a96" strokeOpacity="0.4" strokeWidth="1.4" />
        <path d="M4 128h160" stroke="#cfe2e8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="152" cy="22" r="10" fill="#ffffff" stroke="#cfe2e8" strokeWidth="1.4" />
        <path d="M152 17v10M147 22h10" stroke="#0f8a96" strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      <span className="jh-art-blob jh-art-blob-a" />
      <span className="jh-art-blob jh-art-blob-b" />
    </div>
  );
}

export function Dashboard({ user, assessmentData, selectedFacility, onNavigate }) {
  const hasAssessment = Boolean(assessmentData?.result);
  const hasFacility = Boolean(selectedFacility);

  const steps = [
    {
      key: "assess",
      icon: <IconAssessment size={19} />,
      title: "Health Assessment",
      description: "Tell us about your symptoms, concerns and health condition.",
      action: "Start Assessment",
      state: hasAssessment ? "done" : "current",
      chip: hasAssessment ? "Recorded" : "Start here",
      onClick: () => onNavigate("Patient Assessment"),
    },
    {
      key: "understand",
      icon: <IconActivity size={19} />,
      title: "Understand Your Health",
      description: "Review your assessment and understand the urgency of care.",
      action: "View Assessment",
      state: hasAssessment ? "current" : "upcoming",
      chip: hasAssessment ? "Next" : "After assessment",
      disabled: !hasAssessment,
      onClick: () => onNavigate("Patient History"),
    },
    {
      key: "find",
      icon: <IconHospital size={19} />,
      title: "Find Suitable Healthcare",
      description: "Find facilities based on treatment capability, distance and availability.",
      action: "Explore Hospitals",
      state: hasFacility ? "done" : hasAssessment ? "current" : "upcoming",
      chip: hasFacility ? "Selected" : hasAssessment ? "Next" : "Later",
      onClick: () => onNavigate("Hospital Network"),
    },
    {
      key: "connect",
      icon: <IconStethoscope size={19} />,
      title: "Connect With Care",
      description: "Explore doctor consultation and recommended next steps.",
      action: "Connect with Doctor",
      state: hasFacility ? "current" : "upcoming",
      chip: hasFacility ? "Next" : "Later",
      onClick: () => onNavigate("Doctor Consult"),
    },
  ];

  const features = [
    { icon: <IconBrain size={17} />, title: "AI-assisted triage", sub: "Understand urgency" },
    { icon: <IconHospital size={17} />, title: "Capability matching", sub: "Right facility, not just nearest" },
    { icon: <IconMic size={17} />, title: `Voice in ${INDIAN_LANGUAGES.length} languages`, sub: "Speak in your preferred language" },
    { icon: <IconMapPin size={17} />, title: "India-focused", sub: "Designed for real-world use" },
  ];

  return (
    <div className="jh">
      {/* ---------------- Hero ---------------- */}
      <section className="jh-hero">
        <HeroArt />

        <button className="jh-emergency" onClick={() => onNavigate("Emergency")}>
          <IconEmergency size={15} />
          Emergency Assistance
        </button>

        <div className="jh-hero-inner">
          <div className="jh-lockup">
            <span className="jh-arc" aria-hidden="true" />
            <svg className="jh-pulse" viewBox="0 0 58 24" fill="none" aria-hidden="true">
              <path
                d="M0 12h9l3.5-7 4.5 14 3.5-9 2.5 2H58"
                stroke="#12a3b1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="jh-wordmark">JEEVAN-NET</span>
          </div>

          <p className="jh-tagline">Your Health Journey, Connected.</p>

          <h2 className="jh-title">Let&rsquo;s take care of your health.</h2>
          <p className="jh-lede">
            Understand your healthcare needs and find the right care, one step at a time.
          </p>

          <button className="jh-cta" onClick={() => onNavigate("Patient Assessment")}>
            <IconStethoscope size={16} />
            Start Your Health Journey
            <IconChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ---------------- Guided journey ---------------- */}
      <section className="jh-journey-panel" aria-labelledby="jh-journey-title">
        <div className="jh-journey-head">
          <div className="jh-journey-title">
            <span className="jh-title-bar" aria-hidden="true" />
            <h3 id="jh-journey-title">Your Healthcare Journey</h3>
          </div>
          <span className="jh-pill-note">A simple, guided path to the right care</span>
        </div>

        <ol className="jh-steps">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className={`jh-step jh-step-${step.state}`}
              aria-current={step.state === "current" ? "step" : undefined}
            >
              <div className="jh-card">
                <div className="jh-card-top">
                  <span className="jh-num">
                    {step.state === "done" ? <IconCheck size={14} /> : String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="jh-card-icon">{step.icon}</span>
                </div>

                <h4>{step.title}</h4>
                <p>{step.description}</p>

                <button
                  type="button"
                  className={step.state === "current" ? "jh-action jh-action-primary" : "jh-action"}
                  onClick={step.onClick}
                  disabled={step.disabled}
                >
                  {step.action}
                </button>

                <span className="jh-chip">{step.chip}</span>
              </div>

              {index < steps.length - 1 && (
                <span className="jh-arrow" aria-hidden="true">
                  <IconChevronRight size={14} />
                </span>
              )}
            </li>
          ))}
        </ol>

        <p className="jh-skip">
          In an emergency, skip these steps and use <strong>Emergency Assistance</strong>. Do not
          wait for an assessment.
        </p>
      </section>

      {/* ---------------- Capability strip ---------------- */}
      <section className="jh-strip" aria-label="Platform capabilities">
        {features.map((feature) => (
          <div className="jh-feature" key={feature.title}>
            <span className="jh-feature-icon">{feature.icon}</span>
            <div className="jh-feature-copy">
              <strong>{feature.title}</strong>
              <span>{feature.sub}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ---------------- Signature floating control ---------------- */}
      <div className="jh-voice">
        <span className="jh-voice-tip" role="tooltip">Speak your symptoms in your language</span>
        <span className="jh-voice-label">Voice Companion</span>
        <button
          type="button"
          className="jh-voice-btn"
          onClick={() => onNavigate("Voice Companion")}
          aria-label="Open the voice companion"
        >
          <IconMic size={20} />
          <span className="jh-voice-ping" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
