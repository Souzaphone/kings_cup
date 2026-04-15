# Forms — Kings Cup

No form framework. Forms use plain HTML + fetch.

## Pattern

```js
document.getElementById('join-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const playerName = document.getElementById('player-name').value.trim();
  const gameId = document.getElementById('game-id').value.trim();

  if (!playerName || !gameId) {
    showError('Player name and game ID are required');
    return;
  }

  const res = await fetch('/join_game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_name: playerName, game_id: gameId }),
  });
  const data = await res.json();

  if (!data.success) {
    showError(data.message);
    return;
  }
  // proceed
});
```

## Rules

- Always `e.preventDefault()` on form submit
- Trim string inputs before sending
- Validate client-side for UX, but server always re-validates
- Show loading state on the submit button while the request is in flight
- Display error messages from server responses (`data.message`) to the user
