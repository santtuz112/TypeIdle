// script.js
let wordsToType = [];
let correctKeystrokesTimestamps = [];
let lastTypedWord = "";

let Tickrate = 60;
let Tickinterval = 1000 / Tickrate;


let currentPage = "main-tab";
const tabs = {
    main: {
        tab: document.getElementById("main-tab"),
        page: document.getElementById("gamePage"),
        sidePanel: document.getElementById("upgrades-panel")
    },
    reports: {
        tab: document.getElementById("reports-tab"),
        page: document.getElementById("reportsPage")
    },
    wordle: {
        tab: document.getElementById("wordle-tab"),
        page: document.getElementById("wordlePage"),
        sidePanel: document.getElementById("wordle-panel")
    },
    arena: {
        tab: document.getElementById("arena-tab"),
        page: document.getElementById("arenaPage")
    },
    stock: {
        tab: document.getElementById("stock-tab"),
        page: document.getElementById("stockPage"),
        sidePanel: document.getElementById("stocks-panel")
    },
    settings: {
        tab: document.getElementById("settings-tab"),
        page: document.getElementById("settingsPage")
    },
    research: {
        tab: document.getElementById("research-tab"),
        page: document.getElementById("researchPage")
    },
    guild: {
        tab: document.getElementById("guild-tab"),
        page: document.getElementById("guildPage")
    }
};

let currentBusinessTier = 0;
let businessTiers = [
    { tier: 0, name: "Non existant business", jobTitle: "Unemployed", threshold: 0 },
    { tier: 1, name: "Small Business", jobTitle: "Intern", threshold: 100 },
    { tier: 2, name: "Medium Business", jobTitle: "Assistant", threshold: 50_000 },
    { tier: 3, name: "Large Business", jobTitle: "Associate", threshold: 1_000_000 },
    { tier: 4, name: "Corporation", jobTitle: "Manager", threshold: 100_000_000 },
    { tier: 5, name: "Mega Corporation", jobTitle: "Director", threshold: 1_000_000_000 },
    { tier: 6, name: "Global Conglomerate", jobTitle: "CEO", threshold: 1_000_000_000_000 },
];

let canPromote = true;
function initPromotion() {
    currentBusinessTier = businessTiers.reduce((acc, biz, i) => {
        return (totalKeystrokes >= biz.threshold) ? i : acc;
    }, 0);
    const businessContainer = document.getElementById("business-title");
    const jobTitleContainer = document.getElementById("job-title");
    let newBizTitle = document.createElement('div');
    newBizTitle.innerText = businessTiers[currentBusinessTier].name;
    businessContainer.appendChild(newBizTitle);
    let newJobTitle = document.createElement('div');
    newJobTitle.innerText = businessTiers[currentBusinessTier].jobTitle;
    jobTitleContainer.appendChild(newJobTitle);
    if(currentBusinessTier === businessTiers.length - 1) {
        document.getElementById("business-rankup-progress-bar").style.width = "100%";
    }
}
function checkPromotion() {
    if(!canPromote) return;
    if (currentBusinessTier >= businessTiers.length - 1) return;
    let lowerThreshold = businessTiers[currentBusinessTier].threshold;
    let nextThreshold = businessTiers[currentBusinessTier + 1].threshold;
    document.getElementById("business-rankup-progress-bar").style.width = `${((totalKeystrokes - lowerThreshold) / (nextThreshold - lowerThreshold) * 100).toFixed(2)}%`;
    if(totalKeystrokes >= businessTiers[currentBusinessTier + 1].threshold) {
        canPromote=false; // Limit to 1 promotion a time
        const businessContainer = document.getElementById("business-title");
        const jobTitleContainer = document.getElementById("job-title");

        let oldBizTitle = businessContainer.querySelector('div');
        let oldJobTitle = jobTitleContainer.querySelector('div');
        if (oldBizTitle) oldBizTitle.style.animationName = 'scrollDown';
        if (oldJobTitle) oldJobTitle.style.animationName = 'scrollDown';

        setTimeout(() => {
            currentBusinessTier++;
            if (oldBizTitle) businessContainer.removeChild(oldBizTitle);
            if (oldJobTitle) jobTitleContainer.removeChild(oldJobTitle);

            let newBizTitle = document.createElement('div');
            newBizTitle.innerText = businessTiers[currentBusinessTier].name;
            newBizTitle.style.animationName = 'scrollUp';
            businessContainer.appendChild(newBizTitle);

            let newJobTitle = document.createElement('div');
            newJobTitle.innerText = businessTiers[currentBusinessTier].jobTitle;
            newJobTitle.style.animationName = 'scrollUp';
            jobTitleContainer.appendChild(newJobTitle);
            createFloatingWord(`Promoted to ${businessTiers[currentBusinessTier].jobTitle}`);
            canPromote = true;
        }, 1000);
    }
}


function initGame() {
    loadLocalSave(); // Load saved game data
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
    
    // Send heartbeat every 5 minutes (300000 milliseconds)
    setInterval(sendHeartbeat, 300000);
    
    displayAchievements();
    initUpgrades();
    initBuildings();
    initReports();
    initStockMarket();
    initPromotion();
    renderGameKeyboard();
    highlightNextKey();
    //==========================================
    document.getElementById('reset-button').addEventListener('click', () => {
        if(confirm("Are you sure you want to reset your save?")) {
            resetGame();
        }
    });
    //==========================================
    for (const key in tabs) {
        tabs[key].tab.addEventListener("click", () => switchTab(tabs[key].tab));
    }   
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
    document.getElementById('keyboard-layout').addEventListener('change', function () {
        keyboardLayout = this.value;
        renderWordleKeyboard(); // Update the Wordle keyboard layout
        renderGameKeyboard();
        highlightNextKey();
    });
    document.getElementById('keyboard-layout').value = keyboardLayout;
    //==========================================
    document.getElementById('theme-select').addEventListener('change', function () {
        currentTheme = this.value;
        applyTheme();
    });
    document.getElementById('theme-select').value = currentTheme;
    applyTheme();
    //==========================================
    document.getElementById('toggle-word-definition').addEventListener('click', () => {
        document.getElementById('toggle-word-definition').classList.add('active');
        document.getElementById('toggle-game-keyboard').classList.remove('active');
        document.getElementById('current-word-definition').style.display = 'block';
        document.getElementById('game-keyboard-container').style.display = 'none';
        gameKeyboardOrDefintion = 'definition';
    });
    document.getElementById('toggle-game-keyboard').addEventListener('click', () => {
        document.getElementById('toggle-game-keyboard').classList.add('active');
        document.getElementById('toggle-word-definition').classList.remove('active');
        document.getElementById('current-word-definition').style.display = 'none';
        document.getElementById('game-keyboard-container').style.display = 'block';
        gameKeyboardOrDefintion = 'keyboard';
    });
    if(gameKeyboardOrDefintion === 'definition') {
        document.getElementById('toggle-word-definition').classList.add('active');
        document.getElementById('current-word-definition').style.display = 'block';
        document.getElementById('game-keyboard-container').style.display = 'none';
    } else {
        document.getElementById('toggle-game-keyboard').classList.add('active');
        document.getElementById('current-word-definition').style.display = 'none';
        document.getElementById('game-keyboard-container').style.display = 'block';
    }
    //==========================================
    sendHeartbeat(); // send the first heartbeat
}

document.getElementById('input-box').addEventListener('input', function() {
    const inputBox = document.getElementById('input-box');
    const inputText = inputBox.value.trim();
    
    colorText(inputText, document.getElementById('words-to-type'), wordsToType);
    highlightNextKey();
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
        highlightNextKey();
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
    colorText('', document.getElementById('words-to-type'), wordsToType);
    displayWordDefinition(wordsToType[0]);
    document.getElementById('input-box').placeholder = `Type '${wordsToType[0]}' here...`;
    highlightNextKey();
}

function colorText(inputText, wordsDisplay, words) {
    
    const firstWord = words[0];
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
    
    for (let i = 1; i < words.length; i++) {
        coloredText += ' ' + words[i];
    }
    
    wordsDisplay.innerHTML = coloredText;
}

function updateStats() {
    scrollingKeystrokesBank += (keystrokesBank - scrollingKeystrokesBank) / Tickrate * 4;
    scrollingWpm += (wpm - scrollingWpm) / Tickrate * 10;

    scrollingWpmMultiplier += ((1 + wpm / 30) - scrollingWpmMultiplier) / Tickrate * 10;

    scrollingPassiveIncome += (getPassiveIncome() - scrollingPassiveIncome) / Tickrate * 4;
    document.getElementById('building-cash-earned').textContent = formatShortScale(cashEarnedBuildings);
    document.getElementById('manual-cash-earned').textContent = formatShortScale(cashEarnedManually);
    
    document.getElementById('total-keystrokes').textContent = formatShortScale(totalKeystrokes);
    document.getElementById('total-words').textContent = formatShortScale(totalKeystrokes / 5);
    
    document.getElementById('manual-keystrokes').textContent = formatShortScale(manualKeystrokes);
    document.getElementById('manual-words').textContent = formatShortScale(manualKeystrokes / 5);
    
    document.getElementById('keystrokes-bank').textContent = formatShortScale(scrollingKeystrokesBank);
    document.getElementById('keystrokes-bank2').textContent = formatShortScale(scrollingKeystrokesBank);
    //document.getElementById('keystrokes-bank').textContent = formatShortScale(keystrokesBank);
    //document.getElementById('keystrokes-bank2').textContent = formatShortScale(keystrokesBank);
    document.getElementById('total-research').textContent = formatShortScale(totalResearchPoints);
    document.getElementById('researchPoints').textContent = formatShortScale(totalResearchPoints);
    
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
    document.getElementById('wpm').textContent = scrollingWpm.toFixed(2); // Update WPM display
    document.getElementById('wpm-multiplier').textContent = scrollingWpmMultiplier.toFixed(2);
    
    // Update passive income display
    document.getElementById('passive-income').textContent = formatShortScale(scrollingPassiveIncome);
    
    checkAchievements();
    displayWordle();
    displayBuildings();
    displayUpgrades();
    displayReports();
    displayArena();
    displayStockMarket();
    displayNews();
    displayBuffs();
    displayGuild();
    checkPromotion();
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

function showNotification(head, message, background) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundImage = background;
    notification.innerHTML = `
    <div class="notification-body">
        <div class="notification-header">${head}</div>
        <div class="notification-section">${message}</div>
    </div>
    `;
    
    container.appendChild(notification);
    
    // Remove the notification after it fades out
    setTimeout(() => {
        container.removeChild(notification);
    }, 7000);
}

function formatShortScale(number) {
    if (!Number.isFinite(number)) return '∞'; // Handle infinite numbers
    if (number === 0) return '0'; // Handle zero
    
    const suffixes = [
        '', 'k', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 
        'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion', 
        'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion', 
        'quindecillion', 'sexdecillion', 'septendecillion', 'octodecillion', 
        'novemdecillion', 'vigintillion'
    ];
    const tier = Math.floor(Math.log10(Math.abs(number)) / 3); // Determine the tier (1000^tier)
    
    if (tier === 0 || number < 1000) return number.toFixed(2); // For numbers below 1000, return as is
    
    const scaled = number / Math.pow(10, tier * 3); // Scale the number to its tier
    const suffix = suffixes[tier] || `e${tier * 3}`; // Fallback to scientific notation for very large numbers
    
    return `${scaled.toFixed(2)} ${suffix}`; 
}

function renderGameKeyboard() {
    const keyboardContainer = document.getElementById('game-keyboard');
    keyboardContainer.innerHTML = '';
    const layout = keyboardLayouts[keyboardLayout].row;
    const margins = keyboardLayouts[keyboardLayout].margins;
    const bumps = keyboardLayouts[keyboardLayout].bumps;
    layout.forEach((row, index) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'game-keyboard-row';
        rowElement.style.marginLeft = margins[index];
        row.split('').forEach(key => {
            const keyElement = document.createElement('div');
            keyElement.className = 'game-key';
            if(bumps.includes(key)) keyElement.classList.add('bump');
            if(!legalKeys.includes(key)) keyElement.classList.add('disabled');
            keyElement.textContent = key;
            keyElement.setAttribute('data-key', key);
            rowElement.appendChild(keyElement);
        });
        keyboardContainer.appendChild(rowElement);
    });
    document.getElementById('hand').style.marginLeft = keyboardLayouts[keyboardLayout].handMargin;
}



function highlightNextKey() {
    let mistakeFound = false;
    const inputText = document.getElementById('input-box').value.trim();
    for(let i = 0; i < inputText.length; i++) {
        if(inputText[i] !== wordsToType[0][i]) {
            mistakeFound = true;
            break;
        }
    }
    if(inputText.length > wordsToType[0].length) mistakeFound = true;
    if(inputText.length === 0) mistakeFound = false;
    if(mistakeFound) {
        document.querySelectorAll('.game-key').forEach(keyElement => {
            keyElement.classList.remove('highlight');
            keyElement.classList.add('invalid');
        }); 
        document.querySelectorAll('.finger').forEach(finger => {
            finger.classList.remove('highlight-finger');
        });
    } else {
        if(inputText.length === wordsToType[0].length) {
            document.querySelectorAll('.game-key').forEach(keyElement => {
                keyElement.classList.remove('invalid');
                keyElement.classList.add('highlight');
            }); 
        } else {
            const nextKey = wordsToType[0][inputText.length].toUpperCase();
            document.querySelectorAll('.game-key').forEach(keyElement => {
                keyElement.classList.remove('invalid');
                if (keyElement.getAttribute('data-key') === nextKey) {
                    keyElement.classList.add('highlight');
                } else {
                    keyElement.classList.remove('highlight');
                }
            });
            
            const fingerName = getProperFingerName(keyboardLayout, nextKey.toUpperCase());
            document.querySelectorAll('.finger').forEach(finger => {
                finger.classList.remove('highlight-finger');
                finger.classList.remove('toprow');
                finger.classList.remove('midrow');
                finger.classList.remove('botrow');
            });
            const fingerElement = document.getElementById(fingerName.toLowerCase().replace(' ', '-'));
            if(fingerElement) {
                document.getElementById('finger-guide').innerHTML = `Use your <strong>${fingerName}</strong> finger to type the next key.`;
                fingerElement.classList.add('highlight-finger');
                const rowIndex = keyboardLayouts[keyboardLayout].row.findIndex(row => row.includes(nextKey));
                if (rowIndex === 0) {
                    fingerElement.classList.add('toprow');
                } else if (rowIndex === 1) {
                    fingerElement.classList.add('midrow');
                } else if (rowIndex === 2) {
                    fingerElement.classList.add('botrow');
                }
            } else {
                document.getElementById('finger-guide').textContent = '';
            }
        }
    }
}

function switchTab(activeTab) {
    currentPage = activeTab.id;
    for (const key in tabs) {
        if (tabs[key].tab === activeTab) {
            tabs[key].page.style.display = "block";
            if(tabs[key].sidePanel) {
                tabs[key].sidePanel.style.display = "block";
            }
            tabs[key].tab.classList.add("active");
        } else {
            tabs[key].page.style.display = "none";
            if(tabs[key].sidePanel) {
                tabs[key].sidePanel.style.display = "none";
            }
            tabs[key].tab.classList.remove("active");
        }
    }
    document.body.className = `${currentTheme} ${currentPage}`;
    if(currentPage === 'main-tab') {
        document.getElementById('input-box').focus();
    }
    playMenuSound();
}
function applyTheme() {
    document.body.className = `${currentTheme} ${currentPage}`;
}
function sendHeartbeat() {
    if(window.location.host !== 'www.typeidle.com' && window.location.host !== 'typeidle.com') return; // Don't send heartbeats in development
    fetch('heartbeat.php', {
        method: 'POST',
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log('Heartbeat sent successfully:', data);
    })
    .catch(error => {
        console.error('There was a problem with the heartbeat request:', error);
    });
}



