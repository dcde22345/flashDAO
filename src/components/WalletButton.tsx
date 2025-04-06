'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { toast } from 'sonner';

// 定義可接受的按鈕外觀類型
type ButtonVariant = 'outline' | 'link' | 'default' | 'learnMore' | 'destructive' | 'secondary' | 'ghost';

type WalletButtonProps = {
  variant?: ButtonVariant;
  showAddress?: boolean;
  className?: string;
};

export function WalletButton({ 
  variant = 'outline' as ButtonVariant, 
  showAddress = true, 
  className = '' 
}: WalletButtonProps) {
  const { 
    isConnected,
    displayAddress,
    isSmartAccountReady,
    isLoading,
    error,
    connectWallet,
    logout
  } = usePrivyAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 確保客戶端渲染
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 處理點擊外部關閉下拉菜單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 處理錢包連接
  const handleWalletConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('連接錢包時出錯:', error);
      toast.error('連接錢包失敗，請重試');
    }
  };

  // 處理錢包按鈕點擊
  const handleWalletButtonClick = () => {
    if (isConnected) {
      setShowLogout(!showLogout);
    } else {
      handleWalletConnect();
    }
  };

  // 處理登出
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogout(false);
      toast.success('已成功登出');
    } catch (error) {
      console.error('登出時出錯:', error);
      toast.error('登出失敗，請重試');
    }
  };

  // 服務器端渲染的預設內容
  if (!isMounted) {
    return (
      <Button className={`wallet-button ${className}`} variant={variant} disabled>
        <Wallet className="mr-2 h-4 w-4" />
        <span>Connect Wallet</span>
      </Button>
    );
  }

  // 處理加載狀態
  if (isLoading) {
    return (
      <Button className={`wallet-button ${className}`} variant={variant} disabled>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <span>Loading...</span>
      </Button>
    );
  }

  // 已連接錢包
  if (isConnected) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          className={`wallet-connected ${className}`}
          variant={variant}
          onClick={handleWalletButtonClick}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {showAddress && (
            <span>
              {isSmartAccountReady ? '🛡️ ' : ''}{displayAddress}
            </span>
          )}
        </Button>
        
        {showLogout && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
            <button 
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </button>
          </div>
        )}
      </div>
    );
  }

  // 未連接狀態
  return (
    <Button
      onClick={handleWalletConnect}
      className={`wallet-button ${className}`}
      variant={variant}
    >
      <Wallet className="mr-2 h-4 w-4" />
      <span>Connect Wallet</span>
    </Button>
  );
} 