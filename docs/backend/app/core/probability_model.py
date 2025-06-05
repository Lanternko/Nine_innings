import math
from .game_constants import (
    ATTR_EFFECT_MIDPOINT, SOFT_CAP_ATTRIBUTE_VALUE,

    HR_S_CURVE_POW_ANCHORS, ABSOLUTE_MAX_HR_RATE_CAP,
    HR_EYE_MODIFIER_MIDPOINT, HR_EYE_MODIFIER_SCALE, HR_EYE_MODIFIER_MAX_IMPACT,
    HR_HIT_MODIFIER_MIDPOINT, HR_HIT_MODIFIER_SCALE, HR_HIT_MODIFIER_MAX_IMPACT,

    BABIP_S_CURVE_HIT_ANCHORS, MIN_BABIP_RATE_CAP, MAX_BABIP_RATE_CAP,
    BB_S_CURVE_EYE_ANCHORS, MIN_BB_RATE_CAP, MAX_BB_RATE_CAP,

    K_EYE_EFFECTIVENESS_S_CURVE_ANCHORS,
    K_RATE_HIT_WEIGHT, K_RATE_EYE_WEIGHT,
    K_HIT_EFFECT_MIDPOINT, K_HIT_EFFECT_SCALE,
    AVG_K_RATE_AT_MIDPOINT, MIN_K_RATE_CAP, MAX_K_RATE_CAP,

    AVG_2B_PER_HIT_BIP_NOT_HR_AT_MIDPOINT, MIN_2B_PER_HIT_BIP_NOT_HR, MAX_2B_PER_HIT_BIP_NOT_HR,
    EXTRABASE_POW_EFFECT_MIDPOINT, EXTRABASE_POW_EFFECT_SCALE,
    EXTRABASE_HIT_EFFECT_MIDPOINT, EXTRABASE_HIT_EFFECT_SCALE,
    EXTRABASE_POW_WEIGHT, EXTRABASE_HIT_WEIGHT,
    LEAGUE_AVG_HBP_RATE
)

# --- Helper Functions (scale_attribute_to_effectiveness, get_rate_from_effectiveness, interpolate_s_curve) ---
# (這些輔助函數與上一版相同，此處省略以節省空間，實際使用時需保留)

def scale_attribute_to_effectiveness(attribute_value, midpoint, scale, effect_is_positive=True):
    """
    Scales an attribute to an effectiveness factor, typically between -1 and 1 (for tanh).
    'effect_is_positive': True if higher attribute means "more of the good thing / less of the bad thing".
    """
    if scale == 0:
        return 0.0
    # Cap attribute value for scaling to prevent extreme tanh inputs if desired,
    # though tanh naturally handles large inputs.
    # attribute_value = min(attribute_value, SOFT_CAP_ATTRIBUTE_VALUE * 1.1) # Optional: cap input to tanh
    normalized_value = (attribute_value - midpoint) / scale
    tanh_val = math.tanh(normalized_value)
    return tanh_val if effect_is_positive else -tanh_val

def get_rate_from_effectiveness(base_rate_at_midpoint, min_rate, max_rate, effectiveness_factor):
    """
    Calculates a rate based on an effectiveness factor (-1 to +1).
    This function is now primarily used for K-rate combination and 2B distribution.
    """
    if effectiveness_factor >= 0:
        return base_rate_at_midpoint + effectiveness_factor * (max_rate - base_rate_at_midpoint)
    else:
        return base_rate_at_midpoint + effectiveness_factor * (base_rate_at_midpoint - min_rate)

def interpolate_s_curve(value, anchors):
    """
    Performs linear interpolation for an S-curve defined by anchor points.
    Anchors should be a list of (x, y) tuples, sorted by x.
    """
    if not anchors:
        return 0.0
    
    capped_value = min(value, SOFT_CAP_ATTRIBUTE_VALUE * 1.1) # Apply a cap before interpolation
    # capped_value = max(capped_value, 0) # Ensure non-negative for safety

    if capped_value <= anchors[0][0]:
        return anchors[0][1]
    if capped_value >= anchors[-1][0]:
        # For values beyond the last anchor, extrapolate linearly from the last two points
        # or simply return the last anchor's y-value if extrapolation is not desired.
        # Here, we'll return the last y-value to represent a soft cap.
        return anchors[-1][1]


    for i in range(len(anchors) - 1):
        x1, y1 = anchors[i]
        x2, y2 = anchors[i+1]
        if x1 <= capped_value < x2:
            if (x2 - x1) == 0: 
                return y1 
            return y1 + (y2 - y1) * (capped_value - x1) / (x2 - x1)
    
    return anchors[-1][1] # Fallback, should be covered by boundary checks

# --- Rate Calculation Functions using S-Curves ---

def calculate_hr_rate_from_pow_s_curve(POW):
    """Calculates the base HR rate (per PA) using an S-curve based on POW."""
    return interpolate_s_curve(POW, HR_S_CURVE_POW_ANCHORS)

def calculate_babip_from_hit_s_curve(HIT):
    """Calculates BABIP using an S-curve based on HIT."""
    babip = interpolate_s_curve(HIT, BABIP_S_CURVE_HIT_ANCHORS)
    return max(MIN_BABIP_RATE_CAP, min(MAX_BABIP_RATE_CAP, babip))

def calculate_bb_rate_from_eye_s_curve(EYE):
    """Calculates BB rate (per PA) using an S-curve based on EYE."""
    bb_rate = interpolate_s_curve(EYE, BB_S_CURVE_EYE_ANCHORS)
    return max(MIN_BB_RATE_CAP, min(MAX_BB_RATE_CAP, bb_rate))

def calculate_k_rate_combined(EYE, HIT):
    """
    Calculates K rate based on EYE (S-curve effectiveness) and HIT (tanh effectiveness).
    """
    # EYE's contribution to K effectiveness (S-curve, -1 to +1, negative is better for K%)
    eye_k_effectiveness = interpolate_s_curve(EYE, K_EYE_EFFECTIVENESS_S_CURVE_ANCHORS)
    
    # HIT's contribution to K effectiveness (tanh, -1 to +1, negative is better for K%)
    # For K_Rate, higher HIT is good (reduces K), so effect_is_positive=False for scale_attribute
    hit_k_effectiveness = scale_attribute_to_effectiveness(HIT, K_HIT_EFFECT_MIDPOINT, K_HIT_EFFECT_SCALE, effect_is_positive=False)
    
    # Weighted combined effectiveness.
    # Positive effectiveness here means K-rate goes towards MAX_K_RATE (bad).
    # Negative effectiveness means K-rate goes towards MIN_K_RATE (good).
    combined_k_effectiveness = (K_RATE_EYE_WEIGHT * eye_k_effectiveness +
                                K_RATE_HIT_WEIGHT * hit_k_effectiveness)

    # Ensure combined_k_effectiveness is within [-1, 1] if weights could make it exceed.
    # (Not strictly necessary if weights sum to 1 and individual factors are in [-1,1])
    # combined_k_effectiveness = max(-1.0, min(1.0, combined_k_effectiveness))

    # Get final K-rate using the combined effectiveness
    # Note: AVG_K_RATE_AT_MIDPOINT is the K-rate when combined_k_effectiveness is 0.
    # MIN_K_RATE_CAP is when combined_k_effectiveness is -1 (best case for K).
    # MAX_K_RATE_CAP is when combined_k_effectiveness is +1 (worst case for K).
    k_rate = get_rate_from_effectiveness(AVG_K_RATE_AT_MIDPOINT, MIN_K_RATE_CAP, MAX_K_RATE_CAP, combined_k_effectiveness)
    return max(MIN_K_RATE_CAP, min(MAX_K_RATE_CAP, k_rate))


# --- Main Probability Calculation ---
def get_pa_event_probabilities(POW, HIT, EYE, player_hbp_rate):
    """
    Calculates the probabilities of different plate appearance outcomes
    using S-curves for primary rates and modifiers for HR.
    """
    # 1. Calculate K%, BB%, HBP%
    p_k = calculate_k_rate_combined(EYE, HIT)
    p_bb = calculate_bb_rate_from_eye_s_curve(EYE)
    p_hbp = max(0.0, min(0.05, player_hbp_rate if player_hbp_rate is not None else LEAGUE_AVG_HBP_RATE))

    # 2. Calculate base P(HR) from POW S-curve
    base_p_hr_pa = calculate_hr_rate_from_pow_s_curve(POW)

    # Apply EYE and HIT modifiers to base HR rate
    eye_eff_hr_mod = scale_attribute_to_effectiveness(EYE, HR_EYE_MODIFIER_MIDPOINT, HR_EYE_MODIFIER_SCALE, True)
    eye_modifier = 1.0 + (eye_eff_hr_mod * HR_EYE_MODIFIER_MAX_IMPACT)

    hit_eff_hr_mod = scale_attribute_to_effectiveness(HIT, HR_HIT_MODIFIER_MIDPOINT, HR_HIT_MODIFIER_SCALE, True)
    hit_modifier = 1.0 + (hit_eff_hr_mod * HR_HIT_MODIFIER_MAX_IMPACT)

    p_hr = base_p_hr_pa * eye_modifier * hit_modifier
    p_hr = max(0.0, min(p_hr, ABSOLUTE_MAX_HR_RATE_CAP))

    # 3. Calculate remaining probability for other BIP outcomes
    prob_sum_non_bip_plus_hr = p_k + p_bb + p_hbp + p_hr
    
    if prob_sum_non_bip_plus_hr >= 1.0:
        scale_down = 1.0 / prob_sum_non_bip_plus_hr if prob_sum_non_bip_plus_hr > 0 else 1.0
        p_k *= scale_down
        p_bb *= scale_down
        p_hbp *= scale_down
        p_hr = (1.0 - (p_k + p_bb + p_hbp)) # HR takes the remainder if sum was > 1
        p_hr = max(0, p_hr)
        
        p_1b, p_2b, p_ipo = 0.0, 0.0, 0.0
    else:
        p_bip_for_other_outcomes = 1.0 - prob_sum_non_bip_plus_hr

        # 4. Calculate BABIP for these remaining BIP events using HIT S-curve
        p_hit_given_bip_remaining = calculate_babip_from_hit_s_curve(HIT)

        # 5. Calculate P(Total Hits on these BIPs) and P(IPO on these BIPs)
        p_total_hits_on_remaining_bip = p_bip_for_other_outcomes * p_hit_given_bip_remaining
        p_ipo = p_bip_for_other_outcomes * (1.0 - p_hit_given_bip_remaining)
        p_ipo = max(0, p_ipo)

        # 6. Distribute p_total_hits_on_remaining_bip into P(1B) and P(2B)
        if p_total_hits_on_remaining_bip > 0:
            pow_eff_xbh = scale_attribute_to_effectiveness(POW, EXTRABASE_POW_EFFECT_MIDPOINT, EXTRABASE_POW_EFFECT_SCALE, True)
            hit_eff_xbh = scale_attribute_to_effectiveness(HIT, EXTRABASE_HIT_EFFECT_MIDPOINT, EXTRABASE_HIT_EFFECT_SCALE, True)
            combined_eff_xbh = EXTRABASE_POW_WEIGHT * pow_eff_xbh + EXTRABASE_HIT_WEIGHT * hit_eff_xbh
            
            p_2b_given_hit_bip_not_hr = get_rate_from_effectiveness(
                AVG_2B_PER_HIT_BIP_NOT_HR_AT_MIDPOINT, 
                MIN_2B_PER_HIT_BIP_NOT_HR, 
                MAX_2B_PER_HIT_BIP_NOT_HR, 
                combined_eff_xbh
            )
            p_2b_given_hit_bip_not_hr = max(MIN_2B_PER_HIT_BIP_NOT_HR, min(MAX_2B_PER_HIT_BIP_NOT_HR, p_2b_given_hit_bip_not_hr))
            
            p_2b = p_total_hits_on_remaining_bip * p_2b_given_hit_bip_not_hr
            p_1b = p_total_hits_on_remaining_bip * (1.0 - p_2b_given_hit_bip_not_hr)
            p_2b = max(0, p_2b)
            p_1b = max(0, p_1b)
        else:
            p_1b, p_2b = 0.0, 0.0
            
    # Final check for negative probabilities
    event_keys = ["HR", "2B", "1B", "BB", "HBP", "K", "IPO"]
    temp_events = {"HR": p_hr, "2B": p_2b, "1B": p_1b, "BB": p_bb, "HBP": p_hbp, "K": p_k, "IPO": p_ipo}
    for key in event_keys:
        temp_events[key] = max(0.0, temp_events.get(key, 0.0))

    # Normalize all probabilities to sum to 1.0
    current_total_prob = sum(temp_events.values())
    
    if current_total_prob == 0:
        return {"HR": 0, "2B": 0, "1B": 0, "BB": 0, "HBP": 0, "K": 0, "IPO": 1.0}

    norm_factor = 1.0 / current_total_prob
    normalized_events = {key: value * norm_factor for key, value in temp_events.items()}
    
    return normalized_events
