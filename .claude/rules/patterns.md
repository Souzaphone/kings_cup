# Patterns — Kings Cup (Express / Socket.io)

## Server-Authoritative State

The server owns all game state. Clients propose actions; the server validates and broadcasts:

```
Client emits 'draw_card'
  → Server validates (game exists, player is in game, game is started)
  → Server calls game.drawCard()
  → Server emits 'card_drawn' to all players in room
  → Clients update UI based on broadcast
```

Never let clients directly mutate game state or trust client-computed results.

## Socket.io Handler Pattern

```js
socket.on('event_name', (data) => {
  // 1. Validate inputs
  const { game_id, player_name } = data ?? {};
  if (!game_id || !(game_id in games)) return;
  const game = games[game_id];
  if (!game.players.includes(player_name)) return;

  // 2. Apply game logic
  const result = game.doSomething(player_name);

  // 3. Broadcast result
  io.to(game_id).emit('something_done', { player: player_name, result });
});
```

## Game Class Pattern

Game logic lives in `classes.js`, not in `app.js` socket handlers. This keeps handlers thin and logic testable:

```js
// classes.js — pure game logic
export class Game {
  drawCard() {
    this.turn++;
    this.lastActivity = new Date();
    return this.deck.draw();
  }
}

// app.js — thin handler
socket.on('draw_card', (data) => {
  const game = games[data.game_id];
  const card = game.drawCard();
  io.to(data.game_id).emit('card_drawn', { card });
});
```

## Room Architecture

Each game is a Socket.io room keyed by `game_id` (UUID). Players join on connect and leave on disconnect:

```js
socket.join(game_id);           // join room
io.to(game_id).emit(...);       // broadcast to all in room (including sender)
socket.to(game_id).emit(...);   // broadcast to room (excluding sender)
socket.emit(...);               // send only to this socket
```

## HTTP vs Socket.io

| Use HTTP (`/route`) for... | Use Socket.io for... |
|---------------------------|----------------------|
| Creating/joining/leaving games | Real-time game events (card draws, turn changes) |
| Getting initial game state | Cursor position updates |
| Resetting a game | Player join/leave notifications |
| Listing public games | WebRTC signaling |

## WebRTC Signaling

The server acts as a signaling relay only — it never processes media. Offer/answer/ICE candidates are forwarded blindly to the room:

```js
socket.on('webrtc_offer', ({ gameId, from, offer }) => {
  socket.to(gameId).emit('webrtc_offer', { from, offer });
});
```
