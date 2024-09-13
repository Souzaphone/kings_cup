// cards.js


export const cardEvents = {
    "1": () => {
        console.log("Waterfall!");
        // will have each person start drinking and when they click or press any button their turn is done
        // Implement specific logic for Ace card
    },
    "2": () => {
        console.log("You!");

        // pull up a menu to choose which player you want to drink

        // Implement specific logic for card 2
    },
    // Add more events for other card values
    "3": () => {
        console.log("Me!");
        // me. I drink
    },
    "4": () => {
        console.log("Floor!");
        // everyone has to move their cursor to the bottom of the screen
    },
    "5": () => {
        console.log("Guys!");
        // guys drink  
    },
    "6": () => {
        console.log("Chicks!");
        // All girls drink
    },
    "7": () => {
        console.log("Heaven!");
        // Last person to move their cursor to the top of the screen drinks
    },
    "8": () => {
        console.log("Mate!");
        // Pick another player and everytime you drink they drink and vice versa
    },
    "9": () => {
        console.log("Rhyme!");
        // Pick a word and every player has 5* seconds to type something that rhymes with it
    },
    "10": () => {
        console.log("Categories!");
        // Pick a category 
    },
    "11": () => {
        console.log("Fingers!");
        // everyone put their piece on the beer and a timer counts down on everyones turn and they get to guess how many fingers will be left on the beer
    },
    "12": () => {
        console.log("Question queen!");
        // This person tries to get others to answer questions. Will be a big crown instead of a poker chip so you know who it is
    },
    "13": () => {
        console.log("New Rule!");
        // Brainstorm a bunch of rules that you can pick from, or allow the user to make up a rule and put it on the board
    },
    "default": () => {
        console.log("Default card event triggered!");
        // Implement logic for cards without specific events
    }
};