```mermaid
classDiagram
    title FlashDAO系統組件圖
    
    %% 前端層
    class Frontend {
        +Next.js
        +React
        +TailwindCSS
        +ethers.js
        +顯示緊急響應事件()
        +提供捐款界面()
        +投票界面()
    }
    
    %% API/後端層
    class APILayer {
        +Next.js API Routes
        +處理支付請求()
        +獲取事件數據()
        +提交區塊鏈交易()
    }
    
    %% AI層
    class AIAgent {
        +Claude API
        +分析災難數據()
        +生成合約代碼()
        +創建事件特定DAO邏輯()
    }
    
    %% 區塊鏈層 - DAO工廠
    class DAOFactory {
        +Solidity
        +EventDAOFactory.sol
        +MultiChainDAOFactory.sol
        +根據災難事件創建DAO()
        +分配資金()
        +跨鏈功能()
    }
    
    %% 區塊鏈層 - 事件DAO
    class EventDAO {
        +Solidity
        +EventDAO.sol
        +管理捐款()
        +發行治理代幣()
        +組織投票()
        +管理行動選項()
        +分配資金()
    }
    
    %% 代幣
    class FlashDAOToken {
        +ERC20
        +1:1兌換USDC
        +提供治理權重()
        +投票功能()
    }
    
    %% 外部整合 - 跨鏈支付
    class CircleCCTP {
        +CCTP v2
        +跨鏈USDC轉賬()
        +多鏈操作()
    }
    
    %% 外部整合 - 事件數據
    class ChainlinkOracles {
        +Oracle
        +實時災難數據()
        +觸發事件創建()
    }
    
    %% 用戶角色
    class User {
        +提供捐款()
        +接收治理代幣()
        +為行動選項投票()
    }
    
    %% 關係定義
    Frontend --> APILayer: API請求
    APILayer --> EventDAO: 區塊鏈交互
    ChainlinkOracles --> DAOFactory: 提供災難數據
    DAOFactory --> AIAgent: 請求合約生成
    AIAgent --> DAOFactory: 提供DAO合約代碼
    DAOFactory --> EventDAO: 部署
    EventDAO --> FlashDAOToken: 發行
    EventDAO --> CircleCCTP: 資金分配
    User --> Frontend: 交互
``` 