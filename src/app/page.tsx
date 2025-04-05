'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">FlashDAO</h1>
      <p className="text-xl mb-12 text-center max-w-2xl">
        一個為社區而建的去中心化自治組織平台，讓用戶可以創建、參與和管理事件和活動。
      </p>
      
      <div className="flex gap-4">
        <Button onClick={() => router.push('/daos')}>
          瀏覽活動
        </Button>
        <Button variant="outline" onClick={() => router.push('/about')}>
          了解更多
        </Button>
      </div>
    </main>
  );
} 