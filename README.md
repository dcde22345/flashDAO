# FlashDAO

FlashDAO是一個基於LLM的智能DAO創建系統，用於災難響應和人道主義援助。系統可以監控現實世界的災難事件，自動生成智能合約，並促進捐贈和援助分配。

## 功能特點

- 通過LLM生成特定災難事件的智能合約
- 支持多種災難類型（地震、洪水、火災等）
- 接收Circle支付網關的捐款
- 提供義工登記和驗證機制
- 基於鏈上投票的資金分配

## 系統架構

- `contract/`: 包含所有Solidity智能合約和Hardhat配置
- `scripts/`: 包含所有腳本文件，包括LLM合約生成器、事件監聽器等
- `logs/`: 運行日誌
- `data/`: 存儲處理過的事件數據

## 安裝

1. 克隆儲存庫
2. 安裝依賴
   ```bash
   npm install
   cd contract && npm install
   ```
3. 複製`.env.example`到`.env`並填入必要的API密鑰和配置

## 運行腳本

所有腳本都可以從根目錄使用npm命令運行：

- 啟動事件監聽器：`npm run start:listener`
- 啟動支付處理器：`npm run start:payment`
- 生成災難合約：`npm run generate:contract [earthquake|flood|fire]`
- 創建支付鏈接：`npm run generate:payment <disasterId> <userAddress> <amount>`
- 監控地震事件：`npm run monitor:earthquake`
- 模擬地震事件：`npm run simulate:earthquake`
- 部署改進版FlashDAO：`npm run deploy`

## 智能合約編譯和測試

- 編譯合約：`npm run compile`
- 運行測試：`npm run test`

## API端點

事件監聽器提供以下API端點：

- `POST /api/report-disaster`：報告新的災難事件
- `GET /api/disaster-status/:eventId`：獲取災難事件的狀態
- `GET /api/disasters`：獲取所有正在處理的災難事件

Circle支付處理器提供以下端點：

- `POST /webhook/circle`：接收Circle支付通知

## 環境變量

在`.env`文件中設置以下變量：

- `CLAUDE_API_KEY`：Claude API密鑰
- `CIRCLE_API_KEY`：Circle API密鑰
- `CIRCLE_MERCHANT_ENTITY_ID`：Circle商戶ID
- `CIRCLE_WEBHOOK_SECRET`：Circle webhook密鑰
- `SEPOLIA_RPC_URL`：Sepolia測試網RPC URL
- `DEPLOY_WALLET_1`：部署智能合約的錢包私鑰
- `ETHERSCAN_API_KEY`：Etherscan API密鑰（用於合約驗證）

## 許可證

MIT 