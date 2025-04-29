// typing_game/static/typing_game/script.js

// --- Configuration ---
const LINES_PER_CHUNK = 3; 

// --- DOM Element References (Keep) ---
const quoteDisplayElement = document.getElementById('quote-display');
const typingInputElement = document.getElementById('typing-input');
const timerElement = document.getElementById('timer');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const resultsElement = document.getElementById('results');
const restartButton = document.getElementById('restart-btn');
const finalWpmElement = document.getElementById('final-wpm');
const finalAccuracyElement = document.getElementById('final-accuracy');
const finalTimeElement = document.getElementById('final-time');
const finalErrorsElement = document.getElementById('final-errors');

// --- State Variables (Keep) ---
let originalFullLyrics = '';
let allLyricLines = [];
let currentChunkStartIndex = 0;
let currentChunkText = ''; // Holds the exact text (with newlines) of the current chunk
let startTime;
let timerInterval;
let totalErrors = 0;
let totalCorrect = 0;
let totalTypedChars = 0;
let gameActive = false;
let gameFinished = false;

// --- Disable copy/paste/cut/context menu (Keep) ---
if (typingInputElement) {
    typingInputElement.addEventListener('paste', (e) => e.preventDefault());
    typingInputElement.addEventListener('copy', (e) => e.preventDefault());
    typingInputElement.addEventListener('cut', (e) => e.preventDefault());
    typingInputElement.addEventListener('contextmenu', (e) => e.preventDefault());
    typingInputElement.addEventListener('drop', (e) => e.preventDefault());
}

// --- Setup Game: Split lyrics into lines and prepare first chunk ---
function setupGame() {
    originalFullLyrics = quoteDisplayElement.dataset.lyrics || "";
    if (!originalFullLyrics) {
        console.error("No lyrics found in data attribute.");
        quoteDisplayElement.innerHTML = '<span class="error-message">Could not load lyrics.</span>';
        typingInputElement.disabled = true;
        return;
     }
    // Split into all lines
    allLyricLines = originalFullLyrics.split('\n');
    allLyricLines = allLyricLines.filter(line => line.trim().length > 0);

    if (allLyricLines.length === 0) {
        console.error("Lyrics data resulted in zero lines after splitting.");
        quoteDisplayElement.innerHTML = '<span class="error-message">Lyrics format invalid or empty.</span>';
        typingInputElement.disabled = true;
        return;
     }
    currentChunkStartIndex = 0; // Start with the first chunk
    resetGameStats();          // Reset stats
    renderCurrentChunk();      // Render the first chunk
}

// --- Render Current Chunk: Display N lines ---
function renderCurrentChunk() {
    const startIndex = currentChunkStartIndex;
    // Calculate end index, ensuring it doesn't exceed the total number of lines
    const endIndex = Math.min(startIndex + LINES_PER_CHUNK, allLyricLines.length);

    // Check if we've gone past the available lines
    if (startIndex >= allLyricLines.length) {
        console.log("Attempted to render chunk beyond available lines.");
        if (!gameFinished) endGame(); // Ensure game ends cleanly
        return;
    }

    // Get the lines for the current chunk
    const chunkLines = allLyricLines.slice(startIndex, endIndex);
    // Join them with newline characters for the target text
    currentChunkText = chunkLines.join('\n');

    quoteDisplayElement.innerHTML = ''; // Clear previous chunk spans

    // Create spans for each character in the current chunk text
    currentChunkText.split('').forEach(character => {
        const characterSpan = document.createElement('span');
        characterSpan.innerText = character; // Browser handles rendering newline characters correctly with pre-wrap
        quoteDisplayElement.appendChild(characterSpan);
    });

    // Mark the first character as current
    if (quoteDisplayElement.childNodes.length > 0) {
        quoteDisplayElement.childNodes[0].classList.add('current');
    }

    typingInputElement.value = ''; // Clear input for the new chunk
    // Adjust textarea height based on the number of lines in *this* chunk
    typingInputElement.rows = Math.max(4, chunkLines.length + 1);
    typingInputElement.focus();
    console.log(`Rendered chunk starting at index ${startIndex}. Target text set to: [${currentChunkText.replace(/\n/g, '\\n')}]`); // Debug log
}

// --- Reset Game Stats ---
function resetGameStats() {
    clearInterval(timerInterval);
    timerElement.innerText = '0';
    wpmElement.innerText = '0';
    accuracyElement.innerText = '100';
    resultsElement.style.display = 'none';
    typingInputElement.disabled = false;
    gameActive = false;
    gameFinished = false;
    startTime = undefined;
    totalErrors = 0;
    totalTypedChars = 0;
    currentChunkText = ''; // Reset current chunk text
    // Disable input if lyrics didn't load properly
    if (!allLyricLines || allLyricLines.length === 0) {
        typingInputElement.disabled = true;
    } else {
        typingInputElement.disabled = false;
        typingInputElement.focus();
    }
}

// --- Start Timer ---
function startTimer() {
    // Prevent starting if already active or finished
    if (gameFinished || gameActive) return;
    startTime = new Date();
    gameActive = true;
    timerInterval = setInterval(() => {
        // Stop interval if game becomes inactive or finished
        if (!gameActive || gameFinished) {
             clearInterval(timerInterval);
             return;
        }
        const elapsedTime = Math.floor((new Date() - startTime) / 1000);
        timerElement.innerText = elapsedTime;
        calculateLiveWPM(elapsedTime);
    }, 1000);
}

// --- Live WPM Calculation ---
function calculateLiveWPM(elapsedTime) {
    if (!gameActive || elapsedTime <= 0 || totalTypedChars <= 0) {
        wpmElement.innerText = 0; return;
    }
    const minutes = elapsedTime / 60;
    const currentWpm = Math.round((totalTypedChars / 5) / minutes);
    wpmElement.innerText = currentWpm > 0 ? currentWpm : 0;
}

// --- Live Accuracy Calculation ---
function calculateLiveAccuracy() {
     if (!gameActive || totalTypedChars === 0) {
        accuracyElement.innerText = 100; return;
     }
     let accuracy = 100;
     if (totalTypedChars > 0) {
         // Simple accuracy: (Typed - Errors) / Typed
         accuracy = Math.round(((totalTypedChars - totalErrors) / totalTypedChars) * 100);
     }
     // Ensure accuracy stays within 0-100 range
     accuracyElement.innerText = Math.max(0, Math.min(100, accuracy));
}

// --- Handle user input (Visual Feedback AND Auto-Advancement) ---
typingInputElement.addEventListener('input', () => {
    // Ignore input if game finished or somehow past the last chunk index
    if (gameFinished || currentChunkStartIndex >= allLyricLines.length) return;

    // Start timer on first valid input if not already started
    if (!gameActive && !startTime && typingInputElement.value.length > 0) {
        startTimer();
    }
    // Don't process if timer hasn't started (e.g., immediate backspace)
    if (!gameActive) return;

    const targetText = currentChunkText; // Use the stored target text for the current chunk
    const quoteChars = quoteDisplayElement.querySelectorAll('span');
    const inputValue = typingInputElement.value;
    const inputLength = inputValue.length;

    totalTypedChars++; // Increment total typed chars (simple count for live WPM)

    let currentInputErrors = 0; // Errors in the current comparison
    let currentInputCorrect = 0;
    // Update visual feedback (correct/incorrect/current spans)
    quoteChars.forEach((charSpan, index) => {
        charSpan.classList.remove('correct', 'incorrect', 'current');
        if (index < inputLength) {
            // Character has been typed for this position
            if (inputValue[index] === targetText[index]) {
                charSpan.classList.add('correct');
            } else {
                charSpan.classList.add('incorrect');
                currentInputErrors++;
                // Increment cumulative errors for stats (simple approach)
                totalErrors++;
            }
        } else if (index === inputLength && index < targetText.length) {
            // This is the next character to be typed
            charSpan.classList.add('current');
        }
        // else: Character is beyond the current input or target length - no style needed
    });

    // Update live stats display
    calculateLiveAccuracy();
    const elapsedTime = Math.floor((new Date() - (startTime || new Date())) / 1000);
    calculateLiveWPM(elapsedTime);

    // --- Automatic Chunk Completion Check ---
    // Check if the entire typed input value exactly matches the target chunk text
    if (inputValue.length === targetText.length) {
        console.log(`MATCH DETECTED! Input: [${inputValue.replace(/\n/g, '\\n')}] | Target: [${targetText.replace(/\n/g, '\\n')}]`); // Debug log
        // Input matches the current chunk exactly!
        const oldIndex = currentChunkStartIndex; // Log old value before changing
        currentChunkStartIndex += LINES_PER_CHUNK; // Advance to the start index of the next chunk
        console.log(`Advanced Index: ${oldIndex} -> ${currentChunkStartIndex}`); // Debug log

        // Check if there are more lines left in the lyrics
        if (currentChunkStartIndex < allLyricLines.length) {
            console.log("Calling renderCurrentChunk() for next chunk..."); // Debug log
            renderCurrentChunk(); // Render the next chunk
        } else {
            console.log("Last chunk completed. Calling endGame()..."); // Debug log
            endGame(); // No more lines, end the game
        }
    }


});


// --- Handle Enter Key (Disable ONLY) ---
typingInputElement.addEventListener('keydown', (event) => {
    // Check if the pressed key is 'Enter'
    if (event.key === 'Enter') {
        // Prevent the default Enter behavior (inserting a newline) unconditionally
//        event.preventDefault();
        // console.log("Enter key disabled."); // Optional console message for testing
    }
    // Consider preventing Tab if it interferes with focus
    // if (event.key === 'Tab') {
    //     event.preventDefault();
    //     console.log("Tab key disabled.");
    // }
});


// --- End Game: Calculate final stats and display results ---
function endGame() {
    // Prevent multiple calls
    if (gameFinished) return;
    clearInterval(timerInterval); // Stop the timer
    gameActive = false;
    gameFinished = true;
    typingInputElement.disabled = true; // Disable input

    // Handle edge case where game ends before timer starts properly
    if (!startTime) {
         finalWpmElement.innerText = 0;
         finalAccuracyElement.innerText = calculateFinalAccuracy();
         finalTimeElement.innerText = 0;
         finalErrorsElement.innerText = totalErrors;
         resultsElement.style.display = 'block';
         wpmElement.innerText = 0; // Update top bar too
         accuracyElement.innerText = calculateFinalAccuracy(); // Update top bar too
         return;
    }

    const endTime = new Date();
    const elapsedTimeSeconds = Math.floor((endTime - startTime) / 1000);
    const elapsedTimeMinutes = elapsedTimeSeconds / 60;

    // Final WPM uses the total original lyrics length for standard calculation
    const finalWpm = (elapsedTimeMinutes > 0) ? Math.round((originalFullLyrics.length / 5) / elapsedTimeMinutes) : 0;
    // Final Accuracy uses accumulated totals
    const finalAccuracy = calculateFinalAccuracy();

    // Display results in the results section
    finalWpmElement.innerText = finalWpm > 0 ? finalWpm : 0;
    finalAccuracyElement.innerText = finalAccuracy;
    finalTimeElement.innerText = elapsedTimeSeconds;
    finalErrorsElement.innerText = totalErrors;
    resultsElement.style.display = 'block'; // Show results

    // Update final stats in the top bar as well
    wpmElement.innerText = finalWpm > 0 ? finalWpm : 0;
    accuracyElement.innerText = finalAccuracy;
}

// --- Final Accuracy Calculation Helper ---
function calculateFinalAccuracy() {
    let accuracy = 100; // Default to 100%
     if (totalTypedChars > 0) {
         // Calculate based on total typed characters vs errors
         accuracy = Math.round(((totalTypedChars - totalErrors) / totalTypedChars) * 100);
     }
     // Ensure accuracy is between 0 and 100
     return Math.max(0, Math.min(100, accuracy));
}

// --- Restart Button: Reload the page for a new snippet ---
restartButton.addEventListener('click', () => {
    window.location.reload();
});

// --- Initial Load: Setup the game when the DOM is ready ---
document.addEventListener('DOMContentLoaded', setupGame);