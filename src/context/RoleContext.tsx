'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import { baseSepolia } from 'viem/chains';

// 定義可用鏈 - 目前只專注於Base Sepolia
export type ChainType = 'base' | null;

// 定義網絡配置
export type NetworkConfig = {
  chainId: number;
  name: string;
  bundlerUrl: string;
  paymasterUrl: string;
  rpcUrl: string;
};

// 定義上下文類型
type ChainContextType = {
  selectedChain: ChainType;
  setSelectedChain: (chain: ChainType) => void;
  getNetworkConfig: () => NetworkConfig | null;
};

// 創建上下文的初始值
const ChainContext = createContext<ChainContextType>({
  selectedChain: 'base', // 默認為 Base Sepolia
  setSelectedChain: () => {},
  getNetworkConfig: () => null,
});

// 自定義 hook 以使用鏈上下文
export const useChain = () => useContext(ChainContext);

// Chain Provider 組件
export const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChain, setSelectedChain] = useState<ChainType>('base'); // 默認為 Base Sepolia

  // 根據用戶選擇的鏈獲取合適的網絡配置
  const getNetworkConfig = (): NetworkConfig | null => {
    if (!selectedChain) return null;

    // 目前只提供 Base Sepolia 的配置
    if (selectedChain === 'base') {
      return {
        chainId: baseSepolia.id,
        name: 'Base (Sepolia)',
        bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_BASE_SEPOLIA || '',
        paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_BASE_SEPOLIA || '',
        rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
      };
    }

    return null;
  };

  // 提供上下文值
  return (
    <ChainContext.Provider
      value={{
        selectedChain,
        setSelectedChain,
        getNetworkConfig,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
}; 