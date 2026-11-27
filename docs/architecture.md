# Architecture (as implemented)

This describes the code that exists today, not the roadmap. Where the root
README describes something that has not been built, see
[`limitations.md`](limitations.md).

## Two halves, one dependency edge

```
jeevan-net-phase1/            React 18 + Vite 6 SPA (port 5173)
        |
        |  POST /api/assess   (hardcoded http://127.0.0.1:8000)
        v
Backend/main.py               FastAPI + scikit-learn + qiskit (port 8000)
```

There is exactly one call between them. Everything else the UI shows —
hospitals, doctors, beds, ETAs, screening guidelines, prices — is fixture data
compiled into the bundle. The backend has no hospital, appointment, timeline or
diagnostic endpoint.

There is also an **optional third edge to Supabase**, which is not a dependency:
`lib/supabase.js` exports `null` plus a `supabaseConfigError` when
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, and `lib/auth.js`
falls back to `user_metadata` when the `profiles` table has not been created. The
app must render with none of that configured.

## Frontend layout

```
jeevan-net-phase1/
├── index.html
├── vite.config.js            react plugin, strictPort 5173
├── scripts/
│   ├── verify-imports.mjs    reads src/, asserts every cross-module symbol resolves
│   └── find-dead-css.mjs     lists CSS classes no module references
└── src/
    ├── main.jsx              createRoot only
    ├── App.jsx               shell: sidebar, header, modal hosting, screen switch
    ├── Icons.jsx             ~31 inline SVG icons
    ├── styles.css            all styling
    ├── data/                 patients, doctors, facilities, languages, guidelines, conditions
    ├── lib/                  triage.js, scoring.js, api.js, symptomEngine.js,
    │                         auth.js, supabase.js, patients.js
    ├── components/           Field, Checkbox, RecordItem
    ├── modals/               AuthModal, LiveVideoCallModal, AppointmentBookingModal
    └── pages/                nine screens, plus Result and FacilityCard
```

### Navigation

There is no router and no URL. `App.jsx` holds a single `selected` string whose
value names the screen to render. Consequences worth knowing before you touch it:

- Nothing is deep-linkable; a refresh always returns to the Dashboard.
- Browser back does nothing.
- `DemoPage`-style screens cannot be shared by link.

Moving to a router is a contained change: each entry in `pages/` already takes
its dependencies as props.

### State

All state lives in `App` and is passed down as props:

| State | Owner | Notes |
| --- | --- | --- |
| `signedIn` | `App` | localStorage flag plus Supabase session; gates the whole app |
| `user` | `App` | replaces the whole object on sign-in, profile save or sign-out |
| `selected` | `App` | which screen renders |
| `selectedPatient` | `App` | which register patient is being viewed or assessed |
| `assessmentData` | `App` | last triage result; lost on refresh |
| `selectedFacility` | `App` | chosen hospital for dispatch |
| `activeVideoCallDoctor`, `bookingModalDoctor` | `App` | which modal is open |

Persistence is partial. Two things survive a refresh: the `jeevan-net.session`
localStorage flag that backs the demo/guest sign-in path, and — when Supabase is
configured — a real Supabase Auth session plus the `profiles` row. Everything
clinical (the last assessment, the chosen facility, any booking) is React state
and is lost. See [`limitations.md`](limitations.md).

## Data flow of one triage

1. `pages/PatientAssessment.jsx` collects the form.
2. `lib/triage.js` → `localTriage(form)` runs **always**, producing a 0–15 rule
   score and a level. It depends on nothing external.
3. `lib/api.js` → `assessPatient(form)` posts to the backend.
   - Success: returns model probabilities with `backendOnline: true`.
   - Failure: returns `backendOnline: false`, `null` probabilities, and the real
     error message. It does not invent numbers.
4. The page combines them: the effective `risk_level` is the **model's** when the
   backend answered, and the rule engine's only as a labelled fallback.
5. `pages/Result.jsx` shows both verdicts side by side with a `Live model` /
   `Offline rule estimate` badge.

The two engines are deliberately not merged. See [`scoring.md`](scoring.md).

## Backend layout

`Backend/main.py` is a single module. At import time it:

1. generates 3,500 synthetic patients (`make_dataset`),
2. labels them with the hand-written `risk_score` heuristic (plus 2.5% noise),
3. fits `classical_model` on the 8 vitals,
4. runs 875 statevector simulations to build `quantum_features`,
5. fits `hybrid_model` on vitals + those four quantum features.

Both objects are module-level globals. Endpoints:

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | static payload |
| `POST` | `/api/assess` | Pydantic-validated; returns a `disclaimer` |

CORS allows only `localhost:5173` and `127.0.0.1:5173`. `vite.config.js` pins
that port with `strictPort: true` so the two cannot silently drift apart — if
Vite had fallen back to 5174, the request would fail CORS and the UI would
quietly show the offline estimate instead.

## Known structural debt

- Inline `style={{ ... }}` blocks still carry most screen-level colour, so the
  `:root` token set in `styles.css` is only partly authoritative.
- No router (above), no persistence (above).
- No test suite on either side; `npm run check` is a static import check, not a
  test. The one behavioural check is `scripts/test-voice-engine.mjs` — 45 spoken
  utterances against `lib/symptomEngine.js`.
- `lib/api.js` carries five Supabase CRUD helpers; `saveAssessment` is live, the
  other four (`saveProfile`, `getProfile`, `getAssessmentHistory`,
  `deleteAssessment`) have no caller and duplicate `lib/auth.js` / `lib/patients.js`.
- The register's assessment history comes from `lib/patients.js`
  (`getPatientAssessments`), not from `lib/api.js`.
- The sentinel-import convention required by `scripts/verify-imports.mjs`
  creates a real cycle: `data/facilities.js` → `pages/Emergency.jsx` →
  `data/facilities.js`.
