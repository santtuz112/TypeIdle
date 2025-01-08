// script.js
let wordsToType = [];
let correctKeystrokesTimestamps = [];
let lastTypedWord = "";

let Tickrate = 60;
let Tickinterval = 1000 / Tickrate;
document.addEventListener('DOMContentLoaded', () => {
    loadGame(); // Load saved game data
    
    // Initialize the words to type from words.js
    for (let i = 0; i < 30; i++) {
        wordsToType.push(getRandomWord());
    }
    updateWordsToType();
    
    setInterval(() => {
        generateKeystrokesAndResearchFromBuildings();
        generateFallingWords();
        checkModifiers();
    }, Tickinterval); // Call every tick
    
    setInterval(() => {
        if(autosave) {
            saveGame();
        }
    }, 5000); // Save every 5 seconds
    
    displayAchievements();
    initUpgrades();
    initBuildings();
    initReports();
    //==========================================
    document.getElementById('reset-button').addEventListener('click', () => {
        if(confirm("Are you sure you want to reset your save?")) {
            resetGame();
        }
    });
    //==========================================
    const mainTab = document.getElementById("main-tab");
    const reportsTab = document.getElementById("reports-tab");
    const wordleTab = document.getElementById("wordle-tab");
    const arenaTab = document.getElementById("arena-tab");
    const settingsTab = document.getElementById("settings-tab");
    const mainPage = document.getElementById("gamePage");
    const reportsPage = document.getElementById("reportsPage");
    const wordlePage = document.getElementById("wordlePage");
    const arenaPage = document.getElementById("arenaPage");
    const settingsPage = document.getElementById("settingsPage");
    
    mainTab.addEventListener("click", () => {
        mainPage.style.display = "block";
        reportsPage.style.display = "none";
        wordlePage.style.display = "none";
        arenaPage.style.display = "none";
        settingsPage.style.display = "none";
        mainTab.classList.add("active");
        reportsTab.classList.remove("active");
        wordleTab.classList.remove("active");
        arenaTab.classList.remove("active");
        settingsTab.classList.remove("active");
    });

    reportsTab.addEventListener("click", () => {
        mainPage.style.display = "none";
        reportsPage.style.display = "block";
        wordlePage.style.display = "none";
        arenaPage.style.display = "none";
        settingsPage.style.display = "none";
        mainTab.classList.remove("active");
        reportsTab.classList.add("active");
        wordleTab.classList.remove("active");
        arenaTab.classList.remove("active");
        settingsTab.classList.remove("active");
    });

    wordleTab.addEventListener("click", () => {
        mainPage.style.display = "none";
        reportsPage.style.display = "none";
        wordlePage.style.display = "block";
        arenaPage.style.display = "none";
        settingsPage.style.display = "none";
        mainTab.classList.remove("active");
        reportsTab.classList.remove("active");
        wordleTab.classList.add("active");
        arenaTab.classList.remove("active");
        settingsTab.classList.remove("active");
    });

    arenaTab.addEventListener("click", () => {
        mainPage.style.display = "none";
        reportsPage.style.display = "none";
        wordlePage.style.display = "none";
        arenaPage.style.display = "block";
        settingsPage.style.display = "none";
        mainTab.classList.remove("active");
        reportsTab.classList.remove("active");
        wordleTab.classList.remove("active");
        arenaTab.classList.add("active");
        settingsTab.classList.remove("active");
    });
    
    settingsTab.addEventListener("click", () => {
        mainPage.style.display = "none";
        reportsPage.style.display = "none";
        wordlePage.style.display = "none";
        arenaPage.style.display = "none";
        settingsPage.style.display = "block";
        mainTab.classList.remove("active");
        reportsTab.classList.remove("active");
        wordleTab.classList.remove("active");
        arenaTab.classList.remove("active");
        settingsTab.classList.add("active");
    });
    
    //==========================================
    const volumeSlider = document.getElementById("volume-slider");
    const volumeLabel = document.getElementById("volume-label");
    
    const audioElements = document.querySelectorAll("audio");
    
    volumeSlider.addEventListener("input", function () {
        volume = volumeSlider.value / 100; // Convert to a 0-1 range
        volumeLabel.textContent = `${volumeSlider.value}%`;
        
        audioElements.forEach(audio => {
            audio.volume = volume;
        });
        playBuySound();
    });
    volumeSlider.value = volume * 100;
    volumeLabel.textContent = `${volumeSlider.value}%`;
    audioElements.forEach(audio => {
        audio.volume = volume;
    });
    //==========================================
    document.getElementById('toggle-skip-mistake').addEventListener('change', function () {
        skipOnMistake = this.checked;
    });
    document.getElementById('toggle-skip-mistake').checked = skipOnMistake;
    //==========================================
});

document.getElementById('input-box').addEventListener('input', function() {
    const inputBox = document.getElementById('input-box');
    const inputText = inputBox.value.trim();
    
    colorText(inputText);
    
    if (inputBox.value.endsWith(' ')) {
        if (inputText === wordsToType[0]) {
            manualKeystrokes += inputText.length;
            //let keyStrokeModCount = inputText.length + (inputText.length * (arenaGoldMedals * 0.01 * getPassiveIncome()));
            let keyStrokeModCount = applyKPStoManual(inputText.length);
            keyStrokeModCount = applyModifiers(0, keyStrokeModCount);
            //keyStrokeModCount *= AutoWriter.level * 0.05 + 1; // 1% boost per Auto Writer
            totalKeystrokes += keyStrokeModCount;
            keystrokesBank += keyStrokeModCount;
            cashEarnedManually += keyStrokeModCount;
            lastTypedWord = inputText;
            wordsToType.shift(); // Remove the first word
            wordsToType.push(getRandomWord()); // Add a new random word
            
            // Track each keystroke of the correct word using original inputText.length for WPM calculation
            for (let i = 0; i < inputText.length; i++) {
                correctKeystrokesTimestamps.push(Date.now());
            }
            
            createFallingWord(inputText); // Create falling word effect
            createFloatingWord(`<img src="images/keystroke-coin-icon.png" class="currencyicon" alt="Keystroke Coin"> +${formatShortScale(keyStrokeModCount)}`);
            updateWordsToType();
            playTypeSound();
        } else {
            if (skipOnMistake) {
                wordsToType.shift();
                wordsToType.push(getRandomWord());
                updateWordsToType();
            }
            playTypoSound();
        }
        inputBox.value = '';
        updateStats();
    }
});

function displayWordDefinition(word) {
    const currentWordDefinitionElement = document.getElementById('current-word-definition');
    const WordObj = wordsList[word];
    currentWordDefinitionElement.innerHTML = `<p><strong>${word}</strong></p><p>Definition: ${WordObj.definition}</p><p>Example: <i>${WordObj.example}</i></p>`;
}

const AllWords = Object.keys(wordsList);
function getRandomWord() {
    return AllWords[Math.floor(Math.random() * AllWords.length)]; // Select a random key
}


function updateWordsToType() {
    colorText('');
    displayWordDefinition(wordsToType[0]);
}

function colorText(inputText) {
    const wordsDisplay = document.getElementById('words-to-type');
    const firstWord = wordsToType[0];
    let coloredText = '';
    let mistakeFound = false;
    
    for (let i = 0; i < firstWord.length; i++) {
        if (i < inputText.length && firstWord[i] === inputText[i] && !mistakeFound) {
            coloredText += `<span class="correct">${firstWord[i]}</span>`;
        } else {
            if (i < inputText.length || mistakeFound) {
                coloredText += `<span class="mistake">${firstWord[i]}</span>`;
                mistakeFound = true;
            } else {
                coloredText += `<span class="current">${firstWord[i]}</span>`;
            }
        }
    }
    
    for (let i = 1; i < wordsToType.length; i++) {
        coloredText += ' ' + wordsToType[i];
    }
    
    wordsDisplay.innerHTML = coloredText;
}

function updateStats() {
    document.getElementById('building-cash-earned').textContent = formatShortScale(cashEarnedBuildings);
    document.getElementById('manual-cash-earned').textContent = formatShortScale(cashEarnedManually);
    
    document.getElementById('total-keystrokes').textContent = formatShortScale(totalKeystrokes);
    document.getElementById('total-words').textContent = formatShortScale(totalKeystrokes / 5);
    
    document.getElementById('manual-keystrokes').textContent = formatShortScale(manualKeystrokes);
    document.getElementById('manual-words').textContent = formatShortScale(manualKeystrokes / 5);
    
    document.getElementById('keystrokes-bank').textContent = formatShortScale(keystrokesBank);
    document.getElementById('total-research').textContent = formatShortScale(totalResearchPoints);
    
    document.getElementById('currentAchievementCount').textContent = achievements.filter(a => a.unlocked).length;
    document.getElementById('maxAchievementCount').textContent = achievements.length;
    
    document.getElementById('currentUpgradesCount').textContent = upgrades.filter(u => u.unlocked).length;
    // Update WPM
    // Remove old keystrokes timestamps older than 5 seconds
    const now = Date.now();
    correctKeystrokesTimestamps = correctKeystrokesTimestamps.filter(timestamp => now - timestamp <= 5000);
    
    const correctKeystrokesPerSecond = correctKeystrokesTimestamps.length / 5; // Number of correct keystrokes in the last 5 seconds
    const wordsTyped = correctKeystrokesPerSecond / 5; // Calculate words based on 5 keystrokes per word
    wpm = wordsTyped * 60; // Calculate WPM
    document.getElementById('wpm').textContent = wpm.toFixed(2); // Update WPM display
    
    // Update passive income display
    document.getElementById('passive-income').textContent = formatShortScale(getPassiveIncome());
    
    checkAchievements();
    displayWordle();
    displayBuildings();
    displayUpgrades();
    displayReports();
    displayArena();
}

function createFallingWord(word) {
    const gameContainer = document.getElementById('game-container');
    const fallingWord = document.createElement('div');
    fallingWord.textContent = word;
    fallingWord.className = 'falling-word';
    
    // Set the left property randomly between 0% and 100%
    const rect = document.getElementById('input-box').getBoundingClientRect();
    // Set the left property randomly between 0% and 10%
    fallingWord.style.left = `${rect.left + Math.random() * rect.width}px`;
    fallingWord.style.top = `${rect.bottom}px`;
    //fallingWord.style.left = `${Math.random() * 100}%`;
    
    // Set a random animation duration between 1s and 3s
    const randomDuration = (Math.random() * 2 + 1).toFixed(2);
    fallingWord.style.animationDuration = randomDuration + 's';
    
    gameContainer.appendChild(fallingWord);
    
    // Remove the falling word after the animation completes
    setTimeout(() => {
        gameContainer.removeChild(fallingWord);
    }, randomDuration * 1000); // Convert the duration to milliseconds
}

function createFloatingWord(word) {
    const gameContainer = document.getElementById('game-container');
    const floatingWord = document.createElement('div');
    floatingWord.innerHTML = word;
    floatingWord.className = 'floating-word';
    const rect = document.getElementById('input-box').getBoundingClientRect();
    // Set the left property randomly between 0% and 10%
    floatingWord.style.left = `${rect.left + Math.random() * 20}px`;
    floatingWord.style.top = `${rect.top}px`;
    // Set a random animation duration between 1s and 3s
    const randomDuration = (Math.random() * 2 + 1).toFixed(2);
    floatingWord.style.animationDuration = randomDuration + 's';
    
    gameContainer.appendChild(floatingWord);
    
    // Remove the floating word after the animation completes
    setTimeout(() => {
        gameContainer.removeChild(floatingWord);
    }, randomDuration * 1000); // Convert the duration to milliseconds
}

let wordsToGenerate = 0;

function generateFallingWords() {
    // While there are words to generate, create falling words
    while (wordsToGenerate >= 1) {
        createFallingWord(getRandomWord());
        wordsToGenerate--;
    }
}

function showNotification(message) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = message;
    
    container.appendChild(notification);
    
    // Remove the notification after it fades out
    setTimeout(() => {
        container.removeChild(notification);
    }, 3000); // 3 seconds
}

function formatShortScale(number) {
    if (!Number.isFinite(number)) return '∞'; // Handle infinite numbers
    if (number === 0) return '0'; // Handle zero
    
    const suffixes = ['', 'k', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion'];
    const tier = Math.floor(Math.log10(Math.abs(number)) / 3); // Determine the tier (1000^tier)

    if (tier === 0 || number < 1000) return number.toFixed(1); // For numbers below 1000, return as is

    const scaled = number / Math.pow(10, tier * 3); // Scale the number to its tier
    const suffix = suffixes[tier] || `e${tier * 3}`; // Fallback to scientific notation for very large numbers

    return `${scaled.toFixed(1).replace(/\.0$/, '')} ${suffix}`; // Format with one decimal, remove .0 if unnecessary
}