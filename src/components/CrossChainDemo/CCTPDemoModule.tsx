import React, { useState, useEffect } from 'react';
import { CCTPDemoButton } from './CCTPDemoButton';
import { CCTPInfoCard } from './CCTPInfoCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface CCTPDemoModuleProps {
  volunteers: Array<{
    id: number;
    name: string;
    address: string;
    votes: number;
  }>;
  daoExpired: boolean;
  daoAddress: string;
  isConnected: boolean;
  userAddress?: string; // 當前用戶地址
  isWinnerDemo?: boolean; // 外部傳入的演示模式標誌
}

export const CCTPDemoModule: React.FC<CCTPDemoModuleProps> = ({
  volunteers,
  daoExpired,
  daoAddress,
  isConnected,
  userAddress,
  isWinnerDemo = false
}) => {
  // 演示模式開關
  const [demoWinnerMode, setDemoWinnerMode] = useState(isWinnerDemo);
  
  // 當外部isWinnerDemo變更時同步更新
  useEffect(() => {
    setDemoWinnerMode(isWinnerDemo);
  }, [isWinnerDemo]);
  
  // 檢查當前用戶是否為獲勝者
  const getTopVolunteer = () => {
    if (volunteers.length === 0) return null;
    
    return volunteers
      .filter(v => v.votes > 0)
      .sort((a, b) => b.votes - a.votes)[0] || null;
  };
  
  const topVolunteer = getTopVolunteer();
  const isRealWinner = userAddress && topVolunteer && userAddress.toLowerCase() === topVolunteer.address.toLowerCase();
  
  // 演示模式或實際獲勝者
  const isWinner = demoWinnerMode || isRealWinner;
  
  // 切換演示模式
  const toggleDemoMode = () => {
    setDemoWinnerMode(prev => !prev);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">跨鏈資金領取</h2>
        
        {isConnected && (
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Button 
              variant={demoWinnerMode ? "default" : "outline"} 
              size="sm"
              onClick={toggleDemoMode}
            >
              {demoWinnerMode ? "演示模式: 開啟" : "演示模式: 關閉"}
            </Button>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo">資金領取</TabsTrigger>
          <TabsTrigger value="info">技術說明</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo" className="mt-4">
          <CCTPDemoButton
            volunteers={volunteers}
            daoExpired={daoExpired}
            daoAddress={daoAddress}
            isConnected={isConnected}
            isWinner={isWinner}
          />
        </TabsContent>
        
        <TabsContent value="info" className="mt-4">
          <CCTPInfoCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 