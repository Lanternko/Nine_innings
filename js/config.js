// js/config.js
// This file contains the configuration settings for the baseball simulation game.
// It includes settings for innings, base probabilities, stamina effects, speed effects,
// overall ratings (OVR) weights, stat normalization effects, probability caps, and stat colors.
export const CONFIG = {
    innings: 9,
    baseProbabilities: {
        strikeout: 0.21,
        walk: 0.08,
        homeRun: 0.04,
        otherHit: 0.265,
    },
    stamina: {
        penaltyThreshold1: 0.50,
        penaltyAmount1: 1.5,
        penaltyThreshold2: 0.32,
        penaltyAmount2: 2,
        depletionPerBatterMin: 2.5,
        depletionPerBatterMax: 4.5,
        hitPenaltySingle: 8,
        hitPenaltyExtraBase: 7,
        runPenalty: 10       // 每失 1 分
    },
    speed: {
        stretchSingleToDoubleFast: 0.30,
        stretchSingleToDoubleMedium: 0.15,
        runnerExtraBaseFast: 0.40,
        runnerExtraBaseMedium: 0.20,
        baseHitIsDoubleChance: 0.25
    },
    ovrWeights: {
         batter: {
            power: 2.8, hitRate: 2.8, contact: 2.2, speed: 1.2,
            scale: 1, base: 25
        },
        pitcher: {
            power: 3.0, // "Stuff"
            velocity: 3.0,
            control: 2.5,
            technique: 1.5, // "Movement/Deception"
            staminaEffect: 0.5, // How much maxStamina contributes to OVR
            scale: 1, // Multiplier for the sum of weighted stats
            base: 14  // Base OVR before adding stat contributions
        }
    },
    statNormalization: {
        pitcherPowerEffectOnSO: 0.024,
        velocityEffectOnSO: 0.020,
        velocityEffectOnHit: -0.015,
        techniqueEffectOnHR: -0.013,
        techniqueEffectOnSO: 0.008, // Slight increase with technique
        pitcherControlEffectOnWalk: -0.023,
        pitcherPowerEffectOnHR: -0.0023,
        pitcherPowerEffectOnHit: -0.015,
        
        batterContactEffectOnSO: -0.033,
        batterPowerEffectOnHR: 0.017,
        batterHitRateEffectOnHit: 0.022
    },
    probabilityCaps: {
        strikeout: { min: 0.05, max: 0.50 },
        walk: { min: 0.02, max: 0.30 },
        homeRun: { min: 0.005, max: 0.10 },
        otherHit: { min: 0.05, max: 0.40 },
        outMin: 0.10, // Minimum probability for a generic out
        sumOfDeterminedRatesCap: 0.95 // Max sum for SO, BB, HR, OtherHit before calculating generic out
    },
    statColors: { // For individual stat value display (1-10)
        low: 3,
        medium: 6,
        high: 8,
        elite: 10
    },
    // NEW: OVR Color Theming
    ovrColorSettings: {
        thresholds: { // Upper bound for each tier
            gray: 73,   // OVR <= 73
            blue: 80,   // 73 <= OVR <= 80
            red: 87,    // 80 <= OVR <= 87
            green: 94,  // 87 <= OVR <= 94
            golden: 99  // 95 <= OVR <= 99
        },
        classes: { // Corresponding CSS class names
            gray: 'ovr-tier-gray',
            blue: 'ovr-tier-blue',
            red: 'ovr-tier-red',
            green: 'ovr-tier-green',
            golden: 'ovr-tier-golden'
        },
        // Define actual colors here or purely in CSS. Keeping them here for reference.
        colors: {
            gray: { border: '#adb5bd', background: '#f8f9fa', text: '#6c757d' },
            blue: { border: '#0d6efd', background: '#e3e1ef', text: '#2256b3' },
            red:  { border: '#dc3545', background: '#fdebec', text: '#b02a37' },
            green: { border: '#198754', background: '#e8f5e9', text: '#155724' },
            golden: { border: '#ffc107', background: '#fff8e1', text: '#b08d00' } // Darker gold text
        }
    }
};
