# app.py
from flask import Flask, jsonify, request, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid
import logging
from datetime import datetime, timedelta
from classes import Game, player_cursors

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__, static_folder='static')
socketio = SocketIO(app, cors_allowed_origins="*")

games = {}
BROADCAST_INTERVAL = 100
UPDATE_INTERVAL = timedelta(milliseconds=50)

@app.route('/')
def show_index():
    logging.debug("Index route accessed")
    return render_template('index.html')

@app.route('/game')
def show_game():
    logging.debug("Game route accessed")
    return render_template('game.html')

@app.route('/create_game', methods=['POST'])
def create_game():
    game_id = str(uuid.uuid4())
    current_game = Game(game_id)
    games[game_id] = current_game
    logging.info(f"Game created with ID: {game_id}")
    return jsonify({"success": True, "game_id": current_game.id, "target_amount": current_game.target_amount})


@app.route('/join_game', methods=['POST'])
def join_game():

    data = request.json
    logging.debug(f"join_game request data: {data}")

    game_id = data.get('game_id')
    player_name = data.get('player_name')

    if not isinstance(game_id, str):
        logging.error(f"Expected 'game_id' as string, got {type(game_id)}: {game_id}")
        return jsonify({"success": False, "message": "Invalid game ID format"})
    
    if not isinstance(player_name, str):
        logging.error(f"Expected 'player_name' as string, got {type(player_name)}: {player_name}")
        return jsonify({"success": False, "message": "Invalid player name format"})
    
    if game_id in games:
        game = games[game_id]
        if game.add_player(player_name):
            logging.info(f"Player {player_name} joined game {game_id}")
            return jsonify({"success": True, "game": game.to_dict()})
        else:
            logging.warning(f"Player {player_name} failed to join game {game_id}")
            return jsonify({"success": False, "message": "Game is full or player name already exists"})
    else:
        logging.error(f"Game {game_id} not found for player {player_name}")
        return jsonify({"success": False, "message": "Game not found"})
    
@app.route('/leave_game', methods=['POST'])
def leave_game():
    data = request.json
    game_id = data.get('game_id')
    player_name = data.get('player_name')

    if game_id in games:
        game = games[game_id]
        if game.remove_player(player_name):

            logging.info(f"Player {player_name} left game {game_id}")

            if game.is_players_empty():
                del games[game_id]
                logging.info(f"Game {game_id} removed")
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "Player not found"})
    else:
        logging.error(f"Game {game_id} not found for player {player_name}")
        return jsonify({"success": False, "message": "Game not found"})

@socketio.on('leave')
def on_leave(data):
    game_id = data['game_id']
    player_name = data['player_name']
    leave_room(game_id)
    if game_id in games:
        game = games[game_id]
        logging.info(f"Player {player_name} left room for game {game_id}")
        emit('player_left', {"players": game.players}, room=game_id)
    else:
        emit('player_left', {"players": []}, room=game_id)

@socketio.on('mouse_move')
def update_cursor(data):
    game_id = data['game_id']
    player_name = data['player_name']
    cursor_x = data['x']
    cursor_y = data['y']

    if game_id in games:
        game = games[game_id]
        game.update_cursor(player_name, cursor_x, cursor_y)
        logging.info(f"Received cursor update for game {game_id} from player {player_name}: ({cursor_x}, {cursor_y})")

def broadcast_cursors():
    logging.info("Starting broadcast_cursors background task.")
    while True:
        for game in games.values():

            logging.info(f"Here are the games.values: {len(games.values())}")

            cursor_positions = []
            for player_name, (x, y) in game.player_cursors.items():
                cursor_positions.append({
                    "player_name": player_name,
                    "x": x,
                    "y": y
                })
            if cursor_positions:  # Only log if there are cursor positions
                logging.info(f"Broadcasting cursor positions for game {game.id}: {cursor_positions}")
            socketio.emit('cursor_update', {"cursors": cursor_positions}, room=game.id)
        socketio.sleep(BROADCAST_INTERVAL / 1000.0)

@socketio.on('join')
def on_join(data):
    socketio.start_background_task(target=broadcast_cursors)
    logging.info("Join event received")
    game_id = data['game_id']
    player_name = data['player_name']
    join_room(game_id)
    game = games[game_id]
    logging.info(f"Player {player_name} joined room for game {game_id} with players {game.players}")
    emit('player_joined', {"players": game.players}, room=game_id)

@socketio.on('card_click')
def on_card_click(data):
    game_id = data['game_id']
    player_name = data['player_name']
    if game_id in games:
        # Notify all players 
        emit('card_clicked', {"player_name": player_name}, room=game_id)


@socketio.on('start_game')
def on_start_game(data):
    game_id = data['game_id']
    if game_id in games:
        game = games[game_id]
        if game.start_game():
            logging.info(f"Game {game_id} started by player {data['player_name']}")
            emit('game_started', game.to_dict(), room=game_id)
        else:
            logging.warning(f"Failed to start game {game_id}")
            emit('error', {"message": "Not enough players to start the game"}, room=game_id)

@socketio.on('draw_card')
def on_draw_card(data):
    game_id = data['game_id']
    player_name = data['player_name']
    card = data['card']
    if game_id in games:
        game = games[game_id]
        if card > -1:
            logging.info(f"Player {player_name} drew a card in game {game_id}")
            emit('card_drawn', {"player": player_name, "card": card}, room=game_id)

            ## TODO: need to fix this
            if game.turn == game.target_amount:
                logging.info(f"Game {game_id} over, target amount reached by {player_name}")
                emit('game_over', {"message": f"{player_name} opened the beer!"}, room=game_id)
        # TODO: this has no functionality right now
        else:
            logging.info(f"No more cards to draw in game {game_id}")
            logging.info(f"Here is the card: {card}")
            emit('game_over', {"message": "No more cards in the deck"}, room=game_id)

@app.route('/return_deck', methods=['POST'])
def return_deck():
    game_id = request.json['game_id']
    if game_id in games:
        game = games[game_id]
        card_dicts = [card.to_dict() for card in game.deck.cards]
        logging.info(f"Deck returned for game {game_id}")
        return jsonify({"success": True, "deck": card_dicts})
    else:
        logging.error(f"Game {game_id} not found for deck return")
        return jsonify({"success": False, "message": "Game not found"})
    
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@app.route('/reset_game', methods=['POST'])
def reset_game():
    game_id = request.json['game_id']
    if game_id in games:
        players = games[game_id].players
        del games[game_id]
        game = Game(game_id) # resets the game
        game.players = players
        games[game_id] = game
        logging.info(f"Game {game_id} reset")
    return jsonify({"success": True})

@socketio.on('reset')
def on_reset(data):

    logging.debug("Reset event received")

    gameId = data['game_id']
    emit('game_reset', room=gameId)

@app.route('/get_game_state', methods=['POST'])
def get_game_state():
    game_id = request.json['game_id']
    logging.info(f"Game state requested for game {game_id}")
    if game_id in games:
        game = games[game_id]
        return jsonify({"success": True, "game": game.to_dict()})
    

if __name__ == '__main__':
    logging.info("Starting Flask and SocketIO server")
    socketio.run(app, debug=True)

    