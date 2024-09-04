// cards.js
// retrieve the deck
export async function getDeck() {
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

export const cardEvents = {
    "1": () => {
        console.log("Ace card event triggered!");
        // Implement specific logic for Ace card
    },
    "2": () => {
        console.log("Two card event triggered!");
        // Implement specific logic for card 2
    },
    // Add more events for other card values
    "3": () => {
        console.log("Three card event triggered!");
        // Implement specific logic for King card
    },
    "4": () => {
        console.log("Four card event triggered!");
        // Implement specific logic for King card
    },
    "5": () => {
        console.log("Five card event triggered!");
        // Implement specific logic for King card
    },
    "6": () => {
        console.log("Six card event triggered!");
        // Implement specific logic for King card
    },
    "7": () => {
        console.log("Seven card event triggered!");
        // Implement specific logic for King card
    },
    "8": () => {
        console.log("Eight card event triggered!");
        // Implement specific logic for King card
    },
    "9": () => {
        console.log("Nine card event triggered!");
        // Implement specific logic for King card
    },
    "10": () => {
        console.log("Ten card event triggered!");
        // Implement specific logic for King card
    },
    "11": () => {
        console.log("Jack card event triggered!");
        // Implement specific logic for King card
    },
    "12": () => {
        console.log("Queen card event triggered!");
        // Implement specific logic for King card
    },
    "13": () => {
        console.log("King card event triggered!");
        // Implement specific logic for King card
    },
    "default": () => {
        console.log("Default card event triggered!");
        // Implement logic for cards without specific events
    }
};