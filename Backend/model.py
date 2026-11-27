"""JEEVAN-NET scoring model — shared by the API and the evaluation harness.

Why this file exists
--------------------
`main.py` originally held the dataset generator, the labelling heuristic, the
"quantum" feature map and both models inline, and fitted them at import time.
That made it impossible to evaluate anything: there was no way to train on one
half of the data and score the other half without editing the endpoint module.

This module holds the parts; `main.py` composes them for the API and
`evaluate.py` composes them for measurement.

What the labels are (read before quoting any accuracy number)
-------------------------------------------------------------
`risk_score()` is a HAND-WRITTEN HEURISTIC, and `make_dataset()` labels rows with
`risk_score(row) >= 7`. Both models are therefore trained to reproduce a rule
this repository already contains. Accuracy against these labels measures
"how well did it copy the rule", NOT clinical validity. No clinician has
reviewed this, and no real patient outcome is involved anywhere.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "age",
    "systolic",
    "diastolic",
    "heart_rate",
    "spo2",
    "temperature",
    "glucose",
    "symptom_count",
]

# ---------------------------------------------------------------------------
# One rule, two runtimes.
#
# This file is the same JSON the frontend imports (`src/lib/triage.js`). Both
# sides therefore score a patient identically, which is the point: the model is
# trained to predict what the UI actually shows.
#
# The path reaches outside Backend/ on purpose. Vite can import JSON only from
# inside its root, so the file has to live under jeevan-net-phase1/, and Python
# has no such restriction.
# ---------------------------------------------------------------------------
_RULE_PATH = (
    Path(__file__).resolve().parent.parent
    / "jeevan-net-phase1"
    / "src"
    / "data"
    / "scoring-rule.json"
)

with _RULE_PATH.open(encoding="utf-8") as _fh:
    RULE = json.load(_fh)

WEIGHTS = RULE["weights"]
MAX_SCORE = RULE["maxScore"]
LEVEL_HIGH = RULE["levels"]["high"]
LEVEL_MODERATE = RULE["levels"]["moderate"]

# The model is trained on the rule's own three bands, not on a HIGH/not-HIGH
# split. That was the earlier design and it could not work: a binary head has no
# information about where the LOW/MODERATE boundary sits, so it could never agree
# with a three-band rule (measured agreement capped out at 78.9% at the best
# possible thresholds). Predicting the band directly makes agreement a property of
# model quality rather than of threshold luck.
CLASSES = ["LOW", "MODERATE", "HIGH"]
CLASS_INDEX = {name: i for i, name in enumerate(CLASSES)}
# No probability thresholds: the model predicts the three bands directly, so the
# verdict is the most likely band and there is nothing to tune.
HIGH_INDEX = CLASS_INDEX["HIGH"]


def risk_score(row: Iterable[float]) -> float:
    """The shared additive rule, reimplemented against data/scoring-rule.json.

    Mirrors `localTriage()` in src/lib/triage.js exactly, including the cap. It is
    a hand-written heuristic, not a clinical instrument: it exists so that labels
    can be generated and so the UI can explain its own verdict.
    """
    age, sbp, dbp, hr, spo2, temp, glucose, sc = row
    w = WEIGHTS

    score = 0.0

    if glucose >= w["glucose"]["critical"]:
        score += w["glucose"]["criticalPoints"]
    elif glucose >= w["glucose"]["elevated"]:
        score += w["glucose"]["elevatedPoints"]

    bp = w["bloodPressure"]
    if sbp >= bp["crisisSystolic"] or dbp >= bp["crisisDiastolic"]:
        score += bp["crisisPoints"]
    elif sbp >= bp["stage1Systolic"] or dbp >= bp["stage1Diastolic"]:
        score += bp["stage1Points"]

    if hr > w["heartRate"]["tachycardia"]:
        score += w["heartRate"]["points"]

    if spo2 < w["spo2"]["critical"]:
        score += w["spo2"]["criticalPoints"]
    elif spo2 < w["spo2"]["borderline"]:
        score += w["spo2"]["borderlinePoints"]

    if temp >= w["temperature"]["high"] or temp < w["temperature"]["low"]:
        score += w["temperature"]["points"]

    # 2 points per reported symptom, then the whole score is capped. The old
    # backend capped the SYMPTOM contribution at 6 instead, so three symptoms
    # scored the same as four and the two engines diverged.
    score += w["symptom"]["pointsEach"] * float(sc)

    if age >= w["age"]["atLeast"]:
        score += w["age"]["points"]

    return min(score, MAX_SCORE)


def rule_level(score: float) -> str:
    """The rule's own band for a score, used to label training data."""
    if score >= LEVEL_HIGH:
        return "HIGH"
    if score >= LEVEL_MODERATE:
        return "MODERATE"
    return "LOW"


def make_dataset(n: int = 3500, seed: int = 42):
    """Synthetic vitals plus heuristic labels. No real patient is represented.

    Returns (X, y, scores, rule_levels) where `y` is the integer class index and
    `rule_levels` is the clean, unflipped band for each row.
    """
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
    rule_levels = np.array([rule_level(s) for s in scores], dtype=object)
    y = np.array([CLASS_INDEX[band] for band in rule_levels], dtype=int)

    # Small label noise stops the model being a pure threshold lookup. It also
    # puts a hard ceiling on achievable accuracy: ~2.5% of labels contradict the
    # rule they were generated from.
    flip = rng.random(n) < 0.025
    shifted = (y[flip] + 1) % len(CLASSES)
    y[flip] = shifted
    return X, y, scores, rule_levels


def quantum_features(row) -> np.ndarray:
    """A FIXED 4-qubit angle-encoding circuit, evaluated classically.

    There are no trainable parameters, no variational loop, no measurement
    sampling and no speedup. It is a deterministic non-linear feature map: a
    preprocessing step that happens to be described as a circuit. Four
    single-qubit expectation values in [-1, 1] come out.
    """
    x = np.asarray(row, dtype=float)
    mins = np.array([18, 85, 45, 45, 82, 34, 50, 0], float)
    maxs = np.array([85, 210, 130, 150, 100, 41, 500, 6], float)
    scaled = np.clip((x - mins) / (maxs - mins), 0, 1) * np.pi

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


def quantum_matrix(X: np.ndarray) -> np.ndarray:
    """Quantum feature columns for every row. Slow — subsample for training."""
    return np.vstack([quantum_features(row) for row in X])


def mix_vitals_and_quantum(X: np.ndarray) -> np.ndarray:
    """The hybrid model's input: the 8 vitals plus the 4 circuit features."""
    return np.column_stack([X, quantum_matrix(X)])


# Class weighting. "balanced" raises recall on the HIGH band at the cost of
# precision: measured on the held-out split it moves HIGH recall from 64% to 84%
# while dropping agreement from 85% to 82%. That is the right trade for triage — a
# false HIGH escalates unnecessarily, a missed HIGH sends an emergency patient
# home — but it is a judgement call, so it is recorded here rather than buried in
# the fit call. Set to null to revert.
CLASS_WEIGHT = RULE.get("classWeight")


def new_pipeline(class_weight=CLASS_WEIGHT) -> Pipeline:
    return Pipeline(
        [
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, class_weight=class_weight)),
        ]
    )


def level_from_proba(proba) -> str:
    """The model's own band: the most likely class. No threshold involved."""
    return CLASSES[int(np.argmax(proba))]


# Returns (X, y, classical, hybrid).


def train(n: int = 3500, seed: int = 42):
    """Fit both models the way the API uses them: all data, no held-out split.

    Returns (X, y, classical, hybrid). The hybrid model is fitted on every
    fourth row because the circuit simulation is the expensive part.
    """
    X, y, _, _ = make_dataset(n=n, seed=seed)
    classical = new_pipeline().fit(X, y)
    hybrid = new_pipeline().fit(mix_vitals_and_quantum(X[::4]), y[::4])
    return X, y, classical, hybrid
