# classes.py
import random
import base64
import os
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class Card:
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value
        self.image_data = self.load_image()

    def load_image(self):
        suit_char = self.suit.lower()[0]
        value_str = str(self.value).zfill(2)
        image_path = f"static/assets/{suit_char}{value_str}.png"
        
        if os.path.exists(image_path):
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        logging.warning(f"Image not found for {self.suit} {self.value}")
        return None

    def to_dict(self):
        return {"suit": self.suit, 
                "value": self.value,
                "image_data": self.image_data
        }

class Deck:
    def __init__(self):
        suits = ["Hearts", "Diamonds", "Clubs", "Spades"]
        values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "1"]
        self.cards = [Card(suit, value) for suit in suits for value in values]
        random.shuffle(self.cards)
        logging.info(f"Deck initialized and shuffled. Length: {len(self.cards)}")

    def draw(self):
        if len(self.cards) > 0:
            card = self.cards.pop()
            logging.debug(f"Card drawn: {card.suit} {card.value}")
            return card
        else:
            logging.warning("No more cards to draw")
            return None

class Game:
    def __init__(self, game_id):
        self.id = game_id
        self.players = []
        self.deck = Deck()
        self.started = False
        self.current_player_index = 0
        self.cards_on_table = []
        self.target_amount = random.randint(5, 21)
        self.turn = 0
        logging.info(f"Game created with ID: {self.id}")

    def add_player(self, player_name):
        if len(self.players) < 20 and player_name not in self.players:
            self.players.append(player_name)
            logging.info(f"Player {player_name} added to game {self.id}")
            return True
        logging.warning(f"Failed to add player {player_name} to game {self.id}")
        return False

    def start_game(self):
        if len(self.players) >= 2 and not self.started:
            self.started = True
            logging.info(f"Game {self.id} started")
            return True
        logging.warning(f"Cannot start game {self.id}, not enough players")
        return False

    def draw_card(self):
        card = self.deck.draw()
        if card:
            self.cards_on_table.append(card)
            self.turn += 1
            self.current_player_index = (self.current_player_index + 1) % len(self.players)
            logging.info(f"Card {card.suit} {card.value} drawn in game {self.id}")
            return card
        logging.warning(f"No card drawn in game {self.id}")
        return None

    def to_dict(self):
        return {
            "id": self.id,
            "players": self.players,
            "started": self.started,
            "current_player": self.players[self.current_player_index],
            "cards_on_table": [card.to_dict() for card in self.cards_on_table],
            "deck_count": len(self.deck.cards),
            "target_amount": self.target_amount,
            "turn": self.turn
        }