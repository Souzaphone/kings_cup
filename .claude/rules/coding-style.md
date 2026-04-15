# Coding Style — Kings Cup (Vanilla JS / Node.js)

## General

- ES modules throughout (`import`/`export`) — both server and client use `"type": "module"`
- Use `const` by default, `let` when reassignment is needed, never `var`
- Destructure early: `const { game_id, player_name } = data` not `data.game_id`
- Use millisecond constants for timeouts: `const INACTIVE_GAME_TIMEOUT = 30 * 60 * 1_000`
- Named functions over anonymous arrows for Socket.io handlers — easier to debug in stack traces

## Error Handling

Always check that game/player exists before accessing state in socket handlers:

```js
socket.on('draw_card', (data) => {
  const { game_id, player_name } = data;
  if (!(game_id in games)) return;           // game not found, silently ignore
  const game = games[game_id];
  // ... proceed
});
```

Use `console.log` for informational events, `console.warn` for unexpected-but-recoverable, `console.error` for failures.

## Server-Side (app.js)

- Game state lives only on the server — never trust client-provided state
- Socket.io event handlers should be thin: validate, delegate to `game.*` methods, emit results
- Put game logic in `classes.js` (Game, Card, Deck), not inline in app.js handlers
- Always call `stopCursorBroadcasting(gameId)` before deleting a game

## Client-Side (static/*.js)

- Plain DOM manipulation — no framework
- Keep UI updates in `ui.js`, socket event handling in the HTML script blocks or a separate events file
- Prefer `document.getElementById` over `document.querySelector` for elements with IDs (faster, clearer intent)
- Debounce or throttle high-frequency events (mouse move is already throttled server-side at 20Hz)

## Socket.io Conventions

- Always include `game_id` and `player_name` in event payloads so the server can route correctly
- Emit to room (`io.to(game_id).emit(...)`) for broadcasts; `socket.emit(...)` only for private responses
- Use `socket.to(room)` (excludes sender) when the sender doesn't need the event echoed back
