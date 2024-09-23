const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Game, Card, Deck } = require('./static/classes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

const games = {};
let currentTick = 0;
const UPDATE_INTERVAL = 50; // milliseconds

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'game.html'));
});

app.post('/create_game', (req, res) => {
  const gameId = uuidv4();
  const currentGame = new Game(gameId);
  games[gameId] = currentGame;
  console.log(`Game created with ID: ${gameId}`);
  res.json({ success: true, game_id: currentGame.id, target_amount: currentGame.targetAmount });
});

app.post('/join_game', (req, res) => {
  const { game_id, player_name } = req.body;

  if (typeof game_id !== 'string' || typeof player_name !== 'string') {
    return res.json({ success: false, message: "Invalid game ID or player name format" });
  }

  if (game_id in games) {
    const game = games[game_id];
    if (game.addPlayer(player_name)) {
      console.log(`Player ${player_name} joined game ${game_id}`);
      return res.json({ success: true, game: game.toDict() });
    } else {
      console.warn(`Player ${player_name} failed to join game ${game_id}`);
      return res.json({ success: false, message: "Game is full or player name already exists" });
    }
  } else {
    console.error(`Game ${game_id} not found for player ${player_name}`);
    return res.json({ success: false, message: "Game not found" });
  }
});

app.post('/leave_game', (req, res) => {
  const { game_id, player_name } = req.body;

  if (game_id in games) {
    const game = games[game_id];
    if (game.removePlayer(player_name)) {
      console.log(`Player ${player_name} left game ${game_id}`);

      if (game.isPlayersEmpty()) {
        delete games[game_id];
        console.log(`Game ${game_id} removed`);
      }
      return res.json({ success: true });
    } else {
      return res.json({ success: false, message: "Player not found" });
    }
  } else {
    console.error(`Game ${game_id} not found for player ${player_name}`);
    return res.json({ success: false, message: "Game not found" });
  }
});

app.post('/return_deck', (req, res) => {
  const { game_id } = req.body;
  if (game_id in games) {
    const game = games[game_id];
    const cardDicts = game.deck.cards.map(card => card.toDict());
    console.log(`Deck returned for game ${game_id}`);
    return res.json({ success: true, deck: cardDicts });
  } else {
    console.error(`Game ${game_id} not found for deck return`);
    return res.json({ success: false, message: "Game not found" });
  }
});

app.post('/get_game_state', (req, res) => {
  const { game_id } = req.body;
  console.log(`Game state requested for game ${game_id}`);
  if (game_id in games) {
    const game = games[game_id];
    return res.json({ success: true, game: game.toDict() });
  } else {
    return res.json({ success: false, message: "Game not found" });
  }
});

app.post('/reset_game', (req, res) => {
  const { game_id } = req.body;
  if (game_id in games) {
    const players = games[game_id].players;
    delete games[game_id];
    const game = new Game(game_id);
    game.players = players;
    games[game_id] = game;
    console.log(`Game ${game_id} reset`);
  }
  return res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (data) => {
    const { game_id, player_name } = data;
    socket.join(game_id);
    const game = games[game_id];
    console.log(`Player ${player_name} joined room for game ${game_id} with players ${game.players}`);
    io.to(game_id).emit('player_joined', { players: game.players });
  });

  socket.on('leave', (data) => {
    const { game_id, player_name } = data;
    socket.leave(game_id);
    if (game_id in games) {
      const game = games[game_id];
      console.log(`Player ${player_name} left room for game ${game_id}`);
      io.to(game_id).emit('player_left', { players: game.players });
    } else {
      io.to(game_id).emit('player_left', { players: [] });
    }
  });

  socket.on('mouse_move', (data) => {
    const { game_id, player_name, x, y } = data;
    if (game_id in games) {
      const game = games[game_id];
      game.updateCursor(player_name, x, y);
      console.log(`Received cursor update for game ${game_id} from player ${player_name}: (${x}, ${y})`);
    }
  });

  socket.on('start_game', (data) => {
    const { game_id, player_name } = data;
    if (game_id in games) {
      const game = games[game_id];
      if (game.startGame()) {
        console.log(`Game ${game_id} started by player ${player_name}`);
        io.to(game_id).emit('game_started', game.toDict());
      } else {
        console.warn(`Failed to start game ${game_id}`);
        socket.emit('error', { message: "Not enough players to start the game" });
      }
    }
  });

  socket.on('draw_card', (data) => {
    const { game_id, player_name, card } = data;
    if (game_id in games) {
      const game = games[game_id];
      if (card > -1) {
        console.log(`Player ${player_name} drew a card in game ${game_id}`);
        io.to(game_id).emit('card_drawn', { player: player_name, card: card });

        if (game.turn === game.targetAmount) {
          console.log(`Game ${game_id} over, target amount reached by ${player_name}`);
          io.to(game_id).emit('game_over', { message: `${player_name} opened the beer!` });
        }
      } else {
        console.log(`No more cards to draw in game ${game_id}`);
        io.to(game_id).emit('game_over', { message: "No more cards in the deck" });
      }
    }
  });

  socket.on('card_click', (data) => {
    const { game_id, player_name } = data;
    io.to(game_id).emit('card_clicked', { player_name: player_name });
  });

  socket.on('reset', (data) => {
    const { game_id } = data;
    io.to(game_id).emit('game_reset');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

function broadcastCursors() {

  if (currentTick % 10 === 0) {
    Object.values(games).forEach(game => {
      console.log(`Broadcasting cursor positions for game ${game.id}`);
      const cursorPositions = Object.entries(game.playerCursors).map(([player_name, [x, y]]) => ({
        player_name,
        x,
        y
      }));
      if (cursorPositions.length > 0) {
        io.to(game.id).emit('cursor_update', { cursors: cursorPositions });
      }
    });
  }

  currentTick++;
  console.log(`Tick: ${currentTick}`);

}

setInterval(broadcastCursors, 20);

const PORT = process.env.PORT || 5000;;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});