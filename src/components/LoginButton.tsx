'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LoginButton() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const router = useRouter();

  // 當 Privy 尚未準備好時顯示加載狀態
  if (!ready) {
    return (
      <button className="px-4 py-2 rounded bg-gray-200 text-gray-500 cursor-not-allowed">
        載入中...
      </button>
    );
  }

  // 處理登入
  const handleLogin = () => {
    login();
  };

  // 處理登出
  const handleLogout = () => {
    logout();
    // 如果當前在錢包頁面，重定向到首頁
    if (window.location.pathname === '/wallet') {
      router.push('/');
    }
  };

  if (authenticated) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/wallet" className="text-white hover:text-primary">
          我的錢包
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-300">
            {user?.email?.address ? 
              `${user.email.address.substring(0, 6)}...` : 
              '已連接'}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            登出
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
    >
      連接錢包
    </button>
  );
} 