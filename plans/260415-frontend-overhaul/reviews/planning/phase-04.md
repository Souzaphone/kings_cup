# Phase Review: Phase 04: UI Overlays & Components

**Date:** 2026-04-15
**File:** phase-04-ui-overlays.md
**Verdict:** FAIL (0 critical, 1 high, 5 medium, 1 low)

---

## Part 1: Template Compliance

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | YAML Frontmatter | pass | All fields present: title, description, skill, status, group, dependencies, tags, created, updated |
| 2 | Overview | pass | Brief description + single-sentence Goal present |
| 3 | Context & Workflow | fail | Has "How This Phase Fits" and User Workflow, Integration Points (upstream only) — but missing "Problem Being Solved" subsection and Downstream Consumers / Data Flow in Integration Points |
| 4 | Prerequisites & Clarifications | fail | Entire section absent |
| 5 | Requirements | pass | Functional + Technical both present |
| 6 | Decision Log | pass | ADR-04-01 (retain opacity for fade) + ADR-04-02 (keep function signatures) with Status, Context, Decision |
| 7 | Implementation Steps | fail | Steps 1–4 present but no Step 0; template requires steps to start with Step 0 |
| 8 | Step 0: TDD | fail | Entirely absent |
| 9 | Verifiable Acceptance Criteria | fail | Has Critical Path, Visual, and Card Events sections — but "Quality Gates" section (as a named subsection) absent |
| 10 | Quality Assurance | fail | Only Manual Testing present; Automated Testing, Performance Testing, and Review Checklist absent |
| 11 | Dependencies | fail | Upstream and Downstream present; External Services subsection absent |
| 12 | Completion Gate | pass | Sign-off checklist present |

**Template Score:** 5/12 sections

---

## Part 2: Codebase Compliance

**Reference files used:**
- `game/static/utilities.js` (current function implementations — source of truth for signatures and behavior)
- `game/static/ui.js` (current showLoading/hideLoading/showToast — syntax error on line 4 confirmed)
- `game/static/main.js` (dynamic imports of utilities.js; no static ui.js import — confirmed by grep)
- `game/static/cards.js` line 2 (import of utilities.js functions — confirmed: createPopup, createPlayerSelector, createTextInput, createDrinkingPrompt)

### Issues Found

| # | Severity | Category | Location | Issue | Expected (from codebase) |
|---|----------|----------|----------|-------|--------------------------|
| 1 | High | CSSOM var() incompatibility | Step 2, `createOverlay()` | `overlay.style.zIndex = 'var(--kc-z-modal)'` — CSSOM `zIndex` setter validates against `<integer> \| auto` and silently discards CSS custom property references (`var(...)`) in most browsers. The overlay will fall back to the z-index from `.kc-overlay` CSS class (1000) instead of the intended modal tier (1100). Phase 01 was already fixed to include `.kc-overlay--modal { z-index: var(--kc-z-modal); }` — use that modifier class instead. | `overlay.className = 'kc-overlay kc-overlay--modal';` — remove `style.zIndex` line entirely |
| 2 | Low | Misleading import note | Step 3, `ui.js` note | The note says "If the current import differs, update it to match" for `import showLoading, { hideLoading, showToast, trapFocus } from './ui.js';` — but `main.js` does not import `ui.js` at all (confirmed by grep). Suggesting an update to a non-existent import is confusing for the implementer. | Clarify: `showLoading`/`hideLoading`/`showToast` are not currently imported in main.js. If they are needed there in the future, add the full import at that time. |

**Codebase Score:** 2 issues (0 critical, 1 high, 0 medium, 1 low)

---

## Critical Issues Detail

### Issue #1: `createOverlay()` inline zIndex with var() reference (High)

**Problem:**
```js
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'kc-overlay';
    overlay.style.zIndex = 'var(--kc-z-modal)';  // ← broken
    return overlay;
}
```
The CSSOM property setter for `zIndex` validates values as `<integer> | auto`. It silently discards `var(--kc-z-modal)` — no error is thrown, but the inline style is not applied. The overlay's z-index falls back to whatever `.kc-overlay` CSS sets via `z-index: var(--kc-z-overlay)` = 1000.

**Why High:** Overlays at z-index 1000 still appear above the game header (`z-50` = 50), so the game doesn't break visually. But the intended modal/toast/loading tier hierarchy is lost. If a toast (`.kc-toast` uses `var(--kc-z-toast)` = 1200 via CSS) appears while a popup overlay is open, the toast will render correctly above the overlay — but this is incidental, not structural. The architectural intent of the z-index system is violated.

**Fix:** Phase 01 auto-fixes already added `.kc-overlay--modal { z-index: var(--kc-z-modal); }` to style.css. Use the modifier class:
```js
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'kc-overlay kc-overlay--modal';
    return overlay;
}
```

---

## Fixes Applied

| # | Original Issue | Fix Applied |
|---|---------------|-------------|
| 1 | `createOverlay()` uses `style.zIndex = 'var(--kc-z-modal)'` — CSSOM silently discards var() reference | Changed to `overlay.className = 'kc-overlay kc-overlay--modal'` and removed the style.zIndex line in Step 2 code block (Auto-fixed) |
| 2 | Missing "Problem Being Solved" subsection | Added to Context & Workflow (Auto-fixed) |
| 3 | Missing "Prerequisites & Clarifications" section | Added section with validation checklist (Auto-fixed) |
| 4 | Step 0 TDD absent | Added Step 0 with manual-verification approach for JS-rewrite phase (Auto-fixed) |
| 5 | Quality Assurance missing Automated Testing, Performance Testing, Review Checklist | Added all three subsections (Auto-fixed) |
| 6 | Acceptance Criteria missing "Quality Gates" subsection | Added Quality Gates checklist (Auto-fixed) |

---

## Next Steps (Main Agent)

| # | Severity | Issue | Suggested Improvement |
|---|----------|-------|----------------------|
| 1 | Low | Step 3 note about main.js import is misleading — suggests updating an existing import, but no ui.js import exists in main.js | Update note to clarify: ui.js functions are not currently wired to main.js; add the import only if they are needed there in the future |
| 2 | Low | Dependencies section missing "External Services" subsection | Add `External Services: None` |

**Note to main agent:** These improvements are worth addressing now — phases are rarely revisited after completion. Discuss with user and implement what makes sense.

---

## Verdict

**Template Score:** 5/12 sections (pre-fix) → 10/12 after auto-fixes
**Codebase Score:** 2 issues (0 critical, 1 high, 0 medium, 1 low) → 1 auto-fixed (High), 1 deferred (Low)
**Ready:** Yes — all Critical/High/Medium issues auto-fixed
