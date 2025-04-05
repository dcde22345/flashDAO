'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNexusClient } from '@/hooks/useNexusClient';
import { CHAIN_CONFIG, DEFAULT_CHAIN, USDC_DECIMALS, formatAmount } from '@/contracts/config';
import { createPublicClient, http, Address } from 'viem';
import { baseSepolia } from 'viem/chains';

// ERC20 ABI 僅包含我們需要的函數
const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// 創建客戶端的函數
const createClient = () => createPublicClient({
  chain: baseSepolia,
  transport: http(CHAIN_CONFIG[DEFAULT_CHAIN as keyof typeof CHAIN_CONFIG].rpcUrl),
  pollingInterval: 10000, // 每10秒輪詢一次
});

// 初始化客戶端
const defaultClient = createClient();

export const useUSDCBalance = (spenderAddress?: string) => {
  const { nexusClient } = useNexusClient();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [formattedBalance, setFormattedBalance] = useState<string>('0.00');
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // 使用預設客戶端
  const publicClient = defaultClient;

  // 當用戶錢包地址發生變化時，更新用戶地址
  useEffect(() => {
    if (nexusClient) {
      const address = nexusClient.account?.address;
      if (address) {
        setUserAddress(address as string);
      }
    }
  }, [nexusClient]);

  // 獲取 USDC 餘額
  const fetchBalance = useCallback(async () => {
    if (!publicClient || !userAddress) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const usdcAddress = CHAIN_CONFIG[DEFAULT_CHAIN as keyof typeof CHAIN_CONFIG].contracts.usdcToken;

      // 獲取 USDC 餘額
      const balanceResult = await publicClient.readContract({
        abi: ERC20_ABI,
        address: usdcAddress as `0x${string}`,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      }) as bigint;

      setBalance(balanceResult);
      setFormattedBalance(formatAmount(balanceResult, USDC_DECIMALS));

      // 如果有指定的 spender 地址，獲取授權額度
      if (spenderAddress) {
        const allowanceResult = await publicClient.readContract({
          abi: ERC20_ABI,
          address: usdcAddress as `0x${string}`,
          functionName: 'allowance',
          args: [userAddress as `0x${string}`, spenderAddress as `0x${string}`],
        }) as bigint;

        setAllowance(allowanceResult);
      }
    } catch (err: any) {
      console.error('Error fetching USDC balance:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, userAddress, spenderAddress]);

  // 當用戶地址或 spender 地址變化時獲取餘額
  useEffect(() => {
    fetchBalance();
    
    // 設置定時器每 60 秒刷新一次餘額
    const intervalId = setInterval(fetchBalance, 60000);
    
    return () => clearInterval(intervalId);
  }, [fetchBalance]);

  return {
    balance,
    formattedBalance,
    allowance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}; 