// js/main.js
import { loadData, TEAM_RECORDS_KEY, PLAYER_STATS_KEY, clearSavedData } from './storageUtils.js';
import { prepareTeamsData, getDefaultTeamIds } from './playerUtils.js';
import { DOM_ELEMENTS, initializeUI, updateAllDisplays, updateOutcomeText } from './ui.js';
import { initializeGame, playNextAtBat, getGameState, changeHalfInning, endGame } from './gameLogic.js';

document.addEventListener('DOMContentLoaded', () => {
    const { awayTeamId, homeTeamId } = getDefaultTeamIds(); // 確保 DOM_ELEMENTS 已被 ui.js 初始化

    let currentTeamsData = prepareTeamsData(awayTeamId, homeTeamId);
    let currentTeamRecords = loadData(TEAM_RECORDS_KEY, {});

    if (!currentTeamRecords[awayTeamId]) {
        currentTeamRecords[awayTeamId] = { name: currentTeamsData.away.name, wins: 0, losses: 0, starterIndex: 0 };
    } else {
        currentTeamRecords[awayTeamId].name = currentTeamsData.away.name;
        currentTeamRecords[awayTeamId].starterIndex = currentTeamRecords[awayTeamId].starterIndex || 0;
    }
    if (!currentTeamRecords[homeTeamId]) {
        currentTeamRecords[homeTeamId] = { name: currentTeamsData.home.name, wins: 0, losses: 0, starterIndex: 0 };
    } else {
        currentTeamRecords[homeTeamId].name = currentTeamsData.home.name;
        currentTeamRecords[homeTeamId].starterIndex = currentTeamRecords[homeTeamId].starterIndex || 0;
    }

    initializeUI(currentTeamsData, currentTeamRecords);

    let longPressSimInterval = null;
    let isLongPressSimulating = false;
    let isBatchSimulating = false;
    let pressTimer = null;
    const LONG_PRESS_DURATION = 400;
    const SIM_INTERVAL_DELAY = 100;

    function disableGameControls(simulatingWhichButton = null) {
        isBatchSimulating = true;
        DOM_ELEMENTS.nextPlayButton.disabled = true;
        if (DOM_ELEMENTS.simInningButton) DOM_ELEMENTS.simInningButton.disabled = true;
        if (DOM_ELEMENTS.simGameButton) DOM_ELEMENTS.simGameButton.disabled = true;
        if (DOM_ELEMENTS.sim10GamesButton) DOM_ELEMENTS.sim10GamesButton.disabled = true;

        if (simulatingWhichButton && DOM_ELEMENTS[simulatingWhichButton.id]) {
            DOM_ELEMENTS[simulatingWhichButton.id].classList.add('simulating');
            DOM_ELEMENTS[simulatingWhichButton.id].textContent = 'Simulating...';
        }
    }

    function enableGameControls(gameOver = false) {
        isBatchSimulating = false;
        const originalButtonTexts = {
            nextPlayButton: 'Next Batter',
            simInningButton: 'Sim Inning',
            simGameButton: 'Sim Game',
            sim10GamesButton: 'Sim 10 Games'
        };

        if (DOM_ELEMENTS.nextPlayButton) {
            DOM_ELEMENTS.nextPlayButton.disabled = gameOver;
            DOM_ELEMENTS.nextPlayButton.classList.remove('simulating');
            DOM_ELEMENTS.nextPlayButton.textContent = originalButtonTexts.nextPlayButton;
        }
        if (DOM_ELEMENTS.simInningButton) {
            DOM_ELEMENTS.simInningButton.disabled = gameOver;
            DOM_ELEMENTS.simInningButton.classList.remove('simulating');
            DOM_ELEMENTS.simInningButton.textContent = originalButtonTexts.simInningButton;
        }
        if (DOM_ELEMENTS.simGameButton) {
            DOM_ELEMENTS.simGameButton.disabled = gameOver;
            DOM_ELEMENTS.simGameButton.classList.remove('simulating');
            DOM_ELEMENTS.simGameButton.textContent = originalButtonTexts.simGameButton;
        }
        if (DOM_ELEMENTS.sim10GamesButton) {
            DOM_ELEMENTS.sim10GamesButton.disabled = false;
            DOM_ELEMENTS.sim10GamesButton.classList.remove('simulating');
            DOM_ELEMENTS.sim10GamesButton.textContent = originalButtonTexts.sim10GamesButton;
        }

         if (gameOver) {
            if(DOM_ELEMENTS.simulationControlsContainer) DOM_ELEMENTS.simulationControlsContainer.style.display = 'none';
            if(DOM_ELEMENTS.nextPlayButton) DOM_ELEMENTS.nextPlayButton.style.display = 'none';
            if(DOM_ELEMENTS.startGameButton) DOM_ELEMENTS.startGameButton.style.display = 'inline-block';
        }
    }

    function runSinglePlayAndUpdate() {
        if (getGameState().gameOver) {
            stopLongPressSimulation();
            enableGameControls(true);
            return false;
        }
        isLongPressSimulating = true;
        try {
            playNextAtBat(currentTeamsData); // gameLogic's endGame will handle saving teamRecords
            const newState = getGameState();
            currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords); // Reload records to get updated starterIndex
            updateAllDisplays(newState, currentTeamsData, currentTeamRecords);

            if (newState.gameOver) {
                stopLongPressSimulation();
                enableGameControls(true);
                return false;
            }
        } catch (error) {
            console.error("Error during simulation step:", error);
            stopLongPressSimulation();
            enableGameControls(getGameState().gameOver);
            return false;
        } finally {
            isLongPressSimulating = false;
        }
        return true;
    }

    function startLongPressSimulation() {
        if (longPressSimInterval || getGameState().gameOver || isBatchSimulating) return;
        isLongPressSimulating = true;
        disableGameControls(DOM_ELEMENTS.nextPlayButton);
        
        longPressSimInterval = setInterval(() => {
            if (!runSinglePlayAndUpdate()) {
                stopLongPressSimulation();
            }
        }, SIM_INTERVAL_DELAY);
    }

    function stopLongPressSimulation() {
        if (longPressSimInterval) {
            clearInterval(longPressSimInterval);
            longPressSimInterval = null;
        }
        isLongPressSimulating = false;
        if (!isBatchSimulating) {
            enableGameControls(getGameState().gameOver);
        }
    }

    // 新增 Enter 鍵事件監聽器
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            // 防止在焦點於按鈕時觸發兩次點擊
            if (document.activeElement && (document.activeElement.tagName === 'BUTTON' || document.activeElement.tagName === 'A')) {
                 // 如果焦點在按鈕上，讓按鈕的默認 Enter 行為執行，或者我們可以選擇阻止它並自己處理
                 // 為了簡化，如果焦點在按鈕上，我們這裡可以 return，讓按鈕自己處理 Enter
                 // 但如果希望 Enter 總是執行我們的邏輯，則移除此 return，並在下方 click() 後 event.preventDefault()
                 return; 
            }
            event.preventDefault(); // 阻止例如表單提交等默認行為

            const gameState = getGameState(); // 獲取當前遊戲狀態

            if (DOM_ELEMENTS.startGameButton && DOM_ELEMENTS.startGameButton.style.display !== 'none') {
                DOM_ELEMENTS.startGameButton.click();
            } else if (DOM_ELEMENTS.nextPlayButton && DOM_ELEMENTS.nextPlayButton.style.display !== 'none' && !DOM_ELEMENTS.nextPlayButton.disabled && !gameState.gameOver) {
                DOM_ELEMENTS.nextPlayButton.click();
            }
            // 可以考慮加入對其他模擬按鈕的判斷，但題目主要提到 "current simulation option" 應該是指 "Next Batter"
        }
    });

    DOM_ELEMENTS.startGameButton.addEventListener('click', () => {
        stopLongPressSimulation();
        isBatchSimulating = false;
        
        const defaultIds = getDefaultTeamIds(); 
        const awayIdToPlay = defaultIds.awayTeamId; 
        const homeIdToPlay = defaultIds.homeTeamId; 

        currentTeamsData = prepareTeamsData(awayIdToPlay, homeIdToPlay);
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, {}); 
        
        if (!currentTeamRecords[awayIdToPlay]) {
            currentTeamRecords[awayIdToPlay] = { name: currentTeamsData.away.name, wins: 0, losses: 0, starterIndex: 0 };
        } else {
            currentTeamRecords[awayIdToPlay].name = currentTeamsData.away.name; // Sync name
            currentTeamRecords[awayIdToPlay].starterIndex = currentTeamRecords[awayIdToPlay].starterIndex || 0;
        }
        if (!currentTeamRecords[homeIdToPlay]) {
            currentTeamRecords[homeIdToPlay] = { name: currentTeamsData.home.name, wins: 0, losses: 0, starterIndex: 0 };
        } else {
            currentTeamRecords[homeIdToPlay].name = currentTeamsData.home.name; // Sync name
            currentTeamRecords[homeIdToPlay].starterIndex = currentTeamRecords[homeIdToPlay].starterIndex || 0;
        }
        
        initializeGame(currentTeamsData, currentTeamRecords[awayIdToPlay].starterIndex, currentTeamRecords[homeIdToPlay].starterIndex);
        
        const currentGameState = getGameState();
        updateAllDisplays(currentGameState, currentTeamsData, currentTeamRecords);

        DOM_ELEMENTS.startGameButton.style.display = 'none';
        DOM_ELEMENTS.nextPlayButton.style.display = 'inline-block';
        if (DOM_ELEMENTS.simulationControlsContainer) {
            DOM_ELEMENTS.simulationControlsContainer.style.display = 'flex';
        }
        enableGameControls(false);
        updateOutcomeText(`Game started! ${currentTeamsData.away.name} vs ${currentTeamsData.home.name}.`, "GAME_EVENT");
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('click', () => {
        if (!pressTimer && !longPressSimInterval && !isBatchSimulating) {
            runSinglePlayAndUpdate();
        }
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mousedown', (e) => {
        if (getGameState().gameOver || longPressSimInterval || isBatchSimulating) return;
        if (e.button !== 0) return;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
            pressTimer = null;
            if (!getGameState().gameOver) {
                 startLongPressSimulation();
            }
        }, LONG_PRESS_DURATION);
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
        pressTimer = null;
        stopLongPressSimulation();
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        pressTimer = null;
        if (longPressSimInterval) {
            stopLongPressSimulation();
        }
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('contextmenu', (e) => e.preventDefault());

    if (DOM_ELEMENTS.simInningButton) {
        DOM_ELEMENTS.simInningButton.addEventListener('click', async () => {
            if (getGameState().gameOver || isLongPressSimulating || isBatchSimulating) return;

            disableGameControls(DOM_ELEMENTS.simInningButton);
            updateOutcomeText("Simulating current inning...", "GAME_EVENT");

            const initialInning = getGameState().currentInning;
            const initialHalf = getGameState().halfInning;
            
            await new Promise(resolve => {
                function simulateCurrentInningStep() {
                    let currentSimState = getGameState();
                    if (currentSimState.gameOver || 
                        ((currentSimState.currentInning !== initialInning || currentSimState.halfInning !== initialHalf) && currentSimState.outs === 0)) {
                        resolve();
                        return;
                    }
                    playNextAtBat(currentTeamsData); 
                    currentSimState = getGameState(); 
                    if (!currentSimState.gameOver) {
                        requestAnimationFrame(simulateCurrentInningStep);
                    } else {
                        resolve(); 
                    }
                }
                requestAnimationFrame(simulateCurrentInningStep);
            });
            
            const finalGameState = getGameState();
            currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords);
            // DO NOT call prepareTeamsData here for current game's score display.
            // currentTeamsData already holds the scores for the simulated inning.
            updateAllDisplays(finalGameState, currentTeamsData, currentTeamRecords);
            enableGameControls(finalGameState.gameOver);
            if (!finalGameState.gameOver) {
                 updateOutcomeText(`Inning ${initialInning} (${initialHalf}) simulation complete.`, "GAME_EVENT");
            }
        });
    }

    async function handleSimulateGame() {
        if (getGameState().gameOver || isLongPressSimulating || isBatchSimulating) return;

        disableGameControls(DOM_ELEMENTS.simGameButton);
        updateOutcomeText("Simulating current game...", "GAME_EVENT");

        await new Promise(resolve => {
            function simulateGameStep() {
                if (getGameState().gameOver) {
                    resolve();
                    return;
                }
                playNextAtBat(currentTeamsData); 
                requestAnimationFrame(simulateGameStep);
            }
            requestAnimationFrame(simulateGameStep);
        });

        const finalGameState = getGameState();
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords);
        // DO NOT call prepareTeamsData here. currentTeamsData has the game scores.
        // If you need to refresh career stats for display AFTER this game,
        // then call prepareTeamsData, but the scoreboard will show the fresh game state (all zeros).
        // For now, we want to show the scores of the game just simulated.
        updateAllDisplays(finalGameState, currentTeamsData, currentTeamRecords);
        enableGameControls(finalGameState.gameOver);
    }

    if (DOM_ELEMENTS.simGameButton) {
        DOM_ELEMENTS.simGameButton.addEventListener('click', handleSimulateGame);
    }

    async function handleSimulateMultipleGames(numberOfGames) {
        if (isLongPressSimulating || isBatchSimulating) return;

        disableGameControls(DOM_ELEMENTS.sim10GamesButton);
        updateOutcomeText(`Simulating ${numberOfGames} games... Please wait.`, "GAME_EVENT");
        
        if (DOM_ELEMENTS.sim10GamesButton) {
             DOM_ELEMENTS.sim10GamesButton.classList.add('simulating');
             DOM_ELEMENTS.sim10GamesButton.textContent = 'Simulating...';
        }

        const defaultIds = getDefaultTeamIds(); 

        for (let i = 0; i < numberOfGames; i++) {
            currentTeamRecords = loadData(TEAM_RECORDS_KEY, {}); 
            
            const awayIdToPlay = defaultIds.awayTeamId;
            const homeIdToPlay = defaultIds.homeTeamId;

            if (!currentTeamRecords[awayIdToPlay]) {
                currentTeamRecords[awayIdToPlay] = { name: "Default Away", wins: 0, losses: 0, starterIndex: 0 };
            }
            currentTeamRecords[awayIdToPlay].starterIndex = currentTeamRecords[awayIdToPlay].starterIndex || 0;
            // Ensure name is updated from potentially fresh teamsData if we were to allow team selection
            // For now, prepareTeamsData will get the name from teamsData.js
            // currentTeamRecords[awayIdToPlay].name = currentTeamsData.away.name;


            if (!currentTeamRecords[homeIdToPlay]) {
                currentTeamRecords[homeIdToPlay] = { name: "Default Home", wins: 0, losses: 0, starterIndex: 0 };
            }
            currentTeamRecords[homeIdToPlay].starterIndex = currentTeamRecords[homeIdToPlay].starterIndex || 0;
            // currentTeamRecords[homeIdToPlay].name = currentTeamsData.home.name;


            currentTeamsData = prepareTeamsData(awayIdToPlay, homeIdToPlay); // Prepare fresh game data, loads career stats
            // Sync names back to records if prepareTeamsData got them from a definitive source (teamsData.js)
            currentTeamRecords[awayIdToPlay].name = currentTeamsData.away.name;
            currentTeamRecords[homeIdToPlay].name = currentTeamsData.home.name;


            initializeGame(currentTeamsData, currentTeamRecords[awayIdToPlay].starterIndex, currentTeamRecords[homeIdToPlay].starterIndex);
            
            updateOutcomeText(`Simulating Game ${i + 1} of ${numberOfGames}...`, "GAME_EVENT_MINOR");

            while (!getGameState().gameOver) {
                playNextAtBat(currentTeamsData); 
            }
        }

        // After all games, load the final accumulated stats and records for display
        currentTeamsData = prepareTeamsData(defaultIds.awayTeamId, defaultIds.homeTeamId); // Loads final career stats
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords); 
        
        updateAllDisplays(getGameState(), currentTeamsData, currentTeamRecords); 
        enableGameControls(false); 
        if (DOM_ELEMENTS.sim10GamesButton) {
            DOM_ELEMENTS.sim10GamesButton.disabled = false;
            DOM_ELEMENTS.sim10GamesButton.classList.remove('simulating');
            DOM_ELEMENTS.sim10GamesButton.textContent = 'Sim 10 Games';
        }
        updateOutcomeText(`${numberOfGames} games simulated. Check updated team records and player stats.`, "GAME_EVENT");
    }


    if (DOM_ELEMENTS.sim10GamesButton) {
        DOM_ELEMENTS.sim10GamesButton.addEventListener('click', () => handleSimulateMultipleGames(10));
    }

    const resetButton = document.createElement('button');
    resetButton.id = 'resetDataButton';
    resetButton.textContent = 'Reset';
    resetButton.style.position = 'fixed';
    resetButton.style.top = '10px';
    resetButton.style.right = '10px';
    resetButton.style.zIndex = '1000';
    resetButton.style.padding = '8px 12px';
    resetButton.style.backgroundColor = '#f44336';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    document.body.appendChild(resetButton);
    resetButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset ALL saved player stats and team records? This cannot be undone.")) {
            clearSavedData();
        }
    });
});
