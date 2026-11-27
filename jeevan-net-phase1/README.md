# JEEVAN-NET — Frontend

The web dashboard for JEEVAN-NET (ArogyaNexus), a healthcare coordination
platform that connects patients, health workers, hospitals, ambulances and
diagnostic centres.

Built with React 18 and Vite 6. It runs entirely on its own: every hospital,
doctor, bed count and screening guideline it displays is fixture data compiled
into the bundle, and the triage screen degrades to a local rule engine if the
scoring API is not running.

## Screens

| Screen | What it does |
| --- | --- |
| Dashboard | Profile summary, mandatory-screening strip, teleconsult shortcut |
| Clinical Triage | Vitals and symptoms in, risk assessment out |
| Concentric Locator | Facility matching by radius band, government vs private |
| Doctor Consult | Specialist directory, video call and appointment booking |
| Voice Companion | Spoken symptom intake with first-aid guidance |
| Age Checklist | Population-based NCD screening tables by age and gender |
| Expense & Streams | Allopathy / Ayurveda / Homeopathy allocation and drug costs |
| Emergency Grid | Ambulance dispatch status sequence |
| Patient Record | Demographics and last recorded vitals |
| Sign in | Email/password via Supabase, or demo/guest with no database |
| Patients | Register of people this account records, with per-patient triage history |

## Requirements

- Node.js 18 or newer (developed on 24.x)
- No backend required to browse the app; the scoring API is optional

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. The port is pinned in `vite.config.js` because the
backend's CORS allowlist names it and a silent fallback to 5174 would break the
API call.

## Other commands

```bash
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle
npm run check    # static check: every cross-module reference resolves
```

`npm run check` is not a test suite. It catches a missing import or an undefined
symbol, which `vite build` does not report.

## Connecting the scoring API

The triage screen posts to `http://127.0.0.1:8000/api/assess`. Start the service
in `../Backend` and the result panel switches from `Offline rule estimate` to
`Live model`. With no backend running everything still works, using the local
rule engine, and the UI says so.

## Sign in and the database (optional)

A fresh browser lands on `pages/Login.jsx`. Two paths work with **no**
configuration:

- **Use Demo Account** — signs in as the fixture patient.
- **Continue as guest** — same, without setting the persistence flag.

For real accounts, copy `.env.example` to `.env.local` and fill in
`VITE_SUPABASE_URL` plus either `VITE_SUPABASE_ANON_KEY` (legacy) or
`VITE_SUPABASE_PUBLISHABLE_KEY` (new), then **restart the dev server** — Vite
reads env only at startup. Finally run `supabase/setup.sql` in the Supabase SQL editor — paste its
**contents**, not its file path. It is idempotent and creates/repairs everything
at once: the `profiles` table and its `abha_id` column, the `patients` register,
the `assessments` table with `patient_id`, and every RLS policy.

Skipping it degrades rather than crashes: sign-up still works (details fall back
to account metadata), and the Patients page explains what is missing. To see
exactly what the database has, open **Setup status** in the sidebar — it probes
the schema and lists each item.

Never put a `service_role` key in `.env.local`. It bypasses row-level security
and would ship to the browser; `lib/supabase.js` rejects it.

## Project layout

```
src/
├── main.jsx        entry point
├── App.jsx         shell: sidebar, header, modal hosting, screen switch
├── Icons.jsx       inline SVG icon set
├── styles.css      all styling
├── data/           patient, doctor, facility, language, guideline and condition fixtures
├── lib/            triage rules, facility scoring, API client, symptom engine, auth
├── components/     shared form and display pieces
├── modals/         authentication, video call and booking overlays
└── pages/          one file per screen
```

## Notes

- **No router.** `App.jsx` holds a `selected` string that names the screen to
  render, so nothing is deep-linkable and a refresh returns to the Dashboard.
- **Persistence is partial.** The sign-in flag (`jeevan-net.session`), a Supabase
  session and the `profiles` row survive a refresh; the last assessment, the
  chosen facility and any booking do not.
- **No test suite.** The closest thing is
  `node scripts/test-voice-engine.mjs` — 45 spoken utterances through the symptom
  engine, which must exit 0.
- The profile modal edits your own record directly. It has no code step: the row
  is already scoped to the signed-in account by RLS.

> This is a research prototype. It is not a medical diagnostic system and must
> not be used for clinical decisions.
