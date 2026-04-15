# Flow Audit: Kings Cup Frontend Overhaul

**Audited:** 2026-04-15
**Phases reviewed:** 4 (0 Done, 4 Pending, 0 Deprecated)
**Overall Assessment:** Minor Issues

---

## 1. Dependency Graph

```
P01 (Design Foundation)
  │
  ├──► P02 (Lobby Redesign)
  │       │
  │       └──► P03 (Game Page Layout)
  │                   │
  └───────────────────└──► P04 (UI Overlays & Components)
```

**Declared dependencies (from frontmatter):**

| Phase | Declared Dependencies          | Consumes                                              |
|-------|-------------------------------|-------------------------------------------------------|
| P01   | none                           | `style.css`, `index.html`, `game.html`                |
| P02   | `phase-01-design-foundation`   | Tailwind in index.html, `.kc-*` classes, `.kc-hidden` |
| P03   | P01, `phase-02-lobby-redesign` | Tailwind in game.html, Bootstrap removed, `.kc-player-pill`, `.kc-hidden` pattern |
| P04   | P01, P02, P03                  | All `.kc-*` component classes, header z-index from P03 |

**No circular dependencies detected.** The graph is a strict DAG with P01 as the root.

### Dependency Issues

| #   | Issue | Phases Affected | Severity | Suggested Fix |
|-----|-------|-----------------|----------|---------------|
| 1   | P03 declares dependency on P02 but only needs P01's `.kc-hidden` class (defined in P01's style.css, not P02). P02's lobby changes do not produce any artifact that P03 actually consumes. | P03 | Low | No action needed — soft pattern dependency is documented and harmless. The ordering P01→P02→P03 stays correct for the implementation session. |

---

## 2. Data Flow Analysis

### Architecture Pattern

The plan uses a **Progressive Layer** strategy:

```
style.css tokens + Tailwind CDN  (P01)
        ↓
index.html restyled              (P02)  → main.js: style.display → classList changes
        ↓
game.html restyled               (P03)  → main.js: canvas sizing, player list, copy-status
        ↓
utilities.js + ui.js restyled   (P04)  → CSS classes replace all inline styles
```

All phases target files that exist in the codebase. All file paths referenced are correct. The pattern is consistent — CSS classes from P01's style.css flow into every downstream phase without contradiction.

### Inconsistencies

| #   | Issue | Phases Affected | Details |
|-----|-------|-----------------|---------|
| 1   | **`overlay.style.zIndex = 'var(--kc-z-modal)'` will not reliably work in all browsers.** P04's `createOverlay()` helper uses the CSSOM property assignment `overlay.style.zIndex = 'var(--kc-z-modal)'`. The CSSOM property setter for `zIndex` validates values as `<integer> | auto` and silently discards `var()` references in many environments. The overlay z-index will silently fall back to the `.kc-overlay` CSS class value (1000), which still renders above the header (`z-50` = 50), but the intended modal/toast/loading hierarchy (1000/1100/1200/1300) will not be respected. | P04 | High |
| 2   | P04's `createOverlay()` sets `overlay.style.zIndex` as an inline style, violating the plan's own Architectural North Star ("No `element.style.*` assignments except for computed positions"). A z-index of 1100 is a constant, not a computed value. | P04 | High |

**Suggested fix for both issues #1 and #2:**
Add a modifier class to `style.css` in P04's Step 1:
```css
.kc-overlay--modal   { z-index: var(--kc-z-modal); }
.kc-overlay--toast   { z-index: var(--kc-z-toast); }
.kc-overlay--loading { z-index: var(--kc-z-loading); }
```
Then in `createOverlay()`:
```js
overlay.className = 'kc-overlay kc-overlay--modal';
```
This eliminates the inline style entirely and correctly resolves via CSS.

---

## 3. Phase Ordering Assessment

### Current Order

| # | Phase | One-line description |
|---|-------|---------------------|
| P01 | Design Foundation | style.css tokens + Tailwind CDN on both pages; Bootstrap removed from game.html |
| P02 | Lobby Redesign | index.html full restyle; main.js show/hide → classList updates |
| P03 | Game Page Layout | game.html full restyle; main.js canvas sizing + player list |
| P04 | UI Overlays & Components | utilities.js + ui.js full rewrite to CSS classes |

**Ordering is correct.** Foundation before consumers. P01 creates the token/class system before any page uses it. P02 and P03 handle the page shells before P04 handles the dynamic JS-built overlays.

### Ordering Issues

| #   | Issue | Current Order | Impact |
|-----|-------|---------------|--------|
| 1   | **Intermediate broken visual state.** P01 removes inline `<style>` blocks from both HTML files and the green-gradient from style.css without replacing them with Tailwind classes. The lobby and game pages will have no meaningful styling until P02 and P03 complete. Since all phases are in one session this is acceptable — the implementer just needs to know not to reload the browser mid-way through P01. | P01 removes styles, P02/P03 add them back | Medium |
| 2   | **Both P02 and P03 modify `main.js`.** P02 changes `style.display` → `classList` for lobby elements (`#password-section`, `#password-modal`, `#games-loading`, `#no-games`). P03 modifies `resizeCanvas()`, `setupCursorCanvas()`, `handlePlayerJoined`, `handlePlayerLeft`, `updateGameState`, and `copyGameId`. There is no overlap in the specific code they touch, but the implementer must apply both sets of changes carefully and not overwrite P02's changes when implementing P03. | P02 then P03 (both touch main.js) | Medium |

---

## 4. Stale Artifacts

| #   | Artifact | Type | Location | Action Needed |
|-----|----------|------|----------|---------------|
| 1   | plan.md group column shows "frontend-overhaul" without spaces for P01 but with internal spacing for P02–P04. | Minor formatting | plan.md Phase Table | No action — cosmetic only |
| 2   | No `reviews/code/` folder exists yet — expected by the completion gate "Run `/code-review`" checklist items in all phases. | Missing directory | plan folder | No action needed before implementation — created when code review runs |

No deprecated phases, duplicate phase numbers, or broken inter-phase links detected.

---

## 5. Risk Assessment (Pending Phases)

| Phase | Risk   | Key Risk Factors | Recommendation |
|-------|--------|-----------------|----------------|
| P01   | Low    | Clear scope (add script tags, rewrite style.css). No JS changes. Two files to touch in HTML. | Implement straightforwardly. Test both pages load without console errors after. |
| P02   | Low    | Pure HTML restyle + `main.js` show/hide pattern changes. All element IDs documented and preserved. | Verify all IDs in the checklist are in the new HTML before finishing P02. |
| P03   | Medium | Touches main.js in multiple places (resizeCanvas, setupCursorCanvas, player handlers, copy-status). Canvas positioning change (56px offset) must be applied consistently. | Read the current `resizeCanvas()` and `setupCursorCanvas()` implementations before editing — verify they don't have additional logic not captured in the plan's code blocks. |
| P04   | Medium | The `overlay.style.zIndex = 'var(--kc-z-modal)'` bug (see Data Flow issue #1) must be fixed during implementation. Function signatures must remain identical for `cards.js` compatibility. | Fix the z-index approach (use modifier class) as described in Issue #1 above. Verify `cards.js` imports are unbroken after rewrite. |

---

## 6. Recommendations (Priority Order)

1. **[High]** Fix `overlay.style.zIndex = 'var(--kc-z-modal)'` in P04 `createOverlay()` — Replace with a `.kc-overlay--modal` CSS class and set `overlay.className = 'kc-overlay kc-overlay--modal'`. Add the modifier class to P04's Step 1 CSS block. This eliminates an inline style violation AND ensures reliable cross-browser z-index behavior.

2. **[Medium]** Document the intermediate broken-state explicitly in P01's completion gate — Add a note that the browser should not be checked for visual correctness after P01 alone. Add "Do not review page visuals until P02/P03 complete" to P01's Completion Gate checklist.

3. **[Medium]** Add a note to P03 that main.js changes must be applied ON TOP OF P02's main.js changes — The implementer should not re-read the original main.js at P03 time; they should work from the version already modified by P02.

4. **[Low]** P03 dependency on P02 is over-declared — The only thing P03 actually needs from P02 is the `.kc-hidden` class (defined in P01). Update the downstream note to say "depends on P01's `.kc-hidden` class established as the visibility toggle pattern" rather than implying P02's HTML changes are required.

---

## Summary

The plan is **structurally sound**. The dependency graph has no cycles, ordering is correct, target files exist, and the four-phase progressive-layer strategy is coherent. The single real bug (CSS custom property in JS CSSOM assignment) is easy to fix and is fully contained in P04. No phases need to be restructured.

**Proceed to per-phase reviews.** Fix the z-index issue either before or during implementation.
