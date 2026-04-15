Kings Cup — real-time multiplayer drinking card game (Node.js, Express, Socket.io, WebRTC, MediaPipe).

## Critical Rules

- Never hardcode secrets — use `process.env.*`. Any secret in source code gets committed to git permanently.
- Validate all input from Socket.io events before using it — clients can send arbitrary data. Check types, existence, and bounds.
- Never trust client-provided `game_id` / `player_name` without verifying the game exists and the player is in it.
- `console.log` is fine for this project during development. Avoid excessive logging in hot paths (cursor updates at 20Hz).
- Don't block the event loop — use `async/await` for any I/O. Long synchronous operations will stall all Socket.io clients.
- Keep game state server-authoritative. The client proposes actions (draw card, move cursor); the server validates and broadcasts results.
- Socket.io events are unauthenticated by default — when auth is added, verify the JWT/session on every sensitive socket event, not just connection.

## Commands

```bash
# Development (in game/)
npm run dev       # nodemon app.js — auto-restart on changes
npm start         # node app.js — production start

# Install dependencies
npm install

# No test suite yet — manual testing via browser
```

Server runs on `http://localhost:5000` by default (`PORT` env var to override).

## Architecture

Single Node.js app in `game/`. No build step — plain ES modules served directly.

### Stack
- **Backend:** Express + Socket.io for HTTP routes + real-time events
- **Frontend:** Vanilla JS (ES modules), plain HTML/CSS — no framework or build tool
- **Real-time:** Socket.io rooms keyed by `game_id` (UUID)
- **Webcam / drinking detection:** WebRTC via `simple-peer` + MediaPipe Pose/Hands + TensorFlow.js
- **Game state:** In-memory (`games` object in `app.js`) — no database yet

### File Layout

```
game/
  app.js                 # Express server + Socket.io event handlers
  static/
    classes.js           # Game, Card, Deck domain classes
    ui.js                # Client-side UI logic
    webcam.js            # WebRTC + MediaPipe drinking detection
    test-webcam.html     # Webcam test page
  templates/
    index.html           # Lobby / join page
    game.html            # In-game view
```

### Game Flow

1. Player creates game via `POST /create_game` → gets `game_id`
2. Other players join via `POST /join_game`
3. Browser loads `/game?game_id=...&player_name=...`
4. Socket.io `join` event connects player to room
5. Host emits `start_game` → server validates + broadcasts `game_started`
6. Players draw cards; server validates turn order and broadcasts `card_drawn`
7. Card effects trigger specialized socket event sequences (player selection, reaction events, text input rounds, etc.)

### Socket.io Event Conventions

- Client → server: snake_case (e.g., `draw_card`, `reaction_response`)
- Server → client: snake_case (e.g., `card_drawn`, `game_over`)
- Always check `game_id in games` before accessing game state in handlers
- Cursor updates batched server-side at 20Hz via `setInterval` to avoid flooding clients

### Inactive Game Cleanup

Games auto-delete after 30 minutes of inactivity. Cursor broadcasting intervals are stopped on cleanup to prevent memory leaks.

## Verification

No automated test suite yet. Manual verification steps:

```bash
npm run dev          # Start server with auto-reload
# Open http://localhost:5000 in browser
# Test: create game, join with second tab, start game, draw cards
```
