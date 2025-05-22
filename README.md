# Nine_innings
# ⚾ 9局棒球模擬器 (9-Inning Baseball Simulator)

## 📖 專案描述

本專案是一個網頁版的棒球模擬遊戲。前端使用 HTML, CSS 和 JavaScript 實現互動介面與基本遊戲流程。後端採用 Python FastAPI 服務，提供一個基於 POW (力量) / HIT (安打能力) / EYE (選球能力) 三圍屬性的高精度打擊模擬模型，用以計算詳細的打席結果機率。

前端負責呈現比賽畫面、球隊資訊、計分板等，並處理使用者操作。當進行打席模擬時，前端將向後端 API 發送請求，由後端 Python 模型計算結果後返回給前端進行展示。

此專案旨在結合前端的互動體驗與後端數據模型的精準度，提供一個既有趣又相對真實的棒球模擬體驗。

## 🛠️ 技術棧 (Tech Stack)

### 前端 (Frontend)
* HTML5
* CSS3 (包含 RWD 適應性設計)
* JavaScript (ES6 Modules)

### 後端 (Backend)
* Python 3.x
* FastAPI (高效能 Web 框架)
* Uvicorn (ASGI 伺服器)
* Pydantic (數據驗證與模型定義)

### 數據與模型 (Data & Modeling)
* S-Curve 錨點模型 (用於機率計算)
* 蒙地卡羅模擬 (用於賽季模擬與驗證)
* 兩階段隨機搜索最佳化演算法 (用於球員屬性校準)

## 📁 專案檔案結構 (Proposed Directory Structure)
```
baseball-simulator/
├── frontend/                     # 前端 JavaScript 專案
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── main.js               # 前端主邏輯與初始化
│       ├── gameLogic.js          # 前端遊戲流程控制 (將調用後端 API)
│       ├── ui.js                 # UI 更新與 DOM 操作
│       ├── playerUtils.js        # 前端球員相關工具 (OVR計算等)
│       ├── storageUtils.js       # localStorage 數據存儲
│       ├── config.js             # 前端配置文件 (部分設定可能移至後端或由 API 提供)
│       └── teamsData.js          # 前端預設球隊數據 (部分數據可能由 API 提供)
│
├── backend/                      # 後端 Python FastAPI 專案
│   ├── app/                      # FastAPI 應用程式核心代碼
│   │   ├── init.py
│   │   ├── main.py               # FastAPI 應用實例與 API 路由定義
│   │   ├── api/                  # API 路由模組 (如果路由複雜可拆分)
│   │   │   └── init.py
│   │   │   └── v1/
│   │   │       └── init.py
│   │   │       └── simulation_routes.py
│   │   ├── core/                 # 核心業務邏輯 (打擊模型、模擬引擎等)
│   │   │   ├── init.py
│   │   │   ├── probability_model.py    # 打席事件機率計算模型
│   │   │   ├── simulation_engine.py    # 賽季模擬引擎
│   │   │   ├── player_data_manager.py  # 球員數據處理與 xStats 轉換
│   │   │   └── game_constants.py       # 遊戲常數、S-Curve 錨點、模型參數
│   │   ├── models/               # Pydantic 數據模型 (用於 API 請求與回應)
│   │   │   └── init.py
│   │   │   └── simulation_models.py  # 例如：BatterAttributes, AtBatResult
│   │   └── utils/                # 工具函數 (例如：最佳化工具)
│   │       └── init.py
│   │       └── optimization_utils.py # (如果最佳化也作為 API 的一部分)
│   ├── tests/                    # 後端單元測試與整合測試
│   │   └── ...
│   ├── venv/                     # Python 虛擬環境 (建議加入 .gitignore)
│   ├── requirements.txt          # 後端 Python 依賴套件列表
│   └── .env.example              # 環境變數配置範例 (如果需要)
│
├── README.md                     # 就是您現在看到的這份文件
└── .gitignore                    # Git 忽略文件配置
```


## ⚙️ 安裝與設置 (Installation & Setup)

### 前端
1.  無需特別安裝，直接使用現代瀏覽器打開 `frontend/index.html` 即可（在與後端整合前）。
2.  整合後，前端可能需要一個簡單的本地伺服器來避免檔案路徑問題，例如使用 VS Code 的 "Live Server" 擴展，或 `python -m http.server`。

### 後端
1.  **克隆專案 (Clone the project)** (如果尚未克隆)
    ```bash
    git clone <your-repository-url>
    cd baseball-simulator/backend
    ```
2.  **創建並激活 Python 虛擬環境 (Create and activate a Python virtual environment)**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  **安裝依賴 (Install dependencies)**
    ```bash
    pip install -r requirements.txt
    ```
    (您需要創建 `backend/requirements.txt` 文件，至少包含 `fastapi` 和 `uvicorn[standard]`)

    *`requirements.txt` 範例內容：*
    ```
    fastapi
    uvicorn[standard]
    # 如果用到 numpy 或其他庫，也需加入
    ```

## ▶️ 運行專案 (Running the Project)

### 1. 啟動後端 FastAPI 服務
   進入 `backend/` 目錄，並確保虛擬環境已激活。假設您的 FastAPI 主應用程式檔案是 `app/main.py`，且 FastAPI 實例名為 `app`：
   ```bash
   cd app 
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
--reload：當程式碼變更時自動重啟伺服器，方便開發。
--host 0.0.0.0：允許來自任何網路介面的連接。
--port 8000：指定服務運行的端口 (可自行修改)。 API 服務將運行在 http://localhost:8000 (或您指定的 IP 和端口)。您可以訪問 http://localhost:8000/docs 查看自動生成的 API 文件 (由 FastAPI 提供)。
