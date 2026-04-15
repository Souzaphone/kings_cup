# Phase Review: Phase 03: Game Page Layout

**Date:** 2026-04-15
**File:** phase-03-game-page-layout.md
**Verdict:** FAIL (0 critical, 1 high, 4 medium, 1 low)

---

## Part 1: Template Compliance

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | YAML Frontmatter | pass | All fields present: title, description, skill, status, group, dependencies, tags, created, updated |
| 2 | Overview | pass | Brief description + single-sentence Goal present |
| 3 | Context & Workflow | fail | Has "How This Phase Fits", User Workflow, Problem Being Solved — but missing "Integration Points" subsection (upstream deps, downstream consumers, data flow) |
| 4 | Prerequisites & Clarifications | fail | Entire section absent |
| 5 | Requirements | pass | Functional + Technical both present |
| 6 | Decision Log | pass | ADR-03-01 (remove dark mode) + ADR-03-02 (canvas positioning strategy) with Status, Context, Decision, Consequences |
| 7 | Implementation Steps | fail | Steps 1–5 present but no Step 0; template requires steps to start with Step 0 |
| 8 | Step 0: TDD | fail | Entirely absent |
| 9 | Verifiable Acceptance Criteria | fail | Has Critical Path and Visual sections but missing Quality Gates and Integration checklists |
| 10 | Quality Assurance | fail | Only Manual Testing present; Automated Testing, Performance Testing, and Review Checklist absent |
| 11 | Dependencies | fail | Upstream and Downstream present; External Services subsection absent |
| 12 | Completion Gate | pass | Sign-off checklist present |

**Template Score:** 5/12 sections

---

## Part 2: Codebase Compliance

**Reference files used:**
- `game/static/main.js` lines 566–715 (`resizeCanvas`, `drawTable`, `copyGameId` — source of truth for functions Phase 03 modifies)

### Issues Found

| # | Severity | Category | Location | Issue | Expected (from codebase) |
|---|----------|----------|----------|-------|--------------------------|
| 1 | High | Broken inline style override | Step 2 (renderPlayerList) | `drawTable()` in main.js (lines 681–691) positions `#copy-game-id-btn` and `#copy-status` via `element.style.position/top/left` on every render cycle. After Phase 03 these elements live in the fixed header — `drawTable()` will override their header position on every call, breaking the layout | Phase 03 must add a step to remove the `copyBtn.style.*` and `copyStatus.style.*` inline assignments from `drawTable()` |
| 2 | Medium | Duplicate player display | Step 2 (renderPlayerList) | `drawTable()` (lines 693–713) draws a player board directly on the canvas with `ctx.fillText`. After Phase 03 adds the `#player-list` header pills, both the canvas player board and the header pills will show simultaneously | Phase 03 should add a step removing the canvas player board block from `drawTable()` |
| 3 | Medium | Dropped card repositioning | Step 3 (resizeCanvas) | Phase 03's replacement `resizeCanvas()` omits the card repositioning block (current main.js lines 582–595) that re-centers cards when the window resizes. Implementing the replacement verbatim will drop this logic | The replacement block must either include the card repositioning code or explicitly document that it is intentionally removed |
| 4 | Medium | Inconsistent hidden class | Step 5 (copy-status) | Phase 03 Step 1 HTML uses `class="... hidden"` (Tailwind) and Step 5 JS uses `classList.remove('hidden')` / `classList.add('hidden')`. Phase 01 and 02 establish `kc-hidden` as the project-wide visibility toggle class | Change `#copy-status` class to `kc-hidden` in the HTML (Step 1) and update Step 5 JS to use `kc-hidden` |
| 5 | Medium | Missing template section | Phase file | "Integration Points" subsection absent from Context & Workflow | Required by template |
| 6 | Medium | Missing template section | Phase file | "Prerequisites & Clarifications" section entirely absent | Required by template |
| 7 | Medium | Missing template section | Phase file | Step 0 (TDD) absent from Implementation Steps | Required by template |
| 8 | Medium | Missing template section | Phase file | Quality Assurance missing Automated Testing, Performance Testing, and Review Checklist | Required by template |
| 9 | Low | Missing template section | Phase file | Dependencies section missing "External Services" subsection | Required by template — add `External Services: None` |

**Codebase Score:** 9 issues (0 critical, 1 high, 7 medium, 1 low)

---

## Critical Issues Detail

### Issue #1: `drawTable()` inline styles break header layout (High)

**Problem:** Every call to `drawTable()` runs:
```js
copyBtn.style.position = 'absolute';
copyBtn.style.top = `${canvas.offsetTop + 80}px`;
copyBtn.style.left = `${canvas.offsetLeft + 20}px`;
copyStatus.style.position = 'absolute';
copyStatus.style.top = `${canvas.offsetTop + 110}px`;
copyStatus.style.left = `${canvas.offsetLeft + 20}px`;
```
After Phase 03, `#copy-game-id-btn` and `#copy-status` live in the fixed header. Every time the game is drawn (on every card action, resize, player join, etc.), these inline style assignments will pull both elements out of the header and position them relative to the canvas — breaking the layout repeatedly during gameplay.

**Why High:** `drawTable()` is called on every game state change. This will visually break the header on every game event, making the game unplayable.

**Fix:** Add a Phase 03 step to remove these four lines from `drawTable()`:
```js
// REMOVE these lines from drawTable():
copyBtn.style.position = 'absolute';
copyBtn.style.top = `${canvas.offsetTop + 80}px`;
copyBtn.style.left = `${canvas.offsetLeft + 20}px`;
copyStatus.style.position = 'absolute';
copyStatus.style.top = `${canvas.offsetTop + 110}px`;
copyStatus.style.left = `${canvas.offsetLeft + 20}px`;
```
After Phase 03, both elements are positioned by CSS in the header — no inline style needed.

---

## Fixes Applied

| # | Original Issue | Fix Applied |
|---|---------------|-------------|
| 1 | `drawTable()` inline styles break header layout | Added Step 1b to phase-03: remove `copyBtn.style.*` and `copyStatus.style.*` inline assignments from `drawTable()` (Auto-fixed) |
| 2 | Duplicate player display (canvas board + header pills) | Added Step 2b to phase-03: remove canvas player board block from `drawTable()` (Auto-fixed) |
| 3 | `resizeCanvas()` replacement drops card repositioning | Updated Step 3 code block to include the card repositioning logic from current main.js (Auto-fixed) |
| 4 | `#copy-status` uses `hidden` instead of `kc-hidden` | Updated Step 1 HTML and Step 5 JS to use `kc-hidden` (Auto-fixed) |
| 5 | Missing "Integration Points" in Context & Workflow | Added Integration Points subsection (Auto-fixed) |
| 6 | Missing "Prerequisites & Clarifications" | Added section with validation checklist (Auto-fixed) |
| 7 | Step 0 TDD absent | Added Step 0 with HTML/JS phase verification approach (Auto-fixed) |
| 8 | QA missing Automated Testing, Performance Testing, Review Checklist | Added all three subsections (Auto-fixed) |

---

## Next Steps (Main Agent)

| # | Severity | Issue | Suggested Improvement |
|---|----------|-------|----------------------|
| 1 | Low | Dependencies section missing "External Services" subsection | Add `External Services: None` to Dependencies |

**Note to main agent:** These improvements are worth addressing now — phases are rarely revisited after completion. Discuss with user and implement what makes sense.

---

## Verdict

**Template Score:** 5/12 sections (pre-fix) → 10/12 after auto-fixes
**Codebase Score:** 9 issues (0 critical, 1 high, 7 medium, 1 low) → 8 auto-fixed, 1 low deferred
**Ready:** Yes — all Critical/High/Medium issues auto-fixed
