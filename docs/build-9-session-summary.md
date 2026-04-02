# BROS2 PDCA App — Build 9 Session Summary & Coaching Note
## Builds 7, 8, and 9 — Integration, Director View, and Documentation

**Project:** BROS2 PDCA Desktop App (Web implementation)
**Owner:** Scott Brooker (BROS2), Dir. Programmes, PTSA
**Date:** 2026-04-01
**Branch:** `claude/build-9-summary-notes-airDj`
**Continues from:** Iterations 1–6 and Builds 7–8 documented in `build-history-coaching-note.md`

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
- **Build number in UI** — Initially displayed as "Build 8" at the bottom of the side navigation (`0.0.8`). Later moved to the header (right of "BROS2 PDCA") and reformatted to `v0.8.1` semver.
- **Semantic versioning adopted** — Moved from ad-hoc "Build N" numbering to semver. Retroactively tagged all builds v0.1.0–v0.8.0, then patched to v0.8.1.

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

## Build 9 — Two Phases

Build 9 consists of two distinct phases:

### Phase 1: Documentation Catch-up (this branch)
**Branch:** `claude/build-9-summary-notes-airDj`
**Date:** 2026-04-01
**Theme:** Capturing the build history for Builds 7 and 8 that occurred after the original coaching note was written.

Builds 7 and 8 were shipped across two sessions (2026-03-29 and 2026-03-31) but were not documented in the coaching note. This phase adds complete traceability for those iterations, including features, user stories, bugs found, and coaching lessons.

### Phase 2: Feature Build (branch `claude/build-9-WJ75c`)
**Planned in:** [Build 9 Planning Session (2026-03-31)](../2026-03-31-Session-Summary-Build-9-Planning.md)
**GitHub Issues delivered:** #3 (title disambiguation), #4 (A-accountable), #6 (Build Notes shell), #7 (release notes parser), #8 (summary view), #10 (Bloqué status), #11 (editable temperature S3 sync), #12 (release notes detail toggle)
**Not delivered:** #9 (coaching detail view with toggle) — moved to Build 10. What was implemented was a release notes detail toggle (#12), not the coaching narrative view specified in #9. See correction note below.
**Milestone:** v0.9.0 — Build 9

The feature work was planned in a co-work session on claude.ai and executed on a separate branch. See the planning session summary for full requirements decomposition and dependency chain.

**Correction (2026-04-01):** During code review, the implementation for #9 was accepted without verifying acceptance criteria against the actual build. The delivered feature (release notes detail toggle) was useful but did not match #9's specification (coaching-format narrative with iterations, user stories, test tables, and bugs). Issue #9 was reopened and moved to Build 10. The delivered feature was retroactively documented as Issue #12.

### Tests

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` (TypeScript strict) | PASS |
| All 41 parser tests | PASS |

### Bugs Found and Fixed: None

---

## Test Results Across All Builds

### Automated Tests: 49 total, 49 passing (41 from Iteration 1 + 8 from Build 9 Phase 2)

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

### Runtime / Integration Bugs Found: 3 (Build 7)

| Bug | Build | Type | Severity |
|---|---|---|---|
| S3 CORS preflight returns HTTP 500 | 7 | Infrastructure | Critical (blocks all sync) |
| Phantom workstreams from non-PDCA files | 7 | Data boundary | Medium (wrong data displayed) |
| Orphaned local workstreams after S3 filter | 7 | Sync logic | Medium (stale data persists) |

---

## Key Coaching Observations (Builds 7–9)

7. **First contact with live infrastructure always reveals new bugs.** Iterations 1–6 were built and tested in isolation (parser fixtures, TypeScript checks). Build 7 was the first sync against a real S3 bucket, and three bugs surfaced immediately. This is normal and expected — the value of small iterations is that these bugs are easy to isolate and fix.

8. **Proxy patterns protect your architecture from infrastructure failures.** The CORS failure was not a code bug — it was an AWS-side issue. Instead of waiting for AWS, a server-side proxy was inserted behind the existing service interface. Zero consumer code changed. This is only possible when you have clean interface boundaries (which Iteration 3 established).

9. **Filter at the data boundary, not in the UI.** Phantom workstreams appeared because the S3 listing was unfiltered. The fix was in the proxy (data boundary), not in the Register page (UI). Filtering early prevents garbage from propagating through the entire stack.

10. **Sync must handle deletions, not just additions.** The orphan pruning bug is a classic — sync logic that only adds/updates will accumulate stale data over time. A robust sync compares the local set against the remote set and removes what's no longer present, while protecting unsaved work (dirty files).

11. **Directors and operators need different views of the same data.** Build 8 introduced a subtle but important distinction: BROS2 filters by `lead` (cross-cutting), while equipiers filter by `member_code` (their own files). Same UI component, different query logic. This is a product design pattern worth noting — role-based filtering often appears simple but has real data-model implications.

12. **Documentation is a deliverable, not an afterthought.** Builds 7 and 8 shipped real features and bug fixes but were not documented until Build 9. In a coaching context, undocumented work is invisible work — it can't be reviewed, studied, or learned from. Treat the build history as part of the definition of done.

---

*Document generated: 2026-04-01 | BROS2 Team Operations | Session: claude/build-9-summary-notes-airDj*
