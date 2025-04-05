import React, { ReactNode } from 'react';
import Link from 'next/link';
import { LoginButton } from './LoginButton';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-dark text-white py-4">
        <div className="container-custom flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            FlashDAO
          </Link>
          <div className="flex items-center gap-6">
            <nav className="space-x-4">
              <Link href="/" className="hover:text-primary">
                首頁
              </Link>
              <Link href="/daos" className="hover:text-primary">
                事件
              </Link>
            </nav>
            <LoginButton />
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-dark text-white py-4 mt-12">
        <div className="container-custom text-center">
          <p>&copy; {new Date().getFullYear()} FlashDAO. 基於事件的去中心化自治組織。</p>
        </div>
      </footer>
    </div>
  );
} 