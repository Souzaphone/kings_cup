# Testing — Kings Cup

No automated test suite is set up yet. Manual testing procedure:

## Running the Server

```bash
cd game && npm run dev
# Open http://localhost:5000 in two browser tabs
```

## Manual Test Checklist

### Lobby
- [ ] Create a public game → redirected to `/game`
- [ ] Create a private game with password → join requires correct password
- [ ] Join an existing game → both players see each other in lobby
- [ ] Start game with < 2 players → error shown
- [ ] Start game with 2+ players → game starts for all

### Gameplay
- [ ] Draw a card → card removed from deck for all players
- [ ] Draw the "target" card (kings cup) → game over message shown
- [ ] Draw all 52 cards → game over "no more cards" message

### Card Effects
- [ ] Player selection card → modal appears, selection broadcasts to all
- [ ] Reaction event → all players can respond, responses broadcast
- [ ] Text input round → prompt shown, submissions received by all
- [ ] Sequential event → players notified in order

### Network
- [ ] Player disconnects mid-game → remaining players notified, game continues
- [ ] Last player disconnects → game cleaned up from server
- [ ] Inactive game (30 min) → auto-removed

## Adding Tests (Future)

When adding automated tests, use **Vitest** or **Jest** for unit testing `classes.js` game logic.
The `Game`, `Card`, and `Deck` classes are pure JS with no I/O — easy to unit test without a server.
