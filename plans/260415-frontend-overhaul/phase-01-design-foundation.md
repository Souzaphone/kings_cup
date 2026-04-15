---
title: "Phase 01: Design Foundation"
description: "Add Tailwind CDN to both pages, remove Bootstrap, rewrite style.css with CSS custom-property design tokens, and define the typography/color system."
skill: "none"
status: done
group: "frontend-overhaul"
dependencies: []
tags: [phase, frontend, design-system]
created: 2026-04-15
updated: 2026-04-15
---

# Phase 01: Design Foundation

**Context:** [Master Plan](./plan.md) | **Dependencies:** None | **Status:** Pending

---

## Overview

The current app uses three incompatible styling approaches: an old green-gradient `style.css`, Bootstrap 5.3 in `game.html` only, and hundreds of `element.style.*` inline assignments in `utilities.js`/`ui.js`. This phase establishes a single unified design system before any visual work begins in later phases.

**Goal:** Both HTML pages load Tailwind CDN; Bootstrap is removed from `game.html`; `style.css` is rewritten as a lean token file with CSS custom properties and component class stubs; a `tailwind.config` block defines the Kings Cup color palette.

---

## Context & Workflow

### How This Phase Fits Into the Project

- **UI Layer:** Both `templates/index.html` and `templates/game.html` — add Tailwind script, remove Bootstrap links
- **CSS Layer:** `game/static/style.css` — rewrite from scratch as design token foundation
- **No server changes** — purely static file updates

### User Workflow

**Trigger:** Developer opens either page in the browser.

**Steps:**
1. Browser loads Tailwind CDN script — utility classes are available globally
2. Browser loads `style.css` — CSS custom properties and component classes are available
3. Page renders with base font, neutral background, no Bootstrap conflicts

**Success Outcome:** Both pages render without visual regressions (the old inline styles on existing elements still work; nothing breaks). `class="text-slate-900"` works on any element in either page.

### Problem Being Solved

**Pain Point:** The app currently mixes three incompatible styling systems — a green-gradient `style.css`, Bootstrap 5.3 (only in `game.html`), and hundreds of `element.style.*` inline assignments in `utilities.js`/`ui.js`. This means every page looks different, color values are duplicated everywhere with no single source of truth, and Bootstrap CSS conflicts with the canvas-based game layout. Without a unified foundation, each downstream phase would introduce yet another styling approach.

### Integration Points

**Downstream Consumers:**
- Phase 02 (Lobby Redesign) — needs Tailwind available in index.html
- Phase 03 (Game Page Layout) — needs Tailwind available in game.html, Bootstrap removed
- Phase 04 (UI Overlays) — needs component classes from style.css

---

## Requirements

### Functional

- Tailwind CDN script tag present in both HTML `<head>` elements
- Bootstrap CDN `<link>` and `<script>` tags removed from `game.html`
- `tailwind.config` block defines custom Kings Cup colors (`kc-*`) in both pages
- `style.css` defines CSS custom properties for color, radius, shadow, and z-index scales
- `style.css` defines stub classes for every reusable component (`.kc-overlay`, `.kc-overlay--modal`, `.kc-overlay--toast`, `.kc-overlay--loading`, `.kc-surface`, `.kc-popup`, `.kc-btn`, `.kc-btn-primary`, `.kc-btn-ghost`, `.kc-btn-danger`, `.kc-input`, `.kc-label`, `.kc-toast`, `.kc-spinner`, `.kc-player-pill`, `.kc-hidden`)
- Keyframe animations defined: `@keyframes kc-fade-in`, `@keyframes kc-slide-up`, `@keyframes kc-spin`

### Technical

- No `npm install` — CDN only
- Tailwind version: use `https://cdn.tailwindcss.com` (latest stable)
- The inline `<style>` block inside `index.html` (lines 76–101) is removed — will be replaced by Tailwind classes in Phase 02
- The inline `<style>` block inside `game.html` (lines 10–66) is removed — will be replaced by Tailwind classes in Phase 03
- `style.css` must export only tokens and component classes — no page-specific rules in this phase

---

## Prerequisites & Clarifications

### Prerequisites

- [ ] Both HTML files exist at `game/templates/index.html` and `game/templates/game.html`
- [ ] `game/static/style.css` exists and is writable
- [ ] Dev server is NOT running mid-edit (changes take effect on reload — no hot-reload needed)

### Unresolved Questions

None — design decisions are captured in ADR-01-01.

### Caution

Do not reload the browser after Phase 01 alone. The lobby and game pages will have no meaningful visual styling until Phases 02 and 03 add Tailwind classes to the HTML. This intermediate broken state is expected and intentional.

---

## Decision Log

### Tailwind Config Placement (ADR-01-01)

**Date:** 2026-04-15
**Status:** Accepted

**Context:** Tailwind CDN can be configured via an inline `<script>tailwind.config = {...}</script>` block. Since both pages need identical config, we write it identically in both files (no shared JS include for config because the Tailwind CDN script must parse config before it processes classes).

**Decision:** Duplicate the `tailwind.config` block verbatim in both HTML files. Keep it small (colors only — no custom breakpoints or plugins needed).

**Consequences:**
- **Positive:** Simple, no extra request, works with CDN
- **Negative:** Two copies to keep in sync — acceptable since config will be stable after Phase 01

---

## Implementation Steps

### Step 0: TDD

This is a pure CSS/HTML phase — there are no functions or modules to unit test. Automated testing does not apply here.

**Manual verification approach (test before and after):**

1. Before making changes, note the current page appearance (green gradient background, Bootstrap-styled header)
2. After completing Steps 1–3, open both pages in the browser and confirm:
   - No JS console errors
   - Background is `#f8fafc` (light gray), not green
   - `class="text-blue-600"` on a test element renders blue (Tailwind is active)
3. Verification of component classes will happen in Phases 02–04 when they are applied to actual HTML

There is nothing to write before implementing — proceed directly to Step 1.

### Step 1: Rewrite `style.css`

Replace the entire contents of `game/static/style.css` with:

```css
/* ============================================================
   Kings Cup — Design Tokens & Component Classes
   Loaded by both index.html and game.html
   ============================================================ */

/* ----------------------------------------------------------
   1. CSS Custom Properties (Design Tokens)
   ---------------------------------------------------------- */
:root {
  /* Colors */
  --kc-bg:          #f8fafc;   /* page background  */
  --kc-surface:     #ffffff;   /* card / panel     */
  --kc-border:      #e2e8f0;   /* dividers         */
  --kc-text:        #0f172a;   /* primary text     */
  --kc-muted:       #64748b;   /* secondary text   */
  --kc-accent:      #3b82f6;   /* blue accent      */
  --kc-accent-dark: #2563eb;   /* hover state      */
  --kc-danger:      #ef4444;   /* errors / leave   */
  --kc-success:     #22c55e;   /* success toasts   */
  --kc-warning:     #f59e0b;   /* warnings         */
  --kc-overlay:     rgba(15, 23, 42, 0.55);

  /* Radius */
  --kc-radius-sm:   0.375rem;  /* 6px  */
  --kc-radius:      0.75rem;   /* 12px */
  --kc-radius-lg:   1rem;      /* 16px */

  /* Shadow */
  --kc-shadow-sm:   0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05);
  --kc-shadow:      0 4px 16px rgba(0,0,0,0.10);
  --kc-shadow-lg:   0 8px 32px rgba(0,0,0,0.14);

  /* Z-index scale */
  --kc-z-overlay:   1000;
  --kc-z-modal:     1100;
  --kc-z-toast:     1200;
  --kc-z-loading:   1300;
}

/* ----------------------------------------------------------
   2. Base Reset
   ---------------------------------------------------------- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-size: 16px;
  background-color: var(--kc-bg);
  color: var(--kc-text);
  -webkit-font-smoothing: antialiased;
}

/* ----------------------------------------------------------
   3. Component Classes
   (Populated with real styles in Phase 02–04)
   ---------------------------------------------------------- */

/* Overlay backdrop */
.kc-overlay {
  position: fixed;
  inset: 0;
  background: var(--kc-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--kc-z-overlay);
}

/* Overlay z-index tiers — use modifier classes instead of inline style.zIndex */
.kc-overlay--modal   { z-index: var(--kc-z-modal); }
.kc-overlay--toast   { z-index: var(--kc-z-toast); }
.kc-overlay--loading { z-index: var(--kc-z-loading); }

/* Surface card (white box) */
.kc-surface {
  background: var(--kc-surface);
  border: 1px solid var(--kc-border);
  border-radius: var(--kc-radius);
  box-shadow: var(--kc-shadow);
  padding: 1.5rem;
}

/* Popup / modal panel */
.kc-popup {
  background: var(--kc-surface);
  border-radius: var(--kc-radius-lg);
  box-shadow: var(--kc-shadow-lg);
  padding: 2rem;
  max-width: 420px;
  width: 90%;
  animation: kc-slide-up 0.2s ease-out;
}

.kc-popup h2, .kc-popup h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--kc-text);
  margin-bottom: 0.75rem;
}

/* Primary button */
.kc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: var(--kc-radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.kc-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.kc-btn-primary {
  background: var(--kc-accent);
  color: #fff;
}
.kc-btn-primary:hover:not(:disabled) {
  background: var(--kc-accent-dark);
}

.kc-btn-ghost {
  background: transparent;
  color: var(--kc-muted);
  border: 1px solid var(--kc-border);
}
.kc-btn-ghost:hover:not(:disabled) {
  background: var(--kc-border);
}

.kc-btn-danger {
  background: var(--kc-danger);
  color: #fff;
}
.kc-btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Form input */
.kc-input {
  display: block;
  width: 100%;
  padding: 0.6rem 0.875rem;
  border: 1px solid var(--kc-border);
  border-radius: var(--kc-radius-sm);
  font-size: 0.95rem;
  color: var(--kc-text);
  background: var(--kc-surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.kc-input:focus {
  outline: none;
  border-color: var(--kc-accent);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.kc-input::placeholder {
  color: var(--kc-muted);
}

/* Label */
.kc-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--kc-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

/* Toast */
.kc-toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: var(--kc-radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
  box-shadow: var(--kc-shadow);
  z-index: var(--kc-z-toast);
  animation: kc-fade-in 0.2s ease-out;
  transition: opacity 0.3s;
  white-space: nowrap;
}
.kc-toast-info    { background: var(--kc-accent); }
.kc-toast-success { background: var(--kc-success); }
.kc-toast-error   { background: var(--kc-danger); }
.kc-toast-warning { background: var(--kc-warning); color: var(--kc-text); }

/* Loading overlay */
.kc-loading-overlay {
  position: fixed;
  inset: 0;
  background: var(--kc-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--kc-z-loading);
}

.kc-loading-box {
  background: var(--kc-surface);
  border-radius: var(--kc-radius);
  padding: 2rem 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
  font-weight: 500;
  box-shadow: var(--kc-shadow-lg);
}

/* Spinner */
.kc-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--kc-border);
  border-top-color: var(--kc-accent);
  border-radius: 50%;
  animation: kc-spin 0.75s linear infinite;
  flex-shrink: 0;
}

/* Player list item */
.kc-player-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  background: var(--kc-bg);
  border: 1px solid var(--kc-border);
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--kc-text);
}

.kc-player-pill.is-current {
  background: var(--kc-accent);
  border-color: var(--kc-accent);
  color: #fff;
}

/* Section heading separator */
.kc-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--kc-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
}

/* Utility: hidden */
.kc-hidden { display: none !important; }

/* ----------------------------------------------------------
   4. Keyframe Animations
   ---------------------------------------------------------- */
@keyframes kc-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes kc-slide-up {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

@keyframes kc-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes kc-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

### Step 2: Add Tailwind CDN + Config to `index.html`

In `game/templates/index.html`, inside `<head>`, **after** `<meta name="viewport">` and **before** the existing `<link rel="stylesheet" href="/static/style.css">`:

```html
<!-- Tailwind CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'kc-accent': '#3b82f6',
          'kc-bg':     '#f8fafc',
          'kc-surface':'#ffffff',
          'kc-text':   '#0f172a',
          'kc-muted':  '#64748b',
          'kc-border': '#e2e8f0',
          'kc-danger': '#ef4444',
          'kc-success':'#22c55e',
        },
        borderRadius: {
          'kc': '0.75rem',
        }
      }
    }
  }
</script>
```

Also **remove** the existing `<style>` block at the bottom of `index.html` (lines 76–101) — it will be replaced by Tailwind classes in Phase 02.

### Step 3: Add Tailwind CDN + Config to `game.html`; Remove Bootstrap

In `game/templates/game.html`:

**Remove:**
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
```
and at the bottom:
```html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```

**Add** in `<head>` (before `<link rel="stylesheet" href="/static/style.css">` if present, or after viewport meta):
```html
<!-- Tailwind CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'kc-accent': '#3b82f6',
          'kc-bg':     '#f8fafc',
          'kc-surface':'#ffffff',
          'kc-text':   '#0f172a',
          'kc-muted':  '#64748b',
          'kc-border': '#e2e8f0',
          'kc-danger': '#ef4444',
          'kc-success':'#22c55e',
        },
        borderRadius: {
          'kc': '0.75rem',
        }
      }
    }
  }
</script>
<link rel="stylesheet" href="/static/style.css">
```

Also **remove** the inline `<style>` block in `game.html` (lines 10–66) — this will be replaced by Tailwind classes in Phase 03.

Also **remove** the inline `<script>` at the bottom that handles Bootstrap theme toggling:
```html
<script>
    const toggleThemeBtn = document.getElementById('toggle-theme');
    toggleThemeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        if (html.getAttribute('data-bs-theme') === 'dark') { ... }
    });
</script>
```
(Dark mode toggle will be re-implemented cleanly in Phase 03 if desired, or removed from scope.)

Also update the `<html>` tag — remove `data-bs-theme="light"`.

---

## Verifiable Acceptance Criteria

**Critical Path:**

- [ ] `game/static/style.css` contains CSS custom properties under `:root`, component classes, and four keyframe animations — no old green-gradient background
- [ ] `game/templates/index.html` `<head>` includes the Tailwind CDN `<script>` tag and `tailwind.config` block
- [ ] `game/templates/game.html` `<head>` includes the Tailwind CDN `<script>` tag; Bootstrap CDN `<link>` and `<script>` are gone
- [ ] `class="text-slate-900"` on any element in either page renders dark text (confirms Tailwind is loading)
- [ ] Neither page throws JS errors on load (check browser console)

**Visual:**

- [ ] Background is `#f8fafc` (very light gray) not green gradient
- [ ] No Bootstrap-style container gutters visible

**Integration:**

- [ ] Phase 02, 03, and 04 can import and apply `.kc-surface`, `.kc-overlay`, `.kc-overlay--modal`, `.kc-btn`, `.kc-input` without errors
- [ ] `.kc-hidden` hides elements correctly (`display: none !important`)
- [ ] `.kc-player-pill` and `.kc-player-pill.is-current` render as expected in Phase 03

---

## Quality Assurance

### Manual Testing

- [ ] Open `http://localhost:5000` — no JS console errors, background is light gray
- [ ] Open `http://localhost:5000/game?game_id=...&player_name=...` (must create a game first) — no Bootstrap CSS artifacts, no console errors
- [ ] Add `class="text-blue-600 text-2xl font-bold"` to any element temporarily — confirm Tailwind utility classes render correctly, then remove

### Review Checklist

- [ ] Run `/code-review` on `style.css` after implementation to verify no dead code or pattern violations

---

## Dependencies

### Upstream

- None

### Downstream

- Phase 02 (Lobby Redesign) — requires Tailwind in index.html and clean style.css
- Phase 03 (Game Page Layout) — requires Tailwind in game.html and Bootstrap removed
- Phase 04 (UI Overlays) — requires `.kc-popup`, `.kc-toast`, `.kc-overlay`, `.kc-overlay--modal`, etc. classes in style.css

### External Services

- None — Tailwind CDN (`https://cdn.tailwindcss.com`) is a read-only CDN script load; no API key or auth required

---

## Completion Gate

- [ ] All acceptance criteria met
- [ ] Browsed both pages with no console errors
- [ ] Phase marked DONE in plan.md
- [ ] Committed: `feat(ui): phase 01 complete — tailwind cdn, design tokens, style.css rewrite`

---

**Previous:** (start)
**Next:** [Phase 02: Lobby Redesign](./phase-02-lobby-redesign.md)
