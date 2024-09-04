/// main.js
import { getDeck, cardEvents } from './cards.js';
import { gaussianRandom } from './utilities.js';

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
let targetAmount = Math.max(gaussianRandom(20, 6, 5)); // Picks a random number of cards that the can will burst at
let turn = 0;

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

    console.log(`random amount is: ${targetAmount}`);

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
            cards = await Promise.all(data.deck.map(async (card, i) => {
                const img = new Image();
                const suit = card.suit.toLowerCase().charAt(0);
                const value = card.value.toString().padStart(2, '0');
                img.src = `static/assets/${suit}${value}.png`;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = () => {
                        console.error(`Failed to load image: ${img.src}`);
                        resolve();
                    };
                });
                return {
                    id: i,
                    x: canvas.width / 2 + Math.cos(i * angleStep) * radius,
                    y: canvas.height / 2 + Math.sin(i * angleStep) * radius,
                    angle: angleStep,
                    revealed: false,
                    value: card.value,
                    suit: card.suit,
                    size: 1,
                    zIndex: i,
                    image: img
                };
            }));
            dealt = true;
            console.log(cards);
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
        const cardWidth = card.size * 50;
        const cardHeight = card.size * 75;
        
        ctx.save();
        ctx.translate(card.x, card.y);
        // ctx.rotate(card.angle);
        
        if (card.revealed) {
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
                revealCard(cardId); // Pass card ID to revealCard
                enlargedCard = originalCard;
            }
            addKeyListenerToShrinkCard();
            animatingCard = null;
            busy = false;
        }
    }


    requestAnimationFrame(animate);
}

function addKeyListenerToShrinkCard() {
    document.addEventListener('keydown', shrinkCard, { once: true });
    document.addEventListener('click', shrinkCard, { once: true });
}

function shrinkCard(event) {

    if (enlargedCard) {
        enlargedCard.size = 1; // Reset to original size
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length; 

        turn++;
        if (turn === targetAmount) {
            openCan();
        }

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
    targetAmount = Math.max(gaussianRandom(20, 6, 5));
    console.log(`random amount is: ${targetAmount}`);
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