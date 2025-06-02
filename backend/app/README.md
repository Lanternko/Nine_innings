# Baseball_algo
Use POW/HIT/EYE to predict player's ability and performance!

Baseball_Simulation/
├── game_constants.py       # 儲存聯盟平均、百分位基準等常數
├── player_data.py          # 儲存球員真實數據、目標數據、錨點屬性計算
├── probability_model.py    # 核心：get_player_pa_event_probabilities (SB2因子)
├── simulation_engine.py    # 包含 simulate_season 和 calculate_sim_stats
├── optimization_utils.py   # 包含 calculate_error_with_anchor 和搜索算法框架
└── main_simulation.py      # 主執行腳本，協調所有模組進行測試和模擬