import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Game, Card, Deck } from './static/classes.js';

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use('/static', express.static(join(__dirname, 'static'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

const games = {};
const INACTIVE_GAME_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CURSOR_UPDATE_INTERVAL = 50; // 20Hz (1000ms / 20 = 50ms)
let cursorUpdateIntervals = {}; // Store intervals for each game

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'templates', 'index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(join(__dirname, 'templates', 'game.html'));
});

app.post('/create_game', (req, res) => {
  const { player_name, is_public = true, password } = req.body;
  const gameId = uuidv4();
  const currentGame = new Game(gameId, is_public, password, player_name);
  games[gameId] = currentGame;
  console.log(`Game created with ID: ${gameId}, Public: ${is_public}, Host: ${player_name}`);
  res.json({ success: true, game_id: currentGame.id, target_amount: currentGame.targetAmount });
});

app.post('/join_game', (req, res) => {
  const { game_id, player_name, password } = req.body;

  if (typeof game_id !== 'string' || typeof player_name !== 'string') {
    return res.json({ success: false, message: "Invalid game ID or player name format" });
  }

  if (game_id in games) {
    const game = games[game_id];
    
    // Check password for private games
    if (!game.validatePassword(password)) {
      return res.json({ success: false, message: "Invalid password" });
    }
    
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
        stopCursorBroadcasting(game_id);
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
    const originalGame = games[game_id];
    const players = originalGame.players;
    const isPublic = originalGame.isPublic;
    const password = originalGame.password;
    const hostName = originalGame.hostName;
    
    delete games[game_id];
    const game = new Game(game_id, isPublic, password, hostName);
    game.players = players;
    games[game_id] = game;
    console.log(`Game ${game_id} reset`);
  }
  return res.json({ success: true });
});

// New endpoint to get public games list
app.get('/public_games', (req, res) => {
  const publicGames = Object.values(games)
    .filter(game => game.isPublic && !game.started)
    .map(game => game.getLobbyInfo())
    .sort((a, b) => b.lastActivity - a.lastActivity); // Most recent first
  
  res.json({ success: true, games: publicGames });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  let playerInfo = null;

  socket.on('join', (data) => {
    const { game_id, player_name } = data;
    playerInfo = { gameId: game_id, playerName: player_name };
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
      
      // Start cursor broadcasting for this game if not already started
      if (!cursorUpdateIntervals[game_id]) {
        startCursorBroadcasting(game_id);
      }
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
    if (playerInfo) {
      const { gameId, playerName } = playerInfo;
      
      // Make the leave_game request internally
      if (gameId && playerName && games[gameId]) {
          const game = games[gameId];
          if (game.removePlayer(playerName)) {
              console.log(`Player ${playerName} removed on disconnect from game ${gameId}`);
              
              // Notify remaining players
              io.to(gameId).emit('player_left', { players: game.players });
              
              // Clean up game if empty
              if (game.isPlayersEmpty()) {
                  stopCursorBroadcasting(gameId);
                  delete games[gameId];
                  console.log(`Game ${gameId} removed on disconnect`);
              }
          }
      }
    }
  });
});

// Cursor broadcasting system - 20Hz server updates
function startCursorBroadcasting(gameId) {
  if (cursorUpdateIntervals[gameId]) {
    return; // Already broadcasting for this game
  }
  
  cursorUpdateIntervals[gameId] = setInterval(() => {
    if (!(gameId in games)) {
      // Game no longer exists, stop broadcasting
      clearInterval(cursorUpdateIntervals[gameId]);
      delete cursorUpdateIntervals[gameId];
      return;
    }
    
    const game = games[gameId];
    const cursors = game.getAllCursors();
    
    // Only broadcast if there are cursors to send
    if (Object.keys(cursors).length > 0) {
      io.to(gameId).emit('cursor_batch_update', { cursors });
    }
  }, CURSOR_UPDATE_INTERVAL);
}

function stopCursorBroadcasting(gameId) {
  if (cursorUpdateIntervals[gameId]) {
    clearInterval(cursorUpdateIntervals[gameId]);
    delete cursorUpdateIntervals[gameId];
  }
}

// Clean up inactive games
function cleanupInactiveGames() {
  const now = Date.now();
  Object.entries(games).forEach(([gameId, game]) => {
    if (now - game.lastActivity.getTime() > INACTIVE_GAME_TIMEOUT) {
      console.log(`Removing inactive game: ${gameId}`);
      stopCursorBroadcasting(gameId);
      delete games[gameId];
    }
  });
}

setInterval(cleanupInactiveGames, 5 * 60 * 1000); // Clean up every 5 minutes

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});