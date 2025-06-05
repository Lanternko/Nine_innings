# optimization_utils.py
import math
import random
import time
import heapq

from backend.app.core.game_constants import (
    NUM_ITERATIONS_STAGE_ONE, NUM_SEASONS_PER_EVAL_STAGE_ONE,
    TOP_N_CANDIDATES_FROM_STAGE_ONE,
    NUM_SEASONS_PER_EVAL_STAGE_TWO,
    ERROR_WEIGHTS_STAGE_ONE, DEVIATION_PENALTY_WEIGHT_STAGE_ONE,
    ERROR_WEIGHTS_STAGE_TWO, DEVIATION_PENALTY_WEIGHT_STAGE_TWO
)

# calculate_error_with_anchor 函數與上一版本相同，此處省略
def calculate_error_with_anchor(sim_stats,
                                target_stats_ratios,
                                target_stats_counts,
                                current_abilities,
                                anchor_abilities,
                                error_weights,
                                weight_deviation_penalty):
    error_sim = 0.0
    ratio_keys_to_check = ["BA", "OBP", "SLG"]
    if "OPS" in error_weights:
        ratio_keys_to_check.append("OPS")

    for stat_key in ratio_keys_to_check:
        if error_weights.get(stat_key, 0) == 0:
            continue
        if target_stats_ratios.get(stat_key, 0) > 0:
            sim_val = sim_stats.get(stat_key, 0)
            target_val = target_stats_ratios[stat_key]
            error_sim += error_weights.get(stat_key, 1.0) * \
                ((sim_val - target_val) / target_val)**2

    count_stat_map = {"HR": "HR_target", "BB": "BB_target", "K": "K_target"}
    for stat_key, target_count_key in count_stat_map.items():
        if error_weights.get(stat_key, 0) == 0:
            continue
        sim_val_count = sim_stats.get(f"{stat_key}_count", 0)
        target_val_count = target_stats_counts.get(target_count_key, 0)
        if target_val_count > 0:
            error_sim += error_weights.get(stat_key, 1.0) * \
                ((sim_val_count - target_val_count) / target_val_count)**2
        elif stat_key == "K" and target_stats_ratios.get("K_rate", 0) > 0:
            sim_k_rate = sim_stats.get("K_rate",0)
            target_k_rate = target_stats_ratios["K_rate"]
            error_sim += error_weights.get("K", 1.0) * \
                ((sim_k_rate - target_k_rate) / target_k_rate)**2
    
    error_anchor_dev = 0.0
    norm_pow = anchor_abilities.get("POW", 70) if anchor_abilities.get("POW", 70) != 0 else 70
    norm_hit = anchor_abilities.get("HIT", 70) if anchor_abilities.get("HIT", 70) != 0 else 70
    norm_eye = anchor_abilities.get("EYE", 70) if anchor_abilities.get("EYE", 70) != 0 else 70

    error_anchor_dev += ((current_abilities["POW"] - anchor_abilities["POW"]) / norm_pow )**2
    error_anchor_dev += ((current_abilities["HIT"] - anchor_abilities["HIT"]) / norm_hit )**2
    error_anchor_dev += ((current_abilities["EYE"] - anchor_abilities["EYE"]) / norm_eye )**2
    
    total_error = math.sqrt(error_sim + weight_deviation_penalty * error_anchor_dev)
    return total_error


def get_random_even_integer_in_range(low, high):
    """
    Generates a random even integer within the specified float range [low, high].
    """
    min_val = math.ceil(low)
    max_val = math.floor(high)

    if min_val > max_val: # 如果範圍無效或太小
        # 返回最接近範圍中點的偶數，或基於邊界的偶數
        # 這裡簡化處理：如果下限是偶數則返回下限，否則返回下限+1 (如果仍在範圍內)
        # 或者，如果希望更嚴格，可以拋出錯誤或返回一個標記值
        # 為了搜索，我們至少需要一個值
        if min_val % 2 != 0:
            min_val +=1
        return max(math.ceil(low), min(min_val, math.floor(high)))


    # 調整下限為範圍內的第一個偶數
    start_even = min_val if min_val % 2 == 0 else min_val + 1
    # 調整上限為範圍內的最後一個偶數
    end_even = max_val if max_val % 2 == 0 else max_val - 1

    if start_even > end_even: # 如果調整後沒有有效的偶數範圍
        # 可以選擇返回最接近的偶數，或基於邊界的偶數
        # 例如，返回初始範圍內最接近的偶數
        if min_val % 2 == 0 and min_val <= max_val : return min_val
        if max_val % 2 == 0 and max_val >= min_val : return max_val
        return start_even if start_even <= max_val else end_even # 盡可能返回一個值

    # random.randrange 的停止點是獨占的，所以 end_even + 2
    return random.randrange(start_even, end_even + 2, 2)


def find_best_attributes_two_stage_search(
        player_name,
        anchor_abilities,
        target_pa,
        target_counts,
        target_ratios,
        player_hbp_rate,
        prob_calculator_func,
        season_simulator_func,
        stats_calculator_func,
        pow_search_range,
        hit_search_range,
        eye_search_range
    ):
    candidate_heap = []

    print(f"\n===== {player_name}: 最佳化階段一 (廣泛探索 - 偶數取樣) =====")
    print(f"共 {NUM_ITERATIONS_STAGE_ONE} 次嘗試, 每次模擬 {NUM_SEASONS_PER_EVAL_STAGE_ONE} 個賽季。")
    print(f"誤差權重 (階段一): {ERROR_WEIGHTS_STAGE_ONE}")
    print(f"錨點懲罰權重 (階段一): {DEVIATION_PENALTY_WEIGHT_STAGE_ONE}")

    stage_one_start_time = time.time()
    for i in range(NUM_ITERATIONS_STAGE_ONE):
        # --- 修改點：階段一使用偶數整數取樣 ---
        current_pow = get_random_even_integer_in_range(pow_search_range[0], pow_search_range[1])
        current_hit = get_random_even_integer_in_range(hit_search_range[0], hit_search_range[1])
        current_eye = get_random_even_integer_in_range(eye_search_range[0], eye_search_range[1])
        # --- 修改結束 ---
        current_trial_abilities = {"POW": float(current_pow), "HIT": float(current_hit), "EYE": float(current_eye)} # 確保是浮點數

        current_event_probs = prob_calculator_func(
            current_trial_abilities["POW"], current_trial_abilities["HIT"], current_trial_abilities["EYE"], player_hbp_rate
        )
        
        all_season_sim_stats_list_s1 = []
        for _ in range(NUM_SEASONS_PER_EVAL_STAGE_ONE):
            ss_outcomes = season_simulator_func(target_pa, current_event_probs)
            all_season_sim_stats_list_s1.append(stats_calculator_func(ss_outcomes))
        
        avg_sim_ratios_s1 = {
            stat: sum(s[stat] for s in all_season_sim_stats_list_s1) / NUM_SEASONS_PER_EVAL_STAGE_ONE
            for stat in ["BA", "OBP", "SLG", "K_rate", "BB_rate", "OPS"]
        }
        avg_sim_counts_s1 = {
            count_stat: sum(s[count_stat_key] for s in all_season_sim_stats_list_s1) / NUM_SEASONS_PER_EVAL_STAGE_ONE
            for count_stat, count_stat_key in [
                ("HR_count", "HR_count"), ("BB_count", "BB_count"), ("K_count", "K_count")
            ]
        }
        sim_stats_for_error_s1 = {**avg_sim_ratios_s1, **avg_sim_counts_s1}

        current_total_error_s1 = calculate_error_with_anchor(
            sim_stats_for_error_s1, target_ratios, target_counts,
            current_trial_abilities, anchor_abilities,
            ERROR_WEIGHTS_STAGE_ONE, DEVIATION_PENALTY_WEIGHT_STAGE_ONE
        )

        if len(candidate_heap) < TOP_N_CANDIDATES_FROM_STAGE_ONE:
            heapq.heappush(candidate_heap, (-current_total_error_s1, current_trial_abilities))
        elif -current_total_error_s1 > candidate_heap[0][0]:
            heapq.heapreplace(candidate_heap, (-current_total_error_s1, current_trial_abilities))

        if (i + 1) % (NUM_ITERATIONS_STAGE_ONE // 20 or 1) == 0:
            current_best_error_in_heap = -max(item[0] for item in candidate_heap) if candidate_heap else float('inf')
            print(f"  階段一迭代 {i+1}/{NUM_ITERATIONS_STAGE_ONE}: 當前堆中最佳誤差 {current_best_error_in_heap:.4f}")

    stage_one_duration = time.time() - stage_one_start_time
    print(f"階段一完成。耗時: {stage_one_duration:.2f} 秒。篩選出 {len(candidate_heap)} 個候選者。")

    top_candidates_abilities = [item[1] for item in sorted(candidate_heap, key=lambda x: x[0], reverse=True)]

    print(f"\n===== {player_name}: 最佳化階段二 (精細評估) =====")
    print(f"對 {len(top_candidates_abilities)} 個候選者進行評估, 每次模擬 {NUM_SEASONS_PER_EVAL_STAGE_TWO} 個賽季。")
    print(f"誤差權重 (階段二): {ERROR_WEIGHTS_STAGE_TWO}")
    print(f"錨點懲罰權重 (階段二): {DEVIATION_PENALTY_WEIGHT_STAGE_TWO}")
    
    best_pow_final = anchor_abilities['POW']
    best_hit_final = anchor_abilities['HIT']
    best_eye_final = anchor_abilities['EYE']
    min_total_error_final = float('inf')
    
    stage_two_start_time = time.time()
    for i, current_trial_abilities_s2 in enumerate(top_candidates_abilities):
        current_pow_s2 = current_trial_abilities_s2["POW"]
        current_hit_s2 = current_trial_abilities_s2["HIT"]
        current_eye_s2 = current_trial_abilities_s2["EYE"]

        current_event_probs_s2 = prob_calculator_func(
            current_pow_s2, current_hit_s2, current_eye_s2, player_hbp_rate
        )

        all_season_sim_stats_list_s2 = []
        for _ in range(NUM_SEASONS_PER_EVAL_STAGE_TWO):
            ss_outcomes_s2 = season_simulator_func(target_pa, current_event_probs_s2)
            all_season_sim_stats_list_s2.append(stats_calculator_func(ss_outcomes_s2))

        avg_sim_ratios_s2 = {
            stat: sum(s[stat] for s in all_season_sim_stats_list_s2) / NUM_SEASONS_PER_EVAL_STAGE_TWO
            for stat in ["BA", "OBP", "SLG", "K_rate", "BB_rate", "OPS"]
        }
        avg_sim_counts_s2 = {
            count_stat: sum(s[count_stat_key] for s in all_season_sim_stats_list_s2) / NUM_SEASONS_PER_EVAL_STAGE_TWO
            for count_stat, count_stat_key in [
                ("HR_count", "HR_count"), ("BB_count", "BB_count"), ("K_count", "K_count")
            ]
        }
        sim_stats_for_error_s2 = {**avg_sim_ratios_s2, **avg_sim_counts_s2}

        current_total_error_s2 = calculate_error_with_anchor(
            sim_stats_for_error_s2, target_ratios, target_counts,
            current_trial_abilities_s2, anchor_abilities,
            ERROR_WEIGHTS_STAGE_TWO, DEVIATION_PENALTY_WEIGHT_STAGE_TWO
        )

        if current_total_error_s2 < min_total_error_final:
            min_total_error_final = current_total_error_s2
            best_pow_final = current_pow_s2
            best_hit_final = current_hit_s2
            best_eye_final = current_eye_s2
            print(f"  階段二迭代 {i+1}/{len(top_candidates_abilities)}: 新的最佳誤差 {min_total_error_final:.4f} (POW:{best_pow_final:.2f}, HIT:{best_hit_final:.2f}, EYE:{best_eye_final:.2f})")
        elif (i + 1) % (len(top_candidates_abilities) // 10 or 1) == 0 :
             print(f"  階段二迭代 {i+1}/{len(top_candidates_abilities)}: 當前誤差 {current_total_error_s2:.4f} (POW:{current_pow_s2:.2f}, HIT:{current_hit_s2:.2f}, EYE:{current_eye_s2:.2f})")

    stage_two_duration = time.time() - stage_two_start_time
    print(f"\n階段二完成。耗時: {stage_two_duration:.2f} 秒。")
    print(f"為 {player_name} 自動迭代搜索完成 (兩階段)！")
    print(f"找到的最佳 POW, HIT, EYE 組合為：")
    print(f"  POW: {best_pow_final:.2f}")
    print(f"  HIT: {best_hit_final:.2f}")
    print(f"  EYE: {best_eye_final:.2f}")
    print(f"  對應的最小總誤差 (階段二): {min_total_error_final:.4f}")
    
    return {"POW": best_pow_final, "HIT": best_hit_final, "EYE": best_eye_final}, min_total_error_final
