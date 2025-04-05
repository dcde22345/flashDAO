'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { sepolia, baseSepolia, avalancheFuji, lineaTestnet } from 'viem/chains';

// 定義可用鏈
export type ChainType = 'ethereum' | 'base' | 'avalanche' | 'linea' | null;

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
  selectedChain: null,
  setSelectedChain: () => {},
  getNetworkConfig: () => null,
});

// 自定義 hook 以使用鏈上下文
export const useChain = () => useContext(ChainContext);

// Chain Provider 組件
export const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChain, setSelectedChain] = useState<ChainType>('base');

  useEffect(() => {
    console.log('==== Chain Context ====');
    console.log('Selected Chain:', selectedChain);
  }, [selectedChain]);

  // 根據用戶選擇的鏈獲取合適的網絡配置
  const getNetworkConfig = (): NetworkConfig | null => {
    if (!selectedChain) return null;

    switch (selectedChain) {
      case 'ethereum':
        return {
          chainId: sepolia.id,
          name: 'Ethereum (Sepolia)',
          bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_SEPOLIA || '',
          paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_SEPOLIA || '',
          rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
        };
      case 'base':
        return {
          chainId: baseSepolia.id,
          name: 'Base (Sepolia)',
          bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_BASE_SEPOLIA || '',
          paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_BASE_SEPOLIA || '',
          rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
        };
      case 'avalanche':
        return {
          chainId: avalancheFuji.id,
          name: 'Avalanche (Fuji)',
          bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_AVALANCHE || '',
          paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_AVALANCHE || '',
          rpcUrl: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || 'https://avalanche-fuji-c-chain.publicnode.com',
        };
      case 'linea':
        return {
          chainId: lineaTestnet.id,
          name: 'Linea (Testnet)',
          bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_LINEA || '',
          paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_LINEA || '',
          rpcUrl: process.env.NEXT_PUBLIC_LINEA_RPC_URL || 'https://linea-goerli.infura.io/v3/',
        };
      default:
        return null;
    }
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