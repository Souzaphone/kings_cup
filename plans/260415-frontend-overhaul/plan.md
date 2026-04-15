---
title: "Kings Cup Frontend Overhaul Master Plan"
description: "Replace the rudimentary UI with a polished, minimal/clean design using Tailwind CDN — lobby, game view, and all overlays."
status: pending
priority: P1
tags: [frontend, ui, design, tailwind]
created: 2026-04-15
updated: 2026-04-15
---

# Kings Cup Frontend Overhaul Master Plan

## Executive Summary

**The Mission:** Replace the current patchwork of inline styles, mismatched CSS frameworks, and bare-bones HTML with a cohesive, minimal/clean visual design across the entire Kings Cup frontend.

**The Big Shift:** The current app uses three incompatible styling approaches simultaneously — an old `style.css` with a green gradient, Bootstrap 5 in `game.html` only, and hundreds of inline `element.style.*` assignments scattered across `utilities.js` and `ui.js`. This overhaul unifies everything under Tailwind CSS (CDN, no build step) with a single CSS custom-properties design token file.

> [!NOTE]
> The game view renders its card table entirely on an HTML5 `<canvas>`. This overhaul styles everything *around* the canvas (header, player list, button bar, overlays) and does **not** attempt to migrate canvas rendering to DOM — that is a separate future effort.

**Primary Deliverables:**

1. **Design Foundation:** Tailwind CDN on both pages, CSS custom-property tokens, Bootstrap removed, old `style.css` replaced.
2. **Lobby & Game Layout:** `index.html` and `game.html` fully restyled — clean forms, clear hierarchy, responsive layout.
3. **UI Components:** All inline-styled popups, modals, toasts, and loading overlays converted to CSS-class-driven components that match the design system.

---

## Phasing Strategy (Roadmap)

We follow a **Progressive Layer** strategy: foundation first, then page shells, then overlay components. Each phase builds on the one before it.

### Phase Constraints (1M Context)

- **Size:** 20–30 KB max per phase document
- **Scope:** One coherent unit of work
- **Target:** 4 focused phases
- **Dependencies:** Explicit in phase headers
- **Review gate:** Manual browser test before marking DONE

### Phase File Naming

Pattern: `phase-NN-descriptive-slug.md`

### Phase Table

| Phase  | Title                                              | Group               | Focus                          | Status  |
| :----- | :------------------------------------------------- | :------------------ | :----------------------------- | :------ |
| **01** | [Design Foundation](./phase-01-design-foundation.md) | frontend-overhaul | Tailwind CDN, tokens, style.css | Done |
| **02** | [Lobby Redesign](./phase-02-lobby-redesign.md)     | frontend-overhaul   | index.html full restyle        | Done |
| **03** | [Game Page Layout](./phase-03-game-page-layout.md) | frontend-overhaul   | game.html header & controls    | Done |
| **04** | [UI Overlays & Components](./phase-04-ui-overlays.md) | frontend-overhaul | Popups, modals, toasts, loading | Done |

### Group Summary

| Group              | Phases  | Description                                                               |
| ------------------ | ------- | ------------------------------------------------------------------------- |
| frontend-overhaul  | P01–P04 | Sequential visual redesign of every layer — foundation through overlays   |

**Group ordering:** P01 must complete before P02, P02 before P03, P03 before P04. All four are in one implementation session.

---

## Architectural North Star

### 1. Tailwind CDN — No Build Step

- **Core Principle:** Tailwind is loaded via `<script src="https://cdn.tailwindcss.com">`. No `npm install`, no PostCSS, no purge. This keeps the zero-build-step architecture of the project intact.
- **Enforcement:** All new styling uses Tailwind utility classes. Custom CSS is written only for things Tailwind can't express (keyframe animations, canvas overlay positioning).

### 2. CSS Custom Properties as Design Tokens

- **Core Principle:** Colors, border-radius, shadows are defined once in `style.css` as `--kc-*` variables. Tailwind's inline `style` attribute approach is avoided — use `class` for everything classifiable.
- **Enforcement:** No `element.style.color = '#...'` in JS. Instead set/toggle CSS classes.

### 3. Class-Driven JS UI

- **Core Principle:** `utilities.js` and `ui.js` build DOM elements using CSS class strings, not inline `style.*` assignments.
- **Enforcement:** Every dynamically-created element gets a semantic class from `style.css`. Inline styles permitted only for truly dynamic values (e.g., computed pixel positions for canvas overlay).

### 4. No Bootstrap

- **Core Principle:** Bootstrap is removed from `game.html`. Tailwind replaces it entirely.
- **Enforcement:** Remove the Bootstrap `<link>` and `<script>` CDN tags. Replace all `btn-*`, `container-fluid`, `row`, `col-*` class references.

---

## Project Framework Alignment

This is a **vanilla JS / Node.js** project with no framework. Pages are plain HTML served by Express.

### Styling Priority

1. **First:** Tailwind utility classes via CDN
2. **Second:** Custom CSS in `style.css` for animations and component classes
3. **Third:** Inline styles only for truly dynamic runtime values (computed positions)

### Required Utilities

| Task | Pattern |
|------|---------|
| Show popup | `createPopup(content, duration)` in `utilities.js` — uses CSS classes |
| Toast notification | `showToast(message, type)` in `ui.js` — uses CSS classes |
| Loading overlay | `showLoading() / hideLoading()` in `ui.js` — uses CSS classes |
| Modal | Build with `<div class="kc-modal-overlay">` pattern |
| Form submit | `e.preventDefault()` + fetch + show loading state |

---

## Global Decision Log

### Use Tailwind CDN (ADR-G-01)

**Status:** Accepted

**Context:** The project has no build step. npm scripts only run `node app.js` or `nodemon app.js`. Adding a PostCSS/Tailwind build step would contradict the project's zero-build philosophy.

**Decision:** Use Tailwind via `<script src="https://cdn.tailwindcss.com">` with an inline `tailwind.config` block for any custom tokens needed beyond the defaults.

**Consequences:** No purging (slightly larger initial load, acceptable for LAN/party game use). Full utility class API available without configuration friction.

### Keep Canvas for Game Rendering (ADR-G-02)

**Status:** Accepted

**Context:** `main.js` renders the card table, cards, and cursors entirely on an HTML5 `<canvas>`. Migrating to DOM-based card rendering would require a major rewrite of the animation, z-index, and cursor systems.

**Decision:** Scope this overhaul to everything surrounding the canvas. The canvas background, card drawing, and cursor rendering are out of scope.

**Consequences:** The game board itself will still look canvas-rendered. The surrounding chrome (header, buttons, overlays) will be polished.

---

## Security Requirements

This is a UI-only overhaul. No new server routes, socket events, or data access. Security posture is unchanged.

- No new user input surfaces introduced
- Existing input validation in `app.js` and socket handlers is untouched
- No secrets or environment variables involved

---

## Success Metrics & Quality Gates

### Visual Goals

- [ ] Lobby page feels like a polished web app (clean form, consistent spacing, professional typography)
- [ ] Game header is uncluttered — buttons clearly labeled, game state visible
- [ ] Card event modals are readable and on-brand (white card, clean typography, smooth entrance animation)
- [ ] Toast notifications appear and disappear with smooth fade transitions

### Quality Gates

- [ ] No Bootstrap classes remaining in any HTML file
- [ ] No `element.style.*` inline assignments in `utilities.js` or `ui.js` (except computed positions)
- [ ] Both pages pass visual review in Chrome at 1280×800 and 375×812 (mobile)
- [ ] All card event flows (waterfall, you, me, floor, heaven, mate, rhyme, categories, fingers, question queen, rule) trigger correctly-styled overlays

---

## Resources & References

- **Tailwind CDN docs:** https://tailwindcss.com/docs/installation/play-cdn
- **Card assets:** `game/static/assets/` — `sN.png`, `hN.png`, `dN.png`, `cN.png`, `cardBack.png`, `can.png`
- **Socket events reference:** `game/app.js` lines 180–453

---

**Next:** [Phase 01: Design Foundation](./phase-01-design-foundation.md)
