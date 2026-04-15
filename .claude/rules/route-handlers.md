# Route Handlers — Kings Cup (Express)

## HTTP Routes in app.js

All Express routes follow this pattern — validate inputs, act on game state, return JSON:

```js
app.post('/my_action', (req, res) => {
  const { game_id, player_name } = req.body;

  // Validate types
  if (typeof game_id !== 'string' || typeof player_name !== 'string') {
    return res.json({ success: false, message: 'Invalid input' });
  }

  // Verify game exists
  if (!(game_id in games)) {
    return res.json({ success: false, message: 'Game not found' });
  }

  const game = games[game_id];

  // Act
  const result = game.doThing(player_name);

  return res.json({ success: true, result });
});
```

## Current Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/` | Lobby page |
| `GET` | `/game` | Game page (validates `game_id` + `player_name`) |
| `GET` | `/public_games` | List joinable public games |
| `POST` | `/create_game` | Create a new game |
| `POST` | `/join_game` | Join an existing game |
| `POST` | `/leave_game` | Leave a game |
| `POST` | `/return_deck` | Get the current deck state |
| `POST` | `/get_game_state` | Get full game state |
| `POST` | `/reset_game` | Reset game to initial state |

## Response Format

Always return `{ success: boolean, message?: string, ...data }`:

```js
res.json({ success: true, game_id: '...' });
res.json({ success: false, message: 'Game not found' });
```
