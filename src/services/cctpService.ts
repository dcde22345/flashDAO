// CCTP V2 API服務
// 基於 https://iris-api-sandbox.circle.com 測試網API

// 支持的鏈選項
export interface ChainOption {
  id: number;          // 域ID
  name: string;        // 鏈名稱
  icon: string;        // 圖標 (可選)
  description: string; // 簡短描述
  testnet: boolean;    // 是否為測試網
}

// 支持的鏈列表
export const supportedChains: ChainOption[] = [
  {
    id: 0,
    name: "Ethereum Sepolia",
    icon: "ethereum",
    description: "以太坊測試網，開發者生態豐富",
    testnet: true
  },
  {
    id: 1,
    name: "Avalanche Fuji",
    icon: "avalanche",
    description: "高性能，低費用，適合DeFi應用",
    testnet: true
  },
  {
    id: 3,
    name: "Base Sepolia",
    icon: "base",
    description: "以太坊L2，低Gas費用，快速確認",
    testnet: true
  },
  {
    id: 6,
    name: "Linea Goerli",
    icon: "linea",
    description: "安全的以太坊零知識擴容解決方案",
    testnet: true
  }
];

interface CCTPConfig {
  apiUrl: string;
  apiKey?: string;
  sourceDomainId: number; // 源鏈ID
  destDomainId: number;   // 目標鏈ID
}

// CCTP V2轉賬結果
interface TransferResult {
  success: boolean;
  txHash?: string;
  errorMessage?: string;
}

// 模擬配置 - 實際應用中應從環境變量中獲取
const defaultConfig: CCTPConfig = {
  apiUrl: 'https://iris-api-sandbox.circle.com',
  sourceDomainId: 1, // Avalanche Fuji = 1 
  destDomainId: 3,   // Base Sepolia = 3
};

/**
 * 獲取可用的目標鏈列表
 * 排除源鏈和不支持的鏈
 */
export const getAvailableDestinationChains = (
  sourceDomainId: number = defaultConfig.sourceDomainId
): ChainOption[] => {
  return supportedChains.filter(chain => 
    chain.id !== sourceDomainId // 排除源鏈自身
  );
};

/**
 * 獲取鏈的詳細信息
 */
export const getChainDetails = (domainId: number): ChainOption | undefined => {
  return supportedChains.find(chain => chain.id === domainId);
};

/**
 * 模擬CCTP V2 Fast Transfer跨鏈轉賬
 * 在實際實現中，這將調用真實的CCTP V2 API
 */
export const performFastTransfer = async (
  recipientAddress: string,
  amount: string, // USDC金額，例如 "10.5"
  destDomainId: number, // 目標鏈ID
  config: Partial<CCTPConfig> = {}
): Promise<TransferResult> => {
  const finalConfig = { 
    ...defaultConfig, 
    ...config,
    destDomainId // 使用指定的目標鏈ID
  };
  
  // 獲取源鏈和目標鏈的詳細信息
  const sourceChain = getChainDetails(finalConfig.sourceDomainId);
  const destChain = getChainDetails(finalConfig.destDomainId);
  
  if (!sourceChain || !destChain) {
    return {
      success: false,
      errorMessage: '無效的源鏈或目標鏈'
    };
  }
  
  try {
    console.log(`[CCTP V2] 準備從${sourceChain.name}轉賬${amount} USDC到${destChain.name}的地址 ${recipientAddress}`);
    
    // 模擬API調用延遲
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // 模擬成功的交易哈希
    const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    console.log(`[CCTP V2] 已提交Fast Transfer請求，交易哈希: ${mockTxHash}`);
    
    // 在實際實現中，將調用以下API:
    // 1. 獲取當前費用: GET /v2/fastBurn/USDC/fees/:sourceDomainId/:destDomainId
    // 2. 在源鏈上執行快速轉賬（需要前端Web3交互）
    // 3. 獲取消息和證明: GET /v2/messages/:sourceDomainId
    // 4. 在目標鏈上執行鑄造（需要前端Web3交互）
    
    return {
      success: true,
      txHash: mockTxHash
    };
  } catch (error: any) {
    console.error('[CCTP V2] 跨鏈轉賬失敗:', error);
    return {
      success: false,
      errorMessage: error.message || '跨鏈轉賬過程中發生錯誤'
    };
  }
};

/**
 * 獲取Fast Transfer費用
 * 在實際實現中，這將調用費用API
 */
export const getFastTransferFee = async (
  sourceDomainId: number = defaultConfig.sourceDomainId,
  destDomainId: number = defaultConfig.destDomainId
): Promise<string> => {
  // 模擬API調用
  // 實際應調用: GET /v2/fastBurn/USDC/fees/:sourceDomainId/:destDomainId
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // 模擬一個0.1%的費用 + 固定費用
  return '0.001';
};

/**
 * 檢查交易是否已完成
 * 在實際實現中，這將查詢目標鏈上的交易狀態
 */
export const checkTransactionStatus = async (txHash: string): Promise<boolean> => {
  // 模擬檢查交易狀態
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // 簡單地始終返回成功
  return true;
};

// 導出默認配置，以便其他組件可以使用
export const cctpConfig = defaultConfig; 