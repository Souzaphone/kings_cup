// cards.js

export const cardEvents = {
    "1": (player) => {
        console.log("Waterfall!");

        waterfallTurn(player);

        // will have each person start drinking and when they click or press any button their turn is done
        // Implement specific logic for Ace card
    },
    "2": (player) => {
        console.log("You!");

        // pull up a menu to choose which player you want to drink

        // Implement specific logic for card 2
    },
    // Add more events for other card values
    "3": (player) => {
        console.log("Me!");
        // me. I drink
    },
    "4": (player) => {
        console.log("Floor!");
        // everyone has to move their cursor to the bottom of the screen
    },
    "5": (player) => {
        console.log("Guys!");
        // guys drink  
    },
    "6": (player) => {
        console.log("Chicks!");
        // All girls drink
    },
    "7": (player) => {
        console.log("Heaven!");
        // Last person to move their cursor to the top of the screen drinks
    },
    "8": (player) => {
        console.log("Mate!");
        // Pick another player and everytime you drink they drink and vice versa
    },
    "9": (player) => {
        console.log("Rhyme!");
        // Pick a word and every player has 5* seconds to type something that rhymes with it
    },
    "10": (player) => {
        console.log("Categories!");
        // Pick a category 
    },
    "11": (player) => {
        console.log("Fingers!");
        // everyone put their piece on the beer and a timer counts down on everyones turn and they get to guess how many fingers will be left on the beer
    },
    "12": (player) => {
        console.log("Question queen!");
        // This person tries to get others to answer questions. Will be a big crown instead of a poker chip so you know who it is
    },
    "13": (player) => {
        console.log("New Rule!");
        // Brainstorm a bunch of rules that you can pick from, or allow the user to make up a rule and put it on the board
    },
    "default": (player) => {
        console.log("Default card event triggered!");
        // Implement logic for cards without specific events
    }
};

// TODO: need to make a popup for each player that shows that they are still drinking, and when they are done drinking to click any button to continue their turn
// will start out with each person receieving a popup on their screen that shows what card it is. 
// need to keep track of who drew the card and then prompt them to click any button to start drinking
function waterfallTurn(player) {

    createPopup(`${player} Press any button to start Waterfall!`);

}

// TODO: need to fix how this gets removed
function createPopup(content) {
    const popUp = document.createElement('div');
    popUp.style.position = 'fixed';
    popUp.style.top = '50%';
    popUp.style.left = '50%';
    popUp.style.transform = 'translate(-50%, -50%)';
    popUp.style.background = 'white';
    popUp.style.padding = '20px';
    popUp.style.border = '2px solid black';
    popUp.style.zIndex = '1000';
    popUp.innerHTML = `<h2>${content}</h2>`;
    
    document.body.appendChild(popUp);

    // Remove the pop-up after 3 seconds
    setTimeout(() => {
        document.body.removeChild(popUp);
    }, 3000);
}