# app.py
from flask import Flask, jsonify, request, render_template
import random
import logging

app = Flask(__name__, static_folder='static')

class Card:
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value

    def to_dict(self):
        return {"suit": self.suit, "value": self.value}

class Deck:
    def __init__(self):
        suits = ["Hearts", "Diamonds", "Clubs", "Spades"]
        values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "1"]
        self.cards = [Card(suit, value) for suit in suits for value in values]
        random.shuffle(self.cards)

    def draw(self):
        if len(self.cards) > 0:
            return self.cards.pop()
        else:
            return None

deck = Deck()
players = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_player', methods=['POST'])
def add_player():
    player = request.json['name']
    if player not in players:
        players.append(player)
        return jsonify({"success": True, "players": players})
    return jsonify({"success": False, "message": "Player already exists"})

@app.route('/return_deck', methods=['POST'])
def return_deck():
    if deck:
        card_dicts = [card.to_dict() for card in deck.cards]
        return jsonify({"success": True, "deck": card_dicts})
    else:
        return jsonify({"success": False, "message": "No more cards in the deck"})

@app.route('/reset_game', methods=['POST'])
def reset_game():
    global deck, players
    deck = Deck()
    players = []

    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True)