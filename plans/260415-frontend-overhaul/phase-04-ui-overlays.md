---
title: "Phase 04: UI Overlays & Components"
description: "Replace all inline element.style.* assignments in utilities.js and ui.js with CSS class-based components. Add entrance animations. All card event popups, modals, toasts, and loading overlay use the design system from style.css."
skill: "none"
status: done
group: "frontend-overhaul"
dependencies: ["phase-01-design-foundation", "phase-02-lobby-redesign", "phase-03-game-page-layout"]
tags: [phase, frontend, overlays, components, animation]
created: 2026-04-15
updated: 2026-04-15
---

# Phase 04: UI Overlays & Components

**Context:** [Master Plan](./plan.md) | **Dependencies:** P01–P03 | **Status:** Pending

---

## Overview

The game's dynamic UI — card event popups, player selection modals, text input boxes, drinking prompts, toast notifications, and loading overlays — are all currently built by assigning inline `element.style.*` properties directly in JS. This phase replaces all of those with CSS class assignments, using the component classes defined in `style.css` (Phase 01). The result is consistent styling, smooth CSS animations, and maintainability.

**Goal:** Every dynamically-created UI component (`createPopup`, `createPlayerSelector`, `createTextInput`, `createDrinkingPrompt`, `createReactionPrompt`, `showToast`, `showLoading`) uses only CSS classes — zero inline style assignments except for genuinely dynamic runtime values (timer countdown text, computed pixel positions).

---

## Context & Workflow

### How This Phase Fits Into the Project

- **Files changed:**
  - `game/static/utilities.js` — rewrite all five creator functions
  - `game/static/ui.js` — rewrite `showLoading`/`hideLoading`/`showToast`
  - `game/static/style.css` — add missing component variants needed by this phase

- **No changes to:** `main.js`, `cards.js`, `app.js`, `webcam.js`
  - `cards.js` calls `createPopup(...)`, `createPlayerSelector(...)`, etc. with the same signatures — function signatures are preserved exactly

### User Workflow

**Trigger:** A player draws a card that has a special rule (e.g., "You" = card 2 = player selection).

**Steps:**
1. Card drawn → `cards.js` calls `createPopup("Alex drew You!", 2000)` — styled popup appears center-screen with slide-up animation, auto-dismisses
2. If the current player: `createPlayerSelector(players, client, callback)` — modal with player buttons
3. Player selects a target → modal closes, game continues

**Success Outcome:** All card events trigger visually polished overlays that match the site design — not raw inline-styled DOM elements.

### Problem Being Solved

**Pain Point:** Every card event currently creates DOM elements with dozens of `element.style.*` inline assignments scattered through `utilities.js` (e.g., `popup.style.background = 'rgba(0,0,0,0.9)'`, `playerBtn.style.fontSize = '16px'`). These inline styles cannot be overridden by CSS, are impossible to animate with CSS transitions, and create a maintenance nightmare where design changes require editing JS files. `ui.js` has a syntax error (`default export function`) that prevents it from loading at all in strict module environments.

### Integration Points

**Upstream Dependencies:**
- Phase 01: `.kc-overlay`, `.kc-popup`, `.kc-toast`, `.kc-spinner`, `.kc-loading-overlay`, `.kc-loading-box`, CSS custom properties, animations in `style.css`
- Phase 03: header is `z-index: 50` (Tailwind `z-50`). Overlays must use `var(--kc-z-modal)` = 1100 to appear above the header.

---

## Prerequisites & Clarifications

### Prerequisites

- [ ] Phase 01 complete — `.kc-overlay`, `.kc-overlay--modal`, `.kc-popup`, `.kc-toast`, `.kc-spinner`, `.kc-loading-overlay`, `.kc-loading-box`, `.kc-btn`, `.kc-input`, `@keyframes kc-slide-up` all defined in style.css
- [ ] Phase 03 complete — header at `z-50` (z-index 50) established; overlays at `var(--kc-z-modal)` = 1100 will render above it
- [ ] Dev server running (`npm run dev` in `game/`)
- [ ] `game/static/utilities.js` and `game/static/ui.js` are writable

### Unresolved Questions

None — function signatures are preserved per ADR-04-02; toast fade-out uses `style.opacity` per ADR-04-01.

### Caution

Test every card type after implementation — `cards.js` and `main.js` both call these functions dynamically (`import('./utilities.js').then(...)`). A function signature mismatch or export name change will silently break card events with no console error at load time (only at runtime when a card is drawn).

---

## Requirements

### Functional

- `createPopup(content, duration, buttons?)` — behavior unchanged (auto-dismiss after `duration`, optional buttons array)
- `createPlayerSelector(players, excludePlayer, callback)` — behavior unchanged
- `createTextInput(prompt, callback, timeout)` — behavior unchanged (countdown timer, Enter key submits)
- `createDrinkingPrompt(playerName, callback)` — behavior unchanged
- `createReactionPrompt(message, targetZone, callback)` — behavior unchanged
- `showToast(message, type, duration)` — behavior unchanged (types: `'info'`, `'error'`, `'success'`, `'warning'`)
- `showLoading(message)` / `hideLoading()` — behavior unchanged

### Technical

- Function signatures identical to current — `cards.js` and `main.js` call these without changes
- `export default` / `export` keywords unchanged
- No `element.style.*` property assignments except:
  - `element.style.opacity = '0'` for fade-out transitions on toast dismiss
  - Dynamic countdown text via `textContent`
  - Computed pixel positions if needed (none expected in this phase)
- All new DOM elements get `data-test` attributes matching their purpose for future test automation
- Overlays must render above the game header (z-index > 50 / `var(--kc-z-modal)`)

---

## Decision Log

### Retain `element.style.opacity` for Toast Fade-out (ADR-04-01)

**Date:** 2026-04-15
**Status:** Accepted

**Context:** CSS `transition: opacity` requires setting `opacity: 0` via JS to trigger the fade-out before removal. This is a dynamic runtime value, not a static style.

**Decision:** Allow `element.style.opacity = '0'` in the toast dismiss logic. All other styling uses classes.

### Keep Existing Function Signatures (ADR-04-02)

**Date:** 2026-04-15
**Status:** Accepted

**Context:** `cards.js` calls all utility functions without imports (they're imported at the top of `utilities.js` and re-exported). Changing signatures would break 13 card event handlers.

**Decision:** Keep function signatures identical. Only change the internal DOM construction implementation.

---

## Implementation Steps

### Step 0: TDD

This phase rewrites DOM-manipulation JS functions. There are no pure functions or data-transformation utilities to unit test.

**Manual verification approach — run these after all steps complete:**

1. Open two browser tabs, create a game, start it with 2 players
2. Draw a card that triggers each utility function:
   - Card that triggers `createPopup` (any card) → popup appears with slide-up animation, centered, above header
   - Card that triggers `createPlayerSelector` → modal with player buttons, styled, hover works
   - Card that triggers `createTextInput` → modal with input + countdown in red, Enter submits
   - Card that triggers `createDrinkingPrompt` → green "Done Drinking" button, closes on click
   - Trigger `showToast('Test', 'success')` in browser console → green toast appears and fades
   - Call `showLoading('Waiting…')` then `hideLoading()` in console → spinner overlay appears/disappears
3. Verify all overlays appear above the game header
4. Verify no `element.style.*` assignments remain in the new utilities.js or ui.js (except `toast.style.opacity = '0'`)
5. Check browser console — no JS errors throughout

There is nothing to write before implementing. Proceed to Step 1.

### Step 1: Add Additional Component Classes to `style.css`

Append to `style.css`:

```css
/* ----------------------------------------------------------
   Phase 04 Additions: Overlay component variants
   ---------------------------------------------------------- */

/* Popup title highlight (card events use gold accent) */
.kc-popup-title-accent {
  color: var(--kc-accent);
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

/* Player selector button */
.kc-player-select-btn {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: var(--kc-bg);
  border: 1px solid var(--kc-border);
  border-radius: var(--kc-radius-sm);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--kc-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.kc-player-select-btn:hover {
  background: #eff6ff;
  border-color: var(--kc-accent);
  color: var(--kc-accent);
}

/* Timer text in text-input rounds */
.kc-timer-text {
  font-size: 0.85rem;
  color: var(--kc-danger);
  font-weight: 600;
  margin-top: 0.75rem;
  text-align: center;
}

/* Drinking prompt done button */
.kc-drinking-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--kc-success);
  color: #fff;
  border: none;
  border-radius: var(--kc-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.kc-drinking-btn:hover {
  background: #16a34a;
}

/* Reaction prompt action button */
.kc-reaction-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--kc-warning);
  color: var(--kc-text);
  border: none;
  border-radius: var(--kc-radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.kc-reaction-btn:hover {
  background: #d97706;
  color: #fff;
}
```

### Step 2: Rewrite `utilities.js`

Replace the entire file with:

```js
// utilities.js

// ── Math helpers ────────────────────────────────────────────
export function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.round(z * stdev + mean);
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── UI Helper: backdrop overlay ──────────────────────────────
// Uses .kc-overlay--modal modifier class for z-index tier (1100).
// Do NOT use style.zIndex — CSSOM silently discards var() references.
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'kc-overlay kc-overlay--modal';
    return overlay;
}

// ── createPopup ──────────────────────────────────────────────
// Shows a centered popup with optional action buttons.
// duration > 0: auto-dismisses after `duration` ms
// duration === 0: stays until manually closed
export function createPopup(content, duration = 3000, buttons = null) {
    const overlay = createOverlay();

    const popup = document.createElement('div');
    popup.className = 'kc-popup';
    popup.setAttribute('data-test', 'card-event-popup');
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');

    const title = document.createElement('p');
    title.className = 'kc-popup-title-accent';
    title.textContent = content;
    popup.appendChild(title);

    if (buttons && buttons.length > 0) {
        const btnRow = document.createElement('div');
        btnRow.className = 'flex gap-2 justify-end mt-4';

        buttons.forEach(({ text, callback }) => {
            const btn = document.createElement('button');
            btn.className = 'kc-btn kc-btn-primary';
            btn.textContent = text;
            btn.onclick = () => {
                callback();
                if (document.body.contains(overlay)) document.body.removeChild(overlay);
            };
            btnRow.appendChild(btn);
        });

        popup.appendChild(btnRow);
    }

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    if (duration > 0) {
        setTimeout(() => {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }, duration);
    }

    return overlay;
}

// ── createPlayerSelector ─────────────────────────────────────
// Shows a modal with a button per selectable player.
export function createPlayerSelector(players, excludePlayer, callback) {
    const overlay = createOverlay();

    const panel = document.createElement('div');
    panel.className = 'kc-popup';
    panel.setAttribute('data-test', 'player-selector');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h3');
    heading.textContent = 'Choose a Player';
    panel.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'mt-3 flex flex-col gap-1';

    const available = players.filter(p => p !== excludePlayer);
    available.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'kc-player-select-btn';
        btn.textContent = player;
        btn.setAttribute('data-test', `select-player-${player}`);
        btn.onclick = () => {
            callback(player);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        };
        list.appendChild(btn);
    });

    panel.appendChild(list);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    return overlay;
}

// ── createTextInput ───────────────────────────────────────────
// Shows a modal with a text input and countdown timer.
export function createTextInput(prompt, callback, timeout = 30000) {
    const overlay = createOverlay();

    const panel = document.createElement('div');
    panel.className = 'kc-popup';
    panel.setAttribute('data-test', 'text-input-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h3');
    heading.textContent = prompt;
    panel.appendChild(heading);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'kc-input mt-3';
    input.setAttribute('data-test', 'text-input-field');
    input.placeholder = 'Type here…';
    panel.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'kc-btn kc-btn-primary w-full mt-3';
    submitBtn.textContent = 'Submit';
    submitBtn.setAttribute('data-test', 'text-input-submit');
    panel.appendChild(submitBtn);

    const timerEl = document.createElement('p');
    timerEl.className = 'kc-timer-text';
    panel.appendChild(timerEl);

    let timeLeft = Math.floor(timeout / 1000);
    timerEl.textContent = `${timeLeft}s remaining`;

    const timer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s remaining`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            callback('');
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }
    }, 1000);

    const handleSubmit = () => {
        clearInterval(timer);
        callback(input.value);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
    };

    submitBtn.onclick = handleSubmit;
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSubmit();
    });

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    input.focus();
    return overlay;
}

// ── createDrinkingPrompt ──────────────────────────────────────
// Shows a modal prompting the named player to confirm drinking.
export function createDrinkingPrompt(playerName, callback) {
    const overlay = createOverlay();

    const panel = document.createElement('div');
    panel.className = 'kc-popup text-center';
    panel.setAttribute('data-test', 'drinking-prompt');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const msg = document.createElement('p');
    msg.className = 'kc-popup-title-accent';
    msg.textContent = `${playerName}, click when you're done drinking!`;
    panel.appendChild(msg);

    const btn = document.createElement('button');
    btn.className = 'kc-drinking-btn';
    btn.textContent = 'Done Drinking';
    btn.setAttribute('data-test', 'drinking-done-btn');
    btn.onclick = () => {
        callback();
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
    };
    panel.appendChild(btn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    return overlay;
}

// ── createReactionPrompt ──────────────────────────────────────
// Shows a popup instructing the player to move mouse to a zone.
// Monitors mousemove on the canvas to detect if player reacted.
export function createReactionPrompt(message, targetZone, callback) {
    const overlay = createPopup(message, 0);

    let reacted = false;
    const startTime = Date.now();

    const checkReaction = (event) => {
        if (reacted) return;

        const canvas = document.querySelector('#gameCanvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let inZone = false;
        if (targetZone === 'top')    inZone = y < rect.height * 0.2;
        if (targetZone === 'bottom') inZone = y > rect.height * 0.8;

        if (inZone) {
            reacted = true;
            const reactionTime = Date.now() - startTime;
            callback(reactionTime);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            document.removeEventListener('mousemove', checkReaction);
        }
    };

    document.addEventListener('mousemove', checkReaction);
    return overlay;
}
```

### Step 3: Rewrite `ui.js`

Replace the entire file with:

```js
// ui.js — UI helper functions for Kings Cup

// Show a loading spinner overlay
export default function showLoading(message = 'Loading…') {
    let overlay = document.getElementById('kc-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'kc-loading-overlay';
        overlay.className = 'kc-loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');

        const box = document.createElement('div');
        box.className = 'kc-loading-box';

        const spinner = document.createElement('span');
        spinner.className = 'kc-spinner';
        spinner.setAttribute('aria-hidden', 'true');

        const text = document.createElement('span');
        text.id = 'kc-loading-text';
        text.textContent = message;

        box.appendChild(spinner);
        box.appendChild(text);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    } else {
        const text = document.getElementById('kc-loading-text');
        if (text) text.textContent = message;
        overlay.classList.remove('kc-hidden');
    }
}

// Hide the loading spinner overlay
export function hideLoading() {
    const overlay = document.getElementById('kc-loading-overlay');
    if (overlay) overlay.classList.add('kc-hidden');
}

// Show a toast notification
// type: 'info' | 'success' | 'error' | 'warning'
export function showToast(message, type = 'info', duration = 2500) {
    const toast = document.createElement('div');
    toast.className = `kc-toast kc-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('data-test', 'toast');
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) document.body.removeChild(toast);
        }, 350);
    }, duration);
}

// Focus trap for modals — call after appending modal to DOM
export function trapFocus(modal) {
    const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
            if (document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
    });

    first.focus();
}
```

**Note:** `showLoading` is the `export default`. Currently, `main.js` does **not** import `ui.js` — `showLoading`, `hideLoading`, and `showToast` are not wired to `main.js`. If these functions need to be called from `main.js` in the future, add:
```js
import showLoading, { hideLoading, showToast, trapFocus } from './ui.js';
```
No import change is required for this phase — the rewrite is a drop-in replacement with the syntax error fixed.

### Step 4: Verify `ui.js` syntax (export default)

The current `ui.js` has a syntax error on line 4:
```js
default export function showLoading(...)
```
It should be:
```js
export default function showLoading(...)
```
The rewrite in Step 3 corrects this.

---

## Verifiable Acceptance Criteria

**Critical Path:**

- [ ] `utilities.js` contains zero `element.style.color/background/position/...` assignments (except `opacity` for toast fade-out)
- [ ] `ui.js` contains zero inline style assignments except `toast.style.opacity = '0'`
- [ ] `createPopup` shows a centered white card over a dark backdrop, with `kc-slide-up` animation on appearance
- [ ] `createPlayerSelector` shows a modal with styled player buttons; clicking one closes the modal and triggers the callback
- [ ] `createTextInput` shows a modal with input field, countdown timer, and submit button; Enter key and button both submit
- [ ] `createDrinkingPrompt` shows a "Done Drinking" button; clicking it triggers callback and closes
- [ ] `showToast('Hello', 'success')` shows a green toast that fades out after ~2.5s
- [ ] `showLoading('Connecting…')` shows the spinner overlay; `hideLoading()` removes it

**Visual:**

- [ ] All popups appear above the game header (z-index > `z-50`)
- [ ] Popups slide up on appearance (CSS animation plays)
- [ ] Toast fades out smoothly (opacity transition)
- [ ] Player selector buttons have hover state (blue left border or background tint)
- [ ] Text input modal auto-focuses the input field when opened
- [ ] Countdown timer shows in red, counts down correctly

**Quality Gates:**

- [ ] `grep 'style\.' utilities.js` returns only comments (zero active `element.style.*` assignments)
- [ ] `grep 'style\.' ui.js` returns only `toast.style.opacity = '0'` (one allowed assignment)
- [ ] `createOverlay()` uses `className = 'kc-overlay kc-overlay--modal'` — no `style.zIndex` assignment
- [ ] All exported function signatures match the current codebase exactly: `createPopup(content, duration, buttons)`, `createPlayerSelector(players, excludePlayer, callback)`, `createTextInput(prompt, callback, timeout)`, `createDrinkingPrompt(playerName, callback)`, `createReactionPrompt(message, targetZone, callback)`

**Integration:**

- [ ] `cards.js` import `{ createPopup, createPlayerSelector, createTextInput, createDrinkingPrompt }` from utilities.js still resolves correctly
- [ ] `main.js` dynamic imports of utilities.js functions (`import('./utilities.js').then(...)`) still work
- [ ] Phase 01 `.kc-overlay--modal` class exists in style.css and sets `z-index: var(--kc-z-modal)` ✓

**Card Events (full flow test):**

- [ ] Draw card 3 (Me!) → `createPopup` shows, player who drew sees `createDrinkingPrompt`
- [ ] Draw card 2 (You!) → drawer sees `createPlayerSelector`
- [ ] Draw card 9 (Rhyme) → drawer sees `createTextInput` with 10s countdown
- [ ] Draw card 4 (Floor) → `createPopup` appears for all players
- [ ] Draw card 7 (Heaven) → same as Floor

---

## Quality Assurance

### Manual Testing

- [ ] **Popup auto-dismiss:** Draw card 1 (Waterfall) → popup appears, auto-closes after 2s
- [ ] **Player selector:** Draw card 2 (You) as the current player → selector opens, buttons styled, click selects player
- [ ] **Text input:** Draw card 9 (Rhyme) → text modal opens with countdown, submit works
- [ ] **Drinking prompt:** Draw card 3 (Me) → drinking prompt appears, "Done Drinking" button works
- [ ] **Toast:** Trigger a toast via console: `showToast('Test!', 'success')` → styled green toast appears and fades
- [ ] **Loading:** `showLoading('Please wait')` → spinner overlay appears; `hideLoading()` removes it
- [ ] **Z-index:** All overlays appear above the game header
- [ ] **No JS errors:** Browser console clean throughout all card event flows

### Automated Testing

No automated tests apply — this phase rewrites DOM-construction functions. There are no pure computation functions to unit test (math helpers `gaussianRandom`, `lerp`, `easeInOutCubic` are unchanged). Manual card event verification (above) is the test method.

### Performance Testing

No performance regression expected — CSS class assignments are faster than inline style assignments. The card event flow timing (popup auto-dismiss, countdown timer) should be verified manually.

### Review Checklist

- [ ] Run `/code-review plans/260415-frontend-overhaul/phase-04-ui-overlays.md` after implementation
- [ ] Read review at `reviews/code/phase-04.md`
- [ ] Critical findings addressed (0 remaining)
- [ ] Phase approved for completion

---

## Dependencies

### Upstream

- Phase 01: `.kc-overlay`, `.kc-popup`, `.kc-toast`, `.kc-spinner`, `.kc-loading-overlay`, `.kc-loading-box`, `.kc-btn`, `.kc-input`, CSS animations in `style.css`
- Phase 03: Header z-index established as `z-50` (50 in Tailwind = z-index 50) — overlays must use `var(--kc-z-modal)` = 1100

### Downstream

- None — this is the final phase of the overhaul

### External Services

- None

---

## Completion Gate

- [ ] All acceptance criteria met
- [ ] Manual test: every card type triggers correct styled overlay
- [ ] No `element.style.*` (except opacity) in utilities.js or ui.js
- [ ] Phase marked DONE in plan.md
- [ ] Committed: `feat(ui): phase 04 complete — overlays and components restyled`

---

**Previous:** [Phase 03: Game Page Layout](./phase-03-game-page-layout.md)
**Next:** (overhaul complete)
