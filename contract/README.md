# FlashDAO - Claude 3.7 Sonnet驅動的DAO自動生成系統

FlashDAO是一個由Claude 3.7 Sonnet驅動的自動化系統，能夠根據實時災難事件自動生成和部署智能合約。系統會根據不同類型的災難（地震、洪水、火災等）自動生成相應的DAO合約，讓人們能快速組織起來應對危機。

## 系統概述

FlashDAO系統由以下組件組成：

1. **Claude 3.7 Sonnet合約生成器** - 使用Anthropic的Claude 3.7 Sonnet模型根據災難類型和詳情自動生成適應性的智能合約
2. **事件監聽器** - 監聽災難事件並將其傳遞給Claude合約生成器
3. **合約部署器** - 自動部署生成的合約到區塊鏈上
4. **DAO合約** - 生成的DAO合約，處理捐款、志願者註冊和資金分配
5. **工廠合約** - 創建和管理DAO合約實例

## 功能特點

- **即時反應**：自動偵測並響應災難事件
- **Claude LLM生成**：使用Claude 3.7 Sonnet生成與特定災難類型相匹配的智能合約
- **透明募款**：允許任何人向災難救援基金捐款
- **志願者註冊**：允許經過驗證的個人註冊為志願者
- **民主資金分配**：捐贈者可以投票選擇哪位志願者接收資金
- **NFT獎勵**：向捐贈者和志願者頒發NFT獎勵以表彰其貢獻
- **自我可持續性**：災難處理後DAO解散，所有資金分配完畢

## 前置需求

- [Node.js](https://nodejs.org/) (v16或更高版本)
- [Hardhat](https://hardhat.org/)
- [Claude API key](https://www.anthropic.com/) - 需要有Claude API訪問權限

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
- `ORACLE_ADDRESS`: 在代理中擁有oracle權限的地址
- `CLAUDE_API_KEY`: 你的Claude API金鑰
- `PORT`: API服務的端口（默認為3000）

## 使用方法

### 啟動事件監聽器

啟動事件監聽器服務:

```bash
npm start
```

服務將在指定的端口（默認3000）啟動，並等待災難事件報告。

### 演示生成合約

你可以使用預設的災難事件類型來演示合約生成:

```bash
# 地震事件
npm run generate earthquake

# 洪水事件
npm run generate flood

# 火災事件
npm run generate fire
```

### 報告災難事件

通過API報告新的災難事件:

```bash
curl -X POST http://localhost:3000/api/report-disaster \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Earthquake",
    "name": "Hualien Earthquake",
    "description": "A magnitude 7.2 earthquake hit Hualien County, causing significant damage to infrastructure and displacing thousands of residents.",
    "severity": 8,
    "location": "Hualien County, Taiwan"
  }'
```

### 檢查事件狀態

```bash
curl http://localhost:3000/api/disaster-status/{eventId}
```

### 部署生成的合約

生成合約後，系統會提供部署指令：

```bash
npx hardhat run scripts/deploy_{contractName}.js --network flowTestnet
```

## 工作流程

1. **事件偵測**:
   - 通過API接收災難事件報告
   - 或從外部數據源自動偵測災難事件

2. **合約生成**:
   - Claude 3.7 Sonnet根據災難類型和詳情生成智能合約
   - 同時生成工廠合約和部署腳本

3. **合約部署**:
   - 將生成的合約部署到指定的區塊鏈網絡

4. **捐款階段**:
   - 用戶可以向DAO捐款USDC
   - 捐款在選擇志願者之前將保留在合約中

5. **志願者註冊**:
   - 志願者通過身份驗證進行註冊

6. **投票階段**:
   - 資金期結束後，捐贈者可以投票選擇哪位志願者接收資金
   - 投票權與捐款金額成正比

7. **資金分配**:
   - 投票期結束後，資金將分配給選定的志願者

8. **獎勵**:
   - 捐贈者根據捐款里程碑獲得NFT獎勵
   - 志願者獲得特殊的NFT表彰其服務

## Claude 3.7 Sonnet智能合約生成

系統使用Claude 3.7 Sonnet來生成智能合約，這是Anthropic提供的強大LLM模型，具有以下優點：

- 更好的代碼生成能力和上下文理解
- 更強的安全性考量，生成的合約更不容易存在漏洞
- 較低的幻覺率，確保生成的合約符合實際需求
- 能夠理解複雜的智能合約架構和模式

## 授權

本項目根據MIT授權許可 - 詳情請查看LICENSE文件。

## 貢獻

歡迎貢獻！請隨時提交Pull Request。
