# JEEVAN-NET — Backend

FastAPI service exposing the triage scoring endpoint used by the Phase 1 frontend.

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

Response includes `classical_probability`, `hybrid_probability`, `risk_level`,
`prototype_rule_score`, `quantum_features`, and a `disclaimer`.

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

- Models are trained **at import time**, so startup takes a few seconds and every
  reload retrains. That is known debt, not a bug you introduced.
- Verified on Python 3.13. `qiskit>=1.2` was released targeting 3.9–3.12; if the
  install fails, pin a Python 3.12 interpreter for this service.
- CORS allows only `http://localhost:5173` and `http://127.0.0.1:5173`. The
  frontend's `vite.config.js` pins that port with `strictPort` for this reason.

## Not implemented

No database, persistence, auth, rate limiting, logging, or tests. The hospital,
diagnostic and patient-timeline "engines" described in the root README are
frontend mock data only — they have no endpoints here.
