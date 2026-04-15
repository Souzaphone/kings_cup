---
title: "Phase 03: Game Page Layout"
description: "Restyle game.html — remove Bootstrap, replace with Tailwind header, clean button bar, and a player list sidebar. The canvas stays unchanged."
skill: "none"
status: done
group: "frontend-overhaul"
dependencies: ["phase-01-design-foundation", "phase-02-lobby-redesign"]
tags: [phase, frontend, game-ui, ui]
created: 2026-04-15
updated: 2026-04-15
---

# Phase 03: Game Page Layout

**Context:** [Master Plan](./plan.md) | **Dependencies:** P01, P02 | **Status:** Pending

---

## Overview

The current `game.html` uses Bootstrap 5 for layout (removed in Phase 01). The header is a `.container-fluid .row` Bootstrap grid with buttons strung horizontally. The canvas covers the entire screen behind everything. This phase replaces the Bootstrap-based game chrome with a clean Tailwind layout: a fixed top header bar, and the canvas taking up the remaining viewport below it.

**Goal:** `game.html` renders a polished game view — fixed topbar with game info and action buttons, canvas below filling the remaining viewport, no Bootstrap classes anywhere.

---

## Context & Workflow

### How This Phase Fits Into the Project

- **File changed:** `game/templates/game.html` — full structural rewrite
- **File changed:** `game/static/main.js` — minor: update any references to changed element IDs or layout (canvas positioning)
- **Canvas rendering unchanged** — `#gameCanvas` and `#cursorCanvas` stay. Their JS rendering logic in `main.js` is not touched.
- **Element IDs to preserve** (used by `main.js`):
  - `#gameCanvas`
  - `#cursorCanvas`
  - `#start-game-btn`
  - `#reset-btn`
  - `#leave-btn`
  - `#copy-game-id-btn`
  - `#toggle-webcam-btn`
  - `#copy-status`
  - (remove `#toggle-theme` — dark mode toggle is removed for now; the canvas is always the same)

### User Workflow

**Steps:**
1. Player arrives at `/game?game_id=...&player_name=...`
2. Sees clean fixed header: game title on left, player list in center, action buttons on right
3. Below the header: the canvas fills the full remaining viewport
4. "Start Game" button active once 2+ players join (existing JS logic)
5. "Copy Game ID" copies the ID and shows a brief confirmation

**Success Outcome:** The game chrome looks intentional and clean — not a Bootstrap grid mashed together.

### Problem Being Solved

**Pain Point:** Bootstrap's `.container-fluid .row .col-*` grid over the canvas creates visual noise and conflicts (Bootstrap CSS overrides canvas positioning). The button bar looks like a generic dashboard navbar.

### Integration Points

**Upstream Dependencies:**
- Phase 01 (Design Foundation): Tailwind CDN in game.html, Bootstrap removed, `.kc-btn`, `.kc-player-pill`, `.kc-player-pill.is-current`, `.kc-hidden` classes in style.css
- Phase 02 (Lobby Redesign): Establishes `kc-hidden` pattern for class-based show/hide (used in Step 5 for `#copy-status`)

**Downstream Consumers:**
- Phase 04 (UI Overlays): Card event overlays must have z-index > `z-50` (the header). Phase 03 fixes header z-index so Phase 04 overlays render correctly above it.

**Data Flow:**
```
Player joins /game → game.html loads
  → header renders with #player-list (empty)
  → socket 'player_joined' → handlePlayerJoined → renderPlayerList() → fills #player-list pills
  → canvas draws below header (top: 56px)
  → mouse move → handleMouseMove → cursor transmitted to all peers via socket
  → cursor overlay canvas (fixed, top: 56px) renders opponent cursors
```

---

## Requirements

### Functional

- All existing element IDs preserved
- `#gameCanvas` must still cover the full area below the header for the game to render correctly
- Canvas click and mouse-move events continue working (canvas interaction is not affected by layout changes)
- `#copy-status` (the "Game ID copied!" text) shows/hides via JS — must remain in DOM
- Player list is displayed in the header — populated by JS `handlePlayerJoined` / `handlePlayerLeft`
- Remove `#toggle-theme` button — dark mode toggle is out of scope for this overhaul

### Technical

- No Bootstrap classes in the final HTML
- Canvas fills full viewport height minus the header height; use `calc(100vh - <header-height>)` or CSS grid/flex
- `#cursorCanvas` overlay stays absolutely positioned over `#gameCanvas` (JS sets this in `setupCursorCanvas()` — no changes needed there)
- `simple-peer` CDN script stays in `<head>` (needed for WebRTC)

---

## Prerequisites & Clarifications

### Prerequisites

- [ ] Phase 01 complete — Tailwind CDN in game.html, Bootstrap removed, `.kc-*` classes in style.css
- [ ] Phase 02 complete — `main.js` lobby show/hide already uses `kc-hidden` pattern (Step 5 here builds on this)
- [ ] Dev server running (`npm run dev` in `game/`)
- [ ] `game/templates/game.html` and `game/static/main.js` are writable

### Unresolved Questions

None — canvas positioning strategy is captured in ADR-03-02.

### Caution

- Both game.html and main.js must be updated together. Do not test the game page mid-way (e.g., after Step 1 alone) — the JS will reference elements that don't yet exist in the header and throw errors.
- Phase 02's main.js changes must be applied first — do not overwrite P02's changes when implementing Steps 2–5 here. Work from the version of main.js already modified by Phase 02.

---

## Decision Log

### Remove Dark Mode Toggle (ADR-03-01)

**Date:** 2026-04-15
**Status:** Accepted

**Context:** The Bootstrap theme toggle (`data-bs-theme` attribute) is Bootstrap-specific. Reimplementing it with Tailwind dark mode requires adding `dark:` variants to every class. For a party game used in a lit room, dark mode is low-priority.

**Decision:** Remove the theme toggle button and the associated JS. The app uses the light theme exclusively for now.

**Consequences:**
- **Positive:** Simpler codebase, no dark: variant sprawl
- **Negative:** Users who preferred dark mode lose it — acceptable for now

### Canvas Positioning Strategy (ADR-03-02)

**Date:** 2026-04-15
**Status:** Accepted

**Context:** The current `game.html` has the canvas in `position: fixed; top: 0; left: 0; width: 100%; height: 100%` — it covers the entire viewport including the header area. The header overlays on top of the canvas via `z-index`.

**Decision:** Keep this existing pattern — the canvas stays `position: fixed; inset: 0` and the header sits on top via `z-index`. This avoids changing `main.js` canvas resize logic.

**Consequences:**
- **Positive:** No changes to `resizeCanvas()` or canvas rendering in `main.js`
- **Negative:** The top portion of the canvas is obscured by the header — cards dealt near the top could be clipped. This is the same as the current behavior.

---

## Implementation Steps

### Step 0: TDD

This is an HTML rewrite + targeted main.js function changes. There are no pure functions or modules to unit test.

**Manual verification approach (run after all steps complete):**

1. Start server (`npm run dev`), open two browser tabs, create and join a game
2. Verify the fixed header is visible at 56px height — title on left, player pills in center, buttons on right
3. Verify the game canvas renders below the header (no header overlap on canvas content)
4. Verify cursor overlay canvas is offset to match (opponent cursors at correct positions)
5. Verify player pills appear/update as players join and leave
6. Verify "Copy ID" shows "Copied!" then hides — confirm no layout shift during this
7. Resize the browser window — canvas resizes to fill area below header, cards reposition
8. No JS console errors throughout

There is nothing to write before implementing — the verification is entirely manual. Proceed to Step 1.

### Step 1: Rewrite `game.html`

Replace the entire `game.html` with the following:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kings Cup</title>

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
          }
        }
      }
    }
  </script>

  <link rel="stylesheet" href="/static/style.css">

  <!-- Dependencies -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/simple-peer@9.11.1/simplepeer.min.js"></script>
</head>
<body class="overflow-hidden bg-kc-bg" style="cursor: url('static/assets/user.png') 20 20, auto;">

  <!-- Fixed header bar -->
  <header
    id="game-header"
    class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-kc-border shadow-sm"
    style="height: 56px;"
  >
    <div class="h-full flex items-center justify-between px-4 gap-3">

      <!-- Left: title + game info -->
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-lg font-bold text-kc-text tracking-tight select-none">♠ Kings Cup</span>
        <span id="copy-status" class="text-xs text-kc-success font-medium kc-hidden">Copied!</span>
      </div>

      <!-- Center: player pills (populated by JS) -->
      <div
        id="player-list"
        class="flex items-center gap-2 flex-wrap justify-center flex-1 min-w-0 overflow-hidden"
        aria-label="Players in game"
      >
        <!-- .kc-player-pill elements injected here by handlePlayerJoined -->
      </div>

      <!-- Right: action buttons -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          id="start-game-btn"
          class="kc-btn kc-btn-primary text-sm px-3 py-1.5"
          disabled
          data-test="start-game-btn"
        >Start</button>

        <button
          id="copy-game-id-btn"
          class="kc-btn kc-btn-ghost text-sm px-3 py-1.5"
          data-test="copy-game-id-btn"
          title="Copy Game ID"
        >Copy ID</button>

        <button
          id="toggle-webcam-btn"
          class="kc-btn kc-btn-ghost text-sm px-3 py-1.5"
          data-test="toggle-webcam-btn"
        >Webcam</button>

        <button
          id="reset-btn"
          class="kc-btn kc-btn-ghost text-sm px-3 py-1.5"
          data-test="reset-btn"
        >Reset</button>

        <button
          id="leave-btn"
          class="kc-btn kc-btn-danger text-sm px-3 py-1.5"
          data-test="leave-btn"
        >Leave</button>
      </div>

    </div>
  </header>

  <!-- Game canvas — fills viewport below header -->
  <canvas
    id="gameCanvas"
    style="position: fixed; top: 56px; left: 0; width: 100%; height: calc(100vh - 56px);"
  ></canvas>

  <!-- Cursor overlay canvas (positioned by JS in setupCursorCanvas) -->
  <!-- Note: #cursorCanvas element is created and appended by main.js dynamically -->

  <script type="module" src="static/main.js"></script>
</body>
</html>
```

### Step 1b: Remove inline style overrides from `drawTable()` in `main.js`

**Critical — do this before testing.** The current `drawTable()` positions `#copy-game-id-btn` and `#copy-status` via inline `element.style.*` assignments on every render. After Step 1, both elements live in the fixed header — the inline style assignments will yank them out of the header on every call to `drawTable()`, breaking the layout.

Find these lines in `drawTable()` and delete them:

```js
// DELETE these lines from drawTable():
const copyBtn = document.getElementById('copy-game-id-btn');
const copyStatus = document.getElementById('copy-status');

// Set positions relative to the canvas or other UI elements if necessary
copyBtn.style.position = 'absolute';
copyBtn.style.top = `${canvas.offsetTop + 80}px`; // Adjust to desired position
copyBtn.style.left = `${canvas.offsetLeft + 20}px`;

copyStatus.style.position = 'absolute';
copyStatus.style.top = `${canvas.offsetTop + 110}px`; // Adjust to desired position
copyStatus.style.left = `${canvas.offsetLeft + 20}px`;
```

After deletion, these elements are positioned purely by CSS in the header — no inline style needed.

### Step 2: Update player list rendering in `main.js`

The current code calls `io.to().emit('player_joined', { players })` and the client handles it. In `main.js`, find `handlePlayerJoined` (and `handlePlayerLeft`) which update the player list.

Currently the game draws players on the canvas — there is no DOM player list. We are adding `#player-list` in the header. Update both handlers to populate it:

```js
function renderPlayerList(players) {
    const container = document.getElementById('player-list');
    if (!container) return;
    container.innerHTML = '';
    players.forEach(name => {
        const pill = document.createElement('span');
        pill.className = 'kc-player-pill' + (name === client ? ' is-current' : '');
        pill.textContent = name;
        container.appendChild(pill);
    });
}

function handlePlayerJoined(data) {
    players = data.players;
    renderPlayerList(players);
    updateStartButtonState();
    initializeCardEvents(socket, gameId, players, client);
}

function handlePlayerLeft(data) {
    players = data.players;
    renderPlayerList(players);
    updateStartButtonState();
    initializeCardEvents(socket, gameId, players, client);
}
```

If `handlePlayerJoined` and `handlePlayerLeft` already contain this logic partially, merge rather than replace.

Also call `renderPlayerList` inside `updateGameState`:
```js
function updateGameState(game) {
    players = game.players;
    renderPlayerList(players);
    targetAmount = game.target_amount;
    initializeCardEvents(socket, gameId, players, client);
    drawTable();
}
```

### Step 2b: Remove canvas player board from `drawTable()` in `main.js`

The current `drawTable()` renders a player list directly on the canvas (a dark box with names in white text). After Step 2 adds the `#player-list` header pills, both displays will show simultaneously. Remove the canvas player board block from `drawTable()`:

```js
// DELETE this block from drawTable() — player list moves to header pills:
// Draw player board
const boardWidth = 200;
const boardHeight = 300;
const boardX = canvas.width - boardWidth - 20;
const boardY = 20;

ctx.fillStyle = '#333333'; 
ctx.fillRect(boardX, boardY, boardWidth, boardHeight);

ctx.strokeStyle = '#FFFFFF'; 
ctx.lineWidth = 2;
ctx.strokeRect(boardX, boardY, boardWidth, boardHeight);

ctx.fillStyle = '#FFFFFF';
ctx.font = '16px Arial';

ctx.fillText('Players:', boardX + 10, boardY + 20);

players.forEach((player, index) => {
    ctx.fillText(player, boardX + 10, boardY + 40 + (index * 20));
});
```

Also remove the "Current Player" canvas text that shows `players[currentPlayerIndex]` (the line `ctx.fillText(\`Current Player: ...\`, 20, 30)`) — this information is now in the header and on the canvas as card turn indicators.

### Step 3: Update canvas positioning in `main.js`

The current `resizeCanvas()` sets `canvas.width/height` to `window.innerWidth/Height`. Since the header is now 56px tall and the canvas starts at `top: 56px`, update `resizeCanvas()`:

```js
function resizeCanvas() {
    const HEADER_HEIGHT = 56;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - HEADER_HEIGHT;

    // Reposition cursor canvas if it exists
    if (cursorCanvas) {
        cursorCanvas.width = canvas.width;
        cursorCanvas.height = canvas.height;
        cursorCanvas.style.top = HEADER_HEIGHT + 'px';
    }

    // Recalculate card positions to fit new canvas dimensions
    if (cards.length > 0) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        cards.forEach((card) => {
            if (card.revealed) {
                card.x = centerX;
                card.y = centerY;
            } else {
                card.x = centerX + Math.cos(card.id * (2 * Math.PI / 52)) * 150;
                card.y = centerY + Math.sin(card.id * (2 * Math.PI / 52)) * 150;
            }
        });
    }

    drawTable();
}
```

**Note:** The card repositioning block is preserved from the existing `resizeCanvas()` — do not omit it. Without it, cards will stay at old positions when the window is resized.

Also update `setupCursorCanvas()` to account for the header offset:

```js
function setupCursorCanvas() {
    cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = canvas.width;
    cursorCanvas.height = canvas.height;
    cursorCanvas.style.position = 'fixed';
    cursorCanvas.style.top = '56px';
    cursorCanvas.style.left = '0';
    cursorCanvas.style.pointerEvents = 'none';
    document.body.appendChild(cursorCanvas);
    cursorCtx = cursorCanvas.getContext('2d');
}
```

### Step 4: Remove `#toggle-theme` button handler from `main.js`

Find and delete the event listener:
```js
document.getElementById('toggle-theme').addEventListener('click', ...)
```
(This was inside the inline `<script>` that was removed in Phase 01, but verify it's not duplicated in `main.js`.)

### Step 5: Update `#copy-status` show/hide

The current JS shows `#copy-status` with `style.display`. Update to use Tailwind's `hidden` class:

```js
function copyGameId() {
    navigator.clipboard.writeText(gameId).then(() => {
        const el = document.getElementById('copy-status');
        el.classList.remove('kc-hidden');
        setTimeout(() => el.classList.add('kc-hidden'), 1500);
    }).catch(err => {
        console.error('Failed to copy game ID:', err);
    });
}
```

---

## Verifiable Acceptance Criteria

**Critical Path:**

- [ ] `game.html` contains no Bootstrap class names (`btn-primary`, `container-fluid`, `row`, `col-*`, `d-flex`, etc.)
- [ ] Fixed header is visible at 56px height across the top
- [ ] Player name pills appear in the header when players join
- [ ] The current player's pill is highlighted (blue background, `.is-current` class)
- [ ] Canvas renders cards and table below the header (not obscured by header)
- [ ] Cursor positions from other players render correctly (cursor canvas offset accounts for header)
- [ ] "Start" button enables when 2+ players join
- [ ] "Copy ID" copies game ID and shows "Copied!" for 1.5 s then hides
- [ ] "Leave" button returns to lobby

**Visual:**

- [ ] Header is white with a bottom border — clean, uncluttered
- [ ] Buttons in header are small (`text-sm`) and don't overflow on 1280px screens
- [ ] Canvas fills the area below the header with no gaps

**Quality Gates:**

- [ ] No `element.style.*` assignments remain for header elements (`#copy-game-id-btn`, `#copy-status`) in `main.js`
- [ ] Canvas player board block removed from `drawTable()` — no duplicate player display
- [ ] Card repositioning code preserved in `resizeCanvas()`

**Integration:**

- [ ] Phase 04 card event overlays render above the header (z-index > `z-50`)
- [ ] `.kc-player-pill` and `.kc-player-pill.is-current` classes (from Phase 01) apply correctly in the header

---

## Quality Assurance

### Manual Testing

- [ ] **Open game page:** Join a game → game.html loads with clean header
- [ ] **Player list:** Join with a second tab → second player appears in header pills
- [ ] **Current player highlight:** Your own name pill is blue; others are light gray
- [ ] **Card drawing:** Draw cards → canvas updates correctly, header stays fixed
- [ ] **Cursor tracking:** Move mouse → opponent cursor visible on canvas (join two tabs)
- [ ] **Start game:** With 2+ players → "Start" becomes clickable → game starts
- [ ] **Copy ID:** Click "Copy ID" → "Copied!" appears briefly
- [ ] **Leave:** Click "Leave" → redirected to lobby
- [ ] **Canvas resize:** Resize browser window → canvas resizes to fill below header
- [ ] **Mobile (375px):** Header wraps gracefully or scrolls — no JS errors

### Automated Testing

No automated tests apply — this phase rewrites HTML and modifies canvas rendering functions. There are no pure functions to unit test. Manual verification (above) is the sole test method.

### Performance Testing

Canvas rendering performance should not regress. Verify:
- [ ] Cursor updates still appear smooth at 60Hz in two-tab test
- [ ] No `drawTable()` errors or stalls in the console during normal play

### Review Checklist

- [ ] Run `/code-review plans/260415-frontend-overhaul/phase-03-game-page-layout.md` after implementation
- [ ] Read review at `reviews/code/phase-03.md`
- [ ] Critical findings addressed (0 remaining)
- [ ] Phase approved for completion

---

## Dependencies

### Upstream

- Phase 01: Tailwind CDN in game.html, Bootstrap removed, `.kc-player-pill`, `.kc-btn` classes in style.css
- Phase 02: Pattern established for class-based show/hide (`.kc-hidden`)

### Downstream

- Phase 04 (UI Overlays): Card event popups appear over the canvas — their z-index must exceed the header (`z-50`)

### External Services

- None

---

## Completion Gate

- [ ] All acceptance criteria met
- [ ] Two-browser-tab test: player list updates, cards draw, cursors show
- [ ] Phase marked DONE in plan.md
- [ ] Committed: `feat(ui): phase 03 complete — game page layout, bootstrap removed`

---

**Previous:** [Phase 02: Lobby Redesign](./phase-02-lobby-redesign.md)
**Next:** [Phase 04: UI Overlays & Components](./phase-04-ui-overlays.md)
