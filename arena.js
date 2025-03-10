let raceStartTime = 0; 
let playerKeystrokes = 0;
let opponentKeystrokes = 0;
let raceActive = false;
let raceTimerStarted = false;
let practiceActive = false;
let practiceTimerStarted = false;
let arenaCurrentWordIndex = 0;
let arenaWords = [];
let playerWPM = 0;
let practiceWPM = 0;
let opponentWPM = 0;
let selectedDifficulty = "Normal";
let opponentELO = 1000;
let medalsToGain = 1;
let arenaUIState = "";
let practiceUIState = "";

const raceTargetKeystrokes = 200; // 40 words
const difficultySettings = {
    Normal: { baseELO: 1000, goldMedals: 1 },
    Hard: { baseELO: 1200, goldMedals: 2 },
    VeryHard: { baseELO: 1600, goldMedals: 3 },
};

const arenaTabs = {
    arena: {
        tab: document.getElementById("arena-stats-tab"),
        page: document.getElementById("arena-racePage")
    },
    practice: {
        tab: document.getElementById("practice-stats-tab"),
        page: document.getElementById("arena-practicePage")
    }
};

let currentArenaPage = "arena";
function switchArenaTab(activeTab) {
    currentArenaPage = activeTab.id;
    for (const key in arenaTabs) {
        if (arenaTabs[key].tab === activeTab) {
            arenaTabs[key].page.style.display = "block";
            arenaTabs[key].tab.classList.add("active");
        } else {
            arenaTabs[key].page.style.display = "none";
            arenaTabs[key].tab.classList.remove("active");
        }
    }
    playMenuSound();
}

for (const key in arenaTabs) {
    arenaTabs[key].tab.addEventListener("click", () => switchArenaTab(arenaTabs[key].tab));
}   

const difficultySelect = document.getElementById("difficulty-select");
difficultySelect.addEventListener("change", () => {
    selectedDifficulty = difficultySelect.value;
});

function displayPracticeTab() {
    if(practiceActive) {
        if(practiceUIState != "practice") {
            practiceUIState = "practice";
            document.getElementById("practice-stats").style.display = "none";
            document.getElementById("practice-input-box").value = "";
            document.getElementById("practice-race").style.display = "block";
            document.getElementById("practice-result").innerHTML = "";
            document.getElementById("practice-input-box").focus();
        }
        if(!practiceTimerStarted) return;
        const practiceDurationSeconds = (performance.now() - raceStartTime) / 1000; 
        if(practiceDurationSeconds >= 60) {
            finishPracticeRace();
        } else {
            updatePracticeProgress();
        }
    } else {
        if(practiceUIState != "init") {
            practiceUIState = "init";
            document.getElementById("practice-progress-bar").style.width = "100%";
            document.getElementById("practice-stats").style.display = "block";
            document.getElementById("practice-race").style.display = "none";
            
            // Show practice history if available
            updatePracticeHistoryDisplay();
        }
    }
}

function displayArenaTab() {
    let finishBoost = modifiers.find(modifier => modifier.name === "Race Finish Buff");
    let championBoost = modifiers.find(modifier => modifier.name === "Champion of the Arena");
    if(!finishBoost) {
        if(raceActive) {
            if(arenaUIState != "race") {
                arenaUIState = "race";
                document.getElementById("arena-stats").style.display = "none";
                document.getElementById("arena-tab").classList.remove("ready");
                document.getElementById("arena-input-box").value = "";
                document.getElementById("start-race").style.display = "none";
                document.getElementById("arena-race").style.display = "block";
                document.getElementById("arena-result").innerHTML = "";
                document.getElementById("arena-input-box").focus();
            }
        } else {
            if(arenaUIState != "init") {
                arenaUIState = "init";
                document.getElementById("arena-tab").classList.add("ready");
                document.getElementById("gold-medals").textContent = arenaGoldMedals;
                document.getElementById("arena-race").style.display = "none";
                document.getElementById("start-race").style.display = "block";
                document.getElementById("arena-stats").style.display = "block";
                document.getElementById("arena-result").innerHTML = "";
                //document.getElementById("startRaceButton").disabled = false;
            }
        }
    } else {
        if(arenaUIState != "race_end") {
            arenaUIState = "race_end";
            //document.getElementById("startRaceButton").disabled = true;
            document.getElementById("arena-stats").style.display = "block";
            document.getElementById("gold-medals").textContent = arenaGoldMedals;
            document.getElementById("start-race").style.display = "none";
            document.getElementById("arena-race").style.display = "none";
            document.getElementById("player-progress-bar").style.width = "0";
            document.getElementById("opponent-progress-bar").style.width = "0";
        }
        if(championBoost) {
            document.getElementById("arena-result").innerHTML = `
            <p>You won!</p>
            <p>Auto Writers and manually typed words boosted by 100%. Manual keystrokes gain 1% of your passive income.</p>
            <p>(Your WPM: ${playerWPM}, Opponent WPM: ${opponentWPM})</p>
            <p>You can play again in: ${(finishBoost.duration / Tickrate).toFixed(0)}s</p>`;
        } else {
            document.getElementById("arena-result").innerHTML = `
            <p>You lost!</p>
            <p>(Your WPM: ${playerWPM}, Opponent WPM: ${opponentWPM})</p>
            <p>You can play again in: ${(finishBoost.duration / Tickrate).toFixed(0)}s</p>`;
        }
    }
}
function displayArena() {
    if(TypingArena.level > 0) {
        document.getElementById("arena-tab").disabled = false;
    }
    displayArenaTab();
    displayPracticeTab();
}
function updateRaceProgress() {
    const playerProgressBar = document.getElementById("player-progress-bar");
    const opponentProgressBar = document.getElementById("opponent-progress-bar");
    
    playerProgressBar.style.width = `${(playerKeystrokes / raceTargetKeystrokes) * 100}%`;
    opponentProgressBar.style.width = `${(opponentKeystrokes / raceTargetKeystrokes) * 100}%`;
}
function updatePracticeProgress() {
    const practiceProgressBar = document.getElementById("practice-progress-bar");
    if(practiceTimerStarted) {
        const practiceDurationSeconds = (performance.now() - raceStartTime) / 1000; 
        document.getElementById("practice-time-left").textContent = (60 - practiceDurationSeconds).toFixed(0);
        practiceProgressBar.style.width = `${100 - ((practiceDurationSeconds / 60) * 100)}%`;
    } else {
        practiceProgressBar.style.width = "100%";
        document.getElementById("practice-time-left").textContent = "60";
    }
}
function startArenaRace() {
    if (raceActive || practiceActive) return;
    
    raceActive = true;
    playerKeystrokes = 0;
    opponentKeystrokes = 0;
    
    
    // Generate words for typing race
    arenaWords = [];
    for (let i = 0; i < 60; i++) {
        arenaWords.push(getRandomWord());
    }
    arenaCurrentWordIndex = 0;
    updateArenaWordList(false);
    
    const selectedDifficultyConfig = difficultySettings[selectedDifficulty];
    opponentELO = selectedDifficultyConfig.baseELO;
    medalsToGain = selectedDifficultyConfig.goldMedals;
    
    
    // Update UI
    document.getElementById("player-progress").textContent = "0";
    document.getElementById("opponent-progress").textContent = "0";
}

function startPracticeRace() {
    if (raceActive || practiceActive) return;
    
    practiceActive = true;
    playerKeystrokes = 0;
    
    
    // Generate words for typing race
    arenaWords = [];
    for (let i = 0; i < 60; i++) {
        arenaWords.push(getRandomWord());
    }
    arenaCurrentWordIndex = 0;
    updateArenaWordList(true);
    updatePracticeProgress();
}


function updateArenaWordList(practice) {
    let wordsDisplay;
    let inputBox;
    if(practice) {
        wordsDisplay = document.getElementById('practice-words-to-type');
        inputBox = document.getElementById('practice-input-box');
    } else {
        wordsDisplay = document.getElementById('arena-words-to-type');
        inputBox = document.getElementById('arena-input-box');
    }
    if(arenaCurrentWordIndex > 0) {
        let firstElement = wordsDisplay.children[0];
        const currentElement = wordsDisplay.children[arenaCurrentWordIndex];
        let toRemove = [];
        while (currentElement.getBoundingClientRect().top - 10 > firstElement.getBoundingClientRect().top) {
            toRemove.push(wordsDisplay.children[toRemove.length]);
            firstElement = wordsDisplay.children[toRemove.length];
        }
        if(toRemove.length > 0) {
            for(let i = 0; i < toRemove.length; i++) {
                wordsDisplay.removeChild(toRemove[i]);
                arenaWords.shift();
                arenaWords.push(getRandomWord());
            }
            arenaCurrentWordIndex = 0;
        }
    }
    if(wordsDisplay.children.length < arenaWords.length) {
        for(let i = wordsDisplay.children.length; i < arenaWords.length; i++) {
            const wordElement = document.createElement('div');
            wordElement.className = 'word';
            wordElement.textContent = arenaWords[i];
            wordsDisplay.appendChild(wordElement);
        }
    }
    inputBox.placeholder = `Type '${arenaWords[arenaCurrentWordIndex]}' here...`;
    arenaColorTextByCharacter('', wordsDisplay, arenaWords[arenaCurrentWordIndex], arenaCurrentWordIndex);
}

// New function to handle Arena-specific character highlighting
function arenaColorTextByCharacter(inputText, wordsDisplay, word, currentIndex) {
    let coloredText = '';
    let mistakeFound = false;
    
    // Make current word stand out
    for (let i = 0; i < wordsDisplay.children.length; i++) {
        wordsDisplay.children[i].classList.remove('current');
    }
    if (wordsDisplay.children[currentIndex]) {
        wordsDisplay.children[currentIndex].classList.add('current');
    }
    
    // Process each character
    for (let i = 0; i < word.length; i++) {
        let characterClass = '';
        
        if (i < inputText.length) {
            // User has typed this character
            if (word[i] === inputText[i] && !mistakeFound) {
                characterClass = 'character correct';
            } else {
                characterClass = 'character mistake';
                mistakeFound = true;
            }
        } else {
            // Character not yet typed
            characterClass = i === inputText.length ? 'character current' : 'character';
        }
        
        coloredText += `<span class="${characterClass}">${word[i]}</span>`;
    }
    
    if (wordsDisplay.children[currentIndex]) {
        wordsDisplay.children[currentIndex].innerHTML = coloredText;
    }
}

document.getElementById("practice-input-box").addEventListener("input", function () {
    if(!practiceTimerStarted) { 
        raceStartTime = performance.now();
        practiceTimerStarted = true;
    }
    const inputBox = document.getElementById("practice-input-box");
    const inputText = inputBox.value.trim();
    arenaColorTextByCharacter(inputText, document.getElementById('practice-words-to-type'), arenaWords[arenaCurrentWordIndex], arenaCurrentWordIndex);
    if (inputBox.value.endsWith(" ")) {
        if (inputText === arenaWords[arenaCurrentWordIndex]) {
            playerKeystrokes += inputText.length;
            arenaCurrentWordIndex++;
            updateArenaWordList(true);
            inputBox.value = "";
        } else {
            if(skipOnMistake) {
                arenaCurrentWordIndex++;
                updateArenaWordList(true);
                inputBox.value = "";
            }
        }
        
        updatePracticeProgress();
    }
});

document.getElementById("arena-input-box").addEventListener("input", function () {
    if(!raceTimerStarted) {
        raceStartTime = performance.now();
        raceTimerStarted = true;
        simulateOpponentTyping();
    }
    const inputBox = document.getElementById("arena-input-box");
    const inputText = inputBox.value.trim();
    arenaColorTextByCharacter(inputText, document.getElementById('arena-words-to-type'), arenaWords[arenaCurrentWordIndex], arenaCurrentWordIndex);
    if (inputBox.value.endsWith(" ")) {
        if (inputText === arenaWords[arenaCurrentWordIndex]) {
            playerKeystrokes += inputText.length;
            arenaCurrentWordIndex++;
            updateArenaWordList(false);
            inputBox.value = "";
        } else {
            if(skipOnMistake) {
                arenaCurrentWordIndex++;
                updateArenaWordList(false);
                inputBox.value = "";
            }
        }
        
        document.getElementById("player-progress").textContent = playerKeystrokes.toFixed(0);
        updateRaceProgress();
        if (playerKeystrokes >= raceTargetKeystrokes) {
            finishArenaRace(true);
        }
    }
});

function simulateOpponentTyping() {
    // 1) Compute the base WPM from player ELO:
    //    - 1000 ELO => 30 WPM
    //    - +/- 100 ELO => +/- 10 WPM
    let baseWPM = 30 + 10 * ((opponentELO - 1000) / 100);
    
    // 2) Clamp the minimum speed (optional)
    if (baseWPM < 1) {
        baseWPM = 1;
    }
    
    // 3) Use setInterval to update keystrokes every second
    const typingInterval = setInterval(() => {
        if (!raceActive) {
            clearInterval(typingInterval);
            return;
        }
        
        // Each second, apply a new random adjustment
        const randomAdjustment = Math.random() * 10 - 5;  // range: -5 ... +5
        const finalWPM = baseWPM + randomAdjustment;
        
        // Convert WPM -> keystrokes per second (KPS).
        // 1 word = 5 keystrokes, so 1 WPM = 5 keystrokes/min = 5/60 keystrokes/sec
        const opponentKPS = (finalWPM * 5) / 60; 
        
        // Add keystrokes each second
        opponentKeystrokes += opponentKPS;
        
        if(currentGuildTask === "arena") {
            const PlayerWPMBoost = (10 * 5) / 60;
            playerKeystrokes += PlayerWPMBoost;
            document.getElementById("player-progress").textContent = playerKeystrokes.toFixed(0);
        }
        
        updateRaceProgress();
        document.getElementById("opponent-progress").textContent = Math.min(
            opponentKeystrokes.toFixed(0),
            raceTargetKeystrokes
        );
        
        if (opponentKeystrokes >= raceTargetKeystrokes) {
            clearInterval(typingInterval);
            finishArenaRace(false);
        }
    }, 1000); // update every second
}

function finishPracticeRace() {
    practiceTimerStarted = false;
    practiceActive = false;
    const practiceEndTime = performance.now();
    const practiceDurationSeconds = (practiceEndTime - raceStartTime) / 1000; 
    // Avoid division by zero if for some reason raceDurationSeconds is 0
    const safeDuration = practiceDurationSeconds > 0 ? practiceDurationSeconds : 0.1;
    practiceWPM = Math.round((playerKeystrokes / 5) / (safeDuration / 60));
    document.getElementById("practice-result").innerHTML = `Your WPM: ${practiceWPM}`;
    
    // Save practice result to history
    const practiceResult = {
        date: Date.now(),
        wpm: practiceWPM,
        keystrokes: playerKeystrokes
    };
    
    practiceHistory.push(practiceResult);
    
    // Limit history to the most recent 100 entries
    if (practiceHistory.length > 100) {
        practiceHistory.shift();
    }
    
    // Update history graph
    updatePracticeHistoryDisplay();
    
    gtag('event', 'arena_speedtest', {
        'event_category': 'arena',
        'wpm': practiceWPM
    });
}

function finishArenaRace(playerWon) {
    raceTimerStarted = false;
    raceActive = false;
    const raceEndTime = performance.now();
    const raceDurationSeconds = (raceEndTime - raceStartTime) / 1000; 
    
    // Avoid division by zero if for some reason raceDurationSeconds is 0
    const safeDuration = raceDurationSeconds > 0 ? raceDurationSeconds : 0.1;
    playerWPM = Math.round((playerKeystrokes / 5) / (safeDuration / 60));
    opponentWPM = Math.round((opponentKeystrokes / 5) / (safeDuration / 60));
    if (playerWon) {
        arenaGoldMedals += medalsToGain;
        if(medalsToGain == 3) {
            arenaBeatVeryHard++;
        } else if(medalsToGain == 2) {
            arenaBeatHard++;
        } else if(medalsToGain == 1) {
            arenaBeatNormal++;
        }
        applyArenaChampionBuff();
        playWinSound();
        triggerWinEffect();
    } else {
        playLoseSound();
    }
    applyRaceFinishBuff();
    gtag('event', 'arena_result', {
        'event_category': 'arena',
        'player_wpm': playerWPM
    });
}

function triggerWinEffect() {
    const arenaPage = document.getElementById("arenaPage");
    const winEffect = document.createElement("div");
    winEffect.className = "win-effect";
    winEffect.innerHTML = "🏆 You Won! 🏆";
    
    arenaPage.appendChild(winEffect);
    
    setTimeout(() => {
        winEffect.remove();
    }, 3000); // Remove the effect after 3 seconds
}

function applyRaceFinishBuff() {
    spawnBoost(1);
}

function applyArenaChampionBuff() {
    spawnBoost(2);
}

// Function to update the practice history display
function updatePracticeHistoryDisplay() {
    const historySection = document.getElementById('practice-history-section');
    
    if (practiceHistory.length === 0) {
        return;
    }
    
    historySection.style.display = 'block';
    
    // Calculate statistics
    const wpmValues = practiceHistory.map(entry => entry.wpm);
    const averageWPM = wpmValues.reduce((sum, wpm) => sum + wpm, 0) / wpmValues.length;
    const bestWPM = Math.max(...wpmValues);
    const recentTrend = calculateRecentTrend();
    
    // Update statistics display
    document.getElementById('practice-average-wpm').textContent = averageWPM.toFixed(1);
    document.getElementById('practice-best-wpm').textContent = bestWPM;
    document.getElementById('practice-count').textContent = practiceHistory.length;
    
    const trendElement = document.getElementById('practice-trend');
    if (recentTrend > 0) {
        trendElement.textContent = `+${recentTrend.toFixed(1)}`;
        trendElement.className = 'trend-up';
    } else if (recentTrend < 0) {
        trendElement.textContent = `${recentTrend.toFixed(1)}`;
        trendElement.className = 'trend-down';
    } else {
        trendElement.textContent = '0';
        trendElement.className = '';
    }
    
    // Update chart
    updatePracticeHistoryChart();
}

// Function to calculate the recent trend (comparing last 5 tests to previous 5)
function calculateRecentTrend() {
    if (practiceHistory.length < 10) return 0;
    
    const recentTests = practiceHistory.slice(-5);
    const previousTests = practiceHistory.slice(-10, -5);
    
    const recentAvg = recentTests.reduce((sum, entry) => sum + entry.wpm, 0) / recentTests.length;
    const previousAvg = previousTests.reduce((sum, entry) => sum + entry.wpm, 0) / previousTests.length;
    
    return recentAvg - previousAvg;
}

// Function to create and update the practice history chart
function updatePracticeHistoryChart() {
    const ctx = document.getElementById('practice-history-chart').getContext('2d');
    
    // Prepare data for the chart
    const displayData = practiceHistory.slice(-30); // Show up to 30 most recent tests
    
    const labels = displayData.map(entry => {
        const date = new Date(entry.date);
        return `${date.getMonth()+1}/${date.getDate()}`;
    });
    
    const data = displayData.map(entry => entry.wpm);
    
    // Destroy existing chart if it exists
    if (window.practiceHistoryChart) {
        window.practiceHistoryChart.destroy();
    }
    
    // Create new chart
    window.practiceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'WPM',
                data: data,
                borderColor: getComputedStyle(document.body).getPropertyValue('--correct-color'),
                backgroundColor: getComputedStyle(document.body).getPropertyValue('--correct-color') + '33',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--body-color')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border') + '33'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--body-color')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border') + '33'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--body-color')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const entry = displayData[context.dataIndex];
                            const date = new Date(entry.date);
                            return [`WPM: ${entry.wpm}`, 
                                    `Date: ${date.toLocaleDateString()}`, 
                                    `Time: ${date.toLocaleTimeString()}`];
                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
