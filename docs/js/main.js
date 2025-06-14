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


    // MAKE THIS FUNCTION ASYNC
    async function runSinglePlayAndUpdate() {
        if (getGameState().gameOver) {
            stopLongPressSimulation(); // This should already be handled by enableGameControls
            enableGameControls(true);
            return false;
        }
        // isLongPressSimulating = true; // This state might be managed differently if long press is refactored

        try {
            // Ensure playNextAtBat is awaited
            await playNextAtBat(currentTeamsData); 
            
            const newState = getGameState(); // Get state *after* playNextAtBat completes
            currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords); 
            updateAllDisplays(newState, currentTeamsData, currentTeamRecords);

            if (newState.gameOver) {
                stopLongPressSimulation(); // If game ends, stop any long press
                enableGameControls(true);
                return false; // Indicate simulation step should stop
            }
        } catch (error) {
            console.error("Error during simulation step:", error);
            stopLongPressSimulation();
            enableGameControls(getGameState().gameOver); // Pass current gameOver state
            return false; // Indicate simulation step should stop
        } finally {
            // isLongPressSimulating = false; // Manage this state carefully if refactoring long press
        }
        return true; // Indicate simulation step completed successfully (game not over)
    }

    let longPressActive = false; // New flag to control the async loop

    async function longPressLoop() {
        if (!longPressActive || getGameState().gameOver || !isLongPressSimulating) { // Add isLongPressSimulating check
            stopLongPressSimulation(); // Ensure controls are re-enabled correctly
            return;
        }

        const playSuccessful = await runSinglePlayAndUpdate();
        if (playSuccessful && longPressActive && isLongPressSimulating) { // Check flags again
            setTimeout(longPressLoop, SIM_INTERVAL_DELAY); // Schedule next iteration
        } else {
            stopLongPressSimulation(); // Handles gameOver or error cases from runSinglePlayAndUpdate
        }
    }

    function startLongPressSimulation() {
        if (getGameState().gameOver || isBatchSimulating || isLongPressSimulating) return; // Prevent multiple starts

        isLongPressSimulating = true; // Set flag that long press sim is active
        longPressActive = true;
        disableGameControls(DOM_ELEMENTS.nextPlayButton);
        
        longPressLoop(); // Start the async loop
    }

    function stopLongPressSimulation() {
        longPressActive = false; // Signal the loop to stop
        // isLongPressSimulating flag will be reset by enableGameControls or runSinglePlayAndUpdate if game ends
        // We need to ensure that if stopLongPressSimulation is called externally (e.g., mouseup),
        // the isLongPressSimulating state is also reset if no batch sim is running.
        if (!isBatchSimulating) { // Only enable if no other batch sim is running
            isLongPressSimulating = false; // Reset this crucial flag here
            enableGameControls(getGameState().gameOver);
        }
         // Clear any legacy interval if it was somehow set, though it shouldn't be used with the new loop
        if (longPressSimInterval) {
            clearInterval(longPressSimInterval);
            longPressSimInterval = null;
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
        DOM_ELEMENTS.simInningButton.addEventListener('click', async () => { // Make the handler async
            if (getGameState().gameOver || isLongPressSimulating || isBatchSimulating) return;

            disableGameControls(DOM_ELEMENTS.simInningButton);
            updateOutcomeText("Simulating current inning...", "GAME_EVENT");

            const initialInning = getGameState().currentInning;
            const initialHalf = getGameState().halfInning;
            
            // Helper function for simulation step, now async
            async function simulateCurrentInningStepAsync() {
                let currentSimState = getGameState();
                if (currentSimState.gameOver || 
                    ((currentSimState.currentInning !== initialInning || currentSimState.halfInning !== initialHalf) && currentSimState.outs === 0)) {
                    return true; // Indicate inning/game is done with this sim block
                }
                await playNextAtBat(currentTeamsData); // Await the play
                return false; // Indicate simulation should continue
            }

            // Loop using async/await with requestAnimationFrame for UI responsiveness
            let doneWithInning = false;
            while(!doneWithInning) {
                doneWithInning = await simulateCurrentInningStepAsync();
                if (getGameState().gameOver) break; // Exit if game ended mid-inning
                // Yield to browser for UI updates
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            
            const finalGameState = getGameState();
            currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords);
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

        // Helper function for simulation step, now async
        async function simulateGameStepAsync() {
            if (getGameState().gameOver) {
                return true; // Indicate game is done
            }
            await playNextAtBat(currentTeamsData); // Await the play
            return false; // Indicate simulation should continue
        }

        // Loop using async/await with requestAnimationFrame
        let gameIsOverSimulating = false;
        while(!gameIsOverSimulating) {
            gameIsOverSimulating = await simulateGameStepAsync();
            // Yield to browser for UI updates
            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        const finalGameState = getGameState();
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords);
        updateAllDisplays(finalGameState, currentTeamsData, currentTeamRecords);
        enableGameControls(finalGameState.gameOver);
        // The outcome text will be "GAME OVER! ..." from endGame
    }
    

    if (DOM_ELEMENTS.simGameButton) {
        DOM_ELEMENTS.simGameButton.addEventListener('click', handleSimulateGame);
    }

    async function handleSimulateMultipleGames(numberOfGames) {
        if (isLongPressSimulating || isBatchSimulating) return;

        disableGameControls(DOM_ELEMENTS.sim10GamesButton);
        // Initial message before the loop starts
        updateOutcomeText(`Preparing to simulate ${numberOfGames} games...`, "GAME_EVENT");
        
        if (DOM_ELEMENTS.sim10GamesButton) {
             DOM_ELEMENTS.sim10GamesButton.classList.add('simulating');
             DOM_ELEMENTS.sim10GamesButton.textContent = 'Simulating...';
        }

        const defaultIds = getDefaultTeamIds(); 

        for (let i = 0; i < numberOfGames; i++) {
            // --- Start of a single game simulation ---
            // Load records fresh for each game if that's the intent, 
            // or load once at the start and save at the very end for performance.
            // Current logic reloads records for each game but this might not reflect in team objects until prepareTeamsData.
            let gameSpecificTeamRecords = loadData(TEAM_RECORDS_KEY, {}); 

            const awayIdToPlay = defaultIds.awayTeamId;
            const homeIdToPlay = defaultIds.homeTeamId;

            // Ensure records exist for names and starter index
            if (!gameSpecificTeamRecords[awayIdToPlay]) {
                gameSpecificTeamRecords[awayIdToPlay] = { name: "Away Team Temp", wins: 0, losses: 0, starterIndex: 0 };
            }
            gameSpecificTeamRecords[awayIdToPlay].starterIndex = gameSpecificTeamRecords[awayIdToPlay].starterIndex || 0;

            if (!gameSpecificTeamRecords[homeIdToPlay]) {
                gameSpecificTeamRecords[homeIdToPlay] = { name: "Home Team Temp", wins: 0, losses: 0, starterIndex: 0 };
            }
            gameSpecificTeamRecords[homeIdToPlay].starterIndex = gameSpecificTeamRecords[homeIdToPlay].starterIndex || 0;
            
            // Prepare fresh game data for each game in the batch
            currentTeamsData = prepareTeamsData(awayIdToPlay, homeIdToPlay); 
            // Sync names from definitive source (teamsData via prepareTeamsData) to the records being used for this game
            gameSpecificTeamRecords[awayIdToPlay].name = currentTeamsData.away.name;
            gameSpecificTeamRecords[homeIdToPlay].name = currentTeamsData.home.name;

            initializeGame(currentTeamsData, gameSpecificTeamRecords[awayIdToPlay].starterIndex, gameSpecificTeamRecords[homeIdToPlay].starterIndex);
            
            // UI update for the start of each new game in the batch
            updateOutcomeText(`Simulating Game ${i + 1} of ${numberOfGames}...`, "GAME_EVENT_MINOR");
            // A brief pause to allow UI to update, especially the "Simulating Game X of Y" message
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay

            // THIS IS THE CORRECTED LOOP
            while (!getGameState().gameOver) {
                await playNextAtBat(currentTeamsData); // AWAIT the async function
                // No UI update here per play to speed up batch simulation
                // If you need UI updates per play even in batch mode, add them, but it will be slower.
            }
            // --- End of a single game simulation (gameState.gameOver is true) ---
            // `endGame` inside `playNextAtBat` (or its chain) should have saved teamRecords and playerStats for game `i`.
        }

        // After all games, load the final accumulated stats and records for display
        // This prepares currentTeamsData with career stats for UI, and currentTeamRecords for records display.
        currentTeamsData = prepareTeamsData(defaultIds.awayTeamId, defaultIds.homeTeamId); 
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, {}); // Load the most up-to-date records
        
        // Update all UI elements based on the state *after* all simulations
        // The getGameState() here will reflect the *last* game's final state.
        // We might want to reset or show a summary state instead.
        // For now, it updates based on the last game's state, but records will be cumulative.
        updateAllDisplays(getGameState(), currentTeamsData, currentTeamRecords); 
        enableGameControls(false); // Enable controls, assuming Sim 10 games doesn't leave a game "in progress" for Next Batter
        
        if (DOM_ELEMENTS.sim10GamesButton) {
            DOM_ELEMENTS.sim10GamesButton.disabled = false; // Explicitly enable
            DOM_ELEMENTS.sim10GamesButton.classList.remove('simulating');
            DOM_ELEMENTS.sim10GamesButton.textContent = 'Sim 10 Games';
        }
        updateOutcomeText(`${numberOfGames} games simulated. Records and player stats updated.`, "GAME_EVENT");
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
