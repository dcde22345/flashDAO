'use client';

import { WalletConnector } from '@/components/WalletConnector';
import { GaslessTransaction } from '@/components/GaslessTransaction';
import { usePrivy } from '@privy-io/react-auth';
import { CCTPDemoModule } from '@/components/CrossChainDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WalletPage() {
  const { authenticated, user } = usePrivy();
  // 模擬的志願者數據，用於測試
  const [demoVolunteers] = useState([
    {
      id: 0,
      name: "Alice",
      address: "0x1234...5678",
      votes: 15.5
    },
    {
      id: 1,
      name: "Bob",
      address: user?.wallet?.address || "0x9876...5432",
      votes: 25.2
    },
    {
      id: 2,
      name: "Charlie",
      address: "0x5678...9012",
      votes: 10.3
    }
  ]);
  
  // 演示模式設置
  const [isWinnerMode, setIsWinnerMode] = useState(false);
  
  // 切換演示模式
  const toggleWinnerMode = () => {
    setIsWinnerMode(prev => !prev);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">FlashDAO 錢包集成演示</h1>
      <p className="text-gray-600 mb-8">
        通過 Privy 輕鬆登入並使用 Biconomy 進行無 Gas 費交易，體驗下一代錢包抽象技術。
      </p>
      
      {!authenticated && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">尚未連接錢包</h2>
          <p className="text-yellow-700">
            請使用右上角的「連接錢包」按鈕登入，體驗無 Gas 費交易功能。登入後您將獲得一個智能賬戶，可用於發送免 Gas 費交易。
          </p>
        </div>
      )}
      
      <Tabs defaultValue="wallet" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="wallet">錢包功能</TabsTrigger>
          <TabsTrigger value="cctp">CCTP跨鏈演示</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallet">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-bold mb-4 text-indigo-700">錢包信息</h2>
              <p className="text-gray-600 mb-4">
                在這裡您可以查看您的 Privy 錢包地址和 Biconomy 智能賬戶地址。點擊「顯示完整地址」按鈕可查看完整地址。
              </p>
              <WalletConnector />
            </div>
            
            {authenticated && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-indigo-700">交易功能</h2>
                <p className="text-gray-600 mb-4">
                  使用下面的表單進行無 Gas 費交易。您可以發送 ETH 或調用合約函數而無需支付 Gas 費用。
                </p>
                <GaslessTransaction />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="cctp">
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>CCTP V2 跨鏈演示</CardTitle>
                    <CardDescription>體驗Circle跨鏈轉移協議V2的快速跨鏈轉賬能力</CardDescription>
                  </div>
                  
                  {authenticated && (
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                      <Button 
                        variant={isWinnerMode ? "default" : "outline"} 
                        size="sm"
                        onClick={toggleWinnerMode}
                      >
                        {isWinnerMode ? "獲勝者模式: 開啟" : "獲勝者模式: 關閉"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <CCTPDemoModule
                  volunteers={demoVolunteers}
                  daoExpired={true}
                  daoAddress="0x1234...5678"
                  isConnected={authenticated}
                  userAddress={user?.wallet?.address}
                  isWinnerDemo={isWinnerMode}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg mb-8">
        <h2 className="text-xl font-bold text-blue-800 mb-3">帳戶類型說明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-700 mb-2">Privy 嵌入式錢包</h3>
            <p className="text-sm text-gray-600 mb-2">
              這是您的基礎錢包，由 Privy 提供。登入後自動創建，可用於簽名操作。
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
              <li>使用電子郵件或已有錢包登入</li>
              <li>無需記憶助記詞</li>
              <li>支持多種身份驗證方式</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-700 mb-2">Biconomy 智能賬戶</h3>
            <p className="text-sm text-gray-600 mb-2">
              這是建立在 Privy 錢包基礎上的智能賬戶，由 Biconomy 提供，支持無 Gas 費交易。
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
              <li>支持批量交易</li>
              <li>無需支付 Gas 費用</li>
              <li>支持多鏈操作</li>
              <li>安全可靠的交易處理</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-3">技術實現:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border border-gray-100">
            <h4 className="font-medium text-indigo-600 mb-1">Privy 嵌入式錢包</h4>
            <p className="text-xs text-gray-500">提供用戶認證和錢包功能，簡化登入體驗</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-100">
            <h4 className="font-medium text-indigo-600 mb-1">Biconomy 賬戶抽象</h4>
            <p className="text-xs text-gray-500">提供智能賬戶和無 Gas 費交易支持</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-100">
            <h4 className="font-medium text-indigo-600 mb-1">Circle CCTP V2</h4>
            <p className="text-xs text-gray-500">Fast Transfer快速跨鏈轉賬，僅需22秒</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-100">
            <h4 className="font-medium text-indigo-600 mb-1">多鏈互操作</h4>
            <p className="text-xs text-gray-500">跨链资金转移，支持多條主流區塊鏈</p>
          </div>
        </div>
      </div>
    </div>
  );
} 