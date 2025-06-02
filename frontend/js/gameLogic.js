// js/gameLogic.js
import { CONFIG } from './config.js';
import { saveData, loadData, TEAM_RECORDS_KEY, PLAYER_STATS_KEY } from './storageUtils.js';
import { updateOutcomeText, triggerScoreFlash } from './ui.js';

let gameState = {
    currentInning: 1,
    halfInning: "top",
    outs: 0,
    bases: [null, null, null], // [runnerOnFirst, runnerOnSecond, runnerOnThird]
    activePitcher: null,
    activeBatter: null,
    gameStarted: false,
    gameOver: false,
    awayStartingPitcherThisGame: null,
    homeStartingPitcherThisGame: null,
};

export function getGameState() { return { ...gameState }; }

/**
 * Initializes a new game.
 * @param {object} gameTeams - Object containing away and home team data.
 * @param {number} awayStarterRotationIndex - Index of the away team's starting pitcher in their rotation.
 * @param {number} homeStarterRotationIndex - Index of the home team's starting pitcher in their rotation.
 */
export function initializeGame(gameTeams, awayStarterRotationIndex, homeStarterRotationIndex) {
    gameState.currentInning = 1;
    gameState.halfInning = "top";
    gameState.outs = 0;
    gameState.bases = [null, null, null];
    gameState.gameStarted = true;
    gameState.gameOver = false;

    for (const teamKey in gameTeams) {
        gameTeams[teamKey].scorePerInning = Array(CONFIG.innings).fill(0);
        gameTeams[teamKey].totalRuns = 0;
        gameTeams[teamKey].totalHits = 0;
        gameTeams[teamKey].totalErrors = 0;
        gameTeams[teamKey].currentBatterIndex = 0;
        
        if (gameTeams[teamKey].batters) {
            gameTeams[teamKey].batters.forEach(batter => {
                batter.atBats = 0;
                batter.hits = 0;
                batter.runsBattedIn = 0;
                batter.gameHomeRuns = 0;
                batter.atBatHistory = [];
                batter.performanceString = "0-0";
                // Ensure mapping for new attributes if not already present, or adjust simulateAtBat
                // batter.pow = batter.power; // Example if mapping directly
                // batter.hit = batter.hitRate;
                // batter.eye = batter.contact;
            });
        }
        if (gameTeams[teamKey].pitchers) {
            if (gameTeams[teamKey].pitchers.startersRotation) {
                gameTeams[teamKey].pitchers.startersRotation.forEach(pitcher => {
                    if (pitcher) {
                        pitcher.currentStamina = pitcher.maxStamina;
                        pitcher.gameStrikeouts = 0;
                        pitcher.gameOutsRecorded = 0;
                        pitcher.gameRunsAllowed = 0;
                    }
                });
            }
            ['reliever', 'closer'].forEach(role => {
                const pitcher = gameTeams[teamKey].pitchers[role];
                if (pitcher) {
                    pitcher.currentStamina = pitcher.maxStamina;
                    pitcher.gameStrikeouts = 0;
                    pitcher.gameOutsRecorded = 0;
                    pitcher.gameRunsAllowed = 0;
                }
            });
        }
    }

    const awayStarters = gameTeams.away.pitchers.startersRotation;
    const homeStarters = gameTeams.home.pitchers.startersRotation;

    gameState.awayStartingPitcherThisGame = awayStarters && awayStarters.length > 0 ? awayStarters[awayStarterRotationIndex % awayStarters.length] : null;
    gameState.homeStartingPitcherThisGame = homeStarters && homeStarters.length > 0 ? homeStarters[homeStarterRotationIndex % homeStarters.length] : null;
    
    gameState.activePitcher = gameState.homeStartingPitcherThisGame || gameTeams.home.pitchers.reliever || gameTeams.home.pitchers.closer;
    gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];

    if (!gameState.activePitcher) {
        console.error("CRITICAL: No starting pitcher available for home team.");
    }
    if (!gameState.activeBatter) {
        console.error("CRITICAL: No starting batter available for away team.");
    }
    console.log(`Game initialized. Away Starter: ${gameState.awayStartingPitcherThisGame?.name}, Home Starter: ${gameState.homeStartingPitcherThisGame?.name}`);
}

/**
 * Simulates an at-bat by calling the backend API.
 * @param {object} batter - The current batter object.
 * @param {object} pitcher - The current pitcher object.
 * @returns {Promise<object>} A promise that resolves to an object representing the at-bat outcome.
 */
async function simulateAtBat(batter, pitcher) {
    console.log(`Simulating at-bat for: <span class="math-inline">\{batter\.name\} \(POW\:</span>{batter.power}, HIT:<span class="math-inline">\{batter\.hitRate\}, EYE\:</span>{batter.contact}) vs ${pitcher.name}`); // 這裡的 log 仍用舊名

    const batterApiAttributes = {
        // 假設 teamsData.js 中的 batter.power, batter.hitRate, batter.contact 已經是後端尺度
        // 如果您在 teamsData.js 中已將屬性名改為 pow, hit, eye，則用 batter.pow, batter.hit, batter.eye
        pow: batter.power || 70,     // 直接使用，不再乘以 9.9。提供預設值以防萬一。
        hit: batter.hitRate || 70,   // 直接使用
        eye: batter.contact || 70,   // 直接使用
        hbp_rate: batter.hbp_rate || 0.010
    };
    // Log the attributes being sent to the API (這些應該是後端尺度的大數值了)
    console.log("[Frontend] Attributes sent to API (backend scale):", batterApiAttributes);



    try {
        const response = await fetch('http://localhost:8000/api/v1/simulate_at_bat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(batterApiAttributes),
        });

        if (!response.ok) {
            const errorText = await response.text(); // Get more error details
            console.error(`API Error: ${response.status} - ${response.statusText}`, errorText);
            return {
                event: "OUT",
                description: `${batter.name} hits into an out (API error: ${response.status}). `,
                batter,
                pitcher,
                basesAdvanced: 0
            };
        }

        const apiResult = await response.json();
        const apiOutcome = apiResult.outcome;

        let gameEvent;
        let description = "";
        let basesAdvanced = 0;

        switch (apiOutcome) {
            case "1B":
                gameEvent = "SINGLE";
                description = `${batter.name} hits a SINGLE! `;
                basesAdvanced = 1;
                break;
            case "2B":
                gameEvent = "DOUBLE";
                description = `${batter.name} hits a DOUBLE! `;
                basesAdvanced = 2;
                break;
            case "HR":
                gameEvent = "HOMERUN";
                description = `HOME RUN for ${batter.name}!! `;
                basesAdvanced = 4;
                break;
            case "BB":
                gameEvent = "WALK";
                description = `${batter.name} draws a WALK. `;
                basesAdvanced = 1; // Batter to first, specific runner advancement handled in processAtBatOutcome
                break;
            case "K":
                gameEvent = "STRIKEOUT";
                description = `${batter.name} STRIKES OUT! `;
                break;
            case "IPO":
                gameEvent = "OUT";
                const outTypes = ["grounds out", "flies out", "lines out", "pops up"];
                const randomOutDesc = outTypes[Math.floor(Math.random() * outTypes.length)];
                description = `${batter.name} ${randomOutDesc}. `;
                break;
            case "HBP":
                gameEvent = "HBP";
                description = `${batter.name} is HIT BY PITCH! `;
                basesAdvanced = 1; // Batter to first
                break;
            default:
                console.warn(`Unknown API outcome: ${apiOutcome}. Defaulting to OUT.`);
                gameEvent = "OUT";
                description = `${batter.name} hits into an out (unknown API outcome). `;
        }

        return {
            event: gameEvent,
            description: description,
            batter: batter,
            pitcher: pitcher,
            basesAdvanced: basesAdvanced,
            // rawProbabilities: apiResult.probabilities // Optional: for debugging
        };

    } catch (error) {
        console.error("Failed to fetch at-bat simulation from API:", error);
        return {
            event: "OUT",
            description: `${batter.name} hits into an out (Network error). `,
            batter,
            pitcher,
            basesAdvanced: 0
        };
    }
}


/**
 * Processes the outcome of an at-bat, updating game state, scores, and player stats.
 * @param {object} atBatOutcome - The outcome object from simulateAtBat.
 * @param {object} gameTeams - Object containing away and home team data.
 */
function processAtBatOutcome(atBatOutcome, gameTeams) {
    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    let outcomeString = atBatOutcome.description;
    let outcomeTypeForUI = atBatOutcome.event; // This will be like "SINGLE", "HOMERUN", "OUT"
    let runsScoredThisPlay = 0;
    let isHit = false;
    let isAtBat = true; // Most events are At-Bats, except BB, HBP, etc.
    const batter = atBatOutcome.batter;
    const pitcher = atBatOutcome.pitcher; 
    let historyCode = "OUT"; // For batter's atBatHistory

    switch (atBatOutcome.event) {
        case "STRIKEOUT":
            historyCode = "K";
            if (pitcher) pitcher.gameStrikeouts = (pitcher.gameStrikeouts || 0) + 1;
            break;
        case "WALK":
            historyCode = "BB";
            isAtBat = false;
            break;
        case "HBP": // Handle Hit By Pitch
            historyCode = "HBP";
            isAtBat = false;
            break;
        case "SINGLE":
            historyCode = "1B";
            isHit = true;
            break;
        case "DOUBLE":
            historyCode = "2B";
            isHit = true;
            break;
        case "TRIPLE": // Assuming TRIPLE might be a future outcome from API
            historyCode = "3B";
            isHit = true;
            break;
        case "HOMERUN":
            historyCode = "HR";
            isHit = true;
            if (batter) batter.gameHomeRuns = (batter.gameHomeRuns || 0) + 1;
            break;
        case "OUT": // Generic OUT event
            historyCode = "OUT"; // Or more specific if API provides later
            break;
    }

    // Update batter's game stats
    if (batter) {
        if (batter.atBatHistory) batter.atBatHistory.push(historyCode);
        if (isAtBat) batter.atBats = (batter.atBats || 0) + 1;
        if (isHit) batter.hits = (batter.hits || 0) + 1;
        batter.performanceString = `${batter.hits}-${batter.atBats}`;
    }

    // Update team's total hits
    if (isHit) battingTeam.totalHits = (battingTeam.totalHits || 0) + 1;

    // Handle outs or base advancements
    if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") {
        gameState.outs++;
        if (pitcher) pitcher.gameOutsRecorded = (pitcher.gameOutsRecorded || 0) + 1;
    } else { // Hit, Walk, HBP
        const batterMoving = atBatOutcome.batter;
        const basesToAdvanceByHit = atBatOutcome.basesAdvanced; // 1 for 1B/BB/HBP, 2 for 2B, 4 for HR
        let newBases = [...gameState.bases];

        // Advance existing runners
        for (let i = 2; i >= 0; i--) { // From 3rd base down to 1st
            if (newBases[i]) { // If there's a runner on base i
                const runner = newBases[i];
                let runnerSpecificAdvance = basesToAdvanceByHit;

                // Runner speed effect for singles and doubles (from old logic)
                if ((atBatOutcome.event === "SINGLE" || atBatOutcome.event === "DOUBLE") && CONFIG.speed) {
                     if (runner.speed > 7 && Math.random() < CONFIG.speed.runnerExtraBaseFast) runnerSpecificAdvance++;
                     else if (runner.speed > 5 && Math.random() < CONFIG.speed.runnerExtraBaseMedium) runnerSpecificAdvance++;
                }
                
                const targetBaseIndex = i + runnerSpecificAdvance;
                if (targetBaseIndex >= 3) { // Runner scores
                    runsScoredThisPlay++;
                    if (batter && (atBatOutcome.event !== "WALK" || i < 2)) { // RBI for batter unless it's a bases-loaded walk advancing this specific runner
                         // More precise RBI logic might be needed for complex walk scenarios
                        if (atBatOutcome.event !== "WALK" || (atBatOutcome.event === "WALK" && i === 2 && newBases[0] && newBases[1])) {
                             batter.runsBattedIn = (batter.runsBattedIn || 0) + 1;
                        }
                    }
                    newBases[i] = null; // Runner leaves the base
                } else { // Runner advances to another base
                    newBases[targetBaseIndex] = runner;
                    newBases[i] = null;
                }
            }
        }
        
        // Place the batter
        if (atBatOutcome.event === "HOMERUN") { // Batter scores
            runsScoredThisPlay++;
            if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1;
            // Batter doesn't occupy a base after HR
        } else if (atBatOutcome.event === "WALK" || atBatOutcome.event === "HBP") {
            // Force runners for walk/HBP
            if (newBases[0]) { // Runner on 1st
                if (newBases[1]) { // Runner on 2nd
                    if (newBases[2]) { // Runner on 3rd (scores on bases loaded walk/HBP)
                        runsScoredThisPlay++;
                        if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; // RBI for batter
                        newBases[2] = null; // Runner from 3rd scores
                    }
                    newBases[2] = newBases[1]; // Runner from 2nd to 3rd
                }
                newBases[1] = newBases[0]; // Runner from 1st to 2nd
            }
            newBases[0] = batterMoving; // Batter to 1st
        } else if (basesToAdvanceByHit > 0 && basesToAdvanceByHit <= 3) { // Single, Double, Triple
            newBases[basesToAdvanceByHit - 1] = batterMoving;
        }
        gameState.bases = [...newBases];
    }

    // Update pitcher's game stats
    if (pitcher) {
         // Outs recorded already handled above for STRIKEOUT/OUT
         if (runsScoredThisPlay > 0) {
             pitcher.gameRunsAllowed = (pitcher.gameRunsAllowed || 0) + runsScoredThisPlay;
         }
    }

    // Update score and UI
    if (runsScoredThisPlay > 0) {
        const inningIndex = gameState.currentInning - 1;
        if (inningIndex >= 0 && inningIndex < CONFIG.innings) {
            battingTeam.scorePerInning[inningIndex] = (battingTeam.scorePerInning[inningIndex] || 0) + runsScoredThisPlay;
        }
        battingTeam.totalRuns += runsScoredThisPlay;
        outcomeString += ` (${runsScoredThisPlay} run${runsScoredThisPlay > 1 ? 's' : ''} scored!)`;
        triggerScoreFlash(runsScoredThisPlay);
    }
    updateOutcomeText(outcomeString, outcomeTypeForUI); // outcomeTypeForUI is "SINGLE", "HOMERUN", etc.
}


/**
 * Changes the half-inning or ends the game if applicable.
 * @param {object} gameTeams - Object containing away and home team data.
 */
export function changeHalfInning(gameTeams) {
    const teamThatBattedKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const teamThatBatted = gameTeams[teamThatBattedKey];
    const inningIndex = gameState.currentInning - 1;

    // Ensure score for the completed half-inning is recorded (even if 0)
    if (inningIndex >= 0 && inningIndex < CONFIG.innings) {
        teamThatBatted.scorePerInning[inningIndex] = teamThatBatted.scorePerInning[inningIndex] || 0;
    }

    gameState.outs = 0;
    gameState.bases = [null, null, null];
    updateOutcomeText("Change Side.", "GAME_EVENT");

    const fieldingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away'; // Team that will now pitch
    const newBattingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away'; // Team that will now bat

    if (gameState.halfInning === "top") { // Away team just finished batting, now Home team bats
        gameState.halfInning = "bottom";
        // Away team is now pitching. Select their pitcher.
        gameState.activePitcher = gameState.awayStartingPitcherThisGame; // Start with their starter
        if (!gameState.activePitcher || (gameState.activePitcher.currentStamina < 30 && gameState.activePitcher.role === 'Starter')) {
            gameState.activePitcher = gameTeams.away.pitchers.reliever || gameTeams.away.pitchers.closer || gameState.awayStartingPitcherThisGame;
        }
        gameState.activeBatter = gameTeams.home.batters[gameTeams.home.currentBatterIndex];

        // Check for walk-off win in bottom of 9th or later
        if (gameState.currentInning >= CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
            endGame(gameTeams, `${gameTeams.home.name} win! Walk-off victory in the bottom of the ${gameState.currentInning}th.`);
            return;
        }
    } else { // Home team just finished batting, now Away team bats (new inning)
        gameState.halfInning = "top";
        gameState.currentInning++;

        if (gameState.currentInning > CONFIG.innings) { // Game should end if not tied
            if (gameTeams.home.totalRuns !== gameTeams.away.totalRuns) {
                 endGame(gameTeams);
                 return;
            }
            // If tied, it's extra innings
            updateOutcomeText(`End of ${CONFIG.innings} innings. Score is tied ${gameTeams.away.totalRuns}-${gameTeams.home.totalRuns}. Entering extra innings!`, "GAME_EVENT");
        }
        // Home team is now pitching. Select their pitcher.
        gameState.activePitcher = gameState.homeStartingPitcherThisGame;
        if (!gameState.activePitcher || (gameState.activePitcher.currentStamina < 30 && gameState.activePitcher.role === 'Starter')) {
            gameState.activePitcher = gameTeams.home.pitchers.reliever || gameTeams.home.pitchers.closer || gameState.homeStartingPitcherThisGame;
        }
        gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];
    }
}

/**
 * Ends the current game, updates records and player stats.
 * @param {object} gameTeams - Object containing away and home team data.
 * @param {string} [customMessage=""] - An optional custom message to display.
 */
export function endGame(gameTeams, customMessage = "") {
    if (gameState.gameOver) return;
    gameState.gameOver = true;
    gameState.gameStarted = false; // Mark game as not actively started for UI controls

    let teamRecords = loadData(TEAM_RECORDS_KEY, {});
    const awayTeamId = gameTeams.away.id;
    const homeTeamId = gameTeams.home.id;

    if (!teamRecords[awayTeamId]) teamRecords[awayTeamId] = { name: gameTeams.away.name, wins: 0, losses: 0, starterIndex: 0 };
    if (!teamRecords[homeTeamId]) teamRecords[homeTeamId] = { name: gameTeams.home.name, wins: 0, losses: 0, starterIndex: 0 };
    
    teamRecords[awayTeamId].name = gameTeams.away.name;
    teamRecords[homeTeamId].name = gameTeams.home.name;

    let winnerKey = null;
    let loserKey = null;
    let winningPitcherForStat = null; 
    let losingPitcherForStat = null;

    // Determine winner and loser, and assign W/L to starting pitchers (simplified)
    if (gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
        winnerKey = homeTeamId; loserKey = awayTeamId;
        teamRecords[homeTeamId].wins = (teamRecords[homeTeamId].wins || 0) + 1;
        teamRecords[awayTeamId].losses = (teamRecords[awayTeamId].losses || 0) + 1;
        winningPitcherForStat = gameState.homeStartingPitcherThisGame;
        losingPitcherForStat = gameState.awayStartingPitcherThisGame;
    } else if (gameTeams.away.totalRuns > gameTeams.home.totalRuns) {
        winnerKey = awayTeamId; loserKey = homeTeamId;
        teamRecords[awayTeamId].wins = (teamRecords[awayTeamId].wins || 0) + 1;
        teamRecords[homeTeamId].losses = (teamRecords[homeTeamId].losses || 0) + 1;
        winningPitcherForStat = gameState.awayStartingPitcherThisGame;
        losingPitcherForStat = gameState.homeStartingPitcherThisGame;
    }
    // Tie game: no W/L for teams or pitchers

    // Update starter rotation index
    const awayRotationSize = gameTeams.away.pitchers.startersRotation?.length || 1;
    const homeRotationSize = gameTeams.home.pitchers.startersRotation?.length || 1;
    teamRecords[awayTeamId].starterIndex = (teamRecords[awayTeamId].starterIndex + 1) % Math.max(1, awayRotationSize);
    teamRecords[homeTeamId].starterIndex = (teamRecords[homeTeamId].starterIndex + 1) % Math.max(1, homeRotationSize);
    
    saveData(TEAM_RECORDS_KEY, teamRecords);

    // Update player career stats
    let allPlayerStats = loadData(PLAYER_STATS_KEY, {});
    function updatePlayerCareerStats(player, teamIdForStorage) {
        if (!player || !player.name) return;
        if (!allPlayerStats[teamIdForStorage]) allPlayerStats[teamIdForStorage] = { players: {} };
        if (!allPlayerStats[teamIdForStorage].players[player.name]) {
            allPlayerStats[teamIdForStorage].players[player.name] = {
                name: player.name, type: player.type,
                careerAtBats: 0, careerHits: 0, careerHomeRuns: 0, careerRunsBattedIn: 0,
                careerOutsRecorded: 0, careerRunsAllowed: 0, careerStrikeouts: 0, careerWins: 0, careerLosses: 0
            };
        }
        let targetStats = allPlayerStats[teamIdForStorage].players[player.name];

        if (player.type === 'batter') {
            targetStats.careerAtBats += (player.atBats || 0);
            targetStats.careerHits += (player.hits || 0);
            targetStats.careerHomeRuns += (player.gameHomeRuns || 0);
            targetStats.careerRunsBattedIn += (player.runsBattedIn || 0);
        } else if (player.type === 'pitcher') {
            targetStats.careerOutsRecorded += (player.gameOutsRecorded || 0);
            targetStats.careerRunsAllowed += (player.gameRunsAllowed || 0);
            targetStats.careerStrikeouts += (player.gameStrikeouts || 0);
            if (winningPitcherForStat && player.name === winningPitcherForStat.name && player.teamId === winningPitcherForStat.teamId) {
                targetStats.careerWins = (targetStats.careerWins || 0) + 1;
            }
            if (losingPitcherForStat && player.name === losingPitcherForStat.name && player.teamId === losingPitcherForStat.teamId) {
                targetStats.careerLosses = (targetStats.careerLosses || 0) + 1;
            }
        }
    }

    [gameTeams.away, gameTeams.home].forEach(team => {
        const currentTeamId = team.id;
        team.batters.forEach(batter => updatePlayerCareerStats(batter, currentTeamId));
        if (team.pitchers) {
            const allPitchersInGame = new Set(); // To avoid double counting if a pitcher re-enters (not typical but for safety)
            if(gameState.awayStartingPitcherThisGame && gameState.awayStartingPitcherThisGame.teamId === currentTeamId) allPitchersInGame.add(gameState.awayStartingPitcherThisGame);
            if(gameState.homeStartingPitcherThisGame && gameState.homeStartingPitcherThisGame.teamId === currentTeamId) allPitchersInGame.add(gameState.homeStartingPitcherThisGame);
            // Add any relief pitchers used during the game if you track them dynamically
            // For now, we only have starting pitchers in gameState for W/L.
            // To properly save all pitchers' stats, you'd need to track every pitcher who appeared.
            // Simplified: just save starters if they pitched.
            // A more robust way is to iterate through all pitchers in the roster and save if they have game stats.
            team.pitchers.startersRotation?.forEach(p => { if(p && p.gameOutsRecorded > 0) allPitchersInGame.add(p);});
            if(team.pitchers.reliever && team.pitchers.reliever.gameOutsRecorded > 0) allPitchersInGame.add(team.pitchers.reliever);
            if(team.pitchers.closer && team.pitchers.closer.gameOutsRecorded > 0) allPitchersInGame.add(team.pitchers.closer);

            allPitchersInGame.forEach(pitcher => updatePlayerCareerStats(pitcher, currentTeamId));
        }
    });
    saveData(PLAYER_STATS_KEY, allPlayerStats);

    let finalMessage = customMessage;
    if (!finalMessage) {
        const winner = gameTeams.home.totalRuns > gameTeams.away.totalRuns ? gameTeams.home : (gameTeams.away.totalRuns > gameTeams.home.totalRuns ? gameTeams.away : null);
        if (winner) {
            const loser = winner === gameTeams.home ? gameTeams.away : gameTeams.home;
            finalMessage = `${winner.name} win ${winner.totalRuns} - ${loser.totalRuns}!`;
        } else { // Tie
            finalMessage = `It's a TIE after ${gameState.currentInning > CONFIG.innings ? gameState.currentInning -1 : CONFIG.innings} innings! ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}.`;
        }
    }
    updateOutcomeText(`GAME OVER! ${finalMessage}`, "GAME_OVER");
}

/**
 * Simulates the next at-bat in the game.
 * @param {object} gameTeams - Object containing away and home team data.
 */
export async function playNextAtBat(gameTeams) { // Made async
    if (gameState.gameOver || !gameState.gameStarted) return;

    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    const fieldingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away';
    const fieldingTeam = gameTeams[fieldingTeamKey];

    if (!battingTeam || !battingTeam.batters || battingTeam.currentBatterIndex === undefined) { 
        console.error("Invalid batting team data for playNextAtBat."); 
        updateOutcomeText("Error: Batting team data missing.", "GAME_ERROR");
        gameState.gameOver = true;
        return; 
    }
    if (!fieldingTeam || !fieldingTeam.pitchers) { 
        console.error("Invalid fielding team data for playNextAtBat."); 
        updateOutcomeText("Error: Fielding team data missing.", "GAME_ERROR");
        gameState.gameOver = true;
        return; 
    }

    gameState.activeBatter = battingTeam.batters[battingTeam.currentBatterIndex];
    if (!gameState.activeBatter) {
        console.error(`Batter not found at index ${battingTeam.currentBatterIndex} for ${battingTeamKey}. Resetting index.`);
        battingTeam.currentBatterIndex = 0; // Attempt to reset
        gameState.activeBatter = battingTeam.batters[0];
        if (!gameState.activeBatter) {
            console.error("Critical error: Batter order empty or invalid after reset.");
            gameState.gameOver = true;
            updateOutcomeText("Critical Error: Invalid batter order. Game stopped.", "GAME_ERROR");
            return;
        }
    }
    
    // Ensure activePitcher is valid before API call
    if (!gameState.activePitcher) {
        console.error("Critical: Active pitcher is not set before API call. Attempting to set default.");
        // Attempt to set a default pitcher for the fielding team
        gameState.activePitcher = fieldingTeamKey === 'home' ? gameState.homeStartingPitcherThisGame : gameState.awayStartingPitcherThisGame;
        if (!gameState.activePitcher) { // Still no pitcher, try bullpen
             gameState.activePitcher = fieldingTeam.pitchers.reliever || fieldingTeam.pitchers.closer;
        }
        if (!gameState.activePitcher) { // Still no pitcher, this is a critical issue
            updateOutcomeText("Critical Error: Pitcher data missing. Game stopped.", "GAME_ERROR");
            gameState.gameOver = true;
            return;
        }
    }


    // --- PITCHER CHANGE LOGIC (Simplified, happens before at-bat) ---
    const currentPitcher = gameState.activePitcher;
    let potentialNewPitcher = null;
    const pitcherStaminaPercent = currentPitcher.currentStamina / currentPitcher.maxStamina;
    const closerMinInning = Math.max(1, CONFIG.innings - 1); // Closer might come in from 8th inning onwards

    // Conditions for pulling starter
    if (currentPitcher.role === 'Starter' && 
        (pitcherStaminaPercent < 0.35 || currentPitcher.gameOutsRecorded >= 18 /* 6 IP */)) {
        potentialNewPitcher = fieldingTeam.pitchers.reliever || fieldingTeam.pitchers.closer;
    } 
    // Conditions for pulling reliever
    else if (currentPitcher.role === 'Reliever' && 
             (pitcherStaminaPercent < 0.3 || currentPitcher.gameOutsRecorded >= 6 /* 2 IP */)) {
        potentialNewPitcher = fieldingTeam.pitchers.closer || fieldingTeam.pitchers.reliever; // Prefer closer if available
    }

    // Consider bringing in closer in late, close game situations
    const scoreDifference = Math.abs(gameTeams.away.totalRuns - gameTeams.home.totalRuns);
    const isLateGame = gameState.currentInning >= closerMinInning;
    const isCloseGame = scoreDifference <= 3;

    if (isLateGame && isCloseGame && fieldingTeam.pitchers.closer && 
        fieldingTeam.pitchers.closer !== currentPitcher && 
        fieldingTeam.pitchers.closer.currentStamina > 0) {
        // If it's a save situation or close game, and closer is fresh and not already in
        potentialNewPitcher = fieldingTeam.pitchers.closer;
    }
    
    if (potentialNewPitcher && potentialNewPitcher !== currentPitcher && potentialNewPitcher.currentStamina > 0) {
        gameState.activePitcher = potentialNewPitcher;
        updateOutcomeText(`${fieldingTeam.name} brings in ${potentialNewPitcher.role.toLowerCase()} ${potentialNewPitcher.name}.`, "GAME_EVENT");
        console.log(`Pitching change: ${fieldingTeam.name} brings in ${potentialNewPitcher.name} (Stamina: ${potentialNewPitcher.currentStamina})`);
    }
    // --- END PITCHER CHANGE LOGIC ---


    const atBatResult = await simulateAtBat(gameState.activeBatter, gameState.activePitcher); 
    
    // Reduce pitcher stamina after the at-bat
    if (gameState.activePitcher && CONFIG && CONFIG.stamina) {
        const staminaDrain = Math.floor(Math.random() * (CONFIG.stamina.depletionPerBatterMax - CONFIG.stamina.depletionPerBatterMin + 1)) + CONFIG.stamina.depletionPerBatterMin;
        gameState.activePitcher.currentStamina = Math.max(0, gameState.activePitcher.currentStamina - staminaDrain);
        console.log(`${gameState.activePitcher.name} stamina drained by ${staminaDrain}, remaining: ${gameState.activePitcher.currentStamina}`);
    }

    processAtBatOutcome(atBatResult, gameTeams);

    if (!gameState.gameOver) { // Check if processAtBatOutcome ended the game
        battingTeam.currentBatterIndex = (battingTeam.currentBatterIndex + 1) % battingTeam.batters.length;
        if (gameState.outs >= 3) {
            // Check for walk-off before changing half-inning
            if (gameState.halfInning === 'bottom' && gameState.currentInning >= CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
                // No need to call endGame here, processAtBatOutcome or the main loop should handle it if runs scored.
                // However, if it's the 3rd out and home team is leading in bottom of 9th or later, game ends.
                // This specific walk-off (3rd out but already won) is less common than a walk-off hit.
                // The primary walk-off (scoring winning run with <3 outs) is handled by endGame call in processAtBatOutcome or changeHalfInning.
                // If it's 3 outs and home team is winning in bottom 9th/extra, game is over.
                endGame(gameTeams); // Game ends if it's bottom of 9th (or later) and home leads after 3 outs.
            } else {
                changeHalfInning(gameTeams); // This might call endGame if appropriate
                if (!gameState.gameOver) { // If changeHalfInning didn't end the game
                    const newBattingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
                    gameState.activeBatter = gameTeams[newBattingTeamKey].batters[gameTeams[newBattingTeamKey].currentBatterIndex];
                }
            }
        } else { // Still < 3 outs
             gameState.activeBatter = battingTeam.batters[battingTeam.currentBatterIndex];
        }
    }

    // Final check for game end conditions not caught by specific walk-offs
    if (!gameState.gameOver && gameState.currentInning > CONFIG.innings && gameTeams.home.totalRuns !== gameTeams.away.totalRuns) {
        endGame(gameTeams);
    }
}
