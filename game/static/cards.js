// cards.js
import { createPopup, createPlayerSelector, createTextInput, createDrinkingPrompt } from './utilities.js';

let socket, gameId, players, client;

export function initializeCardEvents(socketRef, gameIdRef, playersRef, clientRef) {
    socket = socketRef;
    gameId = gameIdRef;
    players = playersRef;
    client = clientRef;
}

export const cardEvents = {
    "1": (player) => {
        console.log("Waterfall!");
        createPopup(`${player} drew Waterfall!`, 2000);
        
        const playerOrder = [...players];
        const startIndex = playerOrder.indexOf(player);
        const orderedPlayers = [...playerOrder.slice(startIndex), ...playerOrder.slice(0, startIndex)];
        
        socket.emit('sequential_event_start', {
            game_id: gameId,
            event_type: 'waterfall',
            player_order: orderedPlayers
        });
    },
    "2": (player) => {
        console.log("You!");
        createPopup(`${player} drew You!`, 2000);
        
        if (player === client) {
            socket.emit('request_player_selection', {
                game_id: gameId,
                requesting_player: client,
                card_value: "2"
            });
        }
    },
    "3": (player) => {
        console.log("Me!");
        createPopup(`${player} drew Me! ${player} drinks!`, 3000);
        
        if (player === client) {
            createDrinkingPrompt(client, () => {
                socket.emit('drinking_complete', {
                    game_id: gameId,
                    player_name: client,
                    event_type: 'me_drink'
                });
            });
        }
    },
    "4": (player) => {
        console.log("Floor!");
        createPopup(`${player} drew Floor!`, 2000);
        
        socket.emit('reaction_event_start', {
            game_id: gameId,
            event_type: 'floor',
            initiator: player
        });
    },
    "5": (player) => {
        console.log("Guys!");
        createPopup(`${player} drew Guys! All guys drink!`, 3000);
        
        // For demo purposes, assume client gender or let all players decide
        createDrinkingPrompt("Guys", () => {
            socket.emit('drinking_complete', {
                game_id: gameId,
                player_name: client,
                event_type: 'guys_drink'
            });
        });
    },
    "6": (player) => {
        console.log("Chicks!");
        createPopup(`${player} drew Chicks! All girls drink!`, 3000);
        
        // For demo purposes, assume client gender or let all players decide
        createDrinkingPrompt("Girls", () => {
            socket.emit('drinking_complete', {
                game_id: gameId,
                player_name: client,
                event_type: 'chicks_drink'
            });
        });
    },
    "7": (player) => {
        console.log("Heaven!");
        createPopup(`${player} drew Heaven!`, 2000);
        
        socket.emit('reaction_event_start', {
            game_id: gameId,
            event_type: 'heaven',
            initiator: player
        });
    },
    "8": (player) => {
        console.log("Mate!");
        createPopup(`${player} drew Mate!`, 2000);
        
        if (player === client) {
            socket.emit('request_player_selection', {
                game_id: gameId,
                requesting_player: client,
                card_value: "8"
            });
        }
    },
    "9": (player) => {
        console.log("Rhyme!");
        createPopup(`${player} drew Rhyme!`, 2000);
        
        if (player === client) {
            createTextInput("Pick a word for others to rhyme with:", (word) => {
                socket.emit('text_input_round_start', {
                    game_id: gameId,
                    prompt: `Think of a word that rhymes with: ${word}`,
                    initiator: client,
                    timeout: 15000
                });
            }, 10000);
        }
    },
    "10": (player) => {
        console.log("Categories!");
        createPopup(`${player} drew Categories!`, 2000);
        
        if (player === client) {
            createTextInput("Pick a category:", (category) => {
                socket.emit('text_input_round_start', {
                    game_id: gameId,
                    prompt: `Name something from the category: ${category}`,
                    initiator: client,
                    timeout: 20000
                });
            }, 10000);
        }
    },
    "11": (player) => {
        console.log("Fingers!");
        createPopup(`${player} drew Fingers! Everyone put a finger on the can!`, 3000);
        
        setTimeout(() => {
            createTextInput(`Guess how many fingers will remain (0-${players.length}):`, (guess) => {
                socket.emit('text_input_submit', {
                    game_id: gameId,
                    player_name: client,
                    input_text: guess,
                    card_value: "11"
                });
            }, 10000);
        }, 3000);
    },
    "12": (player) => {
        console.log("Question queen!");
        createPopup(`${player} drew Question Queen!`, 3000);
        
        socket.emit('game_state_change', {
            game_id: gameId,
            state_type: 'question_queen',
            state_data: { player: player }
        });
    },
    "13": (player) => {
        console.log("New Rule!");
        createPopup(`${player} drew Make a Rule!`, 2000);
        
        if (player === client) {
            const predefinedRules = [
                "No pointing",
                "No saying names",
                "No swearing",
                "Drink with your non-dominant hand",
                "No saying 'drink' or 'drank'",
                "Viking rule - make horns, last person drinks",
                "Thumb master - put thumb on table",
                "Question master - questions only"
            ];
            
            createTextInput("Create a new rule (or press Enter for random):", (rule) => {
                const finalRule = rule.trim() || predefinedRules[Math.floor(Math.random() * predefinedRules.length)];
                
                socket.emit('game_state_change', {
                    game_id: gameId,
                    state_type: 'new_rule',
                    state_data: { rule: finalRule, creator: client }
                });
            }, 15000);
        }
    },
    "default": (player) => {
        console.log("Default card event triggered!");
        // Implement logic for cards without specific events
    }
};

