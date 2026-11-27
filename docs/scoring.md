# Scoring: one rule, two runtimes, three verdicts

This file records what produces a risk verdict, so nobody has to reverse-engineer
it from the code later.

## The rule now has a single definition

`jeevan-net-phase1/src/data/scoring-rule.json` is the source of truth for every
weight and threshold.

```
src/data/scoring-rule.json
        │
        ├──> src/lib/triage.js        (frontend, imported by Vite)
        └──> Backend/model.py         (backend, loaded by path)
```

Both runtimes read that one file, so the number the UI shows and the number the
model was trained to predict cannot drift apart. Before this, they did: the
frontend capped symptoms at 12 points and used age ≥ 50, while the label
generator capped them at 6 and used age ≥ 65.

`node scripts/check-scoring-parity.mjs` (from `jeevan-net-phase1/`) is the guard:
it generates 435 forms — boundary values, all 64 symptom subsets, 400 random
combinations, cap-saturating cases — scores them in both runtimes, and fails if a
single score or level differs. Run it after touching the JSON.

## 1. Frontend rule engine — `lib/triage.js` → `localTriage(form)`

An additive score over the form. Runs on every assessment, with or without a
backend, and also produces the human-readable indicators and recommended action.

| Signal | Points |
| --- | --- |
| Glucose ≥ 300 / ≥ 200 | 3 / 2 |
| BP ≥ 160·100 / ≥ 140·90 | 2 / 1 |
| Heart rate > 100 | 1 |
| SpO₂ < 94 / < 96 | 2 / 1 |
| Temperature ≥ 38.5 or < 35 | 1 |
| Each reported symptom | 2 |
| Age ≥ 50 | 1 |

Total is capped at **15**. Level: **HIGH ≥ 9**, **MODERATE ≥ 5**, else LOW.
Every value above lives in `scoring-rule.json`, not in the JS.

## 2. Training labels — `Backend/model.py` → `risk_score(row)`

The same rule, reimplemented against the same JSON. `make_dataset()` labels each
synthetic row with `risk_level(risk_score(row))` and then flips 2.5% of labels.

That flip is why no model reaches 100%: some training targets deliberately
contradict the rule they came from.

## 3. The two models

Both predict the rule's **three bands directly**:

`classical_model` = `StandardScaler` + `LogisticRegression` over the 8 vitals.
`hybrid_model` = the same estimator over the 8 vitals **plus** four features from
`quantum_features()`, fitted on every fourth row because the circuit simulation is
the expensive part.

The reported band is the **most likely class** (`predict_proba().argmax()`), so
there is no probability threshold to tune and no hand-set cut point that can
flatter the result. `classWeight: "balanced"` in the JSON is deliberate — see the
HIGH-recall trade-off below.

### What the "quantum" part really is

`quantum_features()` builds a **fixed** 4-qubit circuit: each qubit gets `RY(a)`
then `RZ(b)` with features normalised to `[0, π]`, followed by three CNOTs for
entanglement, evaluated with `qiskit.quantum_info.Statevector` — i.e. simulated
classically. The returned values are four single-qubit expectation values in
`[-1, 1]`.

It has **no trainable parameters, no variational loop, no measurement sampling,
and no quantum advantage**. It is a deterministic non-linear feature map: a
preprocessing step, not a quantum model. Calling it "Hybrid Quantum-Classical"
is defensible only in the narrow sense that the features originate from a circuit
description.

If asked what is novel here, the honest answer is the coordination layer and the
UI, not the classifier.

## Measured, not asserted

`Backend/evaluate.py` trains both models on a stratified 80/20 split and writes
[`evaluation.md`](evaluation.md). Latest run (seed 7, 4,000 synthetic rows, 800
held out, three-class target):

| Model | Accuracy | Macro F1 | ROC-AUC |
| --- | --- | --- | --- |
| Classical (8 vitals) | 79.5% | 0.771 | 0.936 |
| Classical, same 1/4 rows (ablation) | 80.4% | 0.781 | 0.936 |
| Hybrid (+ 4 quantum features) | 80.9% | 0.786 | 0.937 |

Per band (hybrid): HIGH precision 58.9% / recall 83.5%; MODERATE 84.3% / 75.0%;
LOW 87.3% / 87.1%.

**The ablation settles the quantum question empirically:** on identical training
rows the four extra columns move macro F1 by +0.005, which is noise. There is no
performance claim to make for the circuit.

**The asymmetry is intentional.** `classWeight: "balanced"` was chosen because the
two errors are not equally bad: a false HIGH over-escalates, a missed HIGH sends an
emergency patient home. That weighting raises HIGH recall from 64% to 84% and costs
about three points of overall agreement. Set `classWeight` to `null` in the JSON
for the maximum-agreement variant.

## Engine agreement

After alignment, the rule and the model agree on the exact band **82%** of the time
(up from 67% before the rules were unified — much of that gap was the two
conventions, not model error). Agreement never crosses both extremes:

| | model LOW | model MODERATE | model HIGH |
| --- | --- | --- | --- |
| **rule LOW** | 278 | 38 | 0 |
| **rule MODERATE** | 38 | 290 | 58 |
| **rule HIGH** | 0 | 10 | 88 |

No rule-HIGH patient is ever shown as LOW, and no rule-LOW patient is escalated to
HIGH. Remaining disagreement is between adjacent bands — which is the safe place
for it.

Agreement is a **consistency** measure, not accuracy. The rule has never been
validated, so a model that reproduces it faithfully is equally unvalidated.

## Why the split is still shown

`pages/Result.jsx` displays `ML MODEL` and `RULE CHECK` as separate rows, and that
stays. An earlier version collapsed them, and the effective verdict was silently
taken from the rule engine while the panel displayed model percentages next to it
— the UI claimed an ML decision it had not used.

Keep both numbers visible. The rule engine is the only thing that works offline;
the model is the only thing actually trained. Each has a reason to exist.

## If you change the rule

Order matters:

1. Edit `src/data/scoring-rule.json`.
2. `cd jeevan-net-phase1 && node scripts/check-scoring-parity.mjs` — both runtimes
   still agree.
3. `cd Backend && python evaluate.py` — regenerate `evaluation.md`, and read HIGH
   recall, not just accuracy.
4. `npm run build` — the frontend imports the JSON, so a syntax error shows up here.
