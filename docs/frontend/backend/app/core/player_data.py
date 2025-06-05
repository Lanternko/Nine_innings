# player_data.py
from backend.app.core.game_constants import LEAGUE_BENCHMARKS, ATTRIBUTE_MAPPING_POINTS

def calculate_player_game_attributes(xBA, xSLG, xwOBA):
    pr1_map = ATTRIBUTE_MAPPING_POINTS['pr1']
    pr50_map = ATTRIBUTE_MAPPING_POINTS['pr50']
    pr99_map = ATTRIBUTE_MAPPING_POINTS['pr99']
    delta_50_1 = pr50_map - pr1_map
    delta_99_50 = pr99_map - pr50_map

    def get_attribute_score(metric_val, pr1_benchmark, pr50_benchmark, pr99_benchmark):
        score = 0
        if metric_val <= pr1_benchmark:
            score = pr1_map
        elif metric_val <= pr50_benchmark: 
            if (pr50_benchmark - pr1_benchmark) == 0: score = pr50_map 
            else: score = pr1_map + delta_50_1 * (metric_val - pr1_benchmark) / (pr50_benchmark - pr1_benchmark)
        elif metric_val <= pr99_benchmark: 
            if (pr99_benchmark - pr50_benchmark) == 0: score = pr99_map 
            else: score = pr50_map + delta_99_50 * (metric_val - pr50_benchmark) / (pr99_benchmark - pr50_benchmark)
        else: 
            if (pr99_benchmark - pr50_benchmark) == 0: score = pr99_map 
            else:
                slope_pr50_pr99 = delta_99_50 / (pr99_benchmark - pr50_benchmark)
                score = pr99_map + slope_pr50_pr99 * (metric_val - pr99_benchmark)
        return max(0, min(150, score))

    hit_attribute = get_attribute_score(xBA, LEAGUE_BENCHMARKS['xBA']['pr1'], LEAGUE_BENCHMARKS['xBA']['pr50'], LEAGUE_BENCHMARKS['xBA']['pr99'])
    pow_attribute = get_attribute_score(xSLG, LEAGUE_BENCHMARKS['xSLG']['pr1'], LEAGUE_BENCHMARKS['xSLG']['pr50'], LEAGUE_BENCHMARKS['xSLG']['pr99'])
    eye_attribute = get_attribute_score(xwOBA, LEAGUE_BENCHMARKS['xwOBA']['pr1'], LEAGUE_BENCHMARKS['xwOBA']['pr50'], LEAGUE_BENCHMARKS['xwOBA']['pr99'])
    return {"POW": pow_attribute, "HIT": hit_attribute, "EYE": eye_attribute}

# --- Aaron Judge 數據 ---
JUDGE_XBA_2024 = .310 
JUDGE_XSLG_2024 = .723 
JUDGE_XWOBA_2024 = .479 
JUDGE_TARGET_PA_2024 = 704
JUDGE_K_TARGET_2022_REF = 175 
JUDGE_TARGET_K_RATE_REF = JUDGE_K_TARGET_2022_REF / 696 if 696 > 0 else 0
JUDGE_ESTIMATED_K_TARGET = round(JUDGE_TARGET_K_RATE_REF * JUDGE_TARGET_PA_2024)
JUDGE_TARGET_COUNTS_2024 = {"HR_target": 58, "BB_target": 133, "H_target": 180, "AB_target": 559, "HBP_target": 9, "PA_target": JUDGE_TARGET_PA_2024, "_2B_target": 36, "_1B_target": 85, "K_target": JUDGE_ESTIMATED_K_TARGET }
JUDGE_TARGET_RATIOS_2024 = {"BA": .322, "OBP": .458, "SLG": .701, "OPS": 1.159, "K_rate": JUDGE_ESTIMATED_K_TARGET / JUDGE_TARGET_PA_2024 if JUDGE_TARGET_PA_2024 > 0 else 0, "BB_rate": JUDGE_TARGET_COUNTS_2024["BB_target"] / JUDGE_TARGET_PA_2024 if JUDGE_TARGET_PA_2024 > 0 else 0}
JUDGE_HBP_RATE_2024 = JUDGE_TARGET_COUNTS_2024["HBP_target"] / JUDGE_TARGET_PA_2024 if JUDGE_TARGET_PA_2024 > 0 else 0
def get_judge_anchor_abilities(): return calculate_player_game_attributes(JUDGE_XBA_2024, JUDGE_XSLG_2024, JUDGE_XWOBA_2024)
def get_judge_target_data(): return JUDGE_TARGET_PA_2024, JUDGE_TARGET_COUNTS_2024, JUDGE_TARGET_RATIOS_2024, JUDGE_HBP_RATE_2024

# --- Paul Goldschmidt 數據 ---
GOLDSCHMIDT_XBA_2024 = .255 
GOLDSCHMIDT_XSLG_2024 = .450
GOLDSCHMIDT_XWOBA_2024 = .329
GOLDSCHMIDT_TARGET_PA_2024 = 654
GOLDSCHMIDT_K_TARGET_2022_REF = 141 
GOLDSCHMIDT_TARGET_K_RATE_REF = GOLDSCHMIDT_K_TARGET_2022_REF / 651 if 651 > 0 else 0
GOLDSCHMIDT_ESTIMATED_K_TARGET = round(GOLDSCHMIDT_TARGET_K_RATE_REF * GOLDSCHMIDT_TARGET_PA_2024)
GOLDSCHMIDT_TARGET_COUNTS_2024 = {"HR_target": 20, "BB_target": 47, "H_target": 147, "AB_target": 598, "HBP_target": 5, "PA_target": GOLDSCHMIDT_TARGET_PA_2024, "_2B_target": 39, "_1B_target": 87, "K_target": GOLDSCHMIDT_ESTIMATED_K_TARGET}
GOLDSCHMIDT_TARGET_RATIOS_2024 = {"BA": .245, "OBP": .306, "SLG": .414, "OPS": .720, "K_rate": GOLDSCHMIDT_ESTIMATED_K_TARGET / GOLDSCHMIDT_TARGET_PA_2024 if GOLDSCHMIDT_TARGET_PA_2024 > 0 else 0, "BB_rate": GOLDSCHMIDT_TARGET_COUNTS_2024["BB_target"] / GOLDSCHMIDT_TARGET_PA_2024 if GOLDSCHMIDT_TARGET_PA_2024 > 0 else 0}
GOLDSCHMIDT_HBP_RATE_2024 = GOLDSCHMIDT_TARGET_COUNTS_2024["HBP_target"] / GOLDSCHMIDT_TARGET_PA_2024 if GOLDSCHMIDT_TARGET_PA_2024 > 0 else 0
def get_goldschmidt_anchor_abilities(): return calculate_player_game_attributes(GOLDSCHMIDT_XBA_2024, GOLDSCHMIDT_XSLG_2024, GOLDSCHMIDT_XWOBA_2024)
def get_goldschmidt_target_data(): return GOLDSCHMIDT_TARGET_PA_2024, GOLDSCHMIDT_TARGET_COUNTS_2024, GOLDSCHMIDT_TARGET_RATIOS_2024, GOLDSCHMIDT_HBP_RATE_2024

# --- Orlando Arcia 數據 (2024 Season) ---
ARCIA_XBA_2024_FROM_STATCAST = .206
ARCIA_XSLG_2024_FROM_STATCAST = .323
ARCIA_XWOBA_2024_FROM_STATCAST = .261 
ARCIA_TARGET_PA_2024 = 602
ARCIA_TARGET_COUNTS_2024 = {"HR_target": 17, "BB_target": 41, "H_target": 120, "AB_target": 551, "HBP_target": 2, "PA_target": ARCIA_TARGET_PA_2024, "_2B_target": 24, "_1B_target": 79, "K_target": 128}
ARCIA_TARGET_RATIOS_2024 = {"BA": .218, "OBP": .271, "SLG": .354, "OPS": .625, "K_rate": .213, "BB_rate": .068}
ARCIA_HBP_RATE_2024 = ARCIA_TARGET_COUNTS_2024["HBP_target"] / ARCIA_TARGET_PA_2024 if ARCIA_TARGET_PA_2024 > 0 else 0
def get_arcia_anchor_abilities(): return calculate_player_game_attributes(ARCIA_XBA_2024_FROM_STATCAST, ARCIA_XSLG_2024_FROM_STATCAST, ARCIA_XWOBA_2024_FROM_STATCAST)
def get_arcia_target_data(): return ARCIA_TARGET_PA_2024, ARCIA_TARGET_COUNTS_2024, ARCIA_TARGET_RATIOS_2024, ARCIA_HBP_RATE_2024

# --- Shohei Ohtani 數據 (2024 Season) ---
OHTANI_XBA_2024 = .314
OHTANI_XSLG_2024 = .660 
OHTANI_XWOBA_2024 = .431 
OHTANI_TARGET_PA_2024 = 731
OHTANI_TARGET_COUNTS_2024 = {"HR_target": 54, "BB_target": 81, "H_target": 197, "AB_target": 636, "HBP_target": 4, "PA_target": OHTANI_TARGET_PA_2024, "_2B_target": 38, "_1B_target": 98, "K_target": 162}
OHTANI_TARGET_RATIOS_2024 = {"BA": .310, "OBP": .390, "SLG": .646, "OPS": 1.036, "K_rate": .222, "BB_rate": .111}
OHTANI_HBP_RATE_2024 = OHTANI_TARGET_COUNTS_2024["HBP_target"] / OHTANI_TARGET_PA_2024 if OHTANI_TARGET_PA_2024 > 0 else 0
def get_ohtani_anchor_abilities(): return calculate_player_game_attributes(OHTANI_XBA_2024, OHTANI_XSLG_2024, OHTANI_XWOBA_2024)
def get_ohtani_target_data(): return OHTANI_TARGET_PA_2024, OHTANI_TARGET_COUNTS_2024, OHTANI_TARGET_RATIOS_2024, OHTANI_HBP_RATE_2024

# --- Freddie Freeman 數據 (2023 Season) ---
FREEMAN_XBA_2023 = .300  # Estimated from Savant/FG
FREEMAN_XSLG_2023 = .510  # Estimated from Savant/FG
FREEMAN_XWOBA_2023 = .380 # Estimated from Savant/FG

FREEMAN_TARGET_PA_2023 = 730
FREEMAN_TARGET_COUNTS_2023 = {
    "HR_target": 29, "BB_target": 72, "H_target": 211, "AB_target": 637, "HBP_target": 16, 
    "PA_target": FREEMAN_TARGET_PA_2023, "_2B_target": 59, 
    "_1B_target": 211 - 29 - 59 - 2, # H - HR - 2B - 3B (2) = 121
    "K_target": 121
}
FREEMAN_TARGET_RATIOS_2023 = {
    "BA": .331, "OBP": .410, "SLG": .567, "OPS": .977,
    "K_rate": FREEMAN_TARGET_COUNTS_2023["K_target"] / FREEMAN_TARGET_PA_2023 if FREEMAN_TARGET_PA_2023 > 0 else 0, # ~0.1658
    "BB_rate": FREEMAN_TARGET_COUNTS_2023["BB_target"] / FREEMAN_TARGET_PA_2023 if FREEMAN_TARGET_PA_2023 > 0 else 0  # ~0.0986
}
FREEMAN_HBP_RATE_2023 = FREEMAN_TARGET_COUNTS_2023["HBP_target"] / FREEMAN_TARGET_PA_2023 if FREEMAN_TARGET_PA_2023 > 0 else 0

def get_freeman_anchor_abilities():
    return calculate_player_game_attributes(FREEMAN_XBA_2023, FREEMAN_XSLG_2023, FREEMAN_XWOBA_2023)

def get_freeman_target_data():
    return FREEMAN_TARGET_PA_2023, FREEMAN_TARGET_COUNTS_2023, FREEMAN_TARGET_RATIOS_2023, FREEMAN_HBP_RATE_2023

# --- 原型球員數據 (用於系統校準) ---
ARCHETYPES_DATA = {
    "PR1 (Stat 40)": { 
        "POW": 40, "HIT": 40, "EYE": 40, "HBP_rate": 0.008,
        "Target_Rate": {"BA": .214, "OBP": .274, "SLG": .356, "OPS": .630, "K_rate": 0.280, "BB_rate": 0.070},
        "Target_Count": {"HR": 4, "PA": 600, "K_target": round(0.280 * 600), "BB_target": round(0.070*600)}
    },
    "PR50 (Stat 70)": { 
        "POW": 70, "HIT": 70, "EYE": 70, "HBP_rate": 0.010,
        "Target_Rate": {"BA": .255, "OBP": .325, "SLG": .425, "OPS": .750, "K_rate": 0.220, "BB_rate": 0.085},
        "Target_Count": {"HR": 20, "PA": 600, "K_target": round(0.220 * 600), "BB_target": round(0.085*600)}
    },
    "PR99 (Stat 99)": { 
        "POW": 99, "HIT": 99, "EYE": 99, "HBP_rate": 0.012,
        "Target_Rate": {"BA": .320, "OBP": .400, "SLG": .590, "OPS": .990, "K_rate": 0.150, "BB_rate": 0.120},
        "Target_Count": {"HR": 40, "PA": 600, "K_target": round(0.150 * 600), "BB_target": round(0.120*600)}
    },
    "High Power Specialist": { # POW 99, HIT 70, EYE 70
        "POW": 99, "HIT": 70, "EYE": 70, "HBP_rate": 0.010,
        "Target_Rate": {"BA": .255, "OBP": .325, "SLG": .520, "OPS": .845, "K_rate": 0.220, "BB_rate": 0.085},
        "Target_Count": {"HR": 35, "PA": 600, "K_target": round(0.220 * 600), "BB_target": round(0.085 * 600)}
    }
}


# --- 原型球員數據 (用於系統校準) ---
ARCHETYPES_DATA = {
    "PR1 (Stat 40)": { 
        "POW": 40, "HIT": 40, "EYE": 40, "HBP_rate": 0.008,
        "Target_Rate": {"BA": .214, "OBP": .274, "SLG": .356, "OPS": .630, "K_rate": 0.280, "BB_rate": 0.070},
        "Target_Count": {"HR": 4, "PA": 600, "K_target": round(0.280 * 600), "BB_target": round(0.070*600)}
    },
    "PR50 (Stat 70)": { 
        "POW": 70, "HIT": 70, "EYE": 70, "HBP_rate": 0.010,
        "Target_Rate": {"BA": .255, "OBP": .325, "SLG": .425, "OPS": .750, "K_rate": 0.220, "BB_rate": 0.085},
        "Target_Count": {"HR": 20, "PA": 600, "K_target": round(0.220 * 600), "BB_target": round(0.085*600)}
    },
    "PR99 (Stat 99)": { 
        "POW": 99, "HIT": 99, "EYE": 99, "HBP_rate": 0.012,
        "Target_Rate": {"BA": .320, "OBP": .400, "SLG": .590, "OPS": .990, "K_rate": 0.150, "BB_rate": 0.120},
        "Target_Count": {"HR": 40, "PA": 600, "K_target": round(0.150 * 600), "BB_target": round(0.120*600)}
    },
    # 新增：高力量型原型
    "High Power Specialist": {
        "POW": 99, "HIT": 70, "EYE": 70, "HBP_rate": 0.010, # HBP rate similar to PR50
        # Target stats need careful estimation.
        # Expect: Higher HR & SLG than PR50. BA similar to PR50. K% & BB% similar to PR50.
        "Target_Rate": {
            "BA": .255,     # HIT is 70
            "OBP": .325,    # EYE is 70, BB% should be similar to PR50
            "SLG": .520,    # Significantly higher than PR50's .425 due to POW 99
            "OPS": .845,    # OBP + SLG
            "K_rate": 0.220,# HIT and EYE are 70
            "BB_rate": 0.085# EYE is 70
        },
        "Target_Count": {
            "HR": 35,       # POW 99, higher than PR50's 20, but maybe not as high as PR99's 40 (due to lower HIT/EYE)
            "PA": 600,
            "K_target": round(0.220 * 600), # 132
            "BB_target": round(0.085 * 600) # 51
        }
    }
}
