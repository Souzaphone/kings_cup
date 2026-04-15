// ui.js — UI helper functions for Kings Cup

// Show a loading spinner overlay
export default function showLoading(message = 'Loading…') {
    let overlay = document.getElementById('kc-loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'kc-loading-overlay';
        overlay.className = 'kc-loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');

        const box = document.createElement('div');
        box.className = 'kc-loading-box';

        const spinner = document.createElement('span');
        spinner.className = 'kc-spinner';
        spinner.setAttribute('aria-hidden', 'true');

        const text = document.createElement('span');
        text.id = 'kc-loading-text';
        text.textContent = message;

        box.appendChild(spinner);
        box.appendChild(text);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    } else {
        const text = document.getElementById('kc-loading-text');
        if (text) text.textContent = message;
        overlay.classList.remove('kc-hidden');
    }
}

// Hide the loading spinner overlay
export function hideLoading() {
    const overlay = document.getElementById('kc-loading-overlay');
    if (overlay) overlay.classList.add('kc-hidden');
}

// Show a toast notification
// type: 'info' | 'success' | 'error' | 'warning'
export function showToast(message, type = 'info', duration = 2500) {
    const toast = document.createElement('div');
    toast.className = `kc-toast kc-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('data-test', 'toast');
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) document.body.removeChild(toast);
        }, 350);
    }, duration);
}

// Focus trap for modals — call after appending modal to DOM
export function trapFocus(modal) {
    const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
            if (document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
    });

    first.focus();
}
