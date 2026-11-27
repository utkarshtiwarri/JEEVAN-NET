import React, { useState, useEffect, useRef } from "react";
import { IconMic, IconVideo, IconCalendar } from "../Icons.jsx";
import { INDIAN_LANGUAGES } from "../data/languages.js";
import { SAMPLE_UTTERANCES, CONDITIONS } from "../data/conditions.js";
import { analyzeSymptoms } from "../lib/symptomEngine.js";
// Referenced only by the static import guard in scripts/verify-imports.mjs,
// because the emergency route below is a string until the root component resolves it.
import { Emergency } from "./Emergency.jsx";

// The companion's clinical brain lives in two files, not in this component:
//   data/conditions.js   -> what diseases it knows (edit data, not JSX)
//   lib/symptomEngine.js -> how it scores and routes them
// This component only handles microphone input, display, and speech output.

export function VoiceCompanionView({ user, onStartVideoCall, onBookAppointment, onNavigate }) {
  const [selectedLang, setSelectedLang] = useState("hi-IN");
  const [isListening, setIsListening] = useState(false);
  const [inputSpeech, setInputSpeech] = useState("");
  const [clinicalResponse, setClinicalResponse] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* already stopped */
        }
      }
    };
  }, []);

  const speak = (res) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const spokenCondition = selectedLang === "hi-IN" && res.nameHi ? res.nameHi : res.diagnosis;
    const emergencyPrefix = res.isEmergency ? "Warning. Emergency. " : "";
    const text = `${emergencyPrefix}${spokenCondition}. ${res.recommendedAction} ${res.firstAidRemedies[0] || ""}`;
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 600));
    utterance.lang = selectedLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const processSymptoms = (text) => {
    setInputSpeech(text);
    const res = analyzeSymptoms(text);
    setClinicalResponse(res);
    speak(res);
  };

  const handleVoiceMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Demo fallback for browsers without speech recognition (most desktop Chrome
    // installs without a mic, and Safari in private mode).
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        processSymptoms(SAMPLE_UTTERANCES[0].text);
      }, 1600);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      processSymptoms(transcript);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const severityColour = (res) => {
    if (res.isEmergency) return { border: "#ef4444", bg: "rgba(239,68,68,0.18)", text: "#fca5a5" };
    if (res.severity === "HIGH") return { border: "#f59e0b", bg: "rgba(245,158,11,0.16)", text: "#fcd34d" };
    if (res.severity === "MODERATE") return { border: "#38bdf8", bg: "rgba(2,132,199,0.18)", text: "#7dd3fc" };
    return { border: "#22c55e", bg: "rgba(34,197,94,0.16)", text: "#86efac" };
  };

  const responseColour = clinicalResponse ? severityColour(clinicalResponse) : null;

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
          Speak or type your symptoms. The companion recognises {CONDITIONS.length} conditions across 12 specialities,
          gives safe first-aid steps, asks follow-up questions, and connects you to the right online doctor.
        </p>

        {/* QUICK PROMPT SAMPLE BUTTONS — driven by data/conditions.js */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          {SAMPLE_UTTERANCES.map((p, idx) => (
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
        {inputSpeech && clinicalResponse && (
          <div style={{ marginTop: "24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px" }}>
            <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>SPOKEN SYMPTOM TRANSCRIPT</div>
            <p style={{ margin: "6px 0 16px", fontSize: "15px", color: "#ffffff", fontWeight: 600 }}>"{inputSpeech}"</p>

            {/* RED FLAG BANNER — only when a universal red flag overrode everything */}
            {clinicalResponse.redFlags.length > 0 && (
              <div style={{ background: "rgba(220,38,38,0.25)", border: "1px solid #ef4444", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#fecaca", textTransform: "uppercase" }}>
                  ⚠ Red Flag Detected — Emergency Escalated
                </div>
                <div style={{ fontSize: "13px", color: "#fee2e2", marginTop: "2px" }}>
                  {clinicalResponse.redFlags.join(" · ")}
                </div>
              </div>
            )}

            <div style={{ background: responseColour.bg, border: `1px solid ${responseColour.border}`, padding: "14px", borderRadius: "12px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: responseColour.text, textTransform: "uppercase" }}>
                AI CLINICAL ASSESSMENT • {clinicalResponse.severity}
                {clinicalResponse.icd10 ? ` • ICD-10 ${clinicalResponse.icd10}` : ""}
              </div>
              <h3 style={{ margin: "4px 0", color: "#ffffff" }}>{clinicalResponse.diagnosis}</h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#e2e8f0" }}>{clinicalResponse.recommendedAction}</p>
            </div>

            {/* DIFFERENTIAL DIAGNOSES — top 3, not one guess */}
            {clinicalResponse.differentials.length > 1 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", marginBottom: "8px" }}>
                  🔍 Differential Assessment
                </div>
                {clinicalResponse.differentials.map((d) => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12.5px", color: "#e2e8f0", padding: "3px 0" }}>
                    <span>{d.name}</span>
                    <span style={{ color: "#94a3b8", whiteSpace: "nowrap" }}>{d.likelihood}</span>
                  </div>
                ))}
              </div>
            )}

            {/* VITALS EXTRACTED FROM SPEECH */}
            {Object.keys(clinicalResponse.vitals).length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {clinicalResponse.vitals.glucose != null && (
                  <span style={{ fontSize: "11.5px", padding: "3px 10px", borderRadius: "999px", background: "rgba(56,189,248,0.15)", color: "#7dd3fc" }}>
                    Glucose {clinicalResponse.vitals.glucose} mg/dL
                  </span>
                )}
                {clinicalResponse.vitals.systolic != null && (
                  <span style={{ fontSize: "11.5px", padding: "3px 10px", borderRadius: "999px", background: "rgba(56,189,248,0.15)", color: "#7dd3fc" }}>
                    BP {clinicalResponse.vitals.systolic}/{clinicalResponse.vitals.diastolic ?? "?"}
                  </span>
                )}
                {clinicalResponse.vitals.spo2 != null && (
                  <span style={{ fontSize: "11.5px", padding: "3px 10px", borderRadius: "999px", background: "rgba(56,189,248,0.15)", color: "#7dd3fc" }}>
                    SpO₂ {clinicalResponse.vitals.spo2}%
                  </span>
                )}
                {clinicalResponse.vitals.temperature != null && (
                  <span style={{ fontSize: "11.5px", padding: "3px 10px", borderRadius: "999px", background: "rgba(56,189,248,0.15)", color: "#7dd3fc" }}>
                    Temp {clinicalResponse.vitals.temperature}°C
                  </span>
                )}
              </div>
            )}

            {/* FIRST AID & NEXT STEPS */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", marginBottom: "8px" }}>
                🩺 SAFE FIRST-AID & NEXT STEPS
              </div>
              {clinicalResponse.firstAidRemedies.map((rem, i) => (
                <div key={i} style={{ fontSize: "13px", color: "#f8fafc", margin: "4px 0", lineHeight: 1.5 }}>{rem}</div>
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

            <p style={{ fontSize: "11px", color: "#64748b", marginTop: "16px", marginBottom: 0, lineHeight: 1.5 }}>
              {clinicalResponse.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
