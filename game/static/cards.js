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