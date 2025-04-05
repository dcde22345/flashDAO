import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PrivyProviderWrapper } from '@/components/PrivyProviderWrapper';
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlashDAO - Event-Based Decentralized Autonomous Organization',
  description: 'A decentralized platform for emergency response and community support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProviderWrapper>
          <Layout>
            {children}
          </Layout>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
