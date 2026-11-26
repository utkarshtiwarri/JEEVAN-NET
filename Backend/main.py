from typing import Dict, Any
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

FEATURES = ["age", "systolic", "diastolic", "heart_rate", "spo2", "temperature", "glucose", "symptom_count"]

app = FastAPI(title="JEEVAN-NET Hybrid ML API", version="0.3.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def risk_score(row):
    age, sbp, dbp, hr, spo2, temp, glucose, sc = row
    score = 0
    score += 3 if glucose >= 300 else 2 if glucose >= 200 else 0
    score += 2 if sbp >= 160 or dbp >= 100 else 1 if sbp >= 140 or dbp >= 90 else 0
    score += 1 if hr > 100 else 0
    score += 2 if spo2 < 94 else 1 if spo2 < 96 else 0
    score += 1 if temp >= 38.5 or temp < 35 else 0
    score += min(6, sc * 2)
    score += 1 if age >= 65 else 0
    return score


def make_dataset(n=3500, seed=42):
    rng = np.random.default_rng(seed)
    age = rng.integers(18, 86, n)
    sbp = np.clip(rng.normal(132, 25, n), 85, 210)
    dbp = np.clip(rng.normal(82, 15, n), 45, 130)
    hr = np.clip(rng.normal(82, 17, n), 45, 150)
    spo2 = np.clip(rng.normal(97, 2.5, n), 82, 100)
    temp = np.clip(rng.normal(36.9, 0.8, n), 34, 41)
    glucose = np.clip(rng.lognormal(np.log(115), 0.48, n), 50, 500)
    symptoms = rng.integers(0, 4, n)
    X = np.column_stack([age, sbp, dbp, hr, spo2, temp, glucose, symptoms]).astype(float)
    scores = np.array([risk_score(r) for r in X])
    y = (scores >= 7).astype(int)
    # Small label noise makes the demo model less like a hand-coded threshold.
    flip = rng.random(n) < 0.025
    y[flip] = 1 - y[flip]
    return X, y

X_train, y_train = make_dataset()
classical_model = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=2000))])
classical_model.fit(X_train, y_train)

# Normalize each feature into [0, pi] and encode four clinically relevant pairs.
def quantum_features(row):
    x = np.asarray(row, dtype=float)
    mins = np.array([18, 85, 45, 45, 82, 34, 50, 0], float)
    maxs = np.array([85, 210, 130, 150, 100, 41, 500, 6], float)
    scaled = np.clip((x - mins) / (maxs - mins), 0, 1) * np.pi
    # 4-qubit angle-encoded feature map + entanglement.
    qc = QuantumCircuit(4)
    for i in range(4):
        a = scaled[2 * i] if 2 * i < len(scaled) else 0.0
        b = scaled[2 * i + 1] if 2 * i + 1 < len(scaled) else 0.0
        qc.ry(a, i)
        qc.rz(b, i)
    for i in range(3):
        qc.cx(i, i + 1)
    state = Statevector.from_instruction(qc)
    probs = np.abs(state.data) ** 2
    exps = []
    for q in range(4):
        value = 0.0
        for basis, p in enumerate(probs):
            bit = (basis >> (3 - q)) & 1
            value += p * (1.0 if bit == 0 else -1.0)
        exps.append(value)
    return np.array(exps, dtype=float)

# Train the classical head on quantum-generated features + selected normalized inputs.
Q_train = np.vstack([quantum_features(x) for x in X_train[::4]])
C_train = X_train[::4, :]
H_train = np.column_stack([C_train, Q_train])
hybrid_model = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=2000))])
hybrid_model.fit(H_train, y_train[::4])

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


def level(prob):
    if prob >= 0.70: return "HIGH"
    if prob >= 0.35: return "MODERATE"
    return "LOW"

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
    row = np.array([[payload.age, payload.systolic, payload.diastolic, payload.heartRate, payload.spo2, payload.temperature, payload.glucose, symptom_count]], dtype=float)
    qf = quantum_features(row[0])
    classical_prob = float(classical_model.predict_proba(row)[0, 1])
    hybrid_input = np.column_stack([row, qf.reshape(1, -1)])
    hybrid_prob = float(hybrid_model.predict_proba(hybrid_input)[0, 1])
    heuristic = risk_score(row[0])
    return {
        "engine": "Hybrid Quantum-Classical",
        "classical_probability": round(classical_prob * 100, 1),
        "hybrid_probability": round(hybrid_prob * 100, 1),
        "risk_level": level(hybrid_prob),
        "prototype_rule_score": heuristic,
        "quantum_features": [round(float(v), 4) for v in qf],
        "symptom_count": symptom_count,
        "disclaimer": "Prototype research demonstration using synthetic training data; not a clinical diagnostic model."
    }
