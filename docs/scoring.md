# Scoring: the three engines and how they relate

The prototype contains three separate things that produce a risk verdict. They
disagree on purpose. This file records what each one is, so nobody has to
reverse-engineer it from the code later.

## 1. Frontend rule engine — `lib/triage.js` → `localTriage(form)`

A hand-written additive score over the form. Runs on every assessment, with or
without a backend.

| Signal | Points |
| --- | --- |
| Glucose ≥ 300 / ≥ 200 | 3 / 2 |
| BP ≥ 160·100 / ≥ 140·90 | 2 / 1 |
| Heart rate > 100 | 1 |
| SpO₂ < 94 / < 96 | 2 / 1 |
| Temperature ≥ 38.5 or < 35 | 1 |
| Each reported symptom | 2 |
| Age ≥ 50 | 1 |

Raw total is capped at **15**. Level: **HIGH ≥ 9**, **MODERATE ≥ 5**, else LOW.

This engine also generates the human-readable indicator strings and the
recommended action text.

## 2. Backend label heuristic — `Backend/main.py` → `risk_score(row)`

The label generator for the training set. Notably **not** the same rule:

- Symptoms contribute `min(6, count × 2)`, not 2 each.
- Age ≥ 65 scores a point, not ≥ 50.
- There is no 15 cap.
- The label threshold is **≥ 7**, not ≥ 9.

So the same patient can be HIGH under one convention and MODERATE under the
other. Neither is clinically validated; both are invented for the demo.

## 3. The two models

`classical_model` = `StandardScaler` + `LogisticRegression` over the 8 vitals.
`hybrid_model` = the same estimator over the 8 vitals **plus** four features from
`quantum_features()`. Model level thresholds are probability-based:
**HIGH ≥ 0.70**, **MODERATE ≥ 0.35**.

### What the "quantum" part really is

`quantum_features()` builds a **fixed** 4-qubit circuit: each qubit gets `RY(a)`
then `RZ(b)` with features normalised to `[0, π]`, followed by three CNOTs for
entanglement, and is evaluated with `qiskit.quantum_info.Statevector` — i.e.
simulated classically. The returned values are four single-qubit expectation
values in `[-1, 1]`.

It has **no trainable parameters, no variational loop, no measurement sampling,
and no quantum advantage**. It is a deterministic non-linear feature map: a
preprocessing step, not a quantum model. Calling it "Hybrid Quantum-Classical"
is defensible only in the narrow sense that the features originate from a
circuit description.

If asked what is novel here, the honest answer is the coordination layer and the
UI, not the classifier.

## Why the split is shown rather than merged

`pages/Result.jsx` displays `ML MODEL` and `RULE CHECK` as separate rows. This is
deliberate. An earlier version collapsed them, and the effective verdict was
silently taken from the rule engine while the panel displayed model percentages
next to it — the UI claimed an ML decision it had not used.

If you change the merge logic, keep both numbers visible. The rule engine is the
only thing that works offline, and the model is the only thing that is actually
trained, so each has a reason to exist.

## Alignment, if you want one source of truth

The defensible options, in order of effort:

1. **Document only** (current state). Accept three conventions, keep the split
   display, never present the model as the authority.
2. **Align thresholds.** Decide the real cut points once, use them in
   `localTriage`, in `risk_score` labelling, and for `level()`. Cheapest change
   with the largest credibility gain.
3. **Align the rules too.** Make the backend label generator reuse the same
   thresholds as the frontend, so the model is approximating the rule the UI
   shows.

Do not do (3) halfway: a model trained on one rule and displayed against another
is exactly the failure this refactor removed.
