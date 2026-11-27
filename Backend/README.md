# JEEVAN-NET — Backend

FastAPI service exposing the triage scoring endpoint used by the frontend.

> **This is a research prototype, not a clinical device.** Training data is synthetic.
> It must not be used for diagnosis, triage decisions, or patient care.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness + engine name |
| `POST` | `/api/assess` | Vitals + symptoms in, risk probabilities out |

### `POST /api/assess`

Request body (`Assessment` model — all fields range-validated by Pydantic):

| Field | Type | Range |
| --- | --- | --- |
| `age` | float | 0–120 |
| `systolic` | float | 40–260 |
| `diastolic` | float | 20–180 |
| `heartRate` | float | 20–250 |
| `spo2` | float | 50–100 |
| `temperature` | float | 25–45 |
| `glucose` | float | 20–1000 |
| `symptoms` | object of booleans | optional |
| `symptom_count` | int | 0–20, optional |

Response includes `risk_level` (the model's band), `rule_level`,
`classical_level`, a `probabilities` object per band, `classical_probability` /
`hybrid_probability` (both = P(HIGH), kept for the existing UI),
`prototype_rule_score`, `quantum_features`, and a `disclaimer`.

## Evaluation

`evaluate.py` trains both models on a stratified 80/20 split and reports accuracy,
macro/weighted F1, ROC-AUC, per-band precision and recall, a confusion matrix, and
how often the frontend rule engine and the model disagree.

```bash
python evaluate.py    # ~1 min (circuit simulation dominates); writes ../docs/evaluation.md
```

Latest run (seed 7, 4,000 rows, 800 held out), both models predicting the rule's
three bands directly:

| Model | Accuracy | Macro F1 | ROC-AUC |
| --- | --- | --- | --- |
| Classical (8 vitals) | 79.5% | 0.771 | 0.936 |
| Hybrid (+ 4 quantum features) | 80.9% | 0.786 | 0.937 |

Per band (hybrid): HIGH precision 58.9% / recall 83.5%; MODERATE 84.3% / 75.0%;
LOW 87.3% / 87.1%.

Three results worth quoting:

- **The quantum feature map adds nothing.** Trained on identical rows, the extra
  four columns move macro F1 by +0.005 — noise.
- **The two engines agree on 82% of held-out bands**, after the rule was given a
  single definition shared with the frontend. They never cross both extremes: no
  rule-HIGH case reads as LOW, none as rule-LOW reads as HIGH.
- **HIGH recall is 83.5%, not 100%.** The model misses about one in six rule-HIGH
  patients. `classWeight: "balanced"` in the shared JSON is what lifts that from
  64%, at a cost of ~3 points of overall agreement — a deliberate trade, because a
  missed HIGH is the error that matters.

Accuracy here means "reproduced our own labelling heuristic", not clinical
accuracy. See `../docs/evaluation.md` for the full report and its limits.

## What the models actually are

Be precise about this if you are asked — the names oversell the implementation.

1. **Labels come from a hand-written rule.** `risk_score()` scores each synthetic
   patient; `label = risk_score >= 7`, with 2.5% of labels flipped to stop the
   model from being a pure threshold lookup. So both models learn to approximate
   a rule that already existed.
2. **`classical_model`** is `StandardScaler` + `LogisticRegression` over the 8
   vitals.
3. **`hybrid_model`** is the same estimator with four extra columns produced by
   `quantum_features()`: a fixed 4-qubit `RY`/`RZ` + CNOT angle-encoding circuit,
   evaluated with `Statevector`. The circuit has **no trainable parameters** — it is
   a deterministic feature map simulated classically. There is no quantum speedup
   and no variational training.

## Run

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive docs at <http://127.0.0.1:8000/docs>.

### Environment notes

- Models are trained **at import time**, so startup takes ~35 s and every reload
  retrains. That is known debt, not a bug you introduced.
- Verified working on Python 3.13.14 with qiskit 2.5.2, scikit-learn 1.9 and
  numpy 2.5 on Windows. The `qiskit>=1.2` Python 3.9–3.12 warning in older notes
  no longer applies; the install is fine on 3.13.
- CORS allows only `http://localhost:5173` and `http://127.0.0.1:5173`. The
  frontend's `vite.config.js` pins that port with `strictPort` for this reason.

## Not implemented

No database, persistence, auth, rate limiting or logging. `evaluate.py` measures
the models but is not a test suite — there are no unit tests on either side. The
hospital, diagnostic and patient-timeline "engines" described in the root README
are frontend mock data only — they have no endpoints here.
