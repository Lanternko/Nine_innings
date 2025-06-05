import matplotlib
matplotlib.use('Agg') # Use a non-interactive backend for environments without a display
import matplotlib.pyplot as plt
import numpy as np
import time # To track execution time
import os # For creating directories

# Assuming your project files are in the same directory or accessible via PYTHONPATH
from backend.app.core.probability_model import get_pa_event_probabilities
from backend.app.core.simulation_engine import simulate_season, calculate_sim_stats
from backend.app.core.game_constants import (
    NUM_PA_PER_SEASON_ARCHETYPE,
    LEAGUE_AVG_HBP_RATE
)

# --- Configuration ---
FIXED_ATTRIBUTE_VALUE = 70  # Value for attributes that are held constant
VARYING_ATTRIBUTE_MIN = 1
VARYING_ATTRIBUTE_MAX = 150
NUM_SEASONS_PER_POINT = 100 # Reduced for faster chart generation, increase for more accuracy (e.g., 500-1000)
NUM_PA_PER_SEASON = NUM_PA_PER_SEASON_ARCHETYPE
PLAYER_HBP_RATE = LEAGUE_AVG_HBP_RATE
REPORT_DIR = "reports" # Directory to save generated charts

# --- Helper Functions ---

def ensure_report_dir_exists():
    """Ensures the report directory exists, creates it if not."""
    if not os.path.exists(REPORT_DIR):
        os.makedirs(REPORT_DIR)
        print(f"已創建資料夾: {REPORT_DIR}")

def run_simulations_for_attribute_point(pow_val, hit_val, eye_val):
    """
    Runs simulations for a single combination of POW, HIT, EYE
    and returns the average calculated stats.
    """
    event_probs = get_pa_event_probabilities(pow_val, hit_val, eye_val, PLAYER_HBP_RATE)
    
    all_season_stats_list = []
    for _ in range(NUM_SEASONS_PER_POINT):
        single_season_outcomes = simulate_season(NUM_PA_PER_SEASON, event_probs)
        all_season_stats_list.append(calculate_sim_stats(single_season_outcomes))
    
    avg_stats = {
        stat_key: sum(s[stat_key] for s in all_season_stats_list) / NUM_SEASONS_PER_POINT
        for stat_key in ["BA", "OBP", "SLG", "OPS", "K_rate", "BB_rate"]
    }
    # Calculate HR count specifically for HR plot
    avg_stats["HR_count"] = sum(s["HR_count"] for s in all_season_stats_list) / NUM_SEASONS_PER_POINT
    return avg_stats

def generate_impact_data(varying_attr_name):
    """
    Generates data for how KPIs change as one attribute varies.
    """
    print(f"正在為變動屬性生成數據: {varying_attr_name} (固定其他屬性為 {FIXED_ATTRIBUTE_VALUE})...")
    attribute_values = list(range(VARYING_ATTRIBUTE_MIN, VARYING_ATTRIBUTE_MAX + 1))
    results = {
        "attribute_values": attribute_values,
        "HR_count": [], "BA": [], "OBP": [], "SLG": [], "OPS": [],
        "K_rate": [], "BB_rate": []
    }

    total_points = len(attribute_values)
    start_time = time.time()

    for i, val in enumerate(attribute_values):
        current_pow, current_hit, current_eye = 0, 0, 0
        if varying_attr_name == "POW":
            current_pow, current_hit, current_eye = val, FIXED_ATTRIBUTE_VALUE, FIXED_ATTRIBUTE_VALUE
        elif varying_attr_name == "HIT":
            current_pow, current_hit, current_eye = FIXED_ATTRIBUTE_VALUE, val, FIXED_ATTRIBUTE_VALUE
        elif varying_attr_name == "EYE":
            current_pow, current_hit, current_eye = FIXED_ATTRIBUTE_VALUE, FIXED_ATTRIBUTE_VALUE, val
        
        avg_sim_stats = run_simulations_for_attribute_point(current_pow, current_hit, current_eye)
        
        results["HR_count"].append(avg_sim_stats["HR_count"])
        results["BA"].append(avg_sim_stats["BA"])
        results["OBP"].append(avg_sim_stats["OBP"])
        results["SLG"].append(avg_sim_stats["SLG"])
        results["OPS"].append(avg_sim_stats["OPS"])
        results["K_rate"].append(avg_sim_stats["K_rate"])
        results["BB_rate"].append(avg_sim_stats["BB_rate"])

        if (i + 1) % 10 == 0 or i == total_points - 1:
            elapsed_time = time.time() - start_time
            avg_time_per_point = elapsed_time / (i + 1) if (i+1) > 0 else 0
            remaining_points = total_points - (i + 1)
            eta = remaining_points * avg_time_per_point
            print(f"  進度: {i+1}/{total_points} (預計剩餘時間: {eta:.1f} 秒)")
            
    print(f"{varying_attr_name} 數據生成完畢。總耗時: {time.time() - start_time:.1f} 秒")
    return results

def plot_impact_charts(attr_name, data, fixed_value, filename_prefix):
    """
    Generates and saves plots for the impact of the varying attribute.
    Saves plots into the REPORT_DIR.
    """
    x_values = data["attribute_values"]
    
    # 確保報告資料夾存在
    ensure_report_dir_exists()

    # 圖表 1: HR, SLG, OPS
    fig1, ax1 = plt.subplots(figsize=(12, 7))
    ax1.plot(x_values, data["HR_count"], label="平均全壘打數 (HR)", color="red", marker='o', markersize=3, linestyle='-')
    ax1.set_xlabel(f"{attr_name} 值 (其他固定為 {fixed_value})")
    ax1.set_ylabel("平均全壘打數", color="red")
    ax1.tick_params(axis='y', labelcolor="red")
    ax1.grid(True, linestyle='--', alpha=0.7)

    ax2 = ax1.twinx() #共享X軸
    ax2.plot(x_values, data["SLG"], label="長打率 (SLG)", color="blue", marker='s', markersize=3, linestyle='--')
    ax2.plot(x_values, data["OPS"], label="整體攻擊指數 (OPS)", color="green", marker='^', markersize=3, linestyle=':')
    ax2.set_ylabel("比率 (SLG, OPS)")
    ax2.tick_params(axis='y')

    fig1.suptitle(f"{attr_name} 對 HR, SLG, OPS 的影響 (其他屬性固定為 {fixed_value})", fontsize=16)
    
    # 處理圖例，確保不重疊
    lines, labels = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax2.legend(lines + lines2, labels + labels2, loc="upper left", bbox_to_anchor=(0.05, 0.95))

    plt.tight_layout(rect=[0, 0, 1, 0.96]) # 調整佈局以容納標題
    save_path = os.path.join(REPORT_DIR, f"{filename_prefix}_hr_slg_ops.png")
    plt.savefig(save_path)
    plt.close(fig1)
    print(f"圖表已儲存: {save_path}")

    # 圖表 2: BA, OBP
    fig2, ax3 = plt.subplots(figsize=(12, 7))
    ax3.plot(x_values, data["BA"], label="打擊率 (BA)", color="purple", marker='o', markersize=3, linestyle='-')
    ax3.plot(x_values, data["OBP"], label="上壘率 (OBP)", color="orange", marker='s', markersize=3, linestyle='--')
    ax3.set_xlabel(f"{attr_name} 值 (其他固定為 {fixed_value})")
    ax3.set_ylabel("比率")
    ax3.legend(loc="best")
    ax3.set_title(f"{attr_name} 對 BA, OBP 的影響 (其他屬性固定為 {fixed_value})", fontsize=16)
    ax3.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()
    save_path = os.path.join(REPORT_DIR, f"{filename_prefix}_ba_obp.png")
    plt.savefig(save_path)
    plt.close(fig2)
    print(f"圖表已儲存: {save_path}")

    # 圖表 3: K_rate, BB_rate
    fig3, ax4 = plt.subplots(figsize=(12, 7))
    ax4.plot(x_values, data["K_rate"], label="三振率 (K_rate)", color="brown", marker='o', markersize=3, linestyle='-')
    ax4.plot(x_values, data["BB_rate"], label="保送率 (BB_rate)", color="cyan", marker='s', markersize=3, linestyle='--')
    ax4.set_xlabel(f"{attr_name} 值 (其他固定為 {fixed_value})")
    ax4.set_ylabel("比率")
    ax4.legend(loc="best")
    ax4.set_title(f"{attr_name} 對 K_rate, BB_rate 的影響 (其他屬性固定為 {fixed_value})", fontsize=16)
    ax4.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()
    save_path = os.path.join(REPORT_DIR, f"{filename_prefix}_k_bb_rates.png")
    plt.savefig(save_path)
    plt.close(fig3)
    print(f"圖表已儲存: {save_path}")

# --- Main Execution ---
if __name__ == "__main__":
    # 設定中文字體
    # 嘗試使用 'Microsoft JhengHei'，如果失敗則嘗試 'SimHei'，最後回退到 Matplotlib 預設
    try:
        plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei']
        plt.rcParams['axes.unicode_minus'] = False  # 解決負號顯示問題
        # 測試中文字體是否可用 (可選)
        fig_test, ax_test = plt.subplots(figsize=(1,1))
        ax_test.set_title("測試")
        plt.close(fig_test)
        print("已設定字體為 Microsoft JhengHei")
    except Exception:
        try:
            plt.rcParams['font.sans-serif'] = ['SimHei']
            plt.rcParams['axes.unicode_minus'] = False
            fig_test, ax_test = plt.subplots(figsize=(1,1))
            ax_test.set_title("测试") # SimHei is for Simplified Chinese
            plt.close(fig_test)
            print("Microsoft JhengHei 設定失敗，已設定字體為 SimHei")
        except Exception:
            print("中文字體 (Microsoft JhengHei, SimHei) 設定失敗，將使用 Matplotlib 預設字體。圖表中的中文可能無法正常顯示。")


    # 確保報告資料夾存在 (在繪圖前再次確認，雖然 plot_impact_charts 內部也會檢查)
    ensure_report_dir_exists()
    
    # 1. POW 變化 (HIT, EYE 固定)
    pow_impact_data = generate_impact_data("POW")
    plot_impact_charts("POW", pow_impact_data, FIXED_ATTRIBUTE_VALUE, "pow_impact")

    # 2. HIT 變化 (POW, EYE 固定)
    hit_impact_data = generate_impact_data("HIT")
    plot_impact_charts("HIT", hit_impact_data, FIXED_ATTRIBUTE_VALUE, "hit_impact")

    # 3. EYE 變化 (POW, HIT 固定)
    eye_impact_data = generate_impact_data("EYE")
    plot_impact_charts("EYE", eye_impact_data, FIXED_ATTRIBUTE_VALUE, "eye_impact")

    print("\n所有圖表生成完畢。")

