# game_constants.py

# 聯盟百分位基準值 (不變)
LEAGUE_BENCHMARKS = {
    'xBA': {'pr1': 0.200, 'pr50': 0.250, 'pr99': 0.330},
    'xSLG': {'pr1': 0.310, 'pr50': 0.400, 'pr99': 0.640},
    'xwOBA': {'pr1': 0.260, 'pr50': 0.320, 'pr99': 0.430}
}
ATTRIBUTE_MAPPING_POINTS = {'pr1': 40, 'pr50': 70, 'pr99': 99}

# 模擬參數 (不變)
NUM_PA_PER_SEASON_ARCHETYPE = 600

# --- 最佳化流程參數 (三階段) ---
# 階段一
NUM_ITERATIONS_STAGE_ONE = 1500 # 可酌情調整
NUM_SEASONS_PER_EVAL_STAGE_ONE = 15 # 可酌情調整
TOP_N_CANDIDATES_FROM_STAGE_ONE = 100 # 可酌情調整
ERROR_WEIGHTS_STAGE_ONE = {
    "BA": 1.0, "OBP": 1.2, "SLG": 1.0, "HR": 1.5, "OPS": 0.8,
    "BB": 0.1, "K": 0.1 # 早期階段對BB/K容忍度較高
}
DEVIATION_PENALTY_WEIGHT_STAGE_ONE = 0.005 # 早期階段錨點懲罰較輕

# 階段二
NUM_ITERATIONS_PER_CANDIDATE_STAGE_TWO = 100 # 每個候選區域的迭代次數
NUM_SEASONS_PER_EVAL_STAGE_TWO = 40
TOP_M_CANDIDATES_FROM_STAGE_TWO = 15
ERROR_WEIGHTS_STAGE_TWO = {
    "BA": 1.5, "OBP": 1.8, "SLG": 1.5, "HR": 2.0,
    "BB": 0.5, "K": 0.5 # 稍微加重 BB/K
}
DEVIATION_PENALTY_WEIGHT_STAGE_TWO = 0.05 # 錨點懲罰加重

# 階段三 (最終驗證，權重可沿用階段二或特調)
NUM_SEASONS_PER_EVAL_STAGE_THREE = 200 # 或更高
ERROR_WEIGHTS_STAGE_THREE = ERROR_WEIGHTS_STAGE_TWO.copy()
# 針對特定問題調整，例如 Judge, Ohtani 的 K%
# if player_name in ["Aaron Judge", "Shohei Ohtani"]:
#     ERROR_WEIGHTS_STAGE_THREE["K"] = 1.0
DEVIATION_PENALTY_WEIGHT_STAGE_THREE = 0.075 # 最終錨點懲罰

# 誤差計算權重
ERROR_WEIGHTS_STAGE_ONE = {
    "BA": 1.5, "OBP": 1.8, "SLG": 1.5, "HR": 2.0, "OPS": 1.0,
    "BB": 0.2, "K": 0.2
}
DEVIATION_PENALTY_WEIGHT_STAGE_ONE = 0.01

ERROR_WEIGHTS_STAGE_TWO = {
    "BA": 1.5, "OBP": 1.8, "SLG": 1.5, "HR": 2.0,
    "BB": 0.8, "K": 0.8
}
DEVIATION_PENALTY_WEIGHT_STAGE_TWO = 0.075

ERROR_WEIGHTS = ERROR_WEIGHTS_STAGE_TWO.copy()
DEVIATION_PENALTY_WEIGHT = DEVIATION_PENALTY_WEIGHT_STAGE_TWO

ATTRIBUTE_SEARCH_RANGE_DELTA = 30

# --- S-Curve Anchor Definitions & 其他模型參數 ---
ATTR_EFFECT_MIDPOINT = 70.0
SOFT_CAP_ATTRIBUTE_VALUE = 150.0

# S-Curve for Base HR Rate from POW (HR per PA) - 保持上一版校準
HR_S_CURVE_POW_ANCHORS = [
    (0, 0.0005), (30, 0.003), (40, 0.0067), (60, 0.020),
    (70, 0.0333), (85, 0.045),
    (99, 0.0580), (115, 0.072),(130, 0.0870),
    (140, 0.098), (SOFT_CAP_ATTRIBUTE_VALUE, 0.110)
]
ABSOLUTE_MAX_HR_RATE_CAP = 0.20

# S-Curve for BABIP from HIT (直接影響 BA)
# *** 變更點：進一步提升高 HIT 區間的 BABIP，並確保曲線在高值區仍有增長 ***
BABIP_S_CURVE_HIT_ANCHORS = [
    (0, 0.215),   # 略微提高低 HIT 區的下限 (原 0.210)
    (30, 0.245),  # (原 0.240)
    (40, 0.270),  # 提高 PR1 對應的 BABIP (原 0.265)
    (60, 0.295),  # (原 0.290)
    (70, 0.305),  # 略微提高中點 (原 0.300)
    (85, 0.330),  # (原 0.325)
    (99, 0.350),  # 明顯提高 HIT 99 的 BABIP (原 0.340)，目標 BA .320+
    (110, 0.365), # (原 0.355)
    (120, 0.375), # (原 0.365)
    (130, 0.385), # (原 0.375) Freeman HIT 118，目標 BA .331
    (140, 0.395), # (原 0.385)
    (SOFT_CAP_ATTRIBUTE_VALUE, 0.405) # 提高軟上限 (原 0.395)
]
MIN_BABIP_RATE_CAP = 0.190 # (原 0.180)
MAX_BABIP_RATE_CAP = 0.450 # 提高硬上限 (原 0.430)

# S-Curve for BB_rate from EYE - 保持上一版校準
BB_S_CURVE_EYE_ANCHORS = [
    (0, 0.030), (30, 0.045), (40, 0.062), (60, 0.075),
    (70, 0.085), (85, 0.105), (99, 0.125),
    (115, 0.145), (130, 0.160), (140, 0.170),
    (SOFT_CAP_ATTRIBUTE_VALUE, 0.180)
]
MIN_BB_RATE_CAP = 0.020
MAX_BB_RATE_CAP = 0.250

# S-Curve for K_rate's EYE component - 保持上一版校準 (K% 問題可能需要更綜合的調整)
K_EYE_EFFECTIVENESS_S_CURVE_ANCHORS = [
    (0, 0.8), (30, 0.5), (40, 0.3), (60, 0.1),
    (70, 0.0), (85, -0.20), (99, -0.40),
    (115, -0.55),(130, -0.70),(140, -0.75),
    (SOFT_CAP_ATTRIBUTE_VALUE, -0.80)
]
K_RATE_HIT_WEIGHT = 0.50
K_RATE_EYE_WEIGHT = 1.0 - K_RATE_HIT_WEIGHT
K_HIT_EFFECT_MIDPOINT = ATTR_EFFECT_MIDPOINT
K_HIT_EFFECT_SCALE = 55.0
AVG_K_RATE_AT_MIDPOINT = 0.220
MIN_K_RATE_CAP = 0.080
MAX_K_RATE_CAP = 0.350


# Modifiers for Base HR Rate - 保持不變，以隔離 BA/SLG 的調整效果
HR_EYE_MODIFIER_MIDPOINT = ATTR_EFFECT_MIDPOINT
HR_EYE_MODIFIER_SCALE = 40.0
HR_EYE_MODIFIER_MAX_IMPACT = 0.12

HR_HIT_MODIFIER_MIDPOINT = ATTR_EFFECT_MIDPOINT
HR_HIT_MODIFIER_SCALE = 40.0
HR_HIT_MODIFIER_MAX_IMPACT = 0.18

# Ball In Play (BIP) Outcomes Parameters (2B)
# *** 變更點：進一步調整二壘安打分配參數，以期在 BA 提升後，SLG 也能跟上 ***
AVG_2B_PER_HIT_BIP_NOT_HR_AT_MIDPOINT = 0.31 # 再次提高中點值 (原 0.30)
MIN_2B_PER_HIT_BIP_NOT_HR = 0.22             # 再次提高下限 (原 0.20)
MAX_2B_PER_HIT_BIP_NOT_HR = 0.42             # 再次提高上限 (原 0.40)
EXTRABASE_POW_EFFECT_MIDPOINT = ATTR_EFFECT_MIDPOINT
EXTRABASE_POW_EFFECT_SCALE = 48.0 # (原 50.0) 略微增加POW在高值區的敏感度
EXTRABASE_HIT_EFFECT_MIDPOINT = ATTR_EFFECT_MIDPOINT
EXTRABASE_HIT_EFFECT_SCALE = 48.0 # (原 50.0) 略微增加HIT在高值區的敏感度
EXTRABASE_POW_WEIGHT = 0.50 # (原 0.55) 將權重稍微向 HIT 傾斜，或保持均衡
EXTRABASE_HIT_WEIGHT = 0.50 # (原 0.45)

# League Average HBP Rate
LEAGUE_AVG_HBP_RATE = 0.010
