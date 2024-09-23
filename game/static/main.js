/// main.js
import { cardEvents } from './cards.js';
import { lerp, easeInOutCubic } from './utilities.js';

// TODO: implement events for each individual card
// have it so only cards that when a card is being animated it is not flashing
let canvas, ctx;
let cursorCanvas, cursorCtx;
let cards = [];
let currentPlayerIndex = 0;
let players = [];
let canRadius = 30;
let cardWidth = 50;
let cardHeight = 75;
let canImage;
let cursorImage;
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
let imagesLoaded = 0;
let totalImages = 1;
let playerCursors = {};
const NORMALIZED_WIDTH = 1000;
const NORMALIZED_HEIGHT = 1000;
const ANIMATION_DURATION = 200;
let lastSentTime = 0;
const THROTTLE_INTERVAL = 50;


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
    } else {
        console.error('Canvas element not found');
        return; // Exit the function if canvas is not found
    }

    setupCursorCanvas();
    resizeCanvas();

    canImage = new Image();
    canImage.src = 'static/assets/can.png'; 
    cursorImage = new Image();
    cursorImage.src = 'static/assets/opponent.png';
    canImage.onload = function() {
        imagesLoaded++;
        checkAllImagesLoaded();
    };

    canImage.onerror = function() {
        console.error('Failed to load image at ' + canImage.src);
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    updateStartButtonState();

    window.addEventListener('load', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('beforeunload', handleLeavePage);
    // await resetGameState();

    document.getElementById('start-game-btn').addEventListener('click', handleStartGame);
    document.getElementById('reset-btn').addEventListener('click', resetGameState);
    document.getElementById('copy-game-id-btn').addEventListener('click', copyGameId);
    document.getElementById('leave-btn').addEventListener('click', () => {
        isLeavingIntentionally = true;
        leaveGame();
    });

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
    socket.on('cursor_update', handleCursors);

    animatePulse();
    requestAnimationFrame(animatePulse);
    requestAnimationFrame(gameLoop);
    requestAnimationFrame(drawPlayers);
}

function setupCursorCanvas() {
    cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = canvas.width;
    cursorCanvas.height = canvas.height;
    cursorCanvas.style.position = 'absolute';
    cursorCanvas.style.left = canvas.offsetLeft + 'px';
    cursorCanvas.style.top = canvas.offsetTop + 'px';
    cursorCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    document.body.appendChild(cursorCanvas);
    cursorCtx = cursorCanvas.getContext('2d');
}

function gameLoop() {
    updatePlayerPositions();
    drawPlayers();
    requestAnimationFrame(gameLoop);
}

function checkAllImagesLoaded() {
    if (imagesLoaded === totalImages) {
        drawTable();
    }
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
    isLeavingIntentionally = true;
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
    const createGameButton = document.getElementById('create-game-btn');
    createGameButton.disabled = !playerName;
    joinButton.disabled = !(inputGameId && playerName);
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
        totalImages += data.deck.length;
        cards = data.deck.map((card, i) => {
            const img = new Image();
            img.src = card.imageData;
            img.onload = function() {
                imagesLoaded++;
                checkAllImagesLoaded();
            };
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
    } else {
        console.error('Failed to initialize deck');
    }

}

function resizeCanvas() {
    // Set canvas size to full window size
    const header = document.querySelector('.header');
    const headerHeight = header.offsetHeight;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Adjust canvas style to cover the whole screen
    canvas.style.position = 'fixed';
    canvas.style.top = `${headerHeight}px`;
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    //Recalculate card positions
    if (cards.length > 0) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        cards.forEach((card) => {
            if (card.revealed) {
                card.x = centerX;
                card.y = centerY;
            }
            else {
                card.x = centerX + Math.cos(card.id * (2 * Math.PI / 52)) * 150;
                card.y = centerY + Math.sin(card.id * (2 * Math.PI / 52)) * 150;
            }
        });
    }

    cursorCanvas.width = canvas.width;
    cursorCanvas.height = canvas.height;
    cursorCanvas.style.left = canvas.offsetLeft + 'px';
    cursorCanvas.style.top = canvas.offsetTop + 'px';

    drawTable();
}

function drawPlayers() {
    // Implement logic to draw player cursors
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    Object.keys(playerCursors).forEach(player_name => {
        if (player_name !== client) {
            const { interpolatedX, interpolatedY } = playerCursors[player_name];
            drawCursor(interpolatedX, interpolatedY, player_name, 'red');
        }
    });
}

// use this during animations so it doesn't need to redraw the entire table
function drawCards() {

    if (!ctx || imagesLoaded !== totalImages) {
        console.error('Canvas context is not initialized');
        return; // Exit the function if ctx is not initialized
    }

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
}

function drawTable() {
    if (!ctx || imagesLoaded !== totalImages) {
        console.error('Canvas context is not initialized');
        return; // Exit the function if ctx is not initialized
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw table
    ctx.fillStyle = '#008000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw can
    if (canImage.complete) {
        const canX = canvas.width / 2 - canRadius;
        const canY = canvas.height / 2 - canRadius;
        ctx.drawImage(canImage, canX, canY, canRadius * 2, canRadius * 2);
    }

    // Draw cards
    drawCards();

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    // Check for the topmost card
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        
        const cardLeft = card.x - (cardWidth * card.size) / 2;
        const cardRight = card.x + (cardWidth * card.size) / 2;
        const cardTop = card.y - (cardHeight * card.size) / 2;
        const cardBottom = card.y + (cardHeight * card.size) / 2;

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


function handleGameOver(data) {
    alert(data.message);
    resetGameState();
}

function handleCardDrawn(data) {
    // Find the card by its unique ID
    const card = cards.find(c => c.id === data.card);
    if (!card) {
        console.error(`Card with ID ${card.id} not found.`);
        return;
    }

    busy = true;
    card.revealed = true;
    card.zIndex = nextZIndex++;

    animatingCard = { ...card };  // Use a cloned object to prevent shared state issues

    const targetX = canvas.width / 2;
    const targetY = canvas.height / 2;
    const animationDuration = 1000; // Duration in milliseconds
    const startTime = performance.now();
    const startX = animatingCard.x;
    const startY = animatingCard.y;
    const startSize = animatingCard.size;


    function animate(time) {
        if (animatingCard.id !== card.id) {
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
        const originalCard = cards.find(c => c.id === card.id);
        if (originalCard) {
            originalCard.x = animatingCard.x;
            originalCard.y = animatingCard.y;
            originalCard.size = animatingCard.size;
        }

        drawCards();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Finalize the card position and size
            if (originalCard) {
                originalCard.x = animatingCard.x;
                originalCard.y = animatingCard.y;
                const eventFunction = cardEvents[card.value] || cardEvents["default"];
                eventFunction(data.player);
                enlargedCard = originalCard;
            }
            addKeyListenerToShrinkCard();
            animatingCard = null;
        }
    }
    requestAnimationFrame(animate);
    drawCards();
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

        drawCards();
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

        drawCards();
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

function handleCursors(data) {
    const cursors = data.cursors;
    const currentTime = Date.now();

    cursors.forEach(cursor => {
        if (cursor.player_name === client) {
            return;  
        }

        const screenCoords = fromNormalizedCoords(cursor.x, cursor.y, canvas.width, canvas.height);

        if (!playerCursors[cursor.player_name]) {
            playerCursors[cursor.player_name] = { 
                x: screenCoords.x, 
                y: screenCoords.y, 
                lastX: screenCoords.x, 
                lastY: screenCoords.y, 
                interpolatedX: screenCoords.x,
                interpolatedY: screenCoords.y,
                animationStartTime: null 
            };
        } else {

            const existingCursor = playerCursors[cursor.player_name];
            
            // Always update the target and start a new animation
            existingCursor.startX = existingCursor.interpolatedX;
            existingCursor.startY = existingCursor.interpolatedY;
            existingCursor.targetX = screenCoords.x;
            existingCursor.targetY = screenCoords.y;
            existingCursor.animationStartTime = currentTime;
        }
    });
}

function updatePlayerPositions() {
    const currentTime = Date.now();
    Object.keys(playerCursors).forEach(player_name => {
        const cursor = playerCursors[player_name];

        if (cursor.lastUpdateTime) {
            const elapsedTime = currentTime - cursor.animationStartTime;
            const t = Math.min(elapsedTime / ANIMATION_DURATION, 1);

            const easeT = easeInOutCubic(t);

            // Interpolate position
            cursor.interpolatedX = lerp(cursor.startX, cursor.targetX, easeT);
            cursor.interpolatedY = lerp(cursor.startY, cursor.targetY, easeT);

            if (t === 1) {
                cursor.startX = cursor.targetX;
                cursor.startY = cursor.targetY;
                cursor.animationStartTime = null;
            }
        } else {
            // If no animation is in progress, set interpolated position to target
            cursor.interpolatedX = cursor.targetX;
            cursor.interpolatedY = cursor.targetY;
        }
    });
}

function drawCursor(x, y, playerName, color) {

    if (cursorImage.complete) {
        // Draw the image
        cursorCtx.drawImage(cursorImage, x - cursorImage.width / 2, y - cursorImage.height / 2);
    } else {
        // If the image hasn't loaded yet, draw a fallback circle
        cursorCtx.beginPath();
        cursorCtx.arc(x, y, 5, 0, 2 * Math.PI);
        cursorCtx.fillStyle = color;
        cursorCtx.fill();
    }
    
    // Draw the player name
    cursorCtx.font = '12px Arial';
    cursorCtx.fillStyle = '#FFFFFF';
    cursorCtx.textAlign = 'center';
    cursorCtx.fillText(playerName, x, y - cursorImage.height / 2 - 5);
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;


    const raw_x = event.clientX - rect.left;
    const raw_y = event.clientY - rect.top;

    const normalizedCoords = toNormalizedCoords(raw_x, raw_y, canvas.width, canvas.height);

    const currentTime = Date.now();
    if (currentTime - lastSentTime >= THROTTLE_INTERVAL) {
        lastSentTime = currentTime;
        socket.emit('mouse_move', {game_id: gameId, player_name: client, x: normalizedCoords.x, y: normalizedCoords.y});
    }
    if (busy || !dealt) {
        return;
    }

    // Check if mouse is over any card
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        
        const cardLeft = card.x - (cardWidth * card.size) / 2;
        const cardRight = card.x + (cardWidth * card.size) / 2;
        const cardTop = card.y - (cardHeight * card.size) / 2;
        const cardBottom = card.y + (cardHeight * card.size) / 2;

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

function handleLeavePage(event) {
    if (!isLeavingIntentionally && gameId && client) {
        // Cancel the event as per the standard
        event.preventDefault();
        // Chrome requires returnValue to be set
        event.returnValue = '';

        // Attempt to leave the game
        leaveGame();
    }
}

// Function to convert screen coordinates to normalized coordinates
function toNormalizedCoords(x, y, canvasWidth, canvasHeight) {
    return {
        x: (x / canvasWidth) * NORMALIZED_WIDTH,
        y: (y / canvasHeight) * NORMALIZED_HEIGHT
    };
}

// Function to convert normalized coordinates back to screen coordinates
function fromNormalizedCoords(nx, ny, canvasWidth, canvasHeight) {
    return {
        x: (nx / NORMALIZED_WIDTH) * canvasWidth,
        y: (ny / NORMALIZED_HEIGHT) * canvasHeight
    };
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
    window.addEventListener('load', () => {
        gameId = sessionStorage.getItem('gameId');
        client = sessionStorage.getItem('client');
        init_game();
    });
}