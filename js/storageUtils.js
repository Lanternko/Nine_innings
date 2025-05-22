// js/storageUtils.js

// EXPORT these constants so other modules can import them
export const TEAM_RECORDS_KEY = 'baseballSim_teamRecords';
export const PLAYER_STATS_KEY = 'baseballSim_playerStats';

// Function to save data to localStorage
export function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving data for key ${key}:`, error);
    }
}

// Function to load data from localStorage
export function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`Error loading data for key ${key}:`, error);
        return defaultValue;
    }
}

// Function to clear saved data (useful for resets)
export function clearSavedData() {
     localStorage.removeItem(TEAM_RECORDS_KEY);
     localStorage.removeItem(PLAYER_STATS_KEY);
     console.log("Saved game data cleared.");
     window.location.reload(); // Reload to apply default data and clear current game state
}
