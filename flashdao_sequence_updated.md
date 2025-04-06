```mermaid
sequenceDiagram
    title FlashDAO 緊急響應系統時序圖
    
    actor User as 用戶
    participant FE as 前端(Next.js)
    participant API as API層(Next.js API Routes)
    participant Oracle as Chainlink Oracle
    participant Claude as Claude AI
    participant Factory as DAO工廠(Solidity合約)
    participant EventDAO as 事件DAO(Solidity合約)
    participant CCTP as Circle CCTP v2
    
    %% 災難事件檢測
    Oracle->>Factory: 1. 檢測並報告災難事件
    Factory->>Claude: 2. 請求生成合約代碼
    Claude->>Factory: 3. 返回事件特定合約代碼
    
    %% DAO 創建
    Factory->>EventDAO: 4. 部署事件特定DAO合約
    
    %% 用戶前端互動
    User->>FE: 5. 訪問應用程序主頁
    FE->>API: 6. 請求活躍的緊急響應事件
    API->>EventDAO: 7. 調用智能合約獲取事件數據
    EventDAO->>API: 8. 返回事件數據和籌集的資金
    API->>FE: 9. 返回活躍事件列表
    FE->>User: 10. 顯示緊急響應事件
    
    %% 捐款流程
    User->>FE: 11. 點擊"響應"按鈕
    FE->>User: 12. 顯示捐款選項
    User->>FE: 13. 提交USDC捐款
    FE->>API: 14. 處理支付請求
    API->>EventDAO: 15. 調用合約捐款函數
    EventDAO->>User: 16. 鑄造等額FlashDAO治理代幣
    
    %% 投票流程
    User->>FE: 17. 查看行動選項
    FE->>EventDAO: 18. 請求行動數據
    EventDAO->>FE: 19. 返回可用行動選項
    FE->>User: 20. 顯示行動選項
    User->>FE: 21. 選擇行動並投票
    FE->>EventDAO: 22. 提交投票交易
    EventDAO->>EventDAO: 23. 更新投票計數
    
    %% 資金分配
    EventDAO->>EventDAO: 24. 投票期結束，確定最終行動
    EventDAO->>CCTP: 25. 啟動跨鏈USDC轉賬
    CCTP->>EventDAO: 26. 確認接收地址
    CCTP->>EventDAO: 27. 將籌集的USDC用於執行最高票數行動
``` 