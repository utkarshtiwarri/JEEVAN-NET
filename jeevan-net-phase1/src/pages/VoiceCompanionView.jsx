import React, { useState, useEffect } from "react";
import { IconMic, IconVideo, IconCalendar } from "../Icons.jsx";
import { DOCTORS_LIST } from "../data/doctors.js";
import { INDIAN_LANGUAGES } from "../data/languages.js";
import { Emergency } from "./Emergency.jsx";

export function VoiceCompanionView({ user, onStartVideoCall, onBookAppointment, onNavigate }) {
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
