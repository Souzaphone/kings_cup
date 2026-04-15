# Pages & Templates — Kings Cup

Not a Next.js project. Pages are plain HTML files served by Express from `game/templates/`.

| Route | Template | Purpose |
|-------|----------|---------|
| `GET /` | `templates/index.html` | Lobby — create or join a game |
| `GET /game` | `templates/game.html` | In-game view (requires `game_id` + `player_name` query params) |
| `GET /test-webcam` | `static/test-webcam.html` | Webcam / MediaPipe test page |

## Adding a New Page

1. Create `templates/my-page.html`
2. Add a `GET /my-page` route in `app.js` that calls `res.sendFile(...)`
3. Add any associated static assets to `static/`
