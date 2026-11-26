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

- **No authentication.** The OTP modal compares against a code that is printed
  on screen and has an auto-fill button. It is a UI flow, not a control.
- **No authorisation, sessions, or tokens.** The API is open; the only guard is a
  CORS allowlist.
- No rate limiting, no logging, no audit trail, no request validation beyond
  Pydantic range checks.
- No real patient data is present, and none should be added without a consent and
  storage design.

## Correctness and validation

- Both models are trained on synthetic data whose labels come from a hand-written
  heuristic, so the model learns to approximate that heuristic. It is not
  validated against any clinical outcome.
- Nothing here has been reviewed by a clinician.
- The symptom reasoning in `pages/VoiceCompanionView.jsx` is four
  `String.includes()` branches over Hinglish keywords, and the no-speech-API
  fallback ignores the microphone entirely and processes a fixed sentence.

## Persistence

None. Refresh discards the profile, the last assessment and any booking. No
localStorage, no backend store, no database.

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
- **No test suite** on either side.

## Backend gaps

- Models train at **import time**, so startup is slow and every reload retrains.
  No readiness check; a training failure takes the whole service down.
- No error handling around the quantum feature loop.
- `qiskit>=1.2` targeted Python 3.9–3.12; this machine runs 3.13. Pin 3.12 if the
  install fails.
- No `response_model`, so the response shape is unchecked.
- `glucoseType` (PP/Fasting) is sent by the UI, dropped by the Pydantic model, and
  still used in frontend indicator labels — so the clinical meaning of the
  reading is lost server-side.

## Deployment

The frontend hardcodes `http://127.0.0.1:8000` and the backend allows only
`localhost:5173`. A deployed frontend cannot currently reach a deployed backend,
so the app always falls back to the offline rule estimate. An environment
variable for the API base URL is the prerequisite for any hosted demo.
