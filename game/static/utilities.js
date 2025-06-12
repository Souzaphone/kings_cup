// utilities.js

// Standard Normal variate using Box-Muller transform.
export function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return Math.round(z * stdev + mean);
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// UI Helper Functions for Card Events

export function createPopup(content, duration = 3000, buttons = null) {
    const popup = document.createElement('div');
    popup.className = 'card-event-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = 'rgba(0, 0, 0, 0.9)';
    popup.style.color = 'white';
    popup.style.padding = '30px';
    popup.style.border = '3px solid #FFD700';
    popup.style.borderRadius = '15px';
    popup.style.zIndex = '1000';
    popup.style.textAlign = 'center';
    popup.style.maxWidth = '400px';
    popup.style.minWidth = '300px';
    popup.innerHTML = `<h2 style="margin-top: 0; color: #FFD700;">${content}</h2>`;
    
    if (buttons) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.style.margin = '5px';
            btn.style.padding = '10px 20px';
            btn.style.background = '#4CAF50';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '5px';
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                button.callback();
                document.body.removeChild(popup);
            };
            buttonContainer.appendChild(btn);
        });
        
        popup.appendChild(buttonContainer);
    }
    
    document.body.appendChild(popup);

    if (duration > 0) {
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, duration);
    }
    
    return popup;
}

export function createPlayerSelector(players, excludePlayer, callback) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '1001';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const selector = document.createElement('div');
    selector.style.background = 'white';
    selector.style.padding = '30px';
    selector.style.borderRadius = '15px';
    selector.style.textAlign = 'center';
    selector.innerHTML = '<h2 style="margin-top: 0;">Choose a Player</h2>';

    const availablePlayers = players.filter(player => player !== excludePlayer);
    
    availablePlayers.forEach(player => {
        const playerBtn = document.createElement('button');
        playerBtn.textContent = player;
        playerBtn.style.display = 'block';
        playerBtn.style.width = '200px';
        playerBtn.style.margin = '10px auto';
        playerBtn.style.padding = '15px';
        playerBtn.style.background = '#FF6B6B';
        playerBtn.style.color = 'white';
        playerBtn.style.border = 'none';
        playerBtn.style.borderRadius = '8px';
        playerBtn.style.cursor = 'pointer';
        playerBtn.style.fontSize = '16px';
        
        playerBtn.onclick = () => {
            callback(player);
            document.body.removeChild(overlay);
        };
        
        selector.appendChild(playerBtn);
    });

    overlay.appendChild(selector);
    document.body.appendChild(overlay);
    
    return overlay;
}

export function createTextInput(prompt, callback, timeout = 30000) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '1001';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const inputBox = document.createElement('div');
    inputBox.style.background = 'white';
    inputBox.style.padding = '30px';
    inputBox.style.borderRadius = '15px';
    inputBox.style.textAlign = 'center';
    
    inputBox.innerHTML = `
        <h2 style="margin-top: 0;">${prompt}</h2>
        <input type="text" id="text-input" style="width: 250px; padding: 10px; font-size: 16px; margin: 10px;">
        <br>
        <button id="submit-btn" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Submit</button>
        <div id="timer" style="margin-top: 15px; font-size: 18px; color: #FF6B6B;"></div>
    `;

    const input = inputBox.querySelector('#text-input');
    const submitBtn = inputBox.querySelector('#submit-btn');
    const timerDiv = inputBox.querySelector('#timer');
    
    let timeLeft = timeout / 1000;
    const timer = setInterval(() => {
        timeLeft--;
        timerDiv.textContent = `Time remaining: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            callback('');
            document.body.removeChild(overlay);
        }
    }, 1000);

    const handleSubmit = () => {
        clearInterval(timer);
        callback(input.value);
        document.body.removeChild(overlay);
    };

    submitBtn.onclick = handleSubmit;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    });

    overlay.appendChild(inputBox);
    document.body.appendChild(overlay);
    
    input.focus();
    return overlay;
}

export function createReactionPrompt(message, targetZone, callback) {
    const popup = createPopup(message, 0);
    
    let reacted = false;
    const startTime = Date.now();
    
    const checkReaction = (event) => {
        if (reacted) return;
        
        const rect = document.querySelector('#gameCanvas').getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        let inZone = false;
        if (targetZone === 'top') {
            inZone = y < rect.height * 0.2;
        } else if (targetZone === 'bottom') {
            inZone = y > rect.height * 0.8;
        }
        
        if (inZone) {
            reacted = true;
            const reactionTime = Date.now() - startTime;
            callback(reactionTime);
            document.body.removeChild(popup);
            document.removeEventListener('mousemove', checkReaction);
        }
    };
    
    document.addEventListener('mousemove', checkReaction);
    
    return popup;
}

export function createDrinkingPrompt(playerName, callback) {
    const popup = createPopup(`${playerName}, click when you're done drinking!`, 0, [
        {
            text: 'Done Drinking',
            callback: callback
        }
    ]);
    
    return popup;
}