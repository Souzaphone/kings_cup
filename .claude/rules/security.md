# Security — Kings Cup (Express / Socket.io)

## Input Validation

All Socket.io event data comes from untrusted clients. Always validate before use:

```js
socket.on('draw_card', (data) => {
  // Check types before destructuring
  if (!data || typeof data.game_id !== 'string' || typeof data.player_name !== 'string') return;
  const { game_id, player_name } = data;

  // Verify game exists
  if (!(game_id in games)) return;

  // Verify player is in the game
  const game = games[game_id];
  if (!game.players.includes(player_name)) return;

  // Now safe to act
});
```

## Secret Management

```js
// BAD — committed to git forever
const SECRET = "abc123";

// GOOD — environment variable
const SECRET = process.env.SESSION_SECRET;
if (!SECRET) throw new Error('SESSION_SECRET not configured');
```

Use `.env` for local dev (gitignored), environment variables in production.

## CORS

Current CORS is `origin: "*"` — fine for local dev/LAN play. When deploying publicly, restrict to your actual domain:

```js
const io = new Server(server, {
  cors: { origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5000' }
});
```

## Future Auth Considerations

When adding user accounts (for skins/unlockables):
- Verify JWT/session token on every sensitive socket event, not just on `connection`
- Store the verified user identity on `socket.data` after authentication
- Never trust `player_name` from the client for anything security-sensitive — use the verified identity instead
- Use Supabase Auth or similar — don't roll your own session handling

## Security Checklist

- [ ] No hardcoded secrets in source code
- [ ] Socket.io events validate `game_id` and `player_name` before accessing game state
- [ ] HTTP endpoints validate request body types
- [ ] CORS restricted to production domain before public deployment
- [ ] Rate limiting added to `/create_game` and `/join_game` before public deployment
