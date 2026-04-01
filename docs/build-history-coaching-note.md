# BROS2 PDCA App — Build History & Test Report
## Coaching Note for Product Managers and Business Analysts

**Project:** BROS2 PDCA Desktop App (Web implementation)
**Owner:** Scott Brooker (BROS2), Dir. Programmes, PTSA
**Build Date:** 2026-03-28 / 2026-03-29
**Branch:** `claude/markdown-parser-ui-yU8Al`
**Stack:** Vite 8 + React 19 + TypeScript 5.9 + Dexie (IndexedDB) + TailwindCSS 4 + AWS SDK v3
**Test Framework:** Vitest 4.1.2
**Total Automated Tests:** 41 (all passing)

---

## How to Read This Document

This document traces the full build of a real product, iteration by iteration. For each iteration you will find:

- **What was built** (features, files created)
- **User stories** the work addresses
- **Tests written**, with name, purpose, acceptance criteria, and result
- **Bugs found and fixed**, nested under the test that surfaced them

Use this to study how a build moves from riskiest-first (the parser) through data layer, services, and finally UI. Notice how each iteration is committed and pushed independently, reducing risk of losing work.

---

## Iteration 1 — Markdown Parser + Test Fixtures
**Commit:** `df28773` — "Add parser tests with all 4 PDCA fixtures and round-trip validation"
**Risk Level:** Highest. The spec explicitly calls this "the riskiest piece."

### Features
- TypeScript types and interfaces for the entire data model
- Markdown parser for individual PDCA files (`parseIndividualPdca()`)
- Markdown parser for the consolidated register file (`parseRegister()`)
- Markdown serializer for round-trip fidelity (`serializeIndividualPdca()`)
- 4 fixture files (BARA2, CHOY, JUNC, GAGL2) embedded as test constants
- 1 register fixture embedded as test constant

### User Stories
- *As BROS2, I need the app to correctly read my hand-written PDCA markdown files so that no data is lost or misinterpreted.*
- *As BROS2, I need edited PDCA data to be serialized back to valid markdown so the files remain readable in Pensive and other tools.*

### Tests

#### Suite: `parseIndividualPdca — all files parse`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 1 | `parses BARA2 without error` | Confirm parser handles BARA2 file without throwing | member_code = "BARA2", member_name = "Alexis" | PASS |
| 2 | `parses CHOY without error` | Confirm parser handles CHOY file without throwing | member_code = "CHOY", member_name = "Yvan" | PASS |
| 3 | `parses JUNC without error` | Confirm parser handles JUNC file without throwing | member_code = "JUNC", member_name = "Claudio" | PASS |
| 4 | `parses GAGL2 without error` | Confirm parser handles GAGL2 file without throwing | member_code = "GAGL2", member_name = "Laura" | PASS |

#### Suite: `workstream counts`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 5 | `BARA2 has 5 workstreams` | Verify correct section splitting; notes section must not be counted | workstreams.length = 5 | PASS |
| 6 | `CHOY has 3 workstreams` | Verify correct count for CHOY | workstreams.length = 3 | PASS |
| 7 | `JUNC has 4 workstreams` | Verify correct count for JUNC | workstreams.length = 4 | PASS |
| 8 | `GAGL2 has 3 workstreams` | Verify correct count for GAGL2 | workstreams.length = 3 | PASS |

#### Suite: `global_status`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 9 | `GAGL2 is "ok" (En controle)` | Only file with "En controle" global status; confirm correct mapping | global_status = "ok" | PASS |
| 10 | `BARA2 is "att"` | "Attention requise" maps to "att" | global_status = "att" | PASS |
| 11 | `CHOY is "att"` | "Attention requise" maps to "att" | global_status = "att" | PASS |
| 12 | `JUNC is "att"` | "Attention requise" maps to "att" | global_status = "att" | PASS |

#### Suite: `header parsing`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 13 | `extracts role correctly` | Parse role from "Direct Report —" line for all 4 files | BARA2="Digital Strategies Manager", CHOY="Manager, Commercial Digital Products", JUNC="Data Analyst", GAGL2="Operational Excellence Advisor" | PASS |
| 14 | `extracts last_updated` | Parse date from "Derniere mise a jour:" line | last_updated = "2026-03-09" | PASS |
| 15 | `extracts file_id` | Derive file_id from member_code | file_id = "TEAM-OPS-PDCA-BARA2" | PASS |

#### Suite: `action label mapping`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 16 | `"En attente" maps to "waiting"` | Distinct from "todo"; validates JUNC WS1 action 2 | label = "waiting" | PASS |
| 17 | `"A planifier" maps to "todo"` | "A planifier" is same bucket as "A faire"; validates CHOY WS3 action 1 | label = "todo" | PASS |
| 18 | `"En cours" maps to "inprogress"` | Standard in-progress mapping | label = "inprogress" | PASS |
| 19 | `"A faire" maps to "todo"` | Standard todo mapping | label = "todo" | PASS |

#### Suite: `null phase_a`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 20 | `BARA2 WS3 (Support Licence) has null phase_a` | AGIR row absent from table; must store null not empty string | phase_a = null | PASS |
| 21 | `BARA2 WS4 (Power Automate) has null phase_a` | Same edge case, different workstream | phase_a = null | PASS |
| 22 | `BARA2 WS5 (Gestion equipe DPO) has null phase_a` | Same edge case, third instance | phase_a = null | PASS |
| 23 | `JUNC WS3 (Data Governance) has null phase_a` | Cross-file validation of same edge case | phase_a = null | PASS |

#### Suite: `long action tables`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 24 | `CHOY WS1 has all 7 actions` | Longest action table in dataset; confirm no truncation | actions.length = 7 | PASS |

#### Suite: `long action text`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 25 | `GAGL2 WS3 action 2 preserves full text` | 95-char action text must not be truncated | text contains "Definir le premier mandat concret pour Laura" AND "cartographie" | PASS |

#### Suite: `special characters in titles`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 26 | `JUNC WS3 title contains "Finance & Admin"` | Ampersand must survive parsing unescaped | title contains "Finance & Admin" | PASS |

#### Suite: `lien_ga`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 27 | `is null when absent (BARA2 WS2)` | Most workstreams lack Lien GA; must be null not missing | lien_ga = null | PASS |
| 28 | `is present on BARA2 WS1` | Verify extraction when present | lien_ga = "P3 Harmonized Industrial Excellence" | PASS |
| 29 | `is present on GAGL2 WS3` | Cross-file validation | lien_ga contains "Data Integrity" | PASS |

#### Suite: `note_politique`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 30 | `CHOY WS1 has note_politique` | "Acteurs politiques:" line must be parsed as separate field, not confused with action row | note_politique contains "LAVN2" AND "ROYS" | PASS |

#### Suite: `status suffix stripping`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 31 | `GAGL2 WS3 status is "att" not including "A activer"` | Suffix "— A activer" must be stripped before status mapping | status = "att" | PASS |
| 32 | `BARA2 WS4 "A clarifier" maps to "att"` | Unknown status treated as attention for MVP | status = "att" | PASS |

#### Suite: `notes section skipped`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 33 | `BARA2 has exactly 5 workstreams (notes not parsed)` | "Notes de cadence 1:1" section has no PDCA table; must not create phantom workstream | workstreams.length = 5, no title contains "Notes" | PASS |

#### Suite: `temperature`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 34 | `JUNC has temperature and watch status` | Temperature parsed from prose in role context, not from table | temperature is truthy, temperature_status = "watch" | PASS |

#### Suite: `parseRegister`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 35 | `parses team members` | Extract team table from register file | team.length = 4, team[0].code = "BARA2", team[2].temperature contains "B-" | PASS |
| 36 | `parses workstreams` | Extract consolidated workstream table | workstreams.length >= 4, first ws_number = 1, first status = "att" | PASS |
| 37 | `extracts member_code from lead` | Derive member_code from "R operationnel" column | ws[0].member_code = "BARA2", ws[1].member_code = "CHOY" | PASS |

#### Suite: `round-trip: parse -> serialize -> parse`

| # | Test Name | Purpose | Acceptance Criteria | Result |
|---|-----------|---------|-------------------|--------|
| 38 | `BARA2: round-trip produces identical data` | No data loss through parse/serialize cycle | All fields match: ws_number, title, status, phases, lien_ga, dependances, note_politique, actions (text, responsible, echeance, label), member_code, member_name, global_status | PASS |
| 39 | `CHOY: round-trip produces identical data` | Same validation, different file with 7-action table | Same criteria as above | PASS |
| 40 | `JUNC: round-trip produces identical data` | Same validation, file with "En attente" and & in title | Same criteria as above | PASS |
| 41 | `GAGL2: round-trip produces identical data` | Same validation, file with "ok" global_status and status suffix | Same criteria as above | PASS |

### Bugs Found and Fixed: None
All 41 tests passed on the first run. The parser was written carefully against the Annex B fixtures before tests were executed.

---

## Iteration 2 — Dexie Database Layer
**Commit:** `2105e81` — "Add types, markdown parser/serializer, and Dexie database layer"

### Features
- Dexie (IndexedDB) schema with 3 tables: `files`, `workstreams`, `actions`
- Full CRUD service: upsert files, upsert workstreams with actions, query by file, mark dirty/clean
- Transaction support for atomic workstream + action replacement

### User Stories
- *As BROS2, I need my PDCA data stored locally so the app works fully offline on my MacBook Air.*
- *As BROS2, I need the app to track which files I've edited locally so I know what needs to be pushed to S3.*

### Tests
No new automated tests were added in this iteration. The existing 41 parser tests were re-run to confirm no regressions.

| Regression Check | Result |
|---|---|
| All 41 parser tests | PASS |

### Bugs Found and Fixed: None

---

## Iteration 3 — S3 Service + Sync Orchestration
**Commit:** `00c3480` — "Add S3 service and sync orchestration"

### Features
- S3 service: `listFiles()`, `getFileContent()`, `putFileContent()`, `testConnection()`
- Credentials storage in localStorage
- Sync pull: S3 -> parse -> Dexie (skips dirty files, flags conflicts)
- Sync push: Dexie -> serialize -> S3 (clears dirty flag)
- Conflict resolution: keep local (push) or take remote (overwrite)

### User Stories
- *As BROS2, I need to pull my PDCA markdown files from S3 into the app so I can view and edit them.*
- *As BROS2, I need to push my local edits back to S3 so the source of truth stays updated.*
- *As BROS2, if I edited locally and someone else changed S3, I need to choose which version to keep.*

### Tests
No new automated tests. Regression check only. (S3 service requires live AWS credentials for integration testing.)

| Regression Check | Result |
|---|---|
| All 41 parser tests | PASS |

### Bugs Found and Fixed

#### Bug: `TS6133 — unused variable 'parsed' in syncService.ts`
- **Discovered during:** Iteration 4 TypeScript strict check (`npx tsc -b --noEmit`)
- **Root cause:** `parseRegister(markdown)` result was assigned to a variable but never used in the pull flow
- **Fix:** Call `parseRegister(markdown)` without assignment (still validates the file parses cleanly)
- **Associated test:** N/A (compile-time error, not a runtime test failure)

#### Bug: `TS6133 — unused function 'trimCell' in markdownParser.ts`
- **Discovered during:** Iteration 4 TypeScript strict check
- **Root cause:** Helper function was written but never called (replaced by inline split logic)
- **Fix:** Removed the unused function
- **Associated test:** N/A (compile-time error)

---

## Iteration 4 — App Shell + Layout + SyncBar
**Commit:** `83ca238` — "Add app shell with Layout, SyncBar, and Tailwind brand tokens"

### Features
- Replaced Vite boilerplate with app shell (page router: register/settings)
- Layout component: navy top bar with PT branding, side navigation
- SyncBar component: online/offline detection, dirty count display, sync + push buttons
- TailwindCSS 4 with full Premier Tech brand color theme
- Removed unused boilerplate files (App.css)

### User Stories
- *As BROS2, I need to see the app name and sync status at a glance so I know if my data is current.*
- *As BROS2, I need to navigate between the register and settings screens.*
- *As BROS2, I need to see how many unsynchronized changes I have so I can decide when to push.*

### Tests
No new automated tests. TypeScript strict compilation check + regression.

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` (TypeScript strict) | PASS (after fixing 2 bugs from Iteration 3) |
| All 41 parser tests | PASS |

### Bugs Found and Fixed
See Iteration 3 bugs above (discovered during this iteration's TypeScript check).

---

## Iteration 5 — Register Page + Detail Panel + Edit Form
**Commit:** `c905552` — "Add Register page with team sidebar, filters, detail panel, and edit form"

### Features
- **Register.tsx:** Full page with team member sidebar, status filter pills (Tous/En controle/Attention/Bloque), workstream table with live Dexie queries
- **TeamMemberCard.tsx:** Temperature display, selection state, click to filter
- **StatusPill.tsx:** Filter pills with dot color and count badges
- **WorkstreamRow.tsx:** Pastille dot, dirty indicator, click to select
- **DetailPanel.tsx:** PDCA 2x2 grid (Planifier/Deployer/Controler/Agir), action list with status badges, metadata display (Lien GA, Dependances, note_politique), "Modifier" button
- **EditForm.tsx:** Editable textareas for PDCA phases, pastille selector (3 colored circles), action CRUD (add/edit/delete rows), Enregistrer/Annuler buttons, marks file dirty on save

### User Stories
- *As BROS2, I need to see all my workstreams in a filterable table so I can quickly find what I need.*
- *As BROS2, I need to filter by equipier to see one person's workstreams at a time.*
- *As BROS2, I need to filter by status (En controle / Attention) to focus on what needs attention.*
- *As BROS2, I need to click a workstream and see its full PDCA content (Planifier/Deployer/Controler/Agir) and action items.*
- *As BROS2, I need to edit any PDCA field and action, then save locally so I can push to S3 later.*

### Tests
No new automated tests. TypeScript strict check + regression.

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` (TypeScript strict) | PASS (after fixing 2 type errors) |
| All 41 parser tests | PASS |

### Bugs Found and Fixed

#### Bug: `TS2322 — Type mismatch on useLiveQuery in DetailPanel.tsx`
- **Discovered during:** TypeScript strict check after writing DetailPanel
- **Root cause:** `useLiveQuery` inferred return type as `never[]` because the fallback `Promise.resolve([])` had no type annotation
- **Fix:** Added explicit type annotation: `const actions: Action[] = useLiveQuery(...)` and `Promise.resolve([] as Action[])`
- **Associated test:** N/A (compile-time type error)

#### Bug: `TS6196 — 'Workstream' imported but unused in Register.tsx`
- **Discovered during:** Same TypeScript strict check
- **Root cause:** `Workstream` type was imported during development but ended up unused in the final code
- **Fix:** Removed unused import
- **Associated test:** N/A (compile-time error)

---

## Iteration 6 — Settings Page + Conflict Dialog
**Commit:** `dd907d4` — "Add Settings page and Conflict dialog"

### Features
- **Settings.tsx:** S3 bucket/prefix/region inputs, AWS credentials (password field), "Tester la connexion" button with success/error feedback, "Sync maintenant" button with result summary, localStorage persistence, save confirmation
- **ConflictDialog.tsx:** Modal overlay for sync conflicts, lists conflicting file IDs, two resolution options ("Garder mes modifications" / "Recuperer la version S3"), loading states, cancel option

### User Stories
- *As BROS2, I need to configure my S3 bucket and AWS credentials so the app can connect to my storage.*
- *As BROS2, I need to test my S3 connection before syncing so I know if my credentials are correct.*
- *As BROS2, when a sync conflict occurs, I need to choose whether to keep my local edits or take the S3 version.*

### Tests
No new automated tests. TypeScript strict check + regression.

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` (TypeScript strict) | PASS |
| All 41 parser tests | PASS |

### Bugs Found and Fixed: None

---

## Summary — Test Results Across All Iterations

### Automated Tests: 41 total, 41 passing

| Suite | Tests | Status |
|---|---|---|
| parseIndividualPdca — all files parse | 4 | All PASS |
| workstream counts | 4 | All PASS |
| global_status | 4 | All PASS |
| header parsing | 3 | All PASS |
| action label mapping | 4 | All PASS |
| null phase_a | 4 | All PASS |
| long action tables | 1 | PASS |
| long action text | 1 | PASS |
| special characters in titles | 1 | PASS |
| lien_ga | 3 | All PASS |
| note_politique | 1 | PASS |
| status suffix stripping | 2 | All PASS |
| notes section skipped | 1 | PASS |
| temperature | 1 | PASS |
| parseRegister | 3 | All PASS |
| round-trip: parse -> serialize -> parse | 4 | All PASS |

### Compile-Time Bugs Found: 4

| Bug | Iteration Found | Iteration Introduced | Type | Severity |
|---|---|---|---|---|
| Unused variable `parsed` in syncService.ts | 4 | 3 | TS6133 | Low (lint) |
| Unused function `trimCell` in markdownParser.ts | 4 | 1 | TS6133 | Low (lint) |
| Type mismatch on `useLiveQuery` in DetailPanel.tsx | 5 | 5 | TS2322 | Medium (won't compile) |
| Unused import `Workstream` in Register.tsx | 5 | 5 | TS6196 | Low (lint) |

### Key Coaching Observations (Iterations 1–6)

1. **Riskiest-first build order works.** The parser was the most complex and ambiguous piece. Building and testing it first (with real data fixtures) meant all downstream layers could trust the data shape.

2. **Round-trip tests are the highest-value tests.** Tests 38-41 (parse -> serialize -> parse) validate the entire data pipeline in one assertion. If round-trip passes, the parser and serializer are mutually consistent.

3. **TypeScript strict mode catches integration bugs early.** All 4 bugs were caught by `tsc --noEmit` before the app was ever run in a browser. Without strict mode, these would have surfaced as runtime errors.

4. **Small iterations reduce blast radius.** Each iteration was committed and pushed independently. If any iteration had catastrophic issues, only that iteration's work would need to be reverted.

5. **Fixture-driven development builds confidence.** The 4 PDCA files from Annex B served as both test fixtures and parser development targets. Every edge case in the spec (null phase_a, 7-action tables, & in titles, status suffixes) had a corresponding test.

6. **Not everything needs automated tests.** The UI components (iterations 4-6) were validated by TypeScript compilation. Automated UI tests (e.g., React Testing Library) could be added later, but the riskiest logic (parsing) is already covered.

---

## Build 7 — Integration Hardening & Production Readiness
**Commits:** `64a346b`, `17ddba1`, `f3310ff`, `7822122`, `35b2214` — 2026-03-29
**Theme:** Wiring the app end-to-end against live S3, fixing everything that broke on first contact with real infrastructure.

### Features
- **ConflictDialog wired into SyncBar** — SyncBar now automatically surfaces the ConflictDialog when a pull detects conflicts (dirty local files vs newer S3 versions). Previously the dialog existed but was not connected.
- **Vite server-side S3 proxy** — S3 returned HTTP 500 on all CORS preflight (OPTIONS) requests for the pensiveone-main bucket. Root cause was an AWS-side issue, not a code bug. Fix: route all S3 operations through a Vite dev server middleware (`server/s3-proxy.ts`) running the AWS SDK in Node.js. Browser-side `s3Service.ts` now calls `fetch('/api/s3/...')` instead of the AWS SDK directly. All exported function signatures preserved — zero changes to consumers.
- **Official PT monogram logo** — Replaced text PT badge with official Premier Tech monogram PNG. Updated navy color (#0D2D5E → #041e42) to match PT brand guidelines.
- **S3 file listing filter** — Non-PDCA files in the S3 prefix (coaching notes, competency frameworks, language conventions) were being parsed as workstreams, creating phantom entries (e.g. "Empathy", "Phraseologie contrastive", "Tirets cadratins"). Now only files matching `TEAM-OPS-PDCA-*` and the active register are loaded.
- **Orphan workstream pruning** — After pulling the filtered S3 file list, local files, workstreams, and actions that no longer appear in the listing are removed from IndexedDB. Dirty files are preserved to protect unsaved local edits.
- **Removed Vite boilerplate assets** — hero.png, react.svg, vite.svg, icons.svg all removed.

### User Stories
- *As BROS2, I need sync conflicts to surface automatically so I don't lose local edits when S3 has a newer version.*
- *As BROS2, I need the app to work despite S3 CORS failures so I can sync without waiting for AWS to fix their side.*
- *As BROS2, I need only my PDCA workstream files to appear in the app — not coaching notes, language guides, or other markdown in the same S3 prefix.*
- *As BROS2, I need workstreams that have been deleted from S3 to disappear from my local app after a sync.*

### Tests

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` (TypeScript strict) | PASS |
| All 41 parser tests | PASS |
| Production build (`npm run build`) | PASS |

### Bugs Found and Fixed

#### Bug: S3 CORS preflight returns HTTP 500
- **Discovered during:** First live sync attempt against pensiveone-main bucket
- **Root cause:** AWS-side issue — S3 returns 500 on OPTIONS requests for this bucket. Not a code bug. Browser-to-S3 direct calls cannot work until AWS resolves it.
- **Fix:** Server-side proxy in Vite dev middleware (`server/s3-proxy.ts`). Browser calls `fetch('/api/s3/...')`; Node.js runs the AWS SDK without CORS.
- **Coaching lesson:** *Infrastructure assumptions fail on first contact. The spec assumed browser-to-S3 direct access. Having a clean service interface (all consumers call the same functions) meant the proxy could be inserted without any UI changes.*

#### Bug: Phantom workstreams from non-PDCA files
- **Discovered during:** First live sync — sidebar showed entries like "Empathy", "Phraseologie contrastive"
- **Root cause:** `listFiles()` returned every `.md` file under the S3 prefix, including non-PDCA documents. The parser tried to parse them and created garbage workstreams.
- **Fix:** Filter `listFiles()` results to only include files matching `TEAM-OPS-PDCA-*` pattern and the register file.
- **Coaching lesson:** *Always filter at the data boundary. Don't assume the bucket only contains your files — shared storage means shared responsibility for filtering.*

#### Bug: Orphaned local workstreams after S3 file deletion
- **Discovered during:** After applying the S3 filter, phantom entries persisted in IndexedDB from the previous unfiltered sync
- **Root cause:** Sync pull only upserted new/changed files — it never removed local entries whose S3 source no longer existed
- **Fix:** After pull, compare local file_ids against the S3 listing and delete any that are missing (except dirty files)
- **Coaching lesson:** *Sync is not just "copy down." A robust sync must handle additions, updates, AND deletions. Protecting dirty files during pruning shows defensive thinking.*

---

## Build 8 — BROS2 Director View & Version Identity
**Commits:** `c50b7ac`, `5eb0569`, `87794a9` — 2026-03-31
**Theme:** Making the app work for Scott (BROS2) as a director who oversees all equipiers, not just as an equipier himself.

### Features
- **BROS2 as equipier with lead-based filtering** — BROS2 (Scott, Dir. Programmes) appears as the first card in the team sidebar. Clicking BROS2 filters workstreams where the `lead` field contains "BROS2" (cross-cutting view of all workstreams Scott is involved in). Other equipiers still filter by `member_code` as before.
- **Editable temperature for BROS2** — BROS2's temperature is editable inline via a pencil icon on the card. Persisted in localStorage. Other equipiers' temperatures come from their PDCA files and are read-only.
- **Build number in UI** — Version displayed in the header (right of "BROS2 PDCA") in `v0.8.0` semver format.
- **Semantic versioning adopted** — Moved from ad-hoc "Build N" numbering to semver (`package.json` version `0.8.0`).

### User Stories
- *As BROS2 (director), I need to see all workstreams where I'm listed as lead, across all equipiers, so I can track my cross-cutting responsibilities.*
- *As BROS2, I need my own temperature to be editable since it's not derived from a PDCA file like my direct reports.*
- *As BROS2, I need to see the current version number so I can reference it when reporting issues or requesting features.*

### Tests

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` (TypeScript strict) | PASS |
| All 41 parser tests | PASS |

### Bugs Found and Fixed: None

---

## Build 9 — Session Summary & Coaching Note Update
**Branch:** `claude/build-9-summary-notes-airDj`
**Date:** 2026-04-01
**Theme:** Documentation catch-up — capturing the build history for Builds 7 and 8 that occurred after the original coaching note was written.

### What This Build Covers
Builds 7 and 8 were shipped across two sessions (2026-03-29 and 2026-03-31) but were not documented in the coaching note. This build adds complete traceability for those iterations, including features, user stories, bugs found, and coaching lessons.

### Tests

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` (TypeScript strict) | PASS |
| All 41 parser tests | PASS |

### Bugs Found and Fixed: None

---

## Updated Summary — Test Results Across All Builds

### Automated Tests: 41 total, 41 passing (unchanged since Iteration 1)

| Suite | Tests | Status |
|---|---|---|
| parseIndividualPdca — all files parse | 4 | All PASS |
| workstream counts | 4 | All PASS |
| global_status | 4 | All PASS |
| header parsing | 3 | All PASS |
| action label mapping | 4 | All PASS |
| null phase_a | 4 | All PASS |
| long action tables | 1 | PASS |
| long action text | 1 | PASS |
| special characters in titles | 1 | PASS |
| lien_ga | 3 | All PASS |
| note_politique | 1 | PASS |
| status suffix stripping | 2 | All PASS |
| notes section skipped | 1 | PASS |
| temperature | 1 | PASS |
| parseRegister | 3 | All PASS |
| round-trip: parse -> serialize -> parse | 4 | All PASS |

### All Compile-Time Bugs Found: 4 (Iterations 1–6) + 0 (Builds 7–9)

| Bug | Build Found | Build Introduced | Type | Severity |
|---|---|---|---|---|
| Unused variable `parsed` in syncService.ts | 4 | 3 | TS6133 | Low (lint) |
| Unused function `trimCell` in markdownParser.ts | 4 | 1 | TS6133 | Low (lint) |
| Type mismatch on `useLiveQuery` in DetailPanel.tsx | 5 | 5 | TS2322 | Medium (won't compile) |
| Unused import `Workstream` in Register.tsx | 5 | 5 | TS6196 | Low (lint) |

### Runtime / Integration Bugs Found: 3 (Build 7)

| Bug | Build Found | Type | Severity |
|---|---|---|---|
| S3 CORS preflight returns HTTP 500 | 7 | Infrastructure | Critical (blocks all sync) |
| Phantom workstreams from non-PDCA files | 7 | Data boundary | Medium (wrong data displayed) |
| Orphaned local workstreams after S3 filter | 7 | Sync logic | Medium (stale data persists) |

### Key Coaching Observations (Builds 7–9)

7. **First contact with live infrastructure always reveals new bugs.** Iterations 1–6 were built and tested in isolation (parser fixtures, TypeScript checks). Build 7 was the first sync against a real S3 bucket, and three bugs surfaced immediately. This is normal and expected — the value of small iterations is that these bugs are easy to isolate and fix.

8. **Proxy patterns protect your architecture from infrastructure failures.** The CORS failure was not a code bug — it was an AWS-side issue. Instead of waiting for AWS, a server-side proxy was inserted behind the existing service interface. Zero consumer code changed. This is only possible when you have clean interface boundaries (which Iteration 3 established).

9. **Filter at the data boundary, not in the UI.** Phantom workstreams appeared because the S3 listing was unfiltered. The fix was in the proxy (data boundary), not in the Register page (UI). Filtering early prevents garbage from propagating through the entire stack.

10. **Sync must handle deletions, not just additions.** The orphan pruning bug is a classic — sync logic that only adds/updates will accumulate stale data over time. A robust sync compares the local set against the remote set and removes what's no longer present, while protecting unsaved work (dirty files).

11. **Directors and operators need different views of the same data.** Build 8 introduced a subtle but important distinction: BROS2 filters by `lead` (cross-cutting), while equipiers filter by `member_code` (their own files). Same UI component, different query logic. This is a product design pattern worth noting — role-based filtering often appears simple but has real data-model implications.

12. **Documentation is a deliverable, not an afterthought.** Builds 7 and 8 shipped real features and bug fixes but were not documented until Build 9. In a coaching context, undocumented work is invisible work — it can't be reviewed, studied, or learned from. Treat the build history as part of the definition of done.

---

*Document updated: 2026-04-01 | BROS2 Team Operations | Builds 7–9 added*
*Original document: 2026-03-29 | Session: claude/markdown-parser-ui-yU8Al*
*Update session: claude/build-9-summary-notes-airDj*
