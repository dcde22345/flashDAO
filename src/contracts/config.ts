export const CHAIN_CONFIG = {
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    contracts: {
      eventDAOFactory: '0xE4117A65afD26372E8456b6026a84f2973f7033B',
      usdcToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      selfProtocol: '0x5bA8655D51a25B89F116e4B4eeDa0f106ADDd8F7',
    }
  }
};

export const DEFAULT_CHAIN = 'baseSepolia';

// Token decimals
export const USDC_DECIMALS = 6;

// 時間格式化
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

// 格式化地址顯示
export const formatAddress = (address: string, start = 6, end = 4): string => {
  if (!address) return '';
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
};

// 格式化金額顯示
export const formatAmount = (amount: bigint, decimals = USDC_DECIMALS): string => {
  const divisor = BigInt(10) ** BigInt(decimals);
  const integer = (amount / divisor).toString();
  const fraction = (amount % divisor).toString().padStart(decimals, '0');
  
  const formattedFraction = fraction.substring(0, 2);
  return `${integer}.${formattedFraction}`;
}; 