# FlashDAO 多链 DAO 项目

## 项目概述
FlashDAO 是一个多链去中心化自治组织(DAO)平台，支持 USDC 捐赠、治理权管理、以及与 Self Protocol 的身份验证集成。该项目旨在提供一个开放、透明和高效的社区治理平台。

## 已完成功能
- **智能合约开发**：
  - `FlashDAOToken`: 治理代币合约，实现基于对数曲线的代币铸造机制
  - `VolunteerRegistry`: 志愿者注册合约，与 Self Protocol 集成进行身份验证
  - `FlashDAOTreasury`: 财务管理合约，处理资金和捐赠
  - `FlashDAOGovernance`: 治理合约，处理提案和投票
  - `MultiChainDAOFactory`: 部署工厂合约，支持多链部署

- **测试**：
  - 为 FlashDAOToken 编写单元测试，验证代币铸造逻辑和权限控制

- **部署脚本**：
  - 多链部署脚本，支持一键部署到 Base Sepolia、Ethereum Sepolia 和 Avalanche Fuji 测试网

## 技术堆栈
- Solidity (v0.8.28)
- Hardhat 开发环境
- OpenZeppelin 合约库
- Ethers.js / Viem 库

## 如何运行

### 环境设置
1. 安装依赖
```bash
npm install
```

2. 配置环境变量（创建 .env 文件）
```
DEPLOY_WALLET_1=your_private_key
ETHEREUM_SEPOLIA_RPC=your_sepolia_rpc_url
AVALANCHE_FUJI_RPC=your_fuji_rpc_url
BASESCAN_API_KEY=your_basescan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
SNOWTRACE_API_KEY=your_snowtrace_api_key
SELF_PROTOCOL_ADDRESS=address_of_self_protocol
```

### 编译合约
```bash
npx hardhat compile
```

### 运行测试
```bash
npx hardhat test
```

### 部署合约
```bash
# 部署到特定网络
npx hardhat run scripts/deploy_multichain.js --network baseSepolia

# 部署到多个网络
NETWORKS=baseSepolia,sepolia,fuji npx hardhat run scripts/deploy_multichain.js
```

## 待实现功能
1. **前端界面**：开发用户友好的界面，用于 DAO 管理、投票和代币铸造
2. **跨链治理**：完善跨链投票和执行机制
3. **身份验证流程**：完善与 Self Protocol 的集成，实现完整的身份验证流程
4. **DAO 管理工具**：创建管理仪表板，方便 DAO 操作和监控
5. **合约安全审计**：进行全面安全审计，确保代码安全性

## 贡献指南
欢迎贡献！请遵循以下步骤：
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证
MIT License

# FlashDAO 測試網部署指南

本項目是一個基於多鏈架構的DAO系統，支持跨鏈部署、志願者註冊和投票機制。以下是在測試網上部署和測試的步驟。

## 環境準備

1. 安裝依賴
```bash
cd contract
npm install
```

2. 設置環境變量
將 `.env.example` 文件複製為 `.env` 並填入您的私鑰和API密鑰
```bash
cp .env.example .env
```

編輯 `.env` 文件，填寫以下信息：
- `DEPLOY_WALLET_1`: 您的部署錢包私鑰
- `ETHERSCAN_API_KEY`: Etherscan API密鑰（用於驗證合約）
- `BASESCAN_API_KEY`: Basescan API密鑰
- `SNOWTRACE_API_KEY`: Snowtrace API密鑰（Avalanche）

## 部署步驟

### 1. 單網絡部署 (例如 Base Sepolia)

執行以下命令在 Base Sepolia 測試網上部署：
```bash
npx hardhat run scripts/deploy_event_dao.js --network baseSepolia
```

這將部署以下合約：
- SelfProtocolMock（模擬身份驗證服務）
- EventDAOFactory（DAO工廠合約）

### 2. 多鏈部署 (在多個測試網上部署相同DAO)

執行以下命令在多個網絡上部署相同的DAO：
```bash
NETWORKS=baseSepolia,sepolia,fuji npx hardhat run scripts/deploy_multichain.js
```

或者指定特定網絡：
```bash
npx hardhat run scripts/deploy_multichain.js --network baseSepolia
```

## 測試

部署後可以運行測試以驗證功能：
```bash
npx hardhat test test/EventDAO.test.js
```

## 合約交互

部署後，您可以使用以下方法與合約交互：

### 創建DAO事件

```javascript
const factory = await ethers.getContractAt("EventDAOFactory", "部署地址");
const tx = await factory.createEventDAO("事件名稱", "事件描述", 最小捐款金額, 最大志願者數量, 投票時間, 志願者註冊截止時間);
```

### 捐款並參與

```javascript
// 先授權USDC
const usdc = await ethers.getContractAt("IERC20", USDC地址);
await usdc.approve(DAO地址, 捐款金額);

// 捐款
const eventDAO = await ethers.getContractAt("EventDAO", DAO地址);
await eventDAO.donate(捐款金額);
```

### 註冊為志願者

```javascript
const eventDAO = await ethers.getContractAt("EventDAO", DAO地址);
await eventDAO.registerAsVolunteer();
```

### 投票

```javascript
const eventDAO = await ethers.getContractAt("EventDAO", DAO地址);
await eventDAO.vote(志願者索引);
```

## 多鏈部署說明

部署後，您可以在 `deployments` 目錄下找到部署信息，包括：
- 各網絡的部署地址
- 事件ID（用於跨鏈識別）
- 部署時間

您可以使用相同的事件ID在不同鏈上部署相同的DAO，實現跨鏈投票和管理。

## 注意事項

- 測試網USDC可能需要先部署模擬代幣
- 請確保您的測試錢包中有足夠的測試代幣支付gas費
- Base Sepolia測試網可能需要從水龍頭獲取測試ETH
