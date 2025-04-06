'use client';

import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { 
  createSmartAccountClient, 
  NexusClient, 
  toNexusAccount,
  createBicoPaymasterClient,
  BicoPaymasterClient
} from '@biconomy/abstractjs';
import { useChain } from '@/context/RoleContext';
import { http, custom, createWalletClient, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

// 簡化的 ABI 類型
type Abi = any[];

export function useNexusClient() {
  const { wallets } = useWallets();
  const { selectedChain, getNetworkConfig } = useChain();
  const [nexusClient, setNexusClient] = useState<NexusClient | null>(null);
  const [paymasterClient, setPaymasterClient] = useState<BicoPaymasterClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  // 初始化 Nexus 客戶端
  useEffect(() => {
    const initialize = async () => {
      setNexusClient(null);
      setPaymasterClient(null);
      setError(null);
      setSmartAccountAddress(null);

      // 我們專注於 Base Sepolia
      if (selectedChain !== 'base') {
        return;
      }

      const networkConfig = getNetworkConfig();
      if (!networkConfig) {
        return;
      }

      try {
        setIsLoading(true);

        // 查找 Privy 嵌入式錢包
        const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
        
        if (!embeddedWallet) {
          throw new Error('未找到 Privy 嵌入式錢包');
        }

        console.log('找到 Privy 嵌入式錢包:', {
          address: embeddedWallet.address,
        });

        // 獲取 provider
        const provider = await embeddedWallet.getEthereumProvider();
        
        // 創建標準的 viem walletClient
        const walletClient = createWalletClient({
          transport: custom(provider),
          account: embeddedWallet.address as Address
        });
        
        // 使用 Base Sepolia
        const chain = baseSepolia;
        
        // 創建 Paymaster 客戶端
        const paymasterClient = createBicoPaymasterClient({
          paymasterUrl: networkConfig.paymasterUrl,
        });

        // 創建 Nexus 帳戶
        const account = await toNexusAccount({
          signer: walletClient,
          chain,
          transport: http(networkConfig.rpcUrl),
        });
        
        // 獲取智能賬戶地址
        setSmartAccountAddress(account.address);
        
        // 創建 Nexus 客戶端
        const client = createSmartAccountClient({
          account,
          transport: http(networkConfig.bundlerUrl),
          paymaster: paymasterClient,
        });

        setNexusClient(client);
        setPaymasterClient(paymasterClient);
      } catch (error) {
        console.error('初始化 Nexus 客戶端時出錯:', error);
        setError(error instanceof Error ? error : new Error('發生未知錯誤'));
      } finally {
        setIsLoading(false);
      }
    };

    // 當錢包連接時初始化
    if (wallets.length > 0) {
      initialize();
    }
  }, [wallets, selectedChain, getNetworkConfig]);

  // 發送無 gas 費交易
  const sendGaslessTransaction = async (to: string, value: bigint = BigInt(0), data: string = '0x') => {
    if (!nexusClient) {
      throw new Error('Nexus 客戶端未初始化');
    }

    try {
      setIsLoading(true);
      
      // 發送交易
      const hash = await nexusClient.sendUserOperation({
        calls: [
          {
            to: to as `0x${string}`,
            data: data as `0x${string}`,
            value,
          }
        ],
      });
      
      return hash;
    } catch (error) {
      console.error('發送無 gas 費交易時出錯:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 發送合約交易
  const sendContractTransaction = async (params: {
    abi: Abi;
    functionName: string;
    args: unknown[];
    to: string;
    value?: bigint;
  }) => {
    if (!nexusClient) {
      throw new Error('Nexus 客戶端未初始化');
    }

    try {
      setIsLoading(true);
      
      // 發送合約交易
      const hash = await nexusClient.sendUserOperation({
        calls: [
          {
            abi: params.abi,
            functionName: params.functionName,
            args: params.args,
            to: params.to as `0x${string}`,
            value: params.value || BigInt(0),
          }
        ],
      });
      
      return hash;
    } catch (error) {
      console.error('發送合約交易時出錯:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    nexusClient,
    paymasterClient,
    isLoading,
    error,
    smartAccountAddress,
    sendGaslessTransaction,
    sendContractTransaction,
  };
} 