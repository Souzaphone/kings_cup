/// main.js
import { getDeck } from './cards.js';

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
let nextZIndex = 1;
let hoveredCardIndex = null; // To keep track of which card is being hovered
let pulseOpacity = 0;
let pulseDirection = 1;

// Initialize the game
async function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    
    canImage = new Image();
    canImage.src = 'static/assets/can.png'; 
    canImage.onload = drawTable;

    canImage.onerror = function() {
        console.error('Failed to load image at ' + canImage.src);

    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    updateStartButtonState();

    await resetGameState();


    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('add-player-btn').addEventListener('click', addPlayer);
    document.getElementById('reset-btn').addEventListener('click', resetGameState);

    animatePulse();

    requestAnimationFrame(animatePulse);
}

function updateStartButtonState() {
    const startButton = document.getElementById('start-btn');

    console.log(players.length < 2);

    startButton.disabled = players.length < 2; // Enable button only if there are at least 2 players
}

async function startGame() {
    if (players.length >= 2) {
        const angleStep = (2 * Math.PI) / 52;
        const radius = 150;

        const data = await getDeck();

        if (data && data.success) {
            cards = data.deck.map((card, i) => ({
                id: i,
                x: canvas.width / 2 + Math.cos(i * angleStep) * radius,
                y: canvas.height / 2 + Math.sin(i * angleStep) * radius,
                angle: angleStep,
                revealed: false,
                value: card.value,
                suit: card.suit,
                size: 1,
                zIndex: i
            }));
            dealt = true;
            drawTable();
        } else {
            console.error('Failed to initialize deck');
        }
    }
}

function drawTable() {
    // Draw table
    ctx.fillStyle = '#008000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw can
    ctx.drawImage(canImage, canvas.width / 2 - canRadius, canvas.height / 2 - canRadius, canRadius * 2, canRadius * 2);

    // Draw cards
    cards.sort((a, b) => a.zIndex - b.zIndex);
    cards.forEach((card, index) => {
        ctx.fillStyle = card.revealed ? '#FFFFFF' : '#FF0000';
        const cardWidth = card.size * 50; // Scale width by size
        const cardHeight = card.size * 75; // Scale height by size
        ctx.fillRect(card.x - cardWidth / 2, card.y - cardHeight / 2, cardWidth, cardHeight);

        // Draw border around card
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = 2; 
        ctx.strokeRect(card.x - cardWidth / 2, card.y - cardHeight / 2, cardWidth, cardHeight);

        if (card.revealed) {
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.fillText(card.value, card.x - cardWidth / 4, card.y);
        }

        if (index === hoveredCardIndex) {
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`; // Pulsing white overlay
            ctx.fillRect(card.x - cardWidth / 2, card.y - cardHeight / 2, cardWidth, cardHeight);
        }
    });

    // Draw player information
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText(`Current Player: ${players[currentPlayerIndex] || 'Waiting for players...'}`, 20, 30);

    // Draw player board
    const boardWidth = 200;
    const boardHeight = 100;
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

// Performs action of game when clicking on a card
// TODO: Need to fix this and get actual good hitbox detection
function handleCanvasClick(event) {
    if (busy || !dealt) {
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
                card.zIndex = nextZIndex++;
                animateCard(card.id); 
            }
            return; 
        }
    }
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
                originalCard.size = startSize;
                revealCard(cardId); // Pass card ID to revealCard
            }
            animatingCard = null;
            busy = false;
        }
    }

    requestAnimationFrame(animate);
}

function revealCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (card) {
        card.revealed = true;
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

function addPlayer() {
    const playerName = document.getElementById('player-name').value;
    if (playerName && !players.includes(playerName)) {
        fetch('/add_player', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: playerName})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                players = data.players;
                updateStartButtonState();   
                drawTable();   
            } else {
                alert(data.message);
            }
        });
    }
}

// there is probably an error in here
async function resetGameState() {
    try {
        // Clear server-side state
        const response = await fetch('/reset_game', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            // Clear local state
            cards = [];
            players = [];
            currentPlayerIndex = 0;
            dealt = false;
            updateStartButtonState();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawTable(); 

        } else {
            console.error('Failed to reset game state:', data.message);
        }
    } catch (error) {
        console.error('Error resetting game state:', error);
    }
}

// Initialize the game when the page loads
window.onload = init;