"""Measure the scoring models instead of asserting they work.

Run:  python evaluate.py            (writes docs/evaluation.md and prints a summary)

WHAT THIS CAN AND CANNOT TELL YOU
---------------------------------
The labels come from `model.risk_score()` — the shared additive rule in
`src/data/scoring-rule.json`, which the frontend also reads — plus 2.5% deliberate
noise. So every number here answers "how well does the model reproduce our own
rule?", NOT "is this clinically correct". No real patient outcome is involved, and
no clinician has reviewed any of it.

The rule is NOT duplicated in this file. It is imported from `model.py`, which
loads the same JSON the UI uses. If the two ever disagreed, the agreement figure
below would be measuring the wrong thing.

Both models predict the rule's three bands directly (LOW / MODERATE / HIGH), so
there is no probability threshold to tune: the verdict is the most likely band.
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from model import (
    CLASSES,
    LEVEL_HIGH,
    make_dataset,
    mix_vitals_and_quantum,
    new_pipeline,
    rule_level,
)

N_ROWS = 4000
SEED = 7
TEST_FRACTION = 0.2


def multiclass_metrics(y_true, y_pred, y_proba) -> dict:
    labels = list(range(len(CLASSES)))
    report = classification_report(
        y_true, y_pred, labels=labels, target_names=CLASSES, output_dict=True, zero_division=0
    )
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "macro_f1": f1_score(y_true, y_pred, average="macro", zero_division=0),
        "weighted_f1": f1_score(y_true, y_pred, average="weighted", zero_division=0),
        "auc_ovr": roc_auc_score(y_true, y_proba, multi_class="ovr", labels=labels),
        "per_class": {
            band: {
                "precision": report[band]["precision"],
                "recall": report[band]["recall"],
                "f1": report[band]["f1-score"],
                "support": int(report[band]["support"]),
            }
            for band in CLASSES
        },
    }


def pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def confusion_table(y_true, y_pred) -> list[str]:
    labels = list(range(len(CLASSES)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    header = "| actual \\ predicted | " + " | ".join(CLASSES) + " |"
    sep = "| --- | " + " | ".join("---" for _ in CLASSES) + " |"
    rows = [header, sep]
    for i, band in enumerate(CLASSES):
        cells = " | ".join(str(int(v)) for v in cm[i])
        rows.append(f"| **{band}** | {cells} |")
    return rows


def main() -> int:
    print(f"Generating {N_ROWS} synthetic rows (seed {SEED})...")
    X, y, rule_scores, rule_levels = make_dataset(n=N_ROWS, seed=SEED)

    X_tr, X_te, y_tr, y_te, lvl_tr, lvl_te = train_test_split(
        X, y, rule_levels, test_size=TEST_FRACTION, random_state=SEED, stratify=y
    )

    dist_tr = {band: int((lvl_tr == band).sum()) for band in CLASSES}
    dist_te = {band: int((lvl_te == band).sum()) for band in CLASSES}

    print(f"  train {len(X_tr)} / test {len(X_te)} rows")
    print("  rule band counts (train): " + ", ".join(f"{b}={n}" for b, n in dist_tr.items()))
    print("  rule band counts (test) : " + ", ".join(f"{b}={n}" for b, n in dist_te.items()))

    print("\nFitting classical model on all training rows...")
    classical = new_pipeline().fit(X_tr, y_tr)
    proba_classical = classical.predict_proba(X_te)
    pred_classical = classical.predict(X_te)

    print("Fitting ablation baseline on every 4th training row...")
    classical_sub = new_pipeline().fit(X_tr[::4], y_tr[::4])
    proba_sub = classical_sub.predict_proba(X_te)
    pred_sub = classical_sub.predict(X_te)

    print("Computing quantum features (fixed 4-qubit circuit, classically simulated)...")
    H_tr = mix_vitals_and_quantum(X_tr[::4])
    H_te = mix_vitals_and_quantum(X_te)

    print("Fitting hybrid model...")
    hybrid = new_pipeline().fit(H_tr, y_tr[::4])
    proba_hybrid = hybrid.predict_proba(H_te)
    pred_hybrid = hybrid.predict(H_te)

    m_classical = multiclass_metrics(y_te, pred_classical, proba_classical)
    m_sub = multiclass_metrics(y_te, pred_sub, proba_sub)
    m_hybrid = multiclass_metrics(y_te, pred_hybrid, proba_hybrid)

    # ---- agreement against the CLEAN rule bands (not the flipped labels) ----
    model_bands = np.array([CLASSES[int(i)] for i in pred_hybrid], dtype=object)
    agree = float((model_bands == lvl_te).mean())

    order = CLASSES
    cross = {a: {b: 0 for b in order} for a in order}
    for a, b in zip(lvl_te, model_bands):
        cross[a][b] += 1

    high_to_low = int(cross["HIGH"]["LOW"])
    low_to_high = int(cross["LOW"]["HIGH"])

    # ---- report ----
    lines: list[str] = []
    add = lines.append

    add("# Model evaluation")
    add("")
    add(f"Generated by `Backend/evaluate.py` on {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC.")
    add("Re-run it after any change to `model.py` or `src/data/scoring-rule.json`;")
    add("do not hand-edit this file.")
    add("")
    add("> **What this measures.** Training labels come from the shared additive rule in")
    add("> `src/data/scoring-rule.json` — the same file `src/lib/triage.js` reads — with")
    add("> 2.5% flipped on purpose. Every number below describes how closely the models")
    add("> reproduce *that rule*. None of it is evidence of clinical validity: the data is")
    add("> synthetic, no real patient outcome is involved, and no clinician has reviewed")
    add("> the model.")
    add("")

    add("## Setup")
    add("")
    add("| | |")
    add("| --- | --- |")
    add(f"| Synthetic rows | {N_ROWS} |")
    add(f"| Split | {pct(1 - TEST_FRACTION)} train / {pct(TEST_FRACTION)} test, stratified, seed {SEED} |")
    add(f"| Train / test rows | {len(X_tr)} / {len(X_te)} |")
    add(f"| Target | the rule's three bands (`HIGH` ≥ {LEVEL_HIGH}, `MODERATE` ≥ 5) |")
    add(f"| Rule band counts, train | " + ", ".join(f"{b} {n}" for b, n in dist_tr.items()) + " |")
    add(f"| Rule band counts, test | " + ", ".join(f"{b} {n}" for b, n in dist_te.items()) + " |")
    add(f"| Hybrid training rows | {len(y_tr[::4])} (every 4th, due to circuit cost) |")
    add("")
    add("Both models are trained on the three-band target directly, so the reported band")
    add("is the most likely one — there is no probability threshold to tune, and no way")
    add("for a hand-set cut point to flatter the result.")
    add("")

    add("## Held-out performance")
    add("")
    add("| Model | Accuracy | Macro F1 | Weighted F1 | ROC-AUC (OvR) |")
    add("| --- | --- | --- | --- | --- |")
    for name, m in (
        ("Classical (8 vitals)", m_classical),
        ("Classical, 1/4 rows (ablation baseline)", m_sub),
        ("Hybrid (+ 4 quantum features)", m_hybrid),
    ):
        add(
            f"| {name} | {pct(m['accuracy'])} | {m['macro_f1']:.3f} "
            f"| {m['weighted_f1']:.3f} | {m['auc_ovr']:.3f} |"
        )
    add("")
    add("Macro F1 weighs all three bands equally, so a model that is good at the common")
    add("bands and poor at HIGH cannot hide behind the average. Weighted F1 tracks the")
    add("class imbalance instead. Read them together.")
    add("")

    add("### Per-band quality (hybrid)")
    add("")
    add("| Band | Precision | Recall | F1 | Test rows |")
    add("| --- | --- | --- | --- | --- |")
    for band in CLASSES:
        c = m_hybrid["per_class"][band]
        add(f"| {band} | {pct(c['precision'])} | {pct(c['recall'])} | {c['f1']:.3f} | {c['support']} |")
    add("")
    high = m_hybrid["per_class"]["HIGH"]
    if high["recall"] < 0.8:
        add(f"**HIGH recall is {pct(high['recall'])}** — that is the number that matters")
        add("clinically, because a missed HIGH is a patient sent home who should not be.")
        add("Treat anything below ~0.9 here as the main thing to fix.")
        add("")
    add("## Confusion matrix (hybrid, held-out)")
    add("")
    lines.extend(confusion_table(y_te, pred_hybrid))
    add("")

    add("## Engine agreement")
    add("")
    add("The rule's band against the hybrid model's band on the same held-out rows.")
    add("")
    add("| rule \\ model | LOW | MODERATE | HIGH |")
    add("| --- | --- | --- | --- |")
    for a in order:
        add(f"| **{a}** | {cross[a]['LOW']} | {cross[a]['MODERATE']} | {cross[a]['HIGH']} |")
    add("")
    add(f"- **Exact band agreement: {pct(agree)}** ({int((model_bands == lvl_te).sum())} of {len(model_bands)})")
    add(f"- Rule HIGH → model LOW (under-triage): **{high_to_low}** rows")
    add(f"- Rule LOW → model HIGH (over-triage): **{low_to_high}** rows")
    add("")
    if high_to_low == 0 and low_to_high == 0:
        add("The two engines never disagree across both extremes — a HIGH never reads as LOW")
        add("and a LOW never reads as HIGH. Disagreement is confined to adjacent bands.")
    else:
        add("Disagreement crosses both extremes, which is the case worth arguing about: a")
        add("patient the rule calls HIGH can be shown a LOW model verdict.")
    add("")
    add("Agreement is a consistency measure. If the rule is wrong, a model that reproduces")
    add("it faithfully is equally wrong — so this number cannot be quoted as accuracy.")
    add("")

    add("## Does the quantum feature map help?")
    add("")
    delta_f1 = m_hybrid["macro_f1"] - m_sub["macro_f1"]
    delta_acc = m_hybrid["accuracy"] - m_sub["accuracy"]
    add("Same training rows for both, so only the four circuit-derived columns differ.")
    add("")
    add("| | Accuracy | Macro F1 |")
    add("| --- | --- | --- |")
    add(f"| Classical, same 1/4 rows | {pct(m_sub['accuracy'])} | {m_sub['macro_f1']:.3f} |")
    add(f"| Hybrid, + quantum features | {pct(m_hybrid['accuracy'])} | {m_hybrid['macro_f1']:.3f} |")
    add(f"| Difference | {delta_acc * 100:+.1f} pp | {delta_f1:+.3f} |")
    add("")
    if abs(delta_f1) < 0.01:
        add("**Conclusion: no measurable benefit.** The four circuit features add nothing the")
        add("eight vitals did not already carry. \"Hybrid Quantum-Classical\" is a naming")
        add("choice, not a performance claim.")
    elif delta_f1 > 0:
        add(f"**Conclusion: a small gain** of {delta_f1:+.3f} macro F1 — within the noise of")
        add("the 2.5% label ceiling, so it still does not justify a quantum claim.")
    else:
        add(f"**Conclusion: it makes things worse** ({delta_f1:+.3f} macro F1).")
    add("")

    add("## Known limits of this evaluation")
    add("")
    add("- Labels are a heuristic, so a high score means \"copied our own rule\". Clinical")
    add("  validity is not measured anywhere here.")
    add("- The synthetic generator is not fitted to any real population, so the feature")
    add("  distributions — and therefore the class balance — are invented. The MODERATE")
    add("  band in particular is whatever the rule's 5-of-15 cut point produces.")
    add("- The 2.5% flipped labels set a ceiling: no model can reach 100% on this task.")
    add("- No subgroup analysis. Anything about age, sex or comorbidity performance would")
    add("  be meaningless on synthetic rows.")
    add("- One seed. The numbers move a little on another; nothing here is a confidence")
    add("  interval.")
    add("- Agreement is measured against a rule that has itself never been validated, so")
    add("  the two engines agreeing is evidence of consistency, not of correctness.")
    add("")

    report = "\n".join(lines) + "\n"
    out_dir = Path(__file__).resolve().parent.parent / "docs"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / "evaluation.md"
    out_file.write_text(report, encoding="utf-8")

    print("\n" + "=" * 72)
    print("HELD-OUT PERFORMANCE (task: predict the rule's band)")
    print("=" * 72)
    print(f"{'model':<42}{'acc':>8}{'macroF1':>10}{'AUC':>8}")
    for name, m in (
        ("Classical (all train rows)", m_classical),
        ("Classical (1/4 rows, ablation)", m_sub),
        ("Hybrid (+ quantum features)", m_hybrid),
    ):
        print(f"{name:<42}{pct(m['accuracy']):>8}{m['macro_f1']:>10.3f}{m['auc_ovr']:>8.3f}")

    print("\nper-band precision / recall (hybrid)")
    for band in CLASSES:
        c = m_hybrid["per_class"][band]
        print(f"  {band:<9} P={pct(c['precision']):>7}  R={pct(c['recall']):>7}  n={c['support']}")

    print("\n" + "=" * 72)
    print("ENGINE AGREEMENT (shared rule vs hybrid model)")
    print("=" * 72)
    print(f"exact band agreement  : {pct(agree)}")
    print(f"rule HIGH -> model LOW: {high_to_low}")
    print(f"rule LOW -> model HIGH: {low_to_high}")

    print("\n" + "=" * 72)
    print("QUANTUM ABLATION")
    print("=" * 72)
    print(f"classical same-rows macro F1 : {m_sub['macro_f1']:.3f}")
    print(f"hybrid macro F1              : {m_hybrid['macro_f1']:.3f}")
    print(f"difference                   : {delta_f1:+.3f}")

    print(f"\nWrote {out_file}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
