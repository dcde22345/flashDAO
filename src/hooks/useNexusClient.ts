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
import { sepolia, baseSepolia, avalancheFuji, lineaTestnet } from 'viem/chains';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Abi = any[]; // 簡化的 ABI 類型，實際應該更精確

export function useNexusClient() {
  const { wallets } = useWallets();
  const { selectedChain, getNetworkConfig } = useChain();
  const [nexusClient, setNexusClient] = useState<NexusClient | null>(null);
  const [paymasterClient, setPaymasterClient] = useState<BicoPaymasterClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 添加調試日誌
  useEffect(() => {
    console.log('==== useNexusClient Debug Info ====');
    console.log('Wallets:', wallets);
    console.log('Wallets Length:', wallets?.length);
    console.log('Selected Chain:', selectedChain);
    console.log('Network Config:', getNetworkConfig());
  }, [wallets, selectedChain, getNetworkConfig]);

  // 初始化 Nexus 客戶端
  useEffect(() => {
    const initialize = async () => {
      console.log('Initializing Nexus client...');
      setNexusClient(null);
      setPaymasterClient(null);
      setError(null);

      const networkConfig = getNetworkConfig();

      if (!networkConfig || !selectedChain) {
        console.log('No network config or selected chain, aborting initialization');
        return;
      }

      try {
        setIsLoading(true);
        console.log('Starting Nexus client initialization');

        // 初始化 Nexus 客戶端
        const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
        
        if (!embeddedWallet) {
          console.error('No Privy embedded wallet found');
          throw new Error('未找到 Privy 嵌入式錢包');
        }

        // 添加日誌來查看錢包接口
        console.log('Privy Embedded Wallet:', {
          wallet: embeddedWallet,
          methods: Object.getOwnPropertyNames(Object.getPrototypeOf(embeddedWallet)),
          properties: Object.keys(embeddedWallet)
        });

        // 根據選擇的鏈獲取對應的 chain 對象
        let chain;
        switch (selectedChain) {
          case 'ethereum':
            chain = sepolia;
            break;
          case 'base':
            chain = baseSepolia;
            break;
          case 'avalanche':
            chain = avalancheFuji;
            break;
          case 'linea':
            chain = lineaTestnet;
            break;
          default:
            console.error('Unsupported chain:', selectedChain);
            throw new Error('不支持的鏈');
        }
        console.log('Selected chain object:', chain);

        // 確保 networkConfig.rpcUrl 存在
        if (!networkConfig.rpcUrl) {
          console.error('Missing RPC URL');
          throw new Error('RPC URL 未定義，請檢查環境變數和鏈配置');
        }
        console.log('Using RPC URL:', networkConfig.rpcUrl);

        // 確保 bundlerUrl 存在
        const bundlerUrl = networkConfig.bundlerUrl;

        if (!bundlerUrl) {
          console.error('Missing Bundler URL');
          throw new Error('Bundler URL 未定義，請檢查環境變數和鏈配置');
        }
        console.log('Using Bundler URL:', bundlerUrl);

        // 確保 paymasterUrl 存在
        const paymasterUrl = networkConfig.paymasterUrl;

        if (!paymasterUrl) {
          console.error('Missing Paymaster URL');
          throw new Error('Paymaster URL 未定義，請檢查環境變數和鏈配置');
        }
        console.log('Using Paymaster URL:', paymasterUrl);

        // 創建 Paymaster 客戶端
        console.log('Creating Paymaster client...');
        const paymasterClient = createBicoPaymasterClient({
          paymasterUrl,
        });

        try {
          // 獲取 provider
          console.log('Getting Ethereum provider...');
          const provider = await embeddedWallet.getEthereumProvider();
          console.log('Ethereum provider obtained');
          
          // 創建標準的 viem walletClient
          console.log('Creating wallet client...');
          const walletClient = createWalletClient({
            transport: custom(provider),
            account: embeddedWallet.address as Address
          });
          console.log('Wallet client created');
          
          // 使用 walletClient 創建 Nexus 帳戶
          console.log('Creating Nexus account...');
          const account = await toNexusAccount({
            signer: walletClient,
            chain,
            transport: http(networkConfig.rpcUrl),
          });
          console.log('Nexus account created');
          
          // 創建 Nexus 客戶端
          console.log('Creating Smart Account client...');
          const client = createSmartAccountClient({
            account,
            transport: http(bundlerUrl),
            paymaster: paymasterClient,
          });
          console.log('Smart Account client created successfully');

          setNexusClient(client);
          setPaymasterClient(paymasterClient);
          console.log('Nexus client initialized successfully');
        } catch (error) {
          console.error('初始化客戶端時出錯:', error);
          throw error;
        }
      } catch (error) {
        console.error('初始化客戶端時出錯:', error);
        setError(error instanceof Error ? error : new Error('發生未知錯誤'));
      } finally {
        setIsLoading(false);
        console.log('Nexus client initialization process completed');
      }
    };

    if (wallets && wallets.length > 0 && selectedChain) {
      console.log('Wallets and selected chain available, starting initialization...');
      initialize();
    } else {
      console.log('Waiting for wallets or chain selection...');
      console.log('Wallets:', wallets?.length);
      console.log('Selected Chain:', selectedChain);
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
      
      // 發送交易
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
    sendGaslessTransaction,
    sendContractTransaction,
  };
} 