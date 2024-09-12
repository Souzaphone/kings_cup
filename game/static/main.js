/// main.js
import { cardEvents } from './cards.js';

// TODO: implement events for each individual card
// have it so only cards that when a card is being animated it is not flashing
let canvas, ctx;
let cards = [];
let currentPlayerIndex = 0;
let players = [];
let canRadius = 30;
let cardWidth = 50;
let cardHeight = 75;
let canImage;
let animatingCard = null;
let dealt = false;
let busy = false;
let nextZIndex = 52;
let hoveredCardIndex = null; // To keep track of which card is being hovered
let pulseOpacity = 0;
let pulseDirection = 1;
let enlargedCard = null;
let targetAmount = 5; // Picks a random number of cards that the can will burst at
let turn = 0;
let gameId = null;
let socket;
let client = null;
let clicked = false;
let gameState = null;


// Initialize the game
async function init_index() {


    socket = io();

    socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
    });

    socket.on('connect', () => {
        console.log('Socket.IO connected');
    });

    document.getElementById('create-game-btn').addEventListener('click', createGame);
    document.getElementById('join-game-btn').addEventListener('click', handleJoinGameClick);

    document.getElementById('player-name').addEventListener('input', updateJoinButtonState);
    document.getElementById('game-id').addEventListener('input', updateJoinButtonState);
}

async function init_game() {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
    } else {
        console.error('Canvas element not found');
        return; // Exit the function if canvas is not found
    }

    
    canImage = new Image();
    canImage.src = 'static/assets/can.png'; 
    canImage.onload = drawTable;

    canImage.onerror = function() {
        console.error('Failed to load image at ' + canImage.src);
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    updateStartButtonState();

    // await resetGameState();

    document.getElementById('start-game-btn').addEventListener('click', handleStartGame);
    document.getElementById('reset-btn').addEventListener('click', resetGameState);
    document.getElementById('copy-game-id-btn').addEventListener('click', copyGameId);
    document.getElementById('leave-btn').addEventListener('click', leaveGame);

    if (gameState) {
        updateGameState(gameState);
    } else {
        get_game_state()
    }

    gameId = sessionStorage.getItem('gameId');
    client = sessionStorage.getItem('client');

    socket = io();

    socket.on('connect', () => {
        console.log('Socket.IO connected');
        socket.emit('join', {game_id: gameId, player_name: client});
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
    });

    socket.on('player_joined', handlePlayerJoined);
    socket.on('game_started', handleGameStarted);
    socket.on('card_drawn', handleCardDrawn);
    socket.on('game_over', handleGameOver);
    socket.on('card_clicked', handleCardClick);
    socket.on('player_left', handlePlayerLeft);
    socket.on('game_reset', handleReset);

    animatePulse();
    requestAnimationFrame(animatePulse);
}

function get_game_state() {

    console.log(`Game id in get_game_state ${gameId}`);

    fetch('/get_game_state', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({game_id: gameId, player_name: client})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateGameState(data.game);
        }
    });
}

function createGame() {
    client = document.getElementById('player-name').value;
    if (client) {
        fetch('/create_game', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    gameId = data.game_id;
                    console.log(`Game ID: ${gameId}`)
                    targetAmount = data.target_amount
                    console.log(`random amount is: ${targetAmount}`);
                    joinGame();
                }
            });
    }
}

function leaveGame() {
    if (gameId && client) {
        fetch('/leave_game', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({game_id: gameId, player_name: client})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                socket.emit('leave', {game_id: gameId, player_name: client});
                window.location.href = '/';
            }
        });
    }
}

function joinGame() {
    console.log(`Joining game with ID: ${gameId}`);
    
    if (gameId && client) {
        fetch('/join_game', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({game_id: gameId, player_name: client})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {

                console.log(`gameId: ${gameId}, client: ${client}`);
                gameState = data.game;

                console.log(gameState);

                sessionStorage.setItem('gameId', gameId);
                sessionStorage.setItem('client', client);

                window.location.href = `/game`;

                socket.emit('join', {game_id: gameId, player_name: client});
            }
        });
    } else {
        alert('Please enter your player name.');
    }
}

function updateGameState(game) {
    players = game.players;

    console.log(`players: ${players}`);

    targetAmount = game.target_amount;
    drawTable();
}

function handleJoinGameClick() {
    gameId = document.getElementById('game-id').value;
    client = document.getElementById('player-name').value;
    if (gameId) {
        joinGame();
    } else {
        alert('Please enter a Game ID.');
    }
}

function handlePlayerLeft(data) {
    players = data.players;
    updateStartButtonState;
    drawTable();
}

function handlePlayerJoined(data) {

    console.log(`Inside of handlePlayerJoined`);

    players = data.players;
    updateStartButtonState();
    drawTable();
}

function handleStartGame() {
    socket.emit('start_game', {game_id: gameId, player_name: client});
}

async function handleGameStarted(gameState) {
    // updateGameState(gameState);
    await initializeDeck();
    dealt = true;
    drawTable();
}

function updateJoinButtonState() {
    const playerName = document.getElementById('player-name').value.trim();
    const inputGameId = document.getElementById('game-id').value.trim();
    const joinButton = document.getElementById('join-game-btn');
    joinButton.disabled = !inputGameId && !playerName;
}

function updateStartButtonState() {
    const startButton = document.getElementById('start-game-btn');

    console.log(players.length < 2);

    startButton.disabled = players.length < 2; // Enable button only if there are at least 2 players
}

async function initializeDeck() {

    console.log(`inside initialize deck game id: ${gameId}`);

    const response = await fetch('/return_deck', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({game_id: gameId})
    });
    const data = await response.json();

    if (data.success) {
        cards = data.deck.map((card, i) => {
            const img = new Image();
            img.src = `data:image/png;base64,${card.image_data}`;
            return {
                id: i,
                x: canvas.width / 2 + Math.cos(i * (2 * Math.PI / 52)) * 150,
                y: canvas.height / 2 + Math.sin(i * (2 * Math.PI / 52)) * 150,
                angle: i * (2 * Math.PI / 52),
                revealed: false,
                value: card.value,
                suit: card.suit,
                size: 1,
                zIndex: i,
                image: img
            };
        });
        dealt = true;
        console.log(cards);
        drawTable();
    } else {
        console.error('Failed to initialize deck');
    }

}

function drawTable() {

    if (!ctx) {
        console.error('Canvas context is not initialized');
        return; // Exit the function if ctx is not initialized
    }

    // Draw table
    ctx.fillStyle = '#008000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw can
    if (canImage.complete) {
        ctx.drawImage(canImage, canvas.width / 2 - canRadius, canvas.height / 2 - canRadius, canRadius * 2, canRadius * 2);
    }

    // Draw cards
    cards.sort((a, b) => a.zIndex - b.zIndex);
    cards.forEach((card, index) => {
        const cardWidth = card.size * 50;
        const cardHeight = card.size * 75;
        
        ctx.save();
        ctx.translate(card.x, card.y);
        // ctx.rotate(card.angle);
        
        if (card.revealed && card.image.complete) {
            ctx.drawImage(card.image, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        } else {
            // Draw card back
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        }

        if (index === hoveredCardIndex) {
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
            ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        }

        ctx.restore();
    });

    // Draw player information
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText(`Current Player: ${players[currentPlayerIndex] || 'Waiting for players...'}`, 20, 30);

    const copyBtn = document.getElementById('copy-game-id-btn');
    const copyStatus = document.getElementById('copy-status');
    
    // Set positions relative to the canvas or other UI elements if necessary
    copyBtn.style.position = 'absolute';
    copyBtn.style.top = `${canvas.offsetTop + 80}px`; // Adjust to desired position
    copyBtn.style.left = `${canvas.offsetLeft + 20}px`;

    copyStatus.style.position = 'absolute';
    copyStatus.style.top = `${canvas.offsetTop + 110}px`; // Adjust to desired position
    copyStatus.style.left = `${canvas.offsetLeft + 20}px`;

    // Draw player board
    const boardWidth = 200;
    const boardHeight = 300;
    const boardX = canvas.width - boardWidth - 20;
    const boardY = 20;

    ctx.fillStyle = '#333333'; 
    ctx.fillRect(boardX, boardY, boardWidth, boardHeight);

    ctx.strokeStyle = '#FFFFFF'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(boardX, boardY, boardWidth, boardHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';

    ctx.fillText('Players:', boardX + 10, boardY + 20);

    players.forEach((player, index) => {
        ctx.fillText(player, boardX + 10, boardY + 40 + (index * 20));
    });
}


// need to have a universal player data storage, either in python or js
// Performs action of game when clicking on a card
// TODO: Need to fix this and get actual good hitbox detection
function handleCanvasClick(event) {
    if (busy || !dealt || players[currentPlayerIndex] !== client) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check for the topmost card
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        
        const cardLeft = card.x - cardWidth / 2;
        const cardRight = card.x + cardWidth / 2;
        const cardTop = card.y - cardHeight / 2;
        const cardBottom = card.y + cardHeight / 2;

        if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
            console.log(`Clicked on card id: ${card.id}, value: (${card.value})`);
            
            if (!card.revealed) {
                busy = true;
                socket.emit('draw_card', {game_id: gameId, player_name: client, card: card.id});
            }
            return; 
        }
    }
}

function handleCardDrawn(data) {
    const card = cards.find(c => c.id === data.card);
    if (card) {
        busy = true;
        card.revealed = true;
        card.zIndex = nextZIndex++;
        animateCard(card.id);
        drawTable();
    }
}

function handleGameOver(data) {
    alert(data.message);
    resetGameState();
}

function animateCard(cardId) {
    // Find the card by its unique ID
    const card = cards.find(c => c.id === cardId);
    if (!card) {
        console.error(`Card with ID ${cardId} not found.`);
        return;
    }

    animatingCard = { ...card };  // Use a cloned object to prevent shared state issues

    const targetX = canvas.width / 2;
    const targetY = canvas.height / 2;
    const animationDuration = 1000; // Duration in milliseconds
    const startTime = performance.now();
    const startX = animatingCard.x;
    const startY = animatingCard.y;
    const startSize = animatingCard.size;


    function animate(time) {
        if (animatingCard.id !== cardId) {
            console.error(`Animating card changed from ID ${cardId}.`);
            return; // Abort animation if the card object changes
        }

        const elapsedTime = time - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        // Linear interpolation for position
        animatingCard.x = startX + (targetX - startX) * progress;
        animatingCard.y = startY + (targetY - startY) * progress;

        // Ease-out effect for scaling
        animatingCard.size = startSize + progress * 9; // Adjust size increment for scaling effect

        // Update the actual card in the cards array
        const originalCard = cards.find(c => c.id === cardId);
        if (originalCard) {
            originalCard.x = animatingCard.x;
            originalCard.y = animatingCard.y;
            originalCard.size = animatingCard.size;
        }

        drawTable();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Finalize the card position and size
            if (originalCard) {
                originalCard.x = animatingCard.x;
                originalCard.y = animatingCard.y;
                revealCard(cardId); // Pass card ID to revealCard
                enlargedCard = originalCard;
            }
            addKeyListenerToShrinkCard();
            animatingCard = null;
        }
    }


    requestAnimationFrame(animate);
}

function addKeyListenerToShrinkCard() {
    document.addEventListener('keydown', shrinkCard, { once: true });
    document.addEventListener('click', shrinkCard, { once: true });
}

// this is for every user except the one who clicked the card
function handleCardClick(data) {
    if (!clicked) {
    
        enlargedCard.size = 1; // Reset to original size

        console.log(`Turn: ${turn}, Target: ${targetAmount} inside of handleclick`);

        turn++;
        if (turn === targetAmount) {
            openCan();
        }

        currentPlayerIndex = (currentPlayerIndex + 1) % players.length; 

        drawTable();
        enlargedCard = null;

        document.removeEventListener('keydown', shrinkCard);
        document.removeEventListener('click', shrinkCard);
    }
    clicked = false;
    busy = false;
}

// this is for the user that clicked the card
function shrinkCard(event) {

    if (enlargedCard && players[currentPlayerIndex] === client) {
        clicked = true
        socket.emit('card_click', {game_id: gameId, player_name: client}); // need to make sure this gets to every player
        enlargedCard.size = 1; // Reset to original size

        turn++;

        console.log(`Turn: ${turn}, Target: ${targetAmount}`);

        if (turn === targetAmount) {
            openCan();
        }

        currentPlayerIndex = (currentPlayerIndex + 1) % players.length; 

        drawTable();
        enlargedCard = null;


        document.removeEventListener('keydown', shrinkCard);
        document.removeEventListener('click', shrinkCard);
    }
}

function openCan(){
    const currentPlayer = players[currentPlayerIndex];
            
    // Create and show the pop-up message
    const popUp = document.createElement('div');
    popUp.style.position = 'fixed';
    popUp.style.top = '50%';
    popUp.style.left = '50%';
    popUp.style.transform = 'translate(-50%, -50%)';
    popUp.style.background = 'white';
    popUp.style.padding = '20px';
    popUp.style.border = '2px solid black';
    popUp.style.zIndex = '1000';
    popUp.innerHTML = `<h2>${currentPlayer} opened the beer!</h2>`;
    
    document.body.appendChild(popUp);

    // Remove the pop-up after 3 seconds
    setTimeout(() => {
        document.body.removeChild(popUp);
    }, 3000);

    // Remove all revealed cards
    cards = cards.filter(card => !card.revealed);

    // Reset the game state
    turn = 0;

}


function revealCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (card) {
        card.revealed = true;
        const eventFunction = cardEvents[card.value] || cardEvents["default"];
        eventFunction();
        drawTable();
    }
}

function handleMouseMove(event) {
    if (busy || !dealt) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if mouse is over any card
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        
        const cardLeft = card.x - cardWidth / 2;
        const cardRight = card.x + cardWidth / 2;
        const cardTop = card.y - cardHeight / 2;
        const cardBottom = card.y + cardHeight / 2;

        if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
            hoveredCardIndex = i;
            pulseOpacity = Math.min(pulseOpacity + 0.05, 1);
            drawTable();
            return;
        }
    }

    hoveredCardIndex = null;
    pulseOpacity = Math.max(pulseOpacity - 0.05, 0);
    drawTable();
}

function animatePulse() {

    if (pulseOpacity <= 0 || pulseOpacity >= 1) {
        pulseDirection *= -1;
    }

    pulseOpacity += pulseDirection * 0.005;
    pulseOpacity = Math.min(Math.max(pulseOpacity, 0), 1);

    drawTable();
    
    requestAnimationFrame(animatePulse);
}

// Copy game ID to clipboard
function copyGameId() {

    console.log(`inside of copy. Game ID ${gameId}`);

    if (gameId) {
        console.log(`gameid exists`);
        navigator.clipboard.writeText(gameId).then(() => {
            // Show feedback message
            const copyStatus = document.getElementById('copy-status');
            copyStatus.style.display = 'block';
            setTimeout(() => copyStatus.style.display = 'none', 2000); // Hide after 2 seconds
        }).catch(err => {
            console.error('Failed to copy game ID:', err);
        });
    }
}

function handleReset(data) {
    // Clear local state
    cards = [];
    currentPlayerIndex = 0;
    dealt = false;
    updateStartButtonState();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTable(); 
}

// there is probably an error in here
async function resetGameState() {

    console.log(`inside reset`);

    try {
        // Clear server-side state
        const response = await fetch('/reset_game', { 
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ game_id: gameId })
        });

        const data = await response.json();

        if (data.success) {

            console.log(`data in reset ${data}`);
            socket.emit('reset', {game_id: gameId});
        } else {
            console.error('Failed to reset game state:', data.message);
        }
    } catch (error) {
        console.error('Error resetting game state:', error);
    }
}

// Initialize the game when the page loads
if (window.location.pathname === '/') {
    window.onload = init_index;
}

if (window.location.pathname === '/game') {
    gameId = sessionStorage.getItem('gameId');
    client = sessionStorage.getItem('client');
    window.onload = init_game;
    console.log(`type of ctx:  ${typeof ctx}`);
}