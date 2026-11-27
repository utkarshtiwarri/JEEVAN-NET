from typing import Any, Dict

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import (
    CLASSES,
    HIGH_INDEX,
    level_from_proba,
    mix_vitals_and_quantum,
    quantum_features,
    risk_score,
    train,
)

app = FastAPI(title="JEEVAN-NET Hybrid ML API", version="0.4.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Training happens at import time, so startup is ~35s and every reload retrains.
# Known debt, not an accident: see docs/limitations.md.
X_train, y_train, classical_model, hybrid_model = train()


class Assessment(BaseModel):
    age: float = Field(ge=0, le=120)
    systolic: float = Field(ge=40, le=260)
    diastolic: float = Field(ge=20, le=180)
    heartRate: float = Field(ge=20, le=250)
    spo2: float = Field(ge=50, le=100)
    temperature: float = Field(ge=25, le=45)
    glucose: float = Field(ge=20, le=1000)
    symptoms: Dict[str, bool] = Field(default_factory=dict)
    symptom_count: int | None = Field(default=None, ge=0, le=20)


@app.get("/api/health")
def health():
    return {"status": "online", "engine": "hybrid-quantum-classical", "model": "prototype"}


@app.post("/api/assess")
def assess(payload: Assessment) -> Dict[str, Any]:
    symptoms = dict(payload.symptoms or {})
    symptom_count = payload.symptom_count
    if symptom_count is None:
        symptom_count = sum(bool(v) for v in symptoms.values())
    elif not symptoms:
        symptoms = {
            "confusion": symptom_count > 0,
            "thirst": symptom_count > 1,
            "sweating": symptom_count > 2,
            "chestPain": False,
            "breathingDifficulty": False,
            "weakness": False,
        }

    row = np.array(
        [[
            payload.age,
            payload.systolic,
            payload.diastolic,
            payload.heartRate,
            payload.spo2,
            payload.temperature,
            payload.glucose,
            symptom_count,
        ]],
        dtype=float,
    )

    qf = quantum_features(row[0])

    # Each model returns a probability per band. The verdict is the most likely
    # band, so it comes from the model rather than from a hand-set cut point.
    classical_proba = classical_model.predict_proba(row)[0]
    hybrid_proba = hybrid_model.predict_proba(mix_vitals_and_quantum(row))[0]

    heuristic = risk_score(row[0])

    return {
        "engine": "Hybrid Quantum-Classical",
        "risk_level": level_from_proba(hybrid_proba),
        "classical_level": level_from_proba(classical_proba),
        "rule_level": ("HIGH" if heuristic >= 9 else "MODERATE" if heuristic >= 5 else "LOW"),
        "probabilities": {
            "classical": {name: round(float(p) * 100, 1) for name, p in zip(CLASSES, classical_proba)},
            "hybrid": {name: round(float(p) * 100, 1) for name, p in zip(CLASSES, hybrid_proba)},
        },
        # Kept for the existing UI, which shows these two numbers as confidence.
        "classical_probability": round(float(classical_proba[HIGH_INDEX]) * 100, 1),
        "hybrid_probability": round(float(hybrid_proba[HIGH_INDEX]) * 100, 1),
        "prototype_rule_score": heuristic,
        "quantum_features": [round(float(v), 4) for v in qf],
        "symptom_count": symptom_count,
        "disclaimer": (
            "Prototype research demonstration using synthetic training data; "
            "not a clinical diagnostic model."
        ),
    }
