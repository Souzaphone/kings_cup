# UI — Kings Cup (Vanilla JS / Plain CSS)

No component library. UI is hand-built HTML/CSS/JS.

## Patterns

- Use semantic HTML elements (`<button>`, `<input>`, `<dialog>`) — they handle accessibility and keyboard events for free
- Prefer CSS classes over inline styles for anything beyond one-off positioning
- Show/hide UI with CSS class toggling (`element.classList.add('hidden')`) rather than setting `display` directly
- Use `<template>` elements for repeated UI that gets cloned (e.g., player list items, card elements)

## Game-Specific UI

| UI Element | File | Notes |
|------------|------|-------|
| Lobby / join screen | `templates/index.html` | |
| In-game view | `templates/game.html` | |
| Client logic | `static/ui.js` | DOM updates, event binding |
| Webcam overlay | `static/webcam.js` | MediaPipe + WebRTC canvas overlay |

## Interactive Elements

Add `data-test` attributes to interactive elements to make future test automation easier:

```html
<button data-test="start-game">Start Game</button>
<input data-test="player-name-input" type="text" />
```
