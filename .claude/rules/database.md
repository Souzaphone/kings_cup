# Database — Kings Cup

No database is currently in use. All game state is stored in-memory in `app.js`:

```js
const games = {};  // game_id (UUID) → Game instance
```

**This means all game state is lost on server restart.**

## Future: Adding Persistence

When adding user accounts and unlockables, the recommended approach is **Supabase** (PostgreSQL + Auth):

- `users` table — linked to Supabase Auth
- `unlockables` / `skins` table — scoped by `user_id`
- `game_history` table — optional, for stats/leaderboards

See `security.md` for RLS guidance when adding database tables.
