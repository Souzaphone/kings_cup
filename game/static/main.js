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
    updateStartButtonState();

    await resetGameState();

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
        } 
        else {
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
        ctx.fillRect(card.x - cardWidth / 2, card.y - cardHeight / 2, cardWidth, cardHeight);

        // Draw border around card
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = 2; 
        ctx.strokeRect(card.x - cardWidth / 2, card.y - cardHeight / 2, cardWidth, cardHeight);

        if (card.revealed) {
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.fillText(card.value, card.x - 20, card.y);
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

// preforms action of game when clicking on a card
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
        
        // Calculate card's bounding box
        const cardLeft = card.x - cardWidth / 2;
        const cardRight = card.x + cardWidth / 2;
        const cardTop = card.y - cardHeight / 2;
        const cardBottom = card.y + cardHeight / 2;

        // Check if the click is within the card's bounding box
        if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
            // Only check if the card is not revealed
            if (!card.revealed) {
                busy = true;
                card.zIndex = nextZIndex++;
                animateCard(i); 
            }
            return; 
        }
    }
}

// Animate a card moving towards the center and growing in size
function animateCard(index) {
    animatingCard = cards[index];
    const targetX = canvas.width / 2;
    const targetY = canvas.height / 2;
    const animationDuration = 1000; 
    const startTime = performance.now();
    const startX = animatingCard.x;
    const startY = animatingCard.y;

    function animate(time) {
        const elapsedTime = time - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        // Linear interpolation for position
        animatingCard.x = startX + (targetX - startX) * progress;
        animatingCard.y = startY + (targetY - startY) * progress;

        // Ease-out effect for scaling
        // TODO: Actually get this working
        animatingCard.size = 1 + progress * 2; 

        drawTable();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            revealCard(index); 
            animatingCard = null;
            busy = false;
        }
    }

    requestAnimationFrame(animate);
}

// Reveal a card
// TODO: figure out how to get rid of this as I don't think it is needed
function revealCard(index) {
    if (players.length > 0 && !cards[index].revealed) {
        cards[index].revealed = true;
        drawTable();
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
}

// Add a new player
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

// retrieve the deck
async function getDeck() {
    try {
        const response = await fetch('/return_deck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (data.success) {
            console.log(data);
            return data;
        } else {
            alert(data.message);
            dealt = true;
        }
    } catch (error) {
        console.error('Error fetching card:', error);
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

