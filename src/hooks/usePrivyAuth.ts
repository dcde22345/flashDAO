'use client';

import { useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNexusClient } from './useNexusClient';

export function usePrivyAuth() {
  const { 
    login, 
    logout, 
    authenticated, 
    user, 
    ready, 
    createWallet 
  } = usePrivy();
  const { wallets } = useWallets();
  const { 
    smartAccountAddress, 
    isLoading: isNexusLoading, 
    error: nexusError 
  } = useNexusClient();

  // 檢查是否有嵌入式錢包
  const hasEmbeddedWallet = wallets.some(wallet => wallet.walletClientType === 'privy');

  // 檢查錢包和智能賬戶的狀態
  const isConnected = authenticated && hasEmbeddedWallet;
  const isSmartAccountReady = !!smartAccountAddress;

  // 處理登錄和創建錢包流程
  const connectWallet = useCallback(async () => {
    if (!authenticated) {
      await login();
    }
    
    // 如果已認證但沒有嵌入式錢包，則創建一個
    if (authenticated && !hasEmbeddedWallet) {
      await createWallet();
    }
  }, [authenticated, createWallet, hasEmbeddedWallet, login]);

  // 獲取顯示用的錢包地址
  const getDisplayAddress = useCallback(() => {
    // 優先使用智能賬戶地址
    const address = smartAccountAddress || (wallets[0]?.address ?? '');
    if (!address) return '';
    
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, [smartAccountAddress, wallets]);

  return {
    // 認證狀態
    authenticated,
    isConnected,
    isSmartAccountReady,
    isLoading: !ready || isNexusLoading,
    error: nexusError,
    
    // 用戶信息
    user,
    wallets,
    smartAccountAddress,
    displayAddress: getDisplayAddress(),
    
    // 方法
    login,
    logout,
    connectWallet,
  };
} 