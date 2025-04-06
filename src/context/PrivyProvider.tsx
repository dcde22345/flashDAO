'use client';

import { ReactNode } from 'react';
import { PrivyProvider as PrivyProviderCore } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChainProvider } from './RoleContext';

// 創建一個新的 QueryClient
const queryClient = new QueryClient();

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderCore
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#4F46E5',
          logo: '/images/logo.svg',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          // 禁用自動顯示錢包界面
          showWalletUIs: false,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ChainProvider>
          {children}
        </ChainProvider>
      </QueryClientProvider>
    </PrivyProviderCore>
  );
} 