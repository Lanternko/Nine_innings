# backend/app/main.py
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 確保導入

# 假設您的 Pydantic 模型和核心邏輯檔案在正確的路徑
# (請確保這些導入路徑是正確的，根據您目前的檔案結構)
from .models.simulation_models import BatterAttributes, AtBatResult
from .core.probability_model import get_pa_event_probabilities

# 創建 FastAPI 應用實例
app = FastAPI(
    title="Baseball Simulation API",
    description="提供棒球比賽打席模擬的核心 API 服務。",
    version="1.0.0",
)

# --- 配置 CORS (跨域資源共享) ---
origins = [
    "http://localhost:5500",  # 您的前端開發伺服器地址
    "http://127.0.0.1:5500", # 有時 localhost 解析問題，加入 127.0.0.1
    # 如果您還會在其他端口或域名測試前端，也需要加入
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # 允許來自這些源的請求
    allow_credentials=True,    # 是否支持 cookies (雖然此專案目前不用，但通常會加上)
    allow_methods=["*"],       # 允許所有 HTTP 方法 (GET, POST, OPTIONS 等)
    allow_headers=["*"],       # 允許所有 HTTP 標頭 (包括 Content-Type, Accept 等)
)
# --- CORS 配置結束 ---



@app.post("/api/v1/simulate_at_bat", response_model=AtBatResult)
async def simulate_single_at_bat(attributes: BatterAttributes):
    print(f"[Backend] Received attributes by API: {attributes.model_dump_json(indent=2)}") # <--- 加入這行

    """
    模擬一次打席的結果。
    接收打者的 POW, HIT, EYE 屬性，回傳打席結果。
    """
    # 1. 從核心模型獲取各事件的發生機率
    # 注意：確保 get_pa_event_probabilities 函數的參數與 BatterAttributes 一致
    event_probabilities = get_pa_event_probabilities(
        POW=attributes.pow,
        HIT=attributes.hit,
        EYE=attributes.eye,
        player_hbp_rate=attributes.hbp_rate
    )
    print(f"[Backend] Calculated event_probabilities: {event_probabilities}") # <--- 加入這行


    # 2. 從計算出的機率中，隨機抽出一個實際發生的事件
    # (這段邏輯類似您 simulation_engine.py 中的 simulate_season 但只處理一次事件)
    event_order = ["HR", "2B", "1B", "BB", "HBP", "K", "IPO"] # 確保順序與機率計算時的期望一致
    rand_val = random.random()
    cumulative_prob = 0.0
    chosen_event = "IPO"  # 預設結果為界內球出局

    for event_type in event_order:
        prob = event_probabilities.get(event_type, 0.0)
        cumulative_prob += prob
        if rand_val < cumulative_prob:
            chosen_event = event_type
            break

    print(f"[Backend] Chosen event: {chosen_event}") # <--- 加入這行
            
    return AtBatResult(outcome=chosen_event, probabilities=event_probabilities)

# 您可以在這裡加入其他 API 端點，例如獲取球員資料等

# 測試用的根路徑
@app.get("/")
async def read_root():
    return {"message": "歡迎使用棒球模擬 API！請訪問 /docs 查看 API 文件。"}