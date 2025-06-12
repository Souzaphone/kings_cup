# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

King's Cup is a multiplayer card game with real-time gameplay features. The project has dual implementations:

- **Node.js/Express version** (`game/app.js`) - Primary implementation using Socket.IO for real-time communication
- **Python/Flask version** (`game/app.py`) - Alternative implementation using Flask-SocketIO

Both versions share the same frontend HTML templates and JavaScript client code.

## Architecture

### Backend Structure
- **Node.js server** (`game/app.js`): Express server with Socket.IO for WebSocket connections
- **Python server** (`game/app.py`): Flask server with Flask-SocketIO for WebSocket connections  
- **Game logic** (`game/static/classes.js`, `game/classes.py`): Core game classes (Game, Card, Deck, Player)
- **Templates** (`game/templates/`): HTML templates for game interface

### Frontend Structure
- **Main game logic** (`game/static/main.js`): Canvas-based game rendering and client-side logic
- **Card events** (`game/static/cards.js`): Card-specific game events and interactions
- **Utilities** (`game/static/utilities.js`): Helper functions and animations
- **Styling** (`game/static/style.css`): Game interface styling

### Key Features
- Real-time multiplayer with cursor tracking
- Canvas-based card game interface
- WebSocket communication for game state synchronization
- Game room management with unique game IDs
- Card drawing animations and game state management

## Development Commands

### Node.js Version (Primary)
```bash
cd game
npm install          # Install dependencies
npm start           # Start production server
npm run dev         # Start development server with nodemon
```

### Python Version (Alternative)  
```bash
cd game
python app.py       # Start Flask development server
```

## Key Implementation Details

- **Game State**: Managed server-side with periodic cursor position broadcasts
- **Real-time Communication**: Socket.IO events for game actions (join, leave, start_game, draw_card, etc.)
- **Canvas Rendering**: Client-side canvas for card animations and game visualization
- **Dual Architecture**: Both Python and Node.js backends implement identical API endpoints and socket events

## File Structure Notes

- Static assets (card images) are in `game/static/assets/`
- Game logic is duplicated between JavaScript (`classes.js`) and Python (`classes.py`) versions
- Templates use Bootstrap for responsive design with dark/light theme support