'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// 定義上下文類型
type TokenContextType = {
  tokenBalance: number;
  addTokens: (amount: number) => void;
  resetTokens: () => void;
};

// 創建上下文
const TokenContext = createContext<TokenContextType>({
  tokenBalance: 0,
  addTokens: () => {},
  resetTokens: () => {},
});

// 自定義 hook 以使用代幣上下文
export const useTokens = () => useContext(TokenContext);

// Token Provider 組件
export const TokenProvider = ({ children }: { children: ReactNode }) => {
  // 初始化代幣餘額為0，不再從localStorage讀取
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  // 移除從localStorage讀取的useEffect
  
  // 仍然可以更新localStorage，但每次刷新頁面時都會重置
  useEffect(() => {
    localStorage.setItem('tokenBalance', tokenBalance.toString());
  }, [tokenBalance]);

  // 增加代幣
  const addTokens = (amount: number) => {
    setTokenBalance(prev => prev + amount);
  };

  // 重置代幣
  const resetTokens = () => {
    setTokenBalance(0);
  };

  return (
    <TokenContext.Provider
      value={{
        tokenBalance,
        addTokens,
        resetTokens,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}; 