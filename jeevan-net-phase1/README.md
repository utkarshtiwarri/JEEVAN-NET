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

## Project layout

```
src/
├── main.jsx        entry point
├── App.jsx         shell: sidebar, header, modal hosting, screen switch
├── Icons.jsx       inline SVG icon set
├── styles.css      all styling
├── data/           patient, doctor, facility, language and guideline fixtures
├── lib/            triage rules, facility scoring, API client
├── components/     shared form and display pieces
├── modals/         authentication, video call and booking overlays
└── pages/          one file per screen
```

## Notes

- **No router.** `App.jsx` holds a `selected` string that names the screen to
  render, so nothing is deep-linkable and a refresh returns to the Dashboard.
- **No persistence.** Refreshing discards the profile, the last assessment and
  any booking.
- The OTP modal accepts the code printed on screen. It is a demonstration of the
  flow, not an authentication control.

> This is a research prototype. It is not a medical diagnostic system and must
> not be used for clinical decisions.
