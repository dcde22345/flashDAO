'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/daos');
  }, [router]);
  
  return null; // 重定向頁面不需要顯示任何內容
} 