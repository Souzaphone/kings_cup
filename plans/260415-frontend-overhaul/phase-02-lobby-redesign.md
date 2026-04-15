---
title: "Phase 02: Lobby Redesign"
description: "Completely restyle index.html using Tailwind utility classes — clean player name input, create/join game cards, scrollable public games list, and a polished password modal."
skill: "none"
status: done
group: "frontend-overhaul"
dependencies: ["phase-01-design-foundation"]
tags: [phase, frontend, lobby, ui]
created: 2026-04-15
updated: 2026-04-15
---

# Phase 02: Lobby Redesign

**Context:** [Master Plan](./plan.md) | **Dependencies:** P01 | **Status:** Pending

---

## Overview

The current `index.html` lobby looks unfinished: a bare `<h2>` title, unstyled `<input>` fields, and button elements with no design consistency. The inline `<style>` block (removed in Phase 01) added minimal borders and hover states. This phase replaces the entire HTML structure with a clean, centered layout using Tailwind utility classes — the design matches the "minimal/clean" style the user selected.

**Goal:** `index.html` renders a polished lobby page — a centered column layout with a logo/title area, player name input, create-game section, public games list, and a manual join section — all using Tailwind classes and the CSS component classes from `style.css`.

---

## Context & Workflow

### How This Phase Fits Into the Project

- **File changed:** `game/templates/index.html` — complete HTML rewrite
- **No JS changes** — `main.js` lobby logic (`init_index`) stays intact; only element IDs and the DOM structure change. All existing element IDs used by JS must be preserved exactly:
  - `#player-name`
  - `#create-game-btn`
  - `#game-type` radio buttons (`name="game-type"`, values `"public"` / `"private"`)
  - `#game-password`
  - `#password-section`
  - `#refresh-games-btn`
  - `#games-loading`
  - `#no-games`
  - `#games-list`
  - `#game-id`
  - `#manual-password-section`
  - `#join-password`
  - `#join-game-btn`
  - `#password-modal`
  - `#modal-password`
  - `#password-submit`
  - `#password-cancel`
- **Style approach:** Tailwind utility classes on every element; `.kc-surface`, `.kc-btn`, `.kc-input`, `.kc-label` from `style.css` for complex components

### User Workflow

**Steps:**
1. Player opens `http://localhost:5000` — sees a clean centered page
2. Enters name in the "Your Name" input
3. Either: clicks a public game from the list → joins it
4. Or: chooses "Create Game" (public or private) → filled form → "Create Game" button
5. Or: pastes a Game ID into "Join by ID" → "Join" button
6. Redirected to `/game?game_id=...&player_name=...`

**Success Outcome:** The page looks like a modern web app lobby — not a raw HTML form.

### Problem Being Solved

**Pain Point:** The current lobby looks like a plain HTML wireframe with no visual hierarchy or polish.

### Integration Points

**Upstream Dependencies:**
- Phase 01 (Design Foundation): Tailwind CDN and `tailwind.config` in index.html, all `.kc-*` classes in style.css (`.kc-surface`, `.kc-btn`, `.kc-input`, `.kc-label`, `.kc-overlay`, `.kc-hidden`)

**Downstream Consumers:**
- Phase 04 (UI Overlays): Reuses the `.kc-overlay` / `.kc-popup` pattern established here for the password modal as the reference for all dynamic overlay creation

**Data Flow:**
```
User opens http://localhost:5000
  → index.html loads Tailwind CDN + style.css (from P01)
  → main.js init_index() fires
  → loadPublicGames() fetches /public_games → renders .game-item elements
  → User fills #player-name → updateButtonStates() enables buttons
  → User clicks Create/Join → HTTP POST → redirect to /game
```

---

## Prerequisites & Clarifications

### Prerequisites

- [ ] Phase 01 complete — Tailwind CDN is in index.html `<head>` and `style.css` contains `.kc-*` classes
- [ ] Dev server running (`npm run dev` in `game/`)
- [ ] Both `game/templates/index.html` and `game/static/main.js` are writable

### Unresolved Questions

None — all design decisions are captured in ADR-02-01.

### Caution

Main.js must be updated alongside index.html — the show/hide pattern changes (Step 4) are required for the lobby to function after HTML is rewritten. Do not test the lobby after Step 1 alone; test only after completing Step 4.

---

## Requirements

### Functional

- All existing element IDs preserved (JS still functions without changes to `main.js`)
- "Create Game" button disabled until player name is entered (current `disabled` attribute behavior preserved)
- "Join Game" button disabled until player name is entered (current behavior preserved)
- Public/private radio toggle shows/hides the password field (JS-controlled via `display:none` — preserved with `id="password-section"`)
- Password modal (`#password-modal`) works for joining password-protected games
- Public games list auto-refreshes every 10 s (JS behavior unchanged)
- Mobile-responsive (single column on small screens, comfortable padding)

### Technical

- Tailwind CDN classes only (plus `.kc-*` classes from style.css)
- No inline `style="..."` attributes anywhere in the new HTML
- Remove the `<img src="/static/assets/beer.png">` — replace with text/emoji or nothing (the beer image was only used as a decorative placeholder)
- `<script type="module" src="/static/main.js">` stays at bottom of `<body>`
- `<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js">` stays in `<head>`

---

## Decision Log

### Remove beer.png (ADR-02-01)

**Date:** 2026-04-15
**Status:** Accepted

**Context:** The `<img src="/static/assets/beer.png">` was used as a decorative header logo. It is a small low-quality icon that clashes with the minimal/clean design target.

**Decision:** Replace with a styled text heading ("Kings Cup" in large bold sans-serif) and a card-suit Unicode character (♠ or ♣) as a minimal logo mark.

**Consequences:**
- **Positive:** Cleaner look, no image request
- **Negative:** Loses the beer branding — acceptable for a minimal redesign; can be swapped back later

---

## Implementation Steps

### Step 0: TDD

This is an HTML/CSS phase plus minor JS class-toggle changes. There are no functions, services, or modules to unit test.

**Manual verification approach (verify before and after):**

1. Before making changes, note current lobby behavior: green/gray background, unstyled inputs, bare buttons
2. After completing Steps 1–4, verify in browser:
   - Background is `#f8fafc` (light gray), white card sections visible
   - All buttons enabled/disabled correctly based on name input
   - Public/private radio toggles password field visibility
   - Password modal appears when clicking a private game
   - No JS console errors
3. Test with two browser tabs open to verify game creation and joining still work end-to-end

There is nothing to write before implementing — the verification is entirely manual. Proceed to Step 1.

### Step 1: Rewrite `index.html` body

Replace the entire `<body>` content (everything between `<body>` and `</body>`, not including the `<script>` tags which move to the correct positions). The new structure:

```html
<body class="min-h-screen bg-kc-bg flex flex-col items-center justify-center py-10 px-4">

  <!-- Page Header -->
  <div class="mb-8 text-center">
    <span class="text-5xl select-none">♠</span>
    <h1 class="text-3xl font-bold text-kc-text mt-2 tracking-tight">Kings Cup</h1>
    <p class="text-kc-muted text-sm mt-1">Draw cards. Follow rules. Survive.</p>
  </div>

  <!-- Main content column -->
  <div class="w-full max-w-md flex flex-col gap-4">

    <!-- Player Name -->
    <div class="kc-surface">
      <label class="kc-label" for="player-name">Your Name</label>
      <input
        type="text"
        id="player-name"
        class="kc-input"
        placeholder="Enter your name"
        autocomplete="off"
        maxlength="24"
        data-test="player-name-input"
      >
    </div>

    <!-- Create Game -->
    <div class="kc-surface">
      <h2 class="text-base font-semibold text-kc-text mb-3">Create a Game</h2>

      <div class="flex gap-4 mb-3">
        <label class="flex items-center gap-2 cursor-pointer select-none text-sm text-kc-text font-medium">
          <input type="radio" name="game-type" value="public" checked class="accent-kc-accent">
          Public
        </label>
        <label class="flex items-center gap-2 cursor-pointer select-none text-sm text-kc-text font-medium">
          <input type="radio" name="game-type" value="private" class="accent-kc-accent">
          Private
        </label>
      </div>

      <div id="password-section" class="mb-3 kc-hidden">
        <label class="kc-label" for="game-password">Password</label>
        <input type="password" id="game-password" class="kc-input" placeholder="Set a password">
      </div>

      <button
        type="button"
        id="create-game-btn"
        class="kc-btn kc-btn-primary w-full"
        disabled
        data-test="create-game-btn"
      >
        Create Game
      </button>
    </div>

    <!-- Public Games -->
    <div class="kc-surface">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-kc-text">Public Games</h2>
        <button
          type="button"
          id="refresh-games-btn"
          class="kc-btn kc-btn-ghost text-xs px-2 py-1"
          data-test="refresh-games-btn"
        >
          Refresh
        </button>
      </div>

      <div id="public-games-container" class="max-h-56 overflow-y-auto flex flex-col gap-2">
        <p id="games-loading" class="text-kc-muted text-sm text-center py-4">Loading games…</p>
        <p id="no-games" class="text-kc-muted text-sm text-center py-4 kc-hidden">No public games available</p>
        <div id="games-list" class="flex flex-col gap-2"></div>
      </div>
    </div>

    <!-- Join by ID -->
    <div class="kc-surface">
      <h2 class="text-base font-semibold text-kc-text mb-3">Join by Game ID</h2>

      <label class="kc-label" for="game-id">Game ID</label>
      <input type="text" id="game-id" class="kc-input mb-3" placeholder="Paste game ID here" autocomplete="off">

      <div id="manual-password-section" class="mb-3 kc-hidden">
        <label class="kc-label" for="join-password">Password</label>
        <input type="password" id="join-password" class="kc-input" placeholder="Enter password">
      </div>

      <button
        type="button"
        id="join-game-btn"
        class="kc-btn kc-btn-primary w-full"
        disabled
        data-test="join-game-btn"
      >
        Join Game
      </button>
    </div>

  </div><!-- /main column -->

  <!-- Password Modal (for clicking a private game in the list) -->
  <div id="password-modal" class="kc-overlay kc-hidden">
    <div class="kc-popup">
      <h3>Enter Password</h3>
      <input
        type="password"
        id="modal-password"
        class="kc-input mt-3 mb-4"
        placeholder="Game password"
      >
      <div class="flex gap-2 justify-end">
        <button id="password-cancel" class="kc-btn kc-btn-ghost">Cancel</button>
        <button id="password-submit" class="kc-btn kc-btn-primary">Join</button>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
  <script type="module" src="/static/main.js"></script>
</body>
```

### Step 2: Update `<head>` of `index.html`

The full new `<head>` (replacing everything currently there):

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kings Cup</title>
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
</head>
```

### Step 2b: Update `createGameElement()` button class in `main.js`

The `createGameElement()` function in `main.js` dynamically creates a `<button>` inside each `.game-item`. Step 3 adds `.game-item .kc-btn { flex-shrink: 0; margin-left: 0.5rem; }` to style.css — this CSS rule only applies if the button has the `kc-btn` class.

Find `createGameElement()` in `main.js` and update the `gameDiv.innerHTML` template:

```js
gameDiv.innerHTML = `
    <div class="game-info">
        <div><strong>Host:</strong> ${game.hostName || 'Unknown'}</div>
        <div class="game-meta">
            Players: ${game.playerCount}/${game.maxPlayers} | 
            ${game.hasPassword ? '🔒 Private' : '🌐 Public'} | 
            Last activity: ${timeSince}
        </div>
    </div>
    <button
        class="kc-btn kc-btn-ghost text-xs px-2 py-1"
        onclick="event.stopPropagation(); joinPublicGame('${game.id}', ${game.hasPassword})"
    >Join</button>
`;
```

This ensures the button is styled by `.game-item .kc-btn` and looks consistent with the rest of the UI.

### Step 3: Add `.game-item` style for public game list entries

The JS in `main.js` dynamically builds game list items. The element structure created by `loadPublicGames()` uses the class `game-item`. Add this to `style.css`:

```css
/* Public game list item (rendered by main.js loadPublicGames) */
.game-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 1px solid var(--kc-border);
  border-radius: var(--kc-radius-sm);
  background: var(--kc-bg);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  font-size: 0.9rem;
}

.game-item:hover {
  background: #eff6ff;
  border-color: var(--kc-accent);
}

.game-info {
  flex: 1;
  font-weight: 500;
  color: var(--kc-text);
}

.game-meta {
  font-size: 0.8rem;
  color: var(--kc-muted);
  margin-top: 0.15rem;
}

.game-item .kc-btn {
  flex-shrink: 0;
  margin-left: 0.5rem;
}
```

### Step 4: Fix `#password-section` and `#password-modal` show/hide

In `main.js`, the JS controls `#password-section` visibility with `element.style.display`. Since we removed the old inline `style="display: none;"` and replaced it with `class="kc-hidden"`, we need to verify the JS toggle pattern.

Search `main.js` for:
```js
document.getElementById('password-section').style.display
```
and replace both occurrences with class toggles:
```js
// Show:
document.getElementById('password-section').classList.remove('kc-hidden');
// Hide:
document.getElementById('password-section').classList.add('kc-hidden');
```

Do the same for `#manual-password-section`, `#password-modal`, `#games-loading`, `#no-games`.

The pattern to search for in `main.js`:
```js
style.display = 'none'       →  classList.add('kc-hidden')
style.display = ''           →  classList.remove('kc-hidden')
style.display = 'block'      →  classList.remove('kc-hidden')
style.display = 'flex'       →  classList.remove('kc-hidden')
```

Only change these for the elements listed above — do not touch game canvas or cursor canvas display logic.

---

## Verifiable Acceptance Criteria

**Critical Path:**

- [ ] Lobby page loads at `http://localhost:5000` — title "Kings Cup" visible, no raw HTML bleeding through
- [ ] "Create Game" button is disabled until a player name is typed
- [ ] "Join Game" button is disabled until a player name is typed
- [ ] Switching to "Private" shows the password field; switching back hides it
- [ ] "Refresh" button triggers the games list to reload
- [ ] Clicking a public game from the list triggers the join flow (existing JS behavior)
- [ ] Clicking a private game shows the password modal overlay
- [ ] Creating a game redirects to `/game`
- [ ] Joining a game by ID with correct password redirects to `/game`

**Visual:**

- [ ] Background is light gray (`#f8fafc`) — no green gradient
- [ ] All sections are white cards with subtle borders and shadows
- [ ] Input fields have visible focus rings (blue outline)
- [ ] Buttons have consistent height and padding
- [ ] Page is usable on a 375px wide mobile viewport (no overflow)

---

## Quality Assurance

### Manual Testing

- [ ] **Lobby loads:** Navigate to `http://localhost:5000` — title, subtext, and all three sections visible
- [ ] **Disabled buttons:** Without typing a name, both Create and Join buttons are visually disabled (opacity ≈ 0.45)
- [ ] **Name enables buttons:** Type a name → both buttons become active
- [ ] **Private game toggle:** Select "Private" radio → password field slides into view; select "Public" → field hides
- [ ] **Create game:** Enter name, click Create Game → redirected to game page
- [ ] **Public games list:** Wait for auto-refresh → games appear as styled cards
- [ ] **Join by ID:** Paste a valid game ID, click Join → joins successfully
- [ ] **Password modal:** Click a private game → modal appears centered with backdrop
- [ ] **Mobile:** Resize to 375px width → no horizontal scrollbar, inputs full-width

### Automated Testing

No automated tests apply — this phase rewrites HTML and changes CSS class toggles in JS. There are no pure functions or modules to unit test. Manual verification (above) is the sole test method.

### Performance Testing

No performance regression expected — HTML rewrite reduces total bytes (removes inline `<style>` block, consolidates to Tailwind CDN). No metrics required.

### Review Checklist

- [ ] Run `/code-review plans/260415-frontend-overhaul/phase-02-lobby-redesign.md` after implementation
- [ ] Read review at `reviews/code/phase-02.md`
- [ ] Critical findings addressed (0 remaining)
- [ ] Phase approved for completion

---

## Dependencies

### Upstream

- Phase 01 (Design Foundation): Tailwind CDN in index.html, `.kc-*` classes in style.css, `.kc-hidden` class

### Downstream

- Phase 04 (UI Overlays): will use the same `.kc-overlay` / `.kc-popup` pattern established here for the password modal

### External Services

- None — Tailwind CDN (`https://cdn.tailwindcss.com`) already added in Phase 01; no additional service dependencies

---

## Completion Gate

- [ ] All acceptance criteria met
- [ ] Manual test checklist passed in two browser tabs
- [ ] Phase marked DONE in plan.md
- [ ] Committed: `feat(ui): phase 02 complete — lobby redesign`

---

**Previous:** [Phase 01: Design Foundation](./phase-01-design-foundation.md)
**Next:** [Phase 03: Game Page Layout](./phase-03-game-page-layout.md)
