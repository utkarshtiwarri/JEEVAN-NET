# Working notes for this project

## Environment

- Windows, commands run through `cmd /C`. Node 24.17.0 / npm 11.13.0, Python 3.13.14.
- No git repo existed until this work; `main` now holds the baseline commit plus
  the Phase 0/1/2 changes. Check `git log --oneline` before assuming a state.
- `node_modules` is installed under `jeevan-net-phase1/`. There is no Python
  venv; the backend has not been run.

## Shell and tooling quirks that will cost you time

- **Quoted arguments get mangled through `cmd /C`.** `git commit -m "several words"`
  is split into pathspecs. Write the message to a file and use
  `git commit -F .git/MSG`. Same class of problem breaks `findstr /C:"a b"` with
  multiple patterns, and silently empties `$variables` in `powershell -Command`.
  One pattern per `findstr`, no `$`, no `%%{...}` in `curl -w`.
- **`for %P in (...) do ... | findstr ... && echo` does not work.** The pipe and
  `&&` do not compose inside a cmd `for` body; it reports FAIL for everything.
  Use `&`-chained individual commands.
- **`edit_file` multi-line `old_string` fails on CRLF files.** `styles.css` is
  CRLF, so a multi-line anchor returns "not found". Anchor on a single line (or
  a single line plus text you append in `new_string`). `src/**/*.jsx` accepted
  multi-line anchors fine.
- PowerShell `$j = ...` is emptied by the shell wrapper; use `read_file` instead
  of parsing files in PowerShell.

## Project-specific facts

- `jeevan-net-phase1/scripts/split-main.mjs` and `prune-dead-css.mjs` are
  **destructive one-offs that have already been applied**. Do not re-run them
  against the reorganised tree. `verify-imports.mjs` (`npm run check`) and
  `find-dead-css.mjs` are read-only and safe to re-run.
- `npm run check` is a static import check, not a test suite. Neither side has
  tests.
- The Vite dev server must stay on port **5173** (`strictPort` in
  `vite.config.js`) because the backend CORS allowlist names only that port.
- `Backend/main.py` trains both models at **import time**; a first request is
  slow and every reload retrains.
- The backend has not been executed in this environment. `qiskit>=1.2` targeted
  Python 3.9–3.12, so a 3.12 interpreter may be needed.
