# JEEVAN-NET — judge presentation script

Timed for **7 minutes** with a **3-minute** Q&A. Every number quoted here is
reproducible by running the command named next to it. If a judge checks one, it
should hold.

Floor rule: **never claim a clinical result.** The honest framing below is
stronger than an inflated one, and it survives interrogation. If you overclaim
accuracy and someone asks what the labels are, you lose the room.

---

## 0:00 — The hook (45 s)

> "Healthcare in India rarely fails because there aren't enough hospitals. It
> fails because nobody knows *which* hospital can treat *this* patient, right now.
> The nearest one might not have a working CT. The farthest one might.
>
> So we built the coordination layer: what does this patient need, who can
> actually provide it, how fast can they be reached, and what happens next."

Do not open with "we used quantum machine learning." Open with the problem.

---

## 0:45 — Live triage (90 s)

**Click:** Dashboard → *Start Your Health Journey* → *Critical crisis patient* →
*Analyze Patient Triage*.

Point at three things on the result panel:

| What to say | What they see |
| --- | --- |
| "Two independent engines, side by side" | `ML MODEL` and `RULE CHECK` rows |
| "This patient is HIGH on both" | HIGH · 15/15 and HIGH |
| "The rule engine needs no network" | it works with the backend down |

> "The rule engine is 15 additive points — glucose, blood pressure, oxygen,
> symptoms, age. It's transparent, it runs offline, and a clinician can audit it
> line by line. The model is trained to predict the *same* three bands, so the two
> cannot silently disagree."

**If asked why both:** "Because when we showed only the model, we were displaying
model percentages next to a verdict the rule had actually decided. That's a lie in
the interface. Now we show both and the disagreement is visible."

---

## 2:15 — The coordination layer (2 min) — *this is the differentiator*

**Click:** *Match Concentric Facilities*.

> "This is the part we think matters. 129 real facilities from OpenStreetMap,
> within 6 km of the patient. Distance is computed from published coordinates."

Point at the origin bar:

> "And it measures from **your** location if you allow it — press *Use my
> location*."

Click it / or point at `Measuring from: Connaught Place, New Delhi`.

> "If you're outside the covered area it says so and shows nothing, rather than
> quoting you a distance to a Delhi hospital from Bengaluru."

Point at the match percentage and the coverage number:

> "Now the honest bit. OSM gives us names and coordinates. It does **not** publish
> beds, staffing, equipment or ratings — we measured: an emergency tag exists for
> 3 of 129 facilities, a sector for 28. So we don't invent the rest. The match
> percentage is 'best supported by available data', and it reports how much of the
> evidence was actually there. 76% at 65% coverage is a weaker claim than 76% at
> 100%, and we show the difference."

**Why this wins:** the old version of this screen had invented bed counts and
ratings. You are the team that measured what the data actually contains and
refused to fake the rest. Say that.

---

## 4:15 — Real records, real isolation (60 s)

**Click:** *Patients* in the sidebar → *Add Patient* → fill a name, age → *Add to
Register* → select them → *Run Assessment*.

> "A health worker can record many patients under their own login. Every row is
> scoped by Postgres row-level security — we verified that an anonymous insert is
> refused with 401 on all three tables. One account cannot read another's
> patients, even with the API key."

**If asked "is this production-ready for real patient data?"** — the answer is no,
and say so: "No. It has no audit log, no consent capture and no access review.
That's a design problem, not a feature."

---

## 5:15 — The evidence (90 s) — *the part most teams don't have*

**Open a terminal** and run:

```bash
cd jeevan-net-phase1 && node scripts/check-scoring-parity.mjs
node scripts/test-voice-engine.mjs
cd ../Backend && python evaluate.py
```

> "Three checks. First: the frontend rule and the backend rule are one definition —
> `scoring-rule.json` — and this scores 435 generated forms in both runtimes, with
> zero mismatches. Before we unified them they were two different rules, and the
> engines agreed on only 67% of patients. Now it's 82%."

> "Second: the voice engine, 45 spoken cases in Romanised Hindi and Devanagari.
> That harness was red when we found it — four Devanagari cases escalated wrongly,
> because the danger signs had only been written in Romanised script. The
> microphone returns Devanagari, so on a real Hindi speaker it silently failed."

> "Third: held-out performance. 80.9% accuracy, macro F1 0.786. And here's the
> number I'd want you to remember — **HIGH recall is 83.5%**. One in six patients
> our own rule calls HIGH is classified lower. That's the number that describes
> harm, so that's the number we lead with."

Add the ablation:

> "We also ablated the 'quantum' features we inherited. On identical training rows
> they move macro F1 by 0.005 — noise. So we don't claim them. The coordination
> layer is the novel part, not the classifier."

**This is the moment that distinguishes you.** Most teams claim a number. You can
show the harness, the failure you found, and the number that hurts.

---

## 6:45 — Close (15 s)

> "To be clear about what this is: a working coordination prototype on real
> facility data, with measured scoring and honest limits. What it is not is
> clinically validated — the training labels are a heuristic we wrote, so every
> metric measures self-consistency. The next step is real labelled outcomes, from
> a credentialed dataset or a partner clinic. That's the bottleneck now, and it's
> a data problem, not a software one."

---

## Q&A — prepared answers

**"What's your accuracy?"**
> 80.9% held-out, macro F1 0.786. But it measures how well we reproduce our own
> labelling rule, not clinical correctness. HIGH recall 83.5% is the number that
> matters.

**"Where's your training data from?"**
> Synthetic, generated with the rule as labels. That's the honest limit. Real
> outcomes would need MIMIC-IV (credentialed, weeks) or a clinic partner.

**"Is the quantum part real?"**
> There's a real 4-qubit circuit, classically simulated, used as a fixed feature
> map. It has no trainable parameters and no quantum advantage. We measured it at
> +0.005 F1, i.e. nothing. We kept it documented rather than deleted so the claim
> stays checkable.

**"How do you know it's safe?"**
> We don't, and we don't claim it. It's not a medical device. The safety property
> we *can* show is that the model never downgrades a rule-HIGH patient to LOW —
> zero cases in 800 held-out rows.

**"What would you do with more time?"**
> Two things: real labelled data, and a clinic/tenant model so a register can be
> shared. Both are data-and-design problems, not UI.

**"Why not just use a hospital API?"**
> There isn't a public one in India with bed availability. That absence is the
> reason to build the coordination layer.

---

## Demo failure plan

| Risk | Do this |
| --- | --- |
| Backend not running | Say "backend's down, this is the offline rule engine" — the badge already says `Offline rule estimate`. It's a feature, demonstrate it deliberately. |
| No network | Everything but the API works: facility data is bundled, the rule engine is local. |
| Geolocation denied | It falls back to the default origin and labels it. Nothing breaks. |
| Database misconfigured | Open **Setup status** in the sidebar — it lists exactly which table is missing. |
| Long silence | The voice companion has 6 one-click sample utterances; use them instead of speaking. |

---

## Numbers cheat-sheet

| Claim | Value | Reproduce with |
| --- | --- | --- |
| Facilities | 129 real, 6 km of Connaught Place | `node scripts/fetch-facilities.mjs` |
| Facilities declaring emergency | 3 / 129 | provenance block in `facilities-osm.json` |
| Rule ↔ model agreement | 82% exact band | `python Backend/evaluate.py` |
| Before rule unification | 67% | `docs/scoring.md` |
| Held-out accuracy | 80.9% | `docs/evaluation.md` |
| Macro F1 | 0.786 | `docs/evaluation.md` |
| HIGH recall | 83.5% | `docs/evaluation.md` |
| Quantum ablation | +0.005 F1 | `docs/evaluation.md` |
| Scoring parity cases | 435, 0 mismatches | `node scripts/check-scoring-parity.mjs` |
| Voice cases | 45, all passing | `node scripts/test-voice-engine.mjs` |
| Conditions known | 26 | `data/conditions.js` |
| Languages | 13 | `data/languages.js` |
| RLS verified | 401 on anon insert, 3 tables | `Setup status` page |
