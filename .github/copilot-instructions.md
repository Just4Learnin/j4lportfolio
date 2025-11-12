## Purpose

These instructions help AI coding agents (Copilot-style assistants) be productive in the Just4Learnin portfolio repo.
Focus on where to change behavior, how data flows, and project-specific gotchas.

## Big picture (what this repo is)

- Single-page portfolio site (static HTML + CSS) served from `index.html`.
- Client logic and Firebase integration live in `admin.js` (ES module). `firebase-config.js` exports the Firebase config.
- The app reads/writes Firestore collections: `projects`, `logs`, `skills`. There is a fallback hard-coded dataset embedded in `index.html` used when Firestore is unavailable.

## Key files to edit or inspect

- `index.html` — page markup, styles (large inline style block) and a local, hardcoded dataset (used as fallback). Avoid duplicating logic here unless you intend to change the static fallback UI.
- `admin.js` — primary runtime logic that loads/saves Firestore, handles auth, and renders UI. This is the authoritative place for data-backed behavior.
- `firebase-config.js` — exports `firebaseConfig`; update only when changing Firebase project settings.
- `README.md` — project description and context.

## Data shapes (discoverable examples)

- projects: { id, title, description, tech: string[], links: [{text,url}], image }
- logs: { id, date, title, content, timestamp }
- skills: { id, category, items: string[] }

When writing or updating code that reads/writes Firestore, ensure IDs are handled as strings (the module converts numeric IDs with `.toString()` in some places).

## Conventions & patterns

- UI toggles: the page uses `document.body.classList.add('edit-mode')` and an `.edit-controls` pattern to reveal admin controls.
- Editing workflow: `currentEditType`, `currentEditId`, `currentEditIndex` are used across edit/save flows. Modals populate inputs by querying DOM ids like `#editTitle`, `#editDescription`, etc.
- Rendering: `renderProjects()`, `renderSkills()`, `renderLogs()` are the canonical render entry points; call `renderAll()` after data changes.

## Integration points & external dependencies

- Firebase (Auth + Firestore) is included via CDN ES module imports in `admin.js` (no build step required). `admin.js` uses:
  - initializeApp(firebaseConfig)
  - getAuth/onAuthStateChanged/signInWithEmailAndPassword/signOut
  - getFirestore, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy

## Local development / commands

- This is a static ES module site. Open the site through an HTTP server (ES modules will fail under `file://`). Examples:
  - Quick: `python3 -m http.server 8000` from the repo root and open `http://localhost:8000`.
  - Or use VS Code Live Server.

## Common gotchas for AI edits

- Do not assume `index.html` is the only source of truth: `admin.js` supersedes the inline fallback dataset when Firestore is reachable.
- Document ID types vary (numbers used in fallback data, Firestore returns strings). Keep `.toString()` usage in mind when querying or saving.
- Because Firebase is client-side, authentications and writes are visible in the browser; avoid committing secrets outside `firebase-config.js` (the repo currently contains the public Firebase config which is expected for browser apps).

## Practical examples (what to change for common tasks)

- Add a new project UI flow: update Firestore schema -> `addNewProject()` in `admin.js` (calls `addDoc(collection(db,'projects'), projectData)`), then `renderAll()`.
- Change styling or layout: edit the big inline `<style>` block at the top of `index.html` (there is no CSS build pipeline).
- Modify authentication flow: edit `admin.js` (look for `onAuthStateChanged` and `login()` functions).

## Where to run tests / checks

- There is no test harness in this repo. Use the browser console to watch for runtime errors. Smoke-checks:
  - Load the site via HTTP server and confirm `Loaded X projects, Y journal entries...` appears in the console from `admin.js`.

## When unsure, prefer these edits

1. Small UI/UX fixes: edit `index.html` styles or markup.
2. Data/behavior fixes: edit `admin.js` and verify behavior via browser with the local HTTP server.
3. Firebase config changes: only in `firebase-config.js`.

If anything in these instructions is unclear or you want the file expanded with examples or code snippets, tell me which area to improve.
