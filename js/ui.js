// js/ui.js
import { CONFIG } from './config.js';

export const DOM_ELEMENTS = {
    // Game Controls
    startGameButton: document.getElementById('startGameButton'),
    nextPlayButton: document.getElementById('nextPlayButton'),
    simulationControlsContainer: document.querySelector('.simulation-controls'),
    simInningButton: document.getElementById('simInningButton'),
    simGameButton: document.getElementById('simGameButton'),
    sim10GamesButton: document.getElementById('sim10GamesButton'),

    // Field Header
    inningDisplay: document.getElementById('inningDisplay'),
    inningIndicator: document.querySelector('#inningDisplay .inning-indicator'),
    inningNumber: document.querySelector('#inningDisplay .inning-number'),
    outsDisplayContainer: document.getElementById('outsDisplay'),
    outLights: document.querySelectorAll('#outsDisplay .out-light'),

    // Scoreboard
    awayTeamScoreboardName: document.querySelector('#awayTeamScore .team-name'),
    homeTeamScoreboardName: document.querySelector('#homeTeamScore .team-name'),
    scoreboardTable: document.getElementById('scoreboard'),
    awayTeamScoreRow: document.getElementById('awayTeamScore'),
    homeTeamScoreRow: document.getElementById('homeTeamScore'),
    awayTeamScoreCells: document.querySelector('#awayTeamScore')?.children,
    homeTeamScoreCells: document.querySelector('#homeTeamScore')?.children,
    awayTeamTotalRunsCell: document.querySelector('#awayTeamScore .total-runs'),
    homeTeamTotalRunsCell: document.querySelector('#homeTeamScore .total-runs'),
    awayTeamTotalHitsCell: document.querySelector('#awayTeamScore .total-hits'),
    homeTeamTotalHitsCell: document.querySelector('#homeTeamScore .total-hits'),
    awayTeamTotalErrorsCell: document.querySelector('#awayTeamScore .total-errors'),
    homeTeamTotalErrorsCell: document.querySelector('#homeTeamScore .total-errors'),
    // Note: awayTeamScoreboardName and homeTeamScoreboardName are already defined above.
    // Redefining them here would be redundant.

    // Field Display
    firstBaseVisual: document.getElementById('firstBase'),
    secondBaseVisual: document.getElementById('secondBase'),
    thirdBaseVisual: document.getElementById('thirdBase'),
    runnerName1B: document.getElementById('runnerName1B'),
    runnerName2B: document.getElementById('runnerName2B'),
    runnerName3B: document.getElementById('runnerName3B'),
    scoreFlashElement: document.getElementById('scoreFlash'),

    // At-Bat Outcome
    outcomeText: document.getElementById('outcome-text'),

    // Team Panels (Desktop)
    awayTeamPanel: document.getElementById('awayTeamPanel'),
    homeTeamPanel: document.getElementById('homeTeamPanel'),
    awayTeamNameDisplayElement: document.getElementById('awayTeamNameDisplay'),
    homeTeamNameDisplayElement: document.getElementById('homeTeamNameDisplay'),
    awayCurrentPlayerDisplay: document.getElementById('awayCurrentPlayerDisplay'),
    homeCurrentPlayerDisplay: document.getElementById('homeCurrentPlayerDisplay'),
    awayTeamLineupList: document.getElementById('awayTeamLineupList'),
    homeTeamLineupList: document.getElementById('homeTeamLineupList'),
    awayTeamBullpenList: document.getElementById('awayTeamBullpenList'),
    homeTeamBullpenList: document.getElementById('homeTeamBullpenList'),
    
    // Standings Spans (will be re-acquired in initializeUI)
    awayTeamRecordSpan: null,
    homeTeamRecordSpan: null,
};

export function initializeUI(gameTeams, teamRecords) {
    // Set team names and records in the side panels
    if (DOM_ELEMENTS.awayTeamNameDisplayElement && gameTeams.away) {
        DOM_ELEMENTS.awayTeamNameDisplayElement.innerHTML = `${gameTeams.away.name} <span class="team-record" id="awayTeamRecord">(0-0)</span>`;
    }
    if (DOM_ELEMENTS.homeTeamNameDisplayElement && gameTeams.home) {
        DOM_ELEMENTS.homeTeamNameDisplayElement.innerHTML = `${gameTeams.home.name} <span class="team-record" id="homeTeamRecord">(0-0)</span>`;
    }
    
    // Get the newly created record spans
    DOM_ELEMENTS.awayTeamRecordSpan = document.getElementById('awayTeamRecord');
    DOM_ELEMENTS.homeTeamRecordSpan = document.getElementById('homeTeamRecord');

    // Update scoreboard team names with initial records
    if (DOM_ELEMENTS.awayTeamScoreboardName && gameTeams.away && teamRecords && teamRecords[gameTeams.away.id]) {
        const awayRecord = teamRecords[gameTeams.away.id];
        const awayRecordString = `(${(awayRecord.wins || 0)}-${(awayRecord.losses || 0)})`;
        DOM_ELEMENTS.awayTeamScoreboardName.textContent = `${gameTeams.away.name} ${awayRecordString}`;
    } else if (DOM_ELEMENTS.awayTeamScoreboardName && gameTeams.away) {
        DOM_ELEMENTS.awayTeamScoreboardName.textContent = `${gameTeams.away.name} (0-0)`;
    }

    if (DOM_ELEMENTS.homeTeamScoreboardName && gameTeams.home && teamRecords && teamRecords[gameTeams.home.id]) {
        const homeRecord = teamRecords[gameTeams.home.id];
        const homeRecordString = `(${(homeRecord.wins || 0)}-${(homeRecord.losses || 0)})`;
        DOM_ELEMENTS.homeTeamScoreboardName.textContent = `${gameTeams.home.name} ${homeRecordString}`;
    } else if (DOM_ELEMENTS.homeTeamScoreboardName && gameTeams.home) {
        DOM_ELEMENTS.homeTeamScoreboardName.textContent = `${gameTeams.home.name} (0-0)`;
    }
    
    // Removed redundant lines that overwrite the scoreboard name with only team name:
    // if (DOM_ELEMENTS.awayTeamScoreboardName && gameTeams.away) DOM_ELEMENTS.awayTeamScoreboardName.textContent = gameTeams.away.name;
    // if (DOM_ELEMENTS.homeTeamScoreboardName && gameTeams.home) DOM_ELEMENTS.homeTeamScoreboardName.textContent = gameTeams.home.name;
    
    // Reset inning display
    if(DOM_ELEMENTS.inningIndicator) DOM_ELEMENTS.inningIndicator.className = 'inning-indicator';
    if(DOM_ELEMENTS.inningNumber) DOM_ELEMENTS.inningNumber.textContent = '-';
    if(DOM_ELEMENTS.outLights) DOM_ELEMENTS.outLights.forEach(light => light.classList.remove('active'));
    if(DOM_ELEMENTS.outcomeText) { DOM_ELEMENTS.outcomeText.innerHTML = "Click 'Start New Game' to begin!"; DOM_ELEMENTS.outcomeText.className = ''; }

    // Reset scoreboard cells
    const awayCells = DOM_ELEMENTS.awayTeamScoreCells;
    const homeCells = DOM_ELEMENTS.homeTeamScoreCells;
    for (let i = 0; i < CONFIG.innings; i++) {
        const cellIndexInNodeListOfChildren = i + 1; // Scoreboard cells are 1-indexed after team name
        if (awayCells && awayCells[cellIndexInNodeListOfChildren]) {
            awayCells[cellIndexInNodeListOfChildren].textContent = '-';
        }
        if (homeCells && homeCells[cellIndexInNodeListOfChildren]) {
            homeCells[cellIndexInNodeListOfChildren].textContent = '-';
        }
    }
    // Reset R, H, E
    if (DOM_ELEMENTS.awayTeamTotalRunsCell) DOM_ELEMENTS.awayTeamTotalRunsCell.textContent = '0';
    if (DOM_ELEMENTS.homeTeamTotalRunsCell) DOM_ELEMENTS.homeTeamTotalRunsCell.textContent = '0';
    if (DOM_ELEMENTS.awayTeamTotalHitsCell) DOM_ELEMENTS.awayTeamTotalHitsCell.textContent = '0';
    if (DOM_ELEMENTS.homeTeamTotalHitsCell) DOM_ELEMENTS.homeTeamTotalHitsCell.textContent = '0';
    if (DOM_ELEMENTS.awayTeamTotalErrorsCell) DOM_ELEMENTS.awayTeamTotalErrorsCell.textContent = '0';
    if (DOM_ELEMENTS.homeTeamTotalErrorsCell) DOM_ELEMENTS.homeTeamTotalErrorsCell.textContent = '0';

    // Reset bases display
    if(DOM_ELEMENTS.firstBaseVisual) DOM_ELEMENTS.firstBaseVisual.classList.remove('occupied-base');
    if(DOM_ELEMENTS.secondBaseVisual) DOM_ELEMENTS.secondBaseVisual.classList.remove('occupied-base');
    if(DOM_ELEMENTS.thirdBaseVisual) DOM_ELEMENTS.thirdBaseVisual.classList.remove('occupied-base');
    if(DOM_ELEMENTS.runnerName1B) { DOM_ELEMENTS.runnerName1B.textContent = ''; DOM_ELEMENTS.runnerName1B.style.display = 'none'; }
    if(DOM_ELEMENTS.runnerName2B) { DOM_ELEMENTS.runnerName2B.textContent = ''; DOM_ELEMENTS.runnerName2B.style.display = 'none'; }
    if(DOM_ELEMENTS.runnerName3B) { DOM_ELEMENTS.runnerName3B.textContent = ''; DOM_ELEMENTS.runnerName3B.style.display = 'none'; }

    // Reset player display panels
    const waitingMessage = '<p style="text-align:center; color:#777; font-style:italic;">Waiting...</p>';
    if(DOM_ELEMENTS.awayTeamLineupList) DOM_ELEMENTS.awayTeamLineupList.innerHTML = '';
    if(DOM_ELEMENTS.homeTeamLineupList) DOM_ELEMENTS.homeTeamLineupList.innerHTML = '';
    if(DOM_ELEMENTS.awayCurrentPlayerDisplay) DOM_ELEMENTS.awayCurrentPlayerDisplay.innerHTML = waitingMessage;
    if(DOM_ELEMENTS.homeCurrentPlayerDisplay) DOM_ELEMENTS.homeCurrentPlayerDisplay.innerHTML = waitingMessage;
    if(DOM_ELEMENTS.mobileBatterDisplay) DOM_ELEMENTS.mobileBatterDisplay.innerHTML = waitingMessage;
    if(DOM_ELEMENTS.mobilePitcherDisplay) DOM_ELEMENTS.mobilePitcherDisplay.innerHTML = waitingMessage;
    
    if(DOM_ELEMENTS.awayTeamBullpenList) DOM_ELEMENTS.awayTeamBullpenList.innerHTML = '';
    if(DOM_ELEMENTS.homeTeamBullpenList) DOM_ELEMENTS.homeTeamBullpenList.innerHTML = '';

    if(DOM_ELEMENTS.awayTeamPanel) DOM_ELEMENTS.awayTeamPanel.className = 'team-panel';
    if(DOM_ELEMENTS.homeTeamPanel) DOM_ELEMENTS.homeTeamPanel.className = 'team-panel';
    
    // Hide simulation controls initially
    if (DOM_ELEMENTS.simulationControlsContainer) {
        DOM_ELEMENTS.simulationControlsContainer.style.display = 'none';
    }
    // Update standings display in panels
    updateStandingsDisplay(teamRecords, gameTeams.away?.id, gameTeams.home?.id);
}

// Helper function to get OVR color class
function getOvrColorClass(ovr) {
    if (ovr === undefined || ovr === null) return '';
    const thresholds = CONFIG.ovrColorSettings.thresholds;
    const classes = CONFIG.ovrColorSettings.classes;
    if (ovr <= thresholds.gray) return classes.gray;
    if (ovr <= thresholds.blue) return classes.blue;
    if (ovr <= thresholds.red) return classes.red;
    if (ovr <= thresholds.green) return classes.green;
    if (ovr <= thresholds.golden) return classes.golden;
    return ''; // Default if no tier matches
}

// Helper function to abbreviate player names
function abbreviatePlayerName(fullName, maxLength = 16, panelWidthChars = 15) {
    if (fullName.length <= panelWidthChars) { return fullName; }
    const parts = fullName.split(' ');
    if (parts.length > 1) {
        let abbreviated = `${parts[0][0]}. ${parts.slice(-1)[0]}`; // e.g., "A. Judge"
        if (abbreviated.length <= maxLength) { return abbreviated; }
        // If still too long, try to shorten last name part
        const lastNamePartLength = maxLength - 3; // Space for "F. " and "..."
        if (parts.slice(-1)[0].length > lastNamePartLength) {
             abbreviated = `${parts[0][0]}. ${parts.slice(-1)[0].substring(0, Math.max(1,lastNamePartLength-3))}...`; // Ensure at least 1 char of last name
             return abbreviated;
        }
        // Fallback if abbreviation logic is complex or still too long
        return fullName.substring(0, maxLength - 3) + "...";
    }
    // Single word name, just truncate
    return fullName.substring(0, maxLength - 3) + "...";
}

// Highlights the current inning column on the scoreboard
function highlightCurrentInningOnScoreboard(currentInning, gameStarted, gameOver, halfInning) {
    if (!DOM_ELEMENTS.scoreboardTable) return;
    // Remove previous highlights
    DOM_ELEMENTS.scoreboardTable.querySelectorAll('thead th, tbody td').forEach(cell => cell.classList.remove('current-inning-active'));

    if (gameStarted && !gameOver && currentInning >= 1 && currentInning <= CONFIG.innings) {
        const inningColumnIndex = currentInning; // 1-based index for columns (after team name)
        
        // Highlight header
        const headers = DOM_ELEMENTS.scoreboardTable.querySelectorAll('thead th');
        if (headers && headers.length > inningColumnIndex) headers[inningColumnIndex].classList.add('current-inning-active');
        
        // Highlight active team's current inning cell
        const activeRowCells = halfInning === 'top' ? DOM_ELEMENTS.awayTeamScoreCells : DOM_ELEMENTS.homeTeamScoreCells;
        if (activeRowCells && activeRowCells.length > inningColumnIndex) { 
             activeRowCells[inningColumnIndex].classList.add('current-inning-active');
        }
    }
}

// Updates the inning display (e.g., Top 1st)
export function updateInningDisplay(halfInning, currentInning, gameStarted, gameOver) {
    if (!DOM_ELEMENTS.inningIndicator || !DOM_ELEMENTS.inningNumber) return;
    if (!gameStarted) {
        DOM_ELEMENTS.inningIndicator.className = 'inning-indicator';
        DOM_ELEMENTS.inningNumber.textContent = '-';
        return;
    }
    if (gameOver) {
        DOM_ELEMENTS.inningIndicator.className = 'inning-indicator'; // Clear top/bottom
        DOM_ELEMENTS.inningNumber.textContent = 'Final';
        return;
    }
    DOM_ELEMENTS.inningIndicator.className = `inning-indicator ${halfInning}`; // 'top' or 'bottom'
    DOM_ELEMENTS.inningNumber.textContent = String(currentInning);
}

// Updates the outs display
export function updateOutsDisplay(outs) {
    if (!DOM_ELEMENTS.outLights) return;
    DOM_ELEMENTS.outLights.forEach((light, index) => {
        light.classList.toggle('active', index < outs);
    });
}

// Updates the scoreboard with scores, R, H, E
// CORRECTED: Added teamRecords parameter to the function signature
export function updateScoreboard(gameTeams, currentInning, halfInning, outs, gameStarted, gameOver, teamRecords) {
    if (!gameTeams || !gameTeams.away || !gameTeams.home) {
        console.error("Team data missing for scoreboard update.");
        return;
    }
    // Update team names with records on the scoreboard
    if (DOM_ELEMENTS.awayTeamScoreboardName && gameTeams.away && teamRecords && teamRecords[gameTeams.away.id]) {
        const awayRecord = teamRecords[gameTeams.away.id];
        const awayRecordString = `(${(awayRecord.wins || 0)}-${(awayRecord.losses || 0)})`;
        // Check if update is needed to avoid unnecessary DOM manipulation
        const newText = `${gameTeams.away.name} ${awayRecordString}`;
        if (DOM_ELEMENTS.awayTeamScoreboardName.textContent !== newText) {
            DOM_ELEMENTS.awayTeamScoreboardName.textContent = newText;
        }
    } else if (DOM_ELEMENTS.awayTeamScoreboardName && gameTeams.away) {
         // Fallback if records are somehow missing, show (0-0)
        const newText = `${gameTeams.away.name} (0-0)`;
        if (DOM_ELEMENTS.awayTeamScoreboardName.textContent !== newText) {
            DOM_ELEMENTS.awayTeamScoreboardName.textContent = newText;
        }
    }


    if (DOM_ELEMENTS.homeTeamScoreboardName && gameTeams.home && teamRecords && teamRecords[gameTeams.home.id]) {
        const homeRecord = teamRecords[gameTeams.home.id];
        const homeRecordString = `(${(homeRecord.wins || 0)}-${(homeRecord.losses || 0)})`;
        const newText = `${gameTeams.home.name} ${homeRecordString}`;
        if (DOM_ELEMENTS.homeTeamScoreboardName.textContent !== newText) {
            DOM_ELEMENTS.homeTeamScoreboardName.textContent = newText;
        }
    } else if (DOM_ELEMENTS.homeTeamScoreboardName && gameTeams.home) {
        const newText = `${gameTeams.home.name} (0-0)`;
        if (DOM_ELEMENTS.homeTeamScoreboardName.textContent !== newText) {
            DOM_ELEMENTS.homeTeamScoreboardName.textContent = newText;
        }
    }

    const awayTeamData = gameTeams.away;
    const homeTeamData = gameTeams.home;
    const awayCells = DOM_ELEMENTS.awayTeamScoreCells;
    const homeCells = DOM_ELEMENTS.homeTeamScoreCells;

    if (!awayCells || !homeCells || awayCells.length === 0 || homeCells.length === 0) {
        console.error("Scoreboard cells not found or empty.");
        return;
    }

    // Logic to determine if a dash '-' or the actual score should be shown for an inning cell
    const shouldShowDashForInning = (teamIsAway, inningIdx) => {
        const inningNum = inningIdx + 1; // 1-based inning

        if (gameOver) return false; // If game is over, always show score, not dash
        if (!gameStarted) return true; // If game hasn't started, show dash

        if (inningNum < currentInning) return false; // Past inning, show score

        if (inningNum > currentInning) return true; // Future inning, show dash

        // Current inning (inningNum === currentInning)
        if (teamIsAway) { // Away team
            return halfInning === 'top' && outs < 3;
        } else { // Home team
            return halfInning === 'top' || (halfInning === 'bottom' && outs < 3);
        }
    };

    // Update inning scores
    for (let i = 0; i < CONFIG.innings; i++) {
        const cellDisplayIndex = i + 1; // Scoreboard cells are 1-indexed after team name

        if (awayCells[cellDisplayIndex]) {
            const runsInInning = awayTeamData.scorePerInning[i];
            awayCells[cellDisplayIndex].textContent = shouldShowDashForInning(true, i) ? '-' : (runsInInning ?? 0);
        }
        if (homeCells[cellDisplayIndex]) {
            const runsInInning = homeTeamData.scorePerInning[i];
            homeCells[cellDisplayIndex].textContent = shouldShowDashForInning(false, i) ? '-' : (runsInInning ?? 0);
        }
    }

    // Update R, H, E totals
    if (DOM_ELEMENTS.awayTeamTotalRunsCell) DOM_ELEMENTS.awayTeamTotalRunsCell.textContent = awayTeamData.totalRuns;
    if (DOM_ELEMENTS.homeTeamTotalRunsCell) DOM_ELEMENTS.homeTeamTotalRunsCell.textContent = homeTeamData.totalRuns;
    if (DOM_ELEMENTS.awayTeamTotalHitsCell) DOM_ELEMENTS.awayTeamTotalHitsCell.textContent = awayTeamData.totalHits || 0;
    if (DOM_ELEMENTS.homeTeamTotalHitsCell) DOM_ELEMENTS.homeTeamTotalHitsCell.textContent = homeTeamData.totalHits || 0;
    if (DOM_ELEMENTS.awayTeamTotalErrorsCell) DOM_ELEMENTS.awayTeamTotalErrorsCell.textContent = awayTeamData.totalErrors || 0; // Assuming errors are tracked
    if (DOM_ELEMENTS.homeTeamTotalErrorsCell) DOM_ELEMENTS.homeTeamTotalErrorsCell.textContent = homeTeamData.totalErrors || 0;

    highlightCurrentInningOnScoreboard(currentInning, gameStarted, gameOver, halfInning);
}


// Updates the visual display of runners on bases
export function updateBasesDisplay(bases, activePitcher) { // activePitcher might be used for future enhancements (e.g. pickoff attempts)
    const runnerNameElements = [DOM_ELEMENTS.runnerName1B, DOM_ELEMENTS.runnerName2B, DOM_ELEMENTS.runnerName3B];
    const baseElements = [DOM_ELEMENTS.firstBaseVisual, DOM_ELEMENTS.secondBaseVisual, DOM_ELEMENTS.thirdBaseVisual];

    for (let i = 0; i < 3; i++) {
        const nameEl = runnerNameElements[i];
        const baseEl = baseElements[i];
        if (!nameEl || !baseEl) continue;

        if (bases[i]) { // Runner on this base
            nameEl.textContent = abbreviatePlayerName(bases[i].name, 10, 8); // Shorter name for base display
            nameEl.style.display = 'block';
            baseEl.classList.add('occupied-base');
        } else { // Base is empty
            nameEl.textContent = '';
            nameEl.style.display = 'none';
            baseEl.classList.remove('occupied-base');
        }
    }
}

// Helper to get CSS class for stat value coloring
function getStatColorClass(value) {
    if (value === undefined || value === null) return '';
    if (value <= CONFIG.statColors.low) return 'stat-low';
    if (value <= CONFIG.statColors.medium) return 'stat-medium';
    if (value <= CONFIG.statColors.high) return 'stat-high';
    return 'stat-elite';
}

// Helper to get pitcher role abbreviation
function getPitcherRoleAbbreviation(role) {
    switch (role?.toLowerCase()) {
        case 'starter': return 'SP';
        case 'reliever': return 'RP';
        case 'closer': return 'CP';
        default: return role || '?'; // Fallback
    }
}

// Displays current batter or pitcher info in the designated panel
function displayCurrentPlayer(player, isBatter, targetElement) {
    if (!targetElement) return;
    targetElement.innerHTML = ''; // Clear previous content
    // Clear any OVR tier classes
    Object.values(CONFIG.ovrColorSettings.classes).forEach(className => targetElement.classList.remove(className));

    if (!player) {
        targetElement.innerHTML = `<p style="text-align:center; color:#777; font-style:italic;">${isBatter ? 'Batter' : 'Pitcher'} info not available.</p>`;
        return;
    }

    const ovrClass = getOvrColorClass(player.ovr);
    if (ovrClass) targetElement.classList.add(ovrClass);

    const nameString = player.name; // Full name for display
    const roleUiString = isBatter ? `(#${player.battingOrder || '?'})` : `(${getPitcherRoleAbbreviation(player.role)})`;
    const ovrUiString = `OVR: ${player.ovr}`;
    let careerStatString = '';
    let statsGridHTML = '';
    let historyDisplayHTML = ''; // For batter's at-bat history

    if (isBatter) {
        const avg = (player.careerAtBats || 0) > 0 ? ((player.careerHits || 0) / player.careerAtBats) : 0;
        const hr = player.careerHomeRuns || 0;
        careerStatString = `AVG: ${avg.toFixed(3).replace(/^0/, '')} / HR: ${hr}`;
        statsGridHTML = `
            <span class="stat-label">POW</span><span class="stat-value ${getStatColorClass(player.power)}">${player.power}</span>
            <span class="stat-label">HIT</span><span class="stat-value ${getStatColorClass(player.hitRate)}">${player.hitRate}</span>
            <span class="stat-label">CON</span><span class="stat-value ${getStatColorClass(player.contact)}">${player.contact}</span>
            <span class="stat-label">SPD</span><span class="stat-value ${getStatColorClass(player.speed)}">${player.speed}</span>`;
        
        const gameHistory = player.atBatHistory || [];
        const historyItems = gameHistory.map(item => `<span>${item}</span>`).join(' ');
        if (gameHistory.length > 0 && targetElement !== DOM_ELEMENTS.mobileBatterDisplay) { // Don't show history on mobile player card to save space
             historyDisplayHTML = `<div class="player-history">History: ${historyItems}</div>`;
        }

    } else { // Pitcher
        const outs = player.careerOutsRecorded || 0;
        const runs = player.careerRunsAllowed || 0;
        const ra9 = outs > 0 ? (runs / outs * 27) : 0; // ERA (RA9 for simplicity)
        const so = player.careerStrikeouts || 0;
        careerStatString = `ERA: ${outs > 0 ? ra9.toFixed(2) : 'N/A'} / SO: ${so}`;
        
        const displayCurrentStamina = Math.round(player.currentStamina);
        const staminaFilledPercent = player.maxStamina > 0 ? (displayCurrentStamina / player.maxStamina * 100) : 0;
        const safeStaminaFilledPercent = Math.max(0, Math.min(100, staminaFilledPercent));


        statsGridHTML = `
            <span class="stat-label">POW</span><span class="stat-value ${getStatColorClass(player.power)}">${player.power}</span>
            <span class="stat-label">CON</span><span class="stat-value ${getStatColorClass(player.control)}">${player.control}</span>
            <span class="stat-label">VEL</span><span class="stat-value ${getStatColorClass(player.velocity)}">${player.velocity}</span>
            <span class="stat-label">TEC</span><span class="stat-value ${getStatColorClass(player.technique)}">${player.technique}</span>
            <span class="stat-label">STM</span>
            <div class="stamina-bar-container">
                <div class="stamina-empty" style="width:${100 - safeStaminaFilledPercent.toFixed(1)}%"></div>
                <span class="stamina-text">${displayCurrentStamina}/${player.maxStamina}</span>
            </div>
        `;
    }

    targetElement.innerHTML = `
        <h5>
            <span class="player-main-name">${nameString}</span>
            <span class="player-role-info">${roleUiString}</span>
            <span class="player-ovr-info">${ovrUiString}</span>
            <span class="player-career-stat">${careerStatString}</span>
        </h5>
        <div class="player-stats-detailed">${statsGridHTML}</div>
        ${historyDisplayHTML}`;
}

// Displays a single team's lineup in their panel
function displaySingleTeamLineupList(teamKey, gameTeamsData, currentActiveBatter) {
    const team = gameTeamsData[teamKey];
    const listElement = teamKey === 'away' ? DOM_ELEMENTS.awayTeamLineupList : DOM_ELEMENTS.homeTeamLineupList;

    if (!team || !team.batters || !listElement) return;
    listElement.innerHTML = ''; // Clear previous lineup

    team.batters.forEach((batter, index) => { // Add index for batting order
        const listItem = document.createElement('li');
        if (batter === currentActiveBatter) {
            listItem.classList.add('current-batter-in-lineup');
        }

        const careerAB = batter.careerAtBats || 0;
        const careerH = batter.careerHits || 0;
        const avg = careerAB > 0 ? (careerH / careerAB) : 0;
        const avgString = avg.toFixed(3).replace(/^0/, ''); // .123
        const hr = batter.careerHomeRuns || 0;
        const ovrClass = getOvrColorClass(batter.ovr);

        listItem.innerHTML = `
            <span class="player-ovr-lineup ${ovrClass}">${batter.ovr}</span>
            <span class="player-name-lineup ${ovrClass}">${batter.name}</span>
            <span class="batter-career-stats">${avgString} / ${hr}HR</span>`;
        listElement.appendChild(listItem);
    });
}

// Displays a team's bullpen (starters not currently pitching, relievers, closer)
export function displayTeamBullpen(teamKey, gameTeamsData, activePitcher) {
    const team = gameTeamsData[teamKey];
    const listElement = teamKey === 'away' ? DOM_ELEMENTS.awayTeamBullpenList : DOM_ELEMENTS.homeTeamBullpenList;

    if (!team || !team.pitchers || !listElement) {
        if (listElement) listElement.innerHTML = '<li>Pitcher data not available.</li>';
        return;
    }
    listElement.innerHTML = ''; // Clear previous bullpen list

    const pitchersToDisplay = [];
    // Add starters from rotation who are not the active pitcher (if active pitcher is from this team)
    if (team.pitchers.startersRotation && Array.isArray(team.pitchers.startersRotation)) {
        team.pitchers.startersRotation.forEach(p => {
            if (p && (!activePitcher || p.name !== activePitcher.name || p.teamId !== activePitcher.teamId)) {
                 // Only add if they are not the currently active pitcher for this team
                if (!activePitcher || (activePitcher.teamId === team.id && activePitcher.name !== p.name) || activePitcher.teamId !== team.id) {
                    pitchersToDisplay.push(p);
                }
            }
        });
    }
    // Add reliever and closer
    if (team.pitchers.reliever) pitchersToDisplay.push(team.pitchers.reliever);
    if (team.pitchers.closer) pitchersToDisplay.push(team.pitchers.closer);
    
    const validPitchers = pitchersToDisplay.filter(p => p); // Ensure no null/undefined pitchers

    if (validPitchers.length === 0) {
        listElement.innerHTML = '<li>No pitchers available in bullpen.</li>';
        return;
    }

    validPitchers.forEach(pitcher => {
        const listItem = document.createElement('li');
        const ovrClass = getOvrColorClass(pitcher.ovr);
        const outs = pitcher.careerOutsRecorded || 0;
        const runs = pitcher.careerRunsAllowed || 0;
        const era = outs > 0 ? (runs / outs * 27) : 0;
        const eraString = outs > 0 ? era.toFixed(2) : "N/A";
        const displayCurrentStamina = Math.round(pitcher.currentStamina);

        // Highlight if this pitcher is the active one
        if (activePitcher && activePitcher.name === pitcher.name && activePitcher.teamId === pitcher.teamId) {
            listItem.classList.add('active-pitcher-in-bullpen');
        }

        listItem.innerHTML = `
            <span class="bullpen-pitcher-ovr ${ovrClass}">${pitcher.ovr}</span>
            <span class="bullpen-pitcher-name ${ovrClass}">${pitcher.name}</span>
            <span class="bullpen-pitcher-role">${getPitcherRoleAbbreviation(pitcher.role)}</span>
            <span class="bullpen-pitcher-era">${eraString}</span>
            <span class="bullpen-pitcher-stamina">${displayCurrentStamina}/${pitcher.maxStamina}</span>`;
        listElement.appendChild(listItem);
    });
}


// Triggers a visual flash for scoring plays
export function triggerScoreFlash(runsScored) {
    if (!DOM_ELEMENTS.scoreFlashElement || runsScored <= 0) return;
    DOM_ELEMENTS.scoreFlashElement.textContent = `+${runsScored} Run${runsScored > 1 ? 's' : ''}!`;
    DOM_ELEMENTS.scoreFlashElement.classList.add('show');
    // Remove the class after animation to allow re-triggering
    setTimeout(() => DOM_ELEMENTS.scoreFlashElement.classList.remove('show'), 600); // Duration of animation
}

// Main function to update all relevant parts of the UI
export function updateAllDisplays(gameState, gameTeams, teamRecords) {
    if (!gameState || !gameTeams) { console.error("Missing gameState or gameTeams for updateAllDisplays"); return; }
    const isMobileView = window.innerWidth <= 768;

    // Update core game state displays
    updateInningDisplay(gameState.halfInning, gameState.currentInning, gameState.gameStarted, gameState.gameOver);
    updateOutsDisplay(gameState.outs);
    updateBasesDisplay(gameState.bases, gameState.activePitcher);
    // CORRECTED: Ensure teamRecords is passed to updateScoreboard
    updateScoreboard(gameTeams, gameState.currentInning, gameState.halfInning, gameState.outs, gameState.gameStarted, gameState.gameOver, teamRecords);

    // Determine current batter and pitcher for display
    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const fieldingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away';
    
    const currentBatterForDisplay = gameState.activeBatter;
    const currentPitcherForDisplay = gameState.activePitcher;

    // Add batting order to batter object for display purposes (if not already there)
    if (currentBatterForDisplay && gameTeams[battingTeamKey] && gameTeams[battingTeamKey].batters) {
        const currentBatterActualIndex = gameTeams[battingTeamKey].batters.findIndex(b => b.name === currentBatterForDisplay.name);
        currentBatterForDisplay.battingOrder = (currentBatterActualIndex !== -1) ? currentBatterActualIndex + 1 : '?';
    }
    
    // Update team panel standings
    updateStandingsDisplay(teamRecords, gameTeams.away?.id, gameTeams.home?.id); 

    // Handle panel displays based on view (mobile/desktop) and game state
    if (isMobileView) {
        if (DOM_ELEMENTS.mobileBatterDisplay) displayCurrentPlayer(currentBatterForDisplay, true, DOM_ELEMENTS.mobileBatterDisplay);
        if (DOM_ELEMENTS.mobilePitcherDisplay) displayCurrentPlayer(currentPitcherForDisplay, false, DOM_ELEMENTS.mobilePitcherDisplay);
        // Clear desktop panels if they exist
        if (DOM_ELEMENTS.awayCurrentPlayerDisplay) DOM_ELEMENTS.awayCurrentPlayerDisplay.innerHTML = '';
        if (DOM_ELEMENTS.homeCurrentPlayerDisplay) DOM_ELEMENTS.homeCurrentPlayerDisplay.innerHTML = '';
        if (DOM_ELEMENTS.awayTeamLineupList) DOM_ELEMENTS.awayTeamLineupList.innerHTML = '';
        if (DOM_ELEMENTS.homeTeamLineupList) DOM_ELEMENTS.homeTeamLineupList.innerHTML = '';
        if (DOM_ELEMENTS.awayTeamBullpenList) DOM_ELEMENTS.awayTeamBullpenList.innerHTML = '';
        if (DOM_ELEMENTS.homeTeamBullpenList) DOM_ELEMENTS.homeTeamBullpenList.innerHTML = '';
    } else { // Desktop view
        // Display current players in their respective team panels
        if (battingTeamKey === 'away') {
            displayCurrentPlayer(currentBatterForDisplay, true, DOM_ELEMENTS.awayCurrentPlayerDisplay);
            displayCurrentPlayer(currentPitcherForDisplay, false, DOM_ELEMENTS.homeCurrentPlayerDisplay);
            if (DOM_ELEMENTS.awayTeamPanel) DOM_ELEMENTS.awayTeamPanel.className = 'team-panel batting-team';
            if (DOM_ELEMENTS.homeTeamPanel) DOM_ELEMENTS.homeTeamPanel.className = 'team-panel fielding-team';
        } else { // Home team is batting
            displayCurrentPlayer(currentBatterForDisplay, true, DOM_ELEMENTS.homeCurrentPlayerDisplay);
            displayCurrentPlayer(currentPitcherForDisplay, false, DOM_ELEMENTS.awayCurrentPlayerDisplay);
            if (DOM_ELEMENTS.homeTeamPanel) DOM_ELEMENTS.homeTeamPanel.className = 'team-panel batting-team';
            if (DOM_ELEMENTS.awayTeamPanel) DOM_ELEMENTS.awayTeamPanel.className = 'team-panel fielding-team';
        }
        // Display lineups and bullpens
        displaySingleTeamLineupList('away', gameTeams, gameState.halfInning === 'top' ? currentBatterForDisplay : null);
        displaySingleTeamLineupList('home', gameTeams, gameState.halfInning === 'bottom' ? currentBatterForDisplay : null);
        displayTeamBullpen('away', gameTeams, currentPitcherForDisplay); // Pass active pitcher to correctly highlight
        displayTeamBullpen('home', gameTeams, currentPitcherForDisplay);

        // Clear mobile displays if they exist
        if (DOM_ELEMENTS.mobileBatterDisplay) DOM_ELEMENTS.mobileBatterDisplay.innerHTML = '';
        if (DOM_ELEMENTS.mobilePitcherDisplay) DOM_ELEMENTS.mobilePitcherDisplay.innerHTML = '';
    }
}

// Updates the team records (W-L) display in the side panels
function updateStandingsDisplay(teamRecords, awayTeamId, homeTeamId) {
    if (!teamRecords) { // Fallback if teamRecords is not available
        if (DOM_ELEMENTS.awayTeamRecordSpan) DOM_ELEMENTS.awayTeamRecordSpan.textContent = `(0-0)`;
        if (DOM_ELEMENTS.homeTeamRecordSpan) DOM_ELEMENTS.homeTeamRecordSpan.textContent = `(0-0)`;
        // Scoreboard records are handled by updateScoreboard
        return;
    }

    const awayRecord = awayTeamId ? teamRecords[awayTeamId] : null;
    const homeRecord = homeTeamId ? teamRecords[homeTeamId] : null;

    // Update panel records
    if (DOM_ELEMENTS.awayTeamRecordSpan) {
        DOM_ELEMENTS.awayTeamRecordSpan.textContent = awayRecord ? `(${(awayRecord.wins || 0)}-${(awayRecord.losses || 0)})` : `(0-0)`;
    }
    if (DOM_ELEMENTS.homeTeamRecordSpan) {
        DOM_ELEMENTS.homeTeamRecordSpan.textContent = homeRecord ? `(${(homeRecord.wins || 0)}-${(homeRecord.losses || 0)})` : `(0-0)`;
    }
    // Scoreboard records are now handled directly in updateScoreboard and initializeUI
}

// Updates the text describing the last play's outcome
export function updateOutcomeText(message, outcomeType) {
    if (!DOM_ELEMENTS.outcomeText) return;
    DOM_ELEMENTS.outcomeText.innerHTML = ''; // Clear previous outcome
    DOM_ELEMENTS.outcomeText.className = 'outcome-neutral'; // Reset class

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    if (outcomeType && typeof outcomeType === 'string') {
        // Apply a general class based on the outcome type (e.g., 'outcome-homerun', 'outcome-strikeout')
        const generalClass = `outcome-${outcomeType.toLowerCase().replace(/_/g, '-')}`;
        messageSpan.classList.add(generalClass);
    }
    DOM_ELEMENTS.outcomeText.appendChild(messageSpan);
}
