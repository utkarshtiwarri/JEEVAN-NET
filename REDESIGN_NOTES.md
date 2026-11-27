# JEEVAN-NET UI redesign — implementation notes

## Design decisions
- Kept the existing fixed dark navy sidebar and its navigation model.
- Refreshed the shared application shell, page header, content surfaces, cards, buttons, fields and responsive breakpoints.
- Rebuilt the dashboard as a patient-first coordination overview with prominent clinical triage, voice intake and facility matching actions.
- Kept the existing React + Vite architecture and all current page modules.

## Files changed
- `jeevan-net-phase1/src/App.jsx`
  - Reworded the status indicators so the UI does not imply a live 2G cache, live ABDM sandbox or verified OTP integration.
  - Reworded the footer to identify demonstration data and the research-prototype status.
- `jeevan-net-phase1/src/pages/Dashboard.jsx`
  - Replaced the dashboard layout while retaining existing navigation, doctor-call, profile-edit, screening-guideline and facility-selection callbacks.
  - Uses the actual configured language list (13 entries) instead of the unsupported “22+ languages” claim.
  - Clearly labels the profile and facility/doctor data as demonstration data.
  - States that the national ABHA integration is not connected.
- `jeevan-net-phase1/src/styles.css`
  - Added a shared SaaS design layer and responsive styling for desktop, tablet and mobile.

## Preserved
- Clinical triage, result flow and local rule fallback.
- Facility matching and scoring logic.
- Voice companion engine and language data.
- Doctor consultation, appointment and video-call modals.
- Emergency workflow, age checklist, medical streams and patient record modules.
- FastAPI endpoints and model code.

## Validation
- `node scripts/verify-imports.mjs` passed: “OK - every cross-module reference resolves.”
- Production build could not be completed in this execution environment because the supplied `node_modules` archive is missing the platform-specific optional dependency `@rollup/rollup-linux-x64-gnu`. `npm ci` did not complete within the available install window.
- Reinstall dependencies locally before running the production build:

```bash
cd jeevan-net-phase1
npm ci
npm run build
npm run dev
```

The build should be run on the developer's machine before merging or deploying. This is a UI redesign, not clinical validation or authorization for patient care.

> **Superseded.** The Rollup failure above was environmental, not a code defect.
> On the current machine `npm run build` succeeds in ~2.5 s (523 kB chunk, one
> size warning) and `npm run check` passes. Trust the command output over this
> note.
