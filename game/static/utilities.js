// utilities.js

// ── Math helpers ────────────────────────────────────────────
export function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.round(z * stdev + mean);
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── UI Helper: backdrop overlay ──────────────────────────────
// Uses .kc-overlay--modal modifier class for z-index tier (1100).
// Do NOT use style.zIndex — CSSOM silently discards var() references.
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'kc-overlay kc-overlay--modal';
    return overlay;
}

// ── createPopup ──────────────────────────────────────────────
// Shows a centered popup with optional action buttons.
// duration > 0: auto-dismisses after `duration` ms
// duration === 0: stays until manually closed
export function createPopup(content, duration = 3000, buttons = null) {
    const overlay = createOverlay();

    const popup = document.createElement('div');
    popup.className = 'kc-popup';
    popup.setAttribute('data-test', 'card-event-popup');
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');

    const title = document.createElement('p');
    title.className = 'kc-popup-title-accent';
    title.textContent = content;
    popup.appendChild(title);

    if (buttons && buttons.length > 0) {
        const btnRow = document.createElement('div');
        btnRow.className = 'flex gap-2 justify-end mt-4';

        buttons.forEach(({ text, callback }) => {
            const btn = document.createElement('button');
            btn.className = 'kc-btn kc-btn-primary';
            btn.textContent = text;
            btn.onclick = () => {
                callback();
                if (document.body.contains(overlay)) document.body.removeChild(overlay);
            };
            btnRow.appendChild(btn);
        });

        popup.appendChild(btnRow);
    }

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    if (duration > 0) {
        setTimeout(() => {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }, duration);
    }

    return overlay;
}

// ── createPlayerSelector ─────────────────────────────────────
// Shows a modal with a button per selectable player.
export function createPlayerSelector(players, excludePlayer, callback) {
    const overlay = createOverlay();

    const panel = document.createElement('div');
    panel.className = 'kc-popup';
    panel.setAttribute('data-test', 'player-selector');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h3');
    heading.textContent = 'Choose a Player';
    panel.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'mt-3 flex flex-col gap-1';

    const available = players.filter(p => p !== excludePlayer);
    available.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'kc-player-select-btn';
        btn.textContent = player;
        btn.setAttribute('data-test', `select-player-${player}`);
        btn.onclick = () => {
            callback(player);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        };
        list.appendChild(btn);
    });

    panel.appendChild(list);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    return overlay;
}

// ── createTextInput ───────────────────────────────────────────
// Shows a modal with a text input and countdown timer.
export function createTextInput(prompt, callback, timeout = 30000) {
    const overlay = createOverlay();

    const panel = document.createElement('div');
    panel.className = 'kc-popup';
    panel.setAttribute('data-test', 'text-input-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const heading = document.createElement('h3');
    heading.textContent = prompt;
    panel.appendChild(heading);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'kc-input mt-3';
    input.setAttribute('data-test', 'text-input-field');
    input.placeholder = 'Type here…';
    panel.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'kc-btn kc-btn-primary w-full mt-3';
    submitBtn.textContent = 'Submit';
    submitBtn.setAttribute('data-test', 'text-input-submit');
    panel.appendChild(submitBtn);

    const timerEl = document.createElement('p');
    timerEl.className = 'kc-timer-text';
    panel.appendChild(timerEl);

    let timeLeft = Math.floor(timeout / 1000);
    timerEl.textContent = `${timeLeft}s remaining`;

    const timer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s remaining`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            callback('');
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }
    }, 1000);

    const handleSubmit = () => {
        clearInterval(timer);
        callback(input.value);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
    };

    submitBtn.onclick = handleSubmit;
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSubmit();
    });

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    input.focus();
    return overlay;
}

// ── createDrinkingPrompt ──────────────────────────────────────
// Shows a modal prompting the named player to confirm drinking.
export function createDrinkingPrompt(playerName, callback) {
    const overlay = createOverlay();

    const panel = document.createElement('div');
    panel.className = 'kc-popup text-center';
    panel.setAttribute('data-test', 'drinking-prompt');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const msg = document.createElement('p');
    msg.className = 'kc-popup-title-accent';
    msg.textContent = `${playerName}, click when you're done drinking!`;
    panel.appendChild(msg);

    const btn = document.createElement('button');
    btn.className = 'kc-drinking-btn';
    btn.textContent = 'Done Drinking';
    btn.setAttribute('data-test', 'drinking-done-btn');
    btn.onclick = () => {
        callback();
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
    };
    panel.appendChild(btn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    return overlay;
}

// ── createReactionPrompt ──────────────────────────────────────
// Shows a popup instructing the player to move mouse to a zone.
// Monitors mousemove on the canvas to detect if player reacted.
export function createReactionPrompt(message, targetZone, callback) {
    const overlay = createPopup(message, 0);

    let reacted = false;
    const startTime = Date.now();

    const checkReaction = (event) => {
        if (reacted) return;

        const canvas = document.querySelector('#gameCanvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let inZone = false;
        if (targetZone === 'top')    inZone = y < rect.height * 0.2;
        if (targetZone === 'bottom') inZone = y > rect.height * 0.8;

        if (inZone) {
            reacted = true;
            const reactionTime = Date.now() - startTime;
            callback(reactionTime);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            document.removeEventListener('mousemove', checkReaction);
        }
    };

    document.addEventListener('mousemove', checkReaction);
    return overlay;
}
