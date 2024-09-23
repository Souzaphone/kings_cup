// classes.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Utility function to generate random integer
function generateRandomInteger() {
    return Math.floor(Math.random() * 100) + 1; // Generates a random integer between 1 and 100
}

class Cursor {
    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.color = null; // Color is not set in the original code
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    returnPosition() {
        return [this.x, this.y];
    }

    toDict() {
        return { x: this.x, y: this.y, name: this.name, color: this.color };
    }
}

class PlayerCursors {
    constructor() {
        this.cursors = [];
    }

    addCursor(x, y, client) {
        const cursor = new Cursor(x, y, client);
        this.cursors.push(cursor);
    }

    removeCursor(client) {
        this.cursors = this.cursors.filter(c => c.name !== client);
    }

    updateCursor(x, y, client) {
        const cursor = this.cursors.find(c => c.name === client);
        if (cursor) {
            cursor.updatePosition(x, y);
        }
    }
}

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.imageData = this.loadImage();
    }

    loadImage() {
        const suitChar = this.suit.toLowerCase()[0];
        const valueStr = String(this.value).padStart(2, '0');
        const imagePath =  `static/assets/${suitChar}${valueStr}.png`;
        
        return imagePath;
    }

    toDict() {
        return {
            suit: this.suit,
            value: this.value,
            imageData: this.imageData
        };
    }
}

class Deck {
    constructor() {
        const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
        const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "1"];
        this.cards = suits.reduce((acc, suit) => {
            return acc.concat(values.map(value => new Card(suit, value)));
        }, []);
        this.shuffle();
        console.log(`Deck initialized and shuffled. Length: ${this.cards.length}`);
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length > 0) {
            const card = this.cards.pop();
            console.log(`Card drawn: ${card.suit} ${card.value}`);
            return card;
        } else {
            console.warn("No more cards to draw");
            return null;
        }
    }
}

class Game {
    constructor(gameId) {
        this.id = gameId;
        this.players = [];
        this.deck = new Deck();
        this.started = false;
        this.currentPlayerIndex = 0;
        this.playerCursors = {};
        this.cursorUpdateTimes = {};
        this.cardsOnTable = [];
        this.targetAmount = generateRandomInteger();
        this.turn = 0;
        console.log(`Game created with ID: ${this.id}`);
    }

    addPlayer(playerName) {
        if (this.players.length < 20 && !this.players.includes(playerName)) {
            this.players.push(playerName);
            return true;
        }
        console.warn(`Failed to add player ${playerName} to game ${this.id}`);
        return false;
    }

    removePlayer(playerName) {
        const index = this.players.indexOf(playerName);
        if (index !== -1) {
            this.players.splice(index, 1);
            console.log(`Player ${playerName} removed from game ${this.id}`);
            return true;
        }
        console.warn(`Player ${playerName} not found in game ${this.id}`);
        return false;
    }

    startGame() {
        if (this.players.length >= 2 && !this.started) {
            this.started = true;
            console.log(`Game ${this.id} started`);
            return true;
        }
        console.warn(`Cannot start game ${this.id}, not enough players`);
        return false;
    }

    isPlayersEmpty() {
        return this.players.length === 0;
    }

    drawCard() {
        const card = this.deck.draw();
        if (card) {
            this.cardsOnTable.push(card);
            this.turn += 1;
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            console.log(`Card ${card.suit} ${card.value} drawn in game ${this.id}`);
            return card;
        }
        console.warn(`No card drawn in game ${this.id}`);
        return null;
    }

    updateCursor(playerName, x, y) {
        this.playerCursors[playerName] = [x, y];
    }

    toDict() {
        return {
            id: this.id,
            players: this.players,
            started: this.started,
            currentPlayer: this.players[this.currentPlayerIndex],
            cardsOnTable: this.cardsOnTable.map(card => card.toDict()),
            deckCount: this.deck.cards.length,
            targetAmount: this.targetAmount,
            turn: this.turn
        };
    }
}

module.exports = { Cursor, PlayerCursors, Card, Deck, Game };