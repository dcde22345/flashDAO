'use client';

import { PrivyProvider } from '@/providers/PrivyProvider';

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider>
      {children}
    </PrivyProvider>
  );
} 