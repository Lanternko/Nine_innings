# backend/app/models/simulation_models.py
from typing import Dict, Optional
from pydantic import BaseModel, Field

class BatterAttributes(BaseModel):
    """
    定義模擬打席時，前端需傳送給後端的打者屬性。
    """
    pow: float = Field(..., example=70.0, description="打者的力量值 (Power)")
    hit: float = Field(..., example=70.0, description="打者的打擊技巧值 (Hit Tool)")
    eye: float = Field(..., example=70.0, description="打者的選球能力值 (Plate Discipline/Eye)")
    hbp_rate: Optional[float] = Field(0.010, example=0.010, description="球員的觸身球率 (可選，有預設值)")
    # 未來可以擴展加入投手屬性等
    # pitcher_pow: Optional[float] = Field(None, example=70.0)

class AtBatResult(BaseModel):
    """
    定義後端模擬完一次打席後，回傳給前端的結果。
    """
    outcome: str = Field(..., example="1B", description="打席的最終結果 (例如: HR, 2B, 1B, BB, K, IPO)")
    probabilities: Optional[Dict[str, float]] = Field(None, description="(可選) 各事件發生的詳細機率，供調試或前端進階處理")