# Git Workflow — Kings Cup

## Remotes

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | github.com/user/kings_cup | Primary development |

## Branch Strategy

| Branch | Purpose | Pushes To |
|--------|---------|-----------|
| `main` | Stable, working game | `origin/main` |
| `feature/*` | New features or fixes | `origin/feature/*` → PR to main |

All new work goes on a feature branch. Open a PR to `main` when ready. No CI yet, so review manually before merging.

## Commit Message Format

```
<type>(<scope>): <description>
```

| Field | Values |
|-------|--------|
| **type** | `feat`, `fix`, `refactor`, `docs`, `chore` |
| **scope** | `server`, `client`, `webcam`, `game-logic`, `ui`, `socket` |

Examples:
- `feat(game-logic): add queens rule for waterfall`
- `fix(socket): prevent duplicate join events on reconnect`
- `chore(deps): update socket.io to 4.8.1`

## Before Pushing

No automated verify step yet. Manually test in browser:

```bash
npm run dev
# Test the changed feature in two browser tabs
```

## Pull Request Workflow

1. Branch from `main`: `git checkout -b feature/<name>`
2. Make changes, commit with conventional format
3. Open PR to `main`
4. Test manually — create game, join, play through affected feature
5. Merge when satisfied
