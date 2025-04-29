const QUOTE_API_URL = 'https://api.quotable.io/random?minLength=150&maxLength=250'; // Fetch slightly longer quotes
const quoteDisplayElement = document.getElementById('quote-display');
const typingInputElement = document.getElementById('typing-input');
const timerElement = document.getElementById('timer');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const resultsElement = document.getElementById('results');
const restartButton = document.getElementById('restart-btn');

// Results details spans
const finalWpmElement = document.getElementById('final-wpm');
const finalAccuracyElement = document.getElementById('final-accuracy');
const finalTimeElement = document.getElementById('final-time');
const finalErrorsElement = document.getElementById('final-errors');


let quoteText = '';
let startTime;
let timerInterval;
let errors = 0;
let typedChars = 0;
let gameActive = false;

// Fetch a random quote from the API
async function getRandomQuote() {
    try {
        const response = await fetch(QUOTE_API_URL);
        const data = await response.json();
        return data.content; // Return only the quote text
    } catch (error) {
        console.error("Error fetching quote:", error);
        return "The quick brown fox jumps over the lazy dog. This is a fallback quote.";
    }
}

// Render the quote characters into spans
async function renderNewQuote() {
    quoteText = await getRandomQuote();
    quoteDisplayElement.innerHTML = ''; // Clear previous quote
    // Split quote into characters and wrap each in a span
    quoteText.split('').forEach(character => {
        const characterSpan = document.createElement('span');
        characterSpan.innerText = character;
        quoteDisplayElement.appendChild(characterSpan);
    });
    // Mark the first character as current
    if (quoteDisplayElement.childNodes.length > 0) {
        quoteDisplayElement.childNodes[0].classList.add('current');
    }
    typingInputElement.value = ''; // Clear input field
    resetGameStats(); // Reset timer and stats display
}

// Reset game state and displays
function resetGameStats() {
    clearInterval(timerInterval); // Stop any existing timer
    timerElement.innerText = '0';
    wpmElement.innerText = '0';
    accuracyElement.innerText = '100';
    resultsElement.style.display = 'none'; // Hide results
    typingInputElement.disabled = false; // Enable input
    typingInputElement.focus(); // Focus on input
    gameActive = false;
    startTime = undefined; // Use undefined to check if timer started
    errors = 0;
    typedChars = 0;
}

// Start the timer
function startTimer() {
    startTime = new Date();
    gameActive = true;
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((new Date() - startTime) / 1000);
        timerElement.innerText = elapsedTime;
        calculateLiveWPM(elapsedTime); // Calculate WPM live
    }, 1000);
}

// Calculate WPM live during the test
function calculateLiveWPM(elapsedTime) {
    if (elapsedTime > 0 && typedChars > 0) {
        // WPM = (Total Characters Typed / 5) / (Time in Minutes)
        const minutes = elapsedTime / 60;
        const currentWpm = Math.round((typedChars / 5) / minutes);
        wpmElement.innerText = currentWpm > 0 ? currentWpm : 0;
    } else {
        wpmElement.innerText = 0;
    }
}

// Calculate accuracy live during the test
function calculateLiveAccuracy() {
    if (typedChars === 0) {
        accuracyElement.innerText = 100;
        return;
    }
    const accuracy = Math.round(((typedChars - errors) / typedChars) * 100);
    accuracyElement.innerText = accuracy >= 0 ? accuracy : 0;
}

// Handle user input
typingInputElement.addEventListener('input', () => {
    // Start timer on first typed character
    if (!gameActive && typingInputElement.value.length > 0) {
        startTimer();
    }

    const quoteChars = quoteDisplayElement.querySelectorAll('span');
    const inputChars = typingInputElement.value.split('');
    let currentQuoteIndex = inputChars.length - 1; // The index we are currently comparing

    errors = 0; // Recalculate errors on each input
    typedChars = inputChars.length; // Update total typed characters

    quoteChars.forEach((charSpan, index) => {
        const inputChar = inputChars[index];

        // Remove previous states
        charSpan.classList.remove('correct', 'incorrect', 'current');

        if (inputChar == null) { // Character not yet typed
            if (index === inputChars.length) {
                charSpan.classList.add('current'); // Mark as the next character to type
            }
        } else if (inputChar === charSpan.innerText) { // Correctly typed character
            charSpan.classList.add('correct');
        } else { // Incorrectly typed character
            charSpan.classList.add('incorrect');
            // Only count errors for characters *actually typed* incorrectly
            // Don't increment error count for future chars if user backspaces
            if (index <= currentQuoteIndex) {
                errors++;
            }
        }
    });

    // Update live stats
    calculateLiveAccuracy();
    const elapsedTime = Math.floor((new Date() - (startTime || new Date())) / 1000); // Use current time if startTime not set yet
    calculateLiveWPM(elapsedTime);


    // Check if game is completed
    if (currentQuoteIndex + 1 === quoteChars.length) {
        endGame();
    }

    // Update the 'current' marker if we backspace or move
     // Remove 'current' from all first
     quoteChars.forEach(span => span.classList.remove('current'));
     // Add 'current' to the correct next character
     if (currentQuoteIndex + 1 < quoteChars.length) {
         quoteChars[currentQuoteIndex + 1].classList.add('current');
     }

});

// End the game and show results
function endGame() {
    clearInterval(timerInterval); // Stop the timer
    gameActive = false;
    typingInputElement.disabled = true; // Disable input

    const endTime = new Date();
    const elapsedTimeSeconds = Math.floor((endTime - startTime) / 1000);
    const elapsedTimeMinutes = elapsedTimeSeconds / 60;

    // Final WPM Calculation (Standard: Chars/5 / Minutes)
    const finalWpm = Math.round((quoteText.length / 5) / elapsedTimeMinutes);

    // Final Accuracy Calculation
    const correctChars = quoteText.length - errors;
    const finalAccuracy = Math.round((correctChars / quoteText.length) * 100);

    // Display results
    finalWpmElement.innerText = finalWpm > 0 ? finalWpm : 0;
    finalAccuracyElement.innerText = finalAccuracy >= 0 ? finalAccuracy : 0;
    finalTimeElement.innerText = elapsedTimeSeconds;
    finalErrorsElement.innerText = errors;

    resultsElement.style.display = 'block'; // Show results section

    // Update final stats in the top bar as well (optional)
    wpmElement.innerText = finalWpm > 0 ? finalWpm : 0;
    accuracyElement.innerText = finalAccuracy >= 0 ? finalAccuracy : 0;
}


// Restart button functionality
restartButton.addEventListener('click', () => {
    renderNewQuote(); // Fetch and display a new quote
});

// Initial load
renderNewQuote();