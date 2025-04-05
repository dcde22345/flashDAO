# FlashDAO - 集成Flow和Circle的災難救援系統

FlashDAO是一個由Claude 3.7 Sonnet驅動的自動化系統，能夠根據實時災難事件自動生成和部署智能合約。系統部署在Flow的EVM兼容鏈上，並使用Circle支付基礎設施處理捐款。

## 系統概述

FlashDAO系統由以下組件組成：

1. **Claude 3.7 Sonnet合約生成器** - 使用Anthropic的Claude 3.7 Sonnet模型根據災難類型和詳情自動生成適應性的智能合約
2. **ImprovedFlashDAO合約** - 部署在Flow EVM鏈上的智能合約，實現圈存機制和DAO過期功能
3. **Circle支付整合** - 使用Circle API處理捐款，與Flow EVM鏈上的合約整合
4. **事件監聽器** - 監聽災難事件並將其傳遞給Claude合約生成器
5. **Webhook處理器** - 接收Circle支付通知並觸發區塊鏈上的圈存操作

## 功能特點

- **即時反應**：自動偵測並響應災難事件
- **Claude LLM生成**：使用Claude 3.7 Sonnet生成智能合約
- **圈存機制**：先記錄捐款承諾，不立即扣款
- **Flow區塊鏈**：部署在Flow的EVM兼容鏈上
- **Circle支付**：整合Circle支付API處理法幣和加密貨幣捐款
- **DAO過期**：一週後自動關閉DAO功能

## 前置需求

- [Node.js](https://nodejs.org/) (v16或更高版本)
- [Hardhat](https://hardhat.org/)
- [Flow帳號](https://flow.com/)
- [Circle商戶帳號](https://www.circle.com/)
- [Claude API key](https://www.anthropic.com/)

## 安裝

1. 克隆存儲庫:

```bash
git clone https://github.com/yourusername/flashdao.git
cd flashdao/contract
```

2. 安裝依賴:

```bash
npm install
```

3. 配置環境變數:

將`.env.example`文件複製為`.env`並填入你的值:

```bash
cp .env.example .env
```

編輯`.env`文件並更新以下變數:

- `DEPLOY_WALLET_1`: 部署錢包的私鑰
- `FLOW_RPC_URL`: Flow EVM測試網或主網RPC URL
- `CIRCLE_API_KEY`: Circle API金鑰
- `CIRCLE_WEBHOOK_SECRET`: Circle Webhook密鑰
- `CIRCLE_MERCHANT_ENTITY_ID`: Circle商戶ID

## 部署到Flow EVM鏈

1. 部署智能合約到Flow EVM測試網:

```bash
npx hardhat run scripts/deployImprovedFlashDAO.js --network flowTestnet
```

2. 更新`.env`文件中的`IMPROVED_FLASHDAO_ADDRESS`和`USDC_ADDRESS`為部署的地址

## 設置Circle支付

1. 啟動Circle Webhook處理器:

```bash
node scripts/circlePaymentHandler.js
```

2. 創建支付鏈接:

```bash
node scripts/createPaymentLink.js <災難ID> <用戶地址> <金額>
```

3. 配置Circle Webhook端點到您的服務器:
   - 登錄您的Circle商戶帳戶
   - 配置Webhook URL為: `https://your-server.com/webhook/circle`
   - 使用`.env`中的`CIRCLE_WEBHOOK_SECRET`作為您的簽名密鑰

## 工作流程

1. **災難事件偵測**:
   - Claude生成災難相關智能合約
   - 合約部署到Flow EVM鏈上

2. **捐款流程**:
   - 系統為用戶生成Circle支付鏈接
   - 用戶完成捐款
   - Circle發送Webhook通知
   - Webhook處理器在Flow EVM鏈上記錄圈存（不實際轉帳）

3. **志願者申請和投票**:
   - 志願者在網站上註冊並提交身份驗證
   - 捐款者投票選擇志願者

4. **資金分配**:
   - 投票結束後，系統從捐款者賬戶收取實際捐款
   - 資金分配給獲勝的志願者

5. **DAO過期**:
   - 一週後，DAO自動過期無法再執行操作

## 技術整合細節

### Flow EVM鏈整合

ImprovedFlashDAO合約部署在Flow的EVM兼容鏈上，使用標準的EVM合約格式。這允許您利用Flow生態系統的優勢，同時保持與以太坊工具和庫的兼容性。

### Circle API整合

Circle提供了強大的支付API，允許用戶使用各種支付方式（信用卡、銀行轉帳、加密貨幣等）進行捐款。Circle Webhook將捐款通知發送到您的服務器，觸發Flow EVM鏈上的圈存操作。

## 運行測試

測試完整流程:

```bash
# 部署合約
npx hardhat run scripts/deployImprovedFlashDAO.js --network flowTestnet

# 創建支付鏈接
node scripts/createPaymentLink.js 0 0xYOUR_USER_ADDRESS 10

# 啟動Webhook處理器
node scripts/circlePaymentHandler.js
```

## 授權

本項目根據MIT授權許可 - 詳情請查看LICENSE文件。

## 貢獻

歡迎貢獻！請隨時提交Pull Request。
