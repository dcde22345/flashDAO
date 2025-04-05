# Privy 與 Biconomy 集成指南

## 功能概述
- **Privy** 提供用戶認證和嵌入式錢包功能
- **Biconomy** 提供智能賬戶抽象及無Gas費交易
- **多鏈支持**：Ethereum (Sepolia), Base (Sepolia), Avalanche (Fuji), Linea (Testnet)

## 技術實現
該集成主要包含三個核心組件：

1. **PrivyProvider** (`src/providers/PrivyProvider.tsx`)
   - 設置認證和嵌入式錢包
   - 配置 Privy 登入方式和 UI
   - 創建嵌入式錢包

2. **ChainContext** (`src/context/RoleContext.tsx`)
   - 管理多鏈網絡配置
   - 提供鏈選擇功能
   - 為每個鏈配置適當的 RPC、Bundler 和 Paymaster URL

3. **useNexusClient Hook** (`src/hooks/useNexusClient.ts`)
   - 連接 Privy 與 Biconomy
   - 創建智能賬戶客戶端
   - 提供發送無 Gas 費交易的功能

## 關鍵集成挑戰與解決方案

### 接口不匹配問題
Biconomy 期望特定格式的 signer 對象，而 Privy 嵌入式錢包 API 與此不完全兼容。我們採用以下解決方案：

```typescript
// 獲取 provider
const provider = await embeddedWallet.getEthereumProvider();

// 創建標準的 viem walletClient
const walletClient = createWalletClient({
  transport: custom(provider),
  account: embeddedWallet.address as Address
});

// 使用 walletClient 創建 Nexus 帳戶
const account = await toNexusAccount({
  signer: walletClient,
  chain,
  transport: http(networkConfig.rpcUrl),
});
```

### 多鏈支持
為支持多條鏈，我們創建了 `ChainContext` 來管理網絡配置：

```typescript
const getNetworkConfig = (): NetworkConfig | null => {
  if (!selectedChain) return null;

  switch (selectedChain) {
    case 'ethereum':
      return {
        chainId: sepolia.id,
        name: 'Ethereum (Sepolia)',
        bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_SEPOLIA || '',
        paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_SEPOLIA || '',
        rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '...',
      };
    // 其他鏈的配置...
  }
};
```

## 使用指南

### 環境變量設置
1. 複製 `.env.local.example` 到 `.env.local`
2. 設置 Privy 應用 ID：`NEXT_PUBLIC_PRIVY_APP_ID`
3. 對每個支持的鏈，配置對應的 Biconomy Bundler 和 Paymaster URL

### 集成到應用
該集成已被包裝成可重用的組件和 hooks：

1. **PrivyProvider**: 在 `_app.tsx` 中包裝整個應用
2. **WalletConnector**: 用於錢包連接和鏈選擇
3. **useNexusClient**: 用於發送無 Gas 費交易

示例用法：
```typescript
import { useNexusClient } from '@/hooks/useNexusClient';

function YourComponent() {
  const { sendGaslessTransaction } = useNexusClient();
  
  const handleTransaction = async () => {
    try {
      const hash = await sendGaslessTransaction(
        '0xRecipientAddress', 
        BigInt(1000000000000000), // 0.001 ETH
        '0x' // 無數據
      );
      console.log('交易哈希:', hash);
    } catch (error) {
      console.error('交易錯誤:', error);
    }
  };
  
  return (
    <button onClick={handleTransaction}>
      發送無 Gas 費交易
    </button>
  );
}
```

## 故障排除

### 常見錯誤

1. **"User must have an embedded wallet" 錯誤**
   - 原因：Privy 嵌入式錢包未正確初始化
   - 解決：檢查 PrivyProvider 配置中的 `embeddedWallets.createOnLogin` 設置是否正確

2. **簽名請求失敗**
   - 原因：接口不匹配導致 Biconomy 無法正確調用簽名方法
   - 解決：確保正確創建了 viem walletClient 並傳遞給 toNexusAccount

3. **"RPC URL 未定義" 錯誤**
   - 原因：環境變量未設置
   - 解決：檢查 .env.local 文件中是否填寫了所有必要的環境變量

## 進一步改進

1. **智能賬戶地址緩存**：可以在 localStorage 中保存用戶的智能賬戶地址，減少初始化時間

2. **交易歷史記錄**：添加組件顯示用戶的交易歷史

3. **鏈自動切換**：實現根據 dApp 需要自動切換鏈的功能

4. **批量交易**：支持在一個用戶操作中發送多筆交易 