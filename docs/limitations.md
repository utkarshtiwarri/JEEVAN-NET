# Limitations and unverified claims

Read this before demoing. Everything here is a deliberate prototype boundary or
a known gap, and several items are things a judge or reviewer will find anyway —
better to have them written down.

## Not implemented, despite the root README

The root README describes a four-phase platform. What exists is a single-screen
consumer prototype plus one scoring endpoint.

| README mentions | Reality |
| --- | --- |
| Citizen / healthcare-worker / hospital / government UIs | one citizen UI only |
| Hospital Capability Map, Diagnostic Logistics, Predictive Radar | fixture arrays in `src/data/`, no engine |
| AI Patient Timeline | a static demographics and vitals card |
| Ambulance coordination | a `setTimeout` status sequence in `pages/Emergency.jsx` |
| Offline-first sync | a status pill in the sidebar; nothing queues or syncs |
| ABDM integration | none; the ABHA id is a hardcoded string |
| Tests, `data/synthetic/`, docs pipeline | absent (docs/ now exists; the rest does not) |

The README's section 12 marks its directory tree as the original proposal.

## Claims that are illustrative, not measured

These are labelled as illustrative in the UI:

- The stroke pathway comparison (~210 min vs ~45 min). No trial, no data.
- The 40% out-of-pocket saving and the 87% branded-vs-generic drug gap. The
  prices are placeholders.
- The "40 / 30 / 15" AYUSH stream split. Invented proportions.

## Security and privacy

- **Sign-in exists, but it is not a security boundary for the demo path.**
  `pages/Login.jsx` either authenticates against Supabase (email + password,
  hashed by Supabase Auth) or sets the local `jeevan-net.session` flag for the
  "demo" and "guest" buttons, so the app can still be shown with no database and
  no account. Anything behind the gate can be reached by clicking one button.
- **Sign-in offers a password, and nothing else.** `pages/Login.jsx` calls
  `signInWithPassword` (or `signUp` to create the account). What that establishes
  is possession of a password, **not** a verified identity: the address is only
  verified if Supabase's "Confirm email" is on, there is no ABHA/ABDM check, and
  `abha_id` is free text the user types.
- **There is deliberately no passwordless email code.** One was built and removed:
  this project's mail sender fails (`Error sending confirmation email`), so the
  flow could not deliver its own code. Re-adding it needs working SMTP first.
- **The profile modal in `modals/AuthModal.jsx` has no verification step.** It
  writes straight to the signed-in account's own row, which RLS already scopes;
  a code would have added a dependency without adding a control.
- Phone/SMS auth is disabled on the project, so a mobile number is a profile
  field, never an authentication factor.
- **No authorisation or multi-user roles.** When Supabase is configured, the RLS
  policies in `supabase/02-patient-records.sql` restrict each table to its owning
  patient's rows; nothing else is protected. The FastAPI scoring endpoint has no
  auth at all — its only guard is a CORS allowlist.
- No rate limiting, no logging, no audit trail, no request validation beyond
  Pydantic range checks.
- No real patient data is present, and none should be added without a consent and
  storage design.

## Correctness and validation

- Both models are trained on synthetic data whose labels come from a hand-written
  heuristic, so the model learns to approximate that heuristic. It is not
  validated against any clinical outcome. Held-out performance is measured in
  [`evaluation.md`](evaluation.md) — **80.9% accuracy, 0.786 macro F1** — and that
  number means "reproduced our own rule", nothing more.
- **HIGH recall is 83.5%, not 100%.** The model misses roughly one in six patients
  the rule calls HIGH. That is the number that would matter clinically, and it is
  the one to quote before anyone quotes accuracy.
- **The quantum feature map adds no measurable benefit.** An ablation on identical
  training rows moves macro F1 by +0.005.
- **The two engines now agree on 82% of held-out rows** (exact band). Before the
  rule was given a single definition they agreed on 67%. The remaining gap is
  between adjacent bands: no rule-HIGH patient is shown as LOW, and no rule-LOW
  patient is escalated.
- The rule itself is unvalidated, so agreement is a consistency measure. A model
  that faithfully reproduces a wrong rule is equally wrong.
- Nothing here has been reviewed by a clinician.
- The symptom reasoning is not in the view. `lib/symptomEngine.js` scores 26
  conditions defined in `data/conditions.js`, with keyword weights
  hand-assigned and `emergencyAt` thresholds hand-calibrated: it is keyword
  matching, not a trained model. `node scripts/test-voice-engine.mjs` covers 45
  spoken utterances (Romanised and Devanagari) and is the only behavioural test
  in the repo — it must exit 0. The no-speech-API fallback still ignores the
  microphone entirely and processes a fixed sample sentence.

## Persistence

Partial, and split down the middle:

| What | Survives a refresh? | Where |
| --- | --- | --- |
| Signed-in flag for the demo/guest path | yes | `localStorage`, key `jeevan-net.session` |
| A real account session | yes | Supabase Auth |
| Profile details | if Supabase is configured | `profiles` table, else `user_metadata` |
| Patients in the register | if `03-patients.sql` has been run | `patients` table |
| Assessments, for a real account | yes | `assessments` table, optionally keyed to a patient |
| Assessments, for demo/guest | **no** | React state only, never written |
| Chosen facility, bookings | **no** | React state in `App.jsx` only |

`PatientAssessment` writes a row only when `user.isDemo` is false, and
`PatientHistory` / `Patients` read history back from the same table, so a real
account keeps a record while a demo session never creates one. The write is
best-effort: if the policies have not been applied, the screen says
"Not saved: …" rather than pretending the record exists.

## Facility data

Facility names, types and coordinates come from **OpenStreetMap** via the Overpass
API: 129 facilities within 6 km of Connaught Place, New Delhi, committed as
`src/data/facilities-osm.json` with a provenance block. Refresh with:

```bash
node scripts/fetch-facilities.mjs    # ~10 s, needs network
```

What the source publishes, measured over this area:

| Field | Coverage |
| --- | --- |
| name | ~98% |
| hospital vs clinic | 100% |
| coordinates | 100% |
| sector (govt/private) | 22% (28 of 129) |
| emergency tag | 2% (3 of 129) |
| beds, staffing, equipment, ratings | **not published at all** |

So distance is real and ETA is estimated from it; everything else is either shown
as "not published" or scored conservatively. The old hand-written list of six
hospitals — with invented bed counts, ratings and capability scores — is gone.
A match percentage now means "best supported by available data", explicitly not
"able to treat this patient".

Data © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright).
Attribution is shown in the app footer and on the facility screen, as the licence
requires.

## What this still is not

One account can hold **many** patients (`patients` table), and each assessment can
be filed against one of them via `patient_id`. That covers "a health worker records
patients under their own login". It does **not** cover:

- sharing a patient with another account, or a clinic-wide register — every row
  is owned by one `auth.uid()`, and RLS enforces exactly that;
- staff roles: there is no `is_staff`, no admin, no read-only view;
- de-duplication: nothing detects the same person entered twice.

So a profile can persist while the clinical content around it does not.
`src/lib/api.js` already holds five Supabase helpers that would close that gap
(`saveAssessment`, `getAssessmentHistory`, `deleteAssessment`, …) but nothing
imports them, and there is no `assessments` table in `supabase/schema.sql`.

## Frontend gaps

- **No router**: `selected` string in `App.jsx`. Nothing is deep-linkable, back
  does nothing, refresh returns to the Dashboard.
- **Two design systems**: `:root` in `styles.css` defines a teal palette, but most
  screens override it with hardcoded slate/blue values in inline `style={{}}`
  blocks. Consolidating onto the tokens is unfinished.
- **Dead responsive CSS**: 13 unused selectors remain inside `@media` blocks.
  `npm run check` catches broken imports; `scripts/find-dead-css.mjs` lists these.
- **Accessibility**: no focus trap or Escape handling in any modal, no
  `role="dialog"`/`aria-modal`, and emoji are used as icons without `aria-hidden`.
  Form labels in the modals still lack `htmlFor`/`id` (the triage `Field`
  component is fixed).
- **No test framework** on either side: no runner and no assertions beyond the
  pass counter in `scripts/test-voice-engine.mjs`. Nothing covers React rendering
  or the FastAPI endpoints.

## Backend gaps

- Models train at **import time**, so startup is slow and every reload retrains.
  No readiness check; a training failure takes the whole service down.
- No error handling around the quantum feature loop — a failure there takes the
  whole service down at import.
- No `response_model`, so the response shape is unchecked.
- `glucoseType` (PP/Fasting) is sent by the UI, **dropped by the Pydantic model**,
  and still used in frontend indicator labels. It is now persisted with the
  assessment (`api.js` writes it into `vitals`), but the model still never sees
  it — so a fasting reading is scored as if it were post-prandial.

## Deployment

The frontend hardcodes `http://127.0.0.1:8000` and the backend allows only
`localhost:5173`. A deployed frontend cannot currently reach a deployed backend,
so the app always falls back to the offline rule estimate. An environment
variable for the API base URL is the prerequisite for any hosted demo.
