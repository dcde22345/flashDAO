import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, Clock, Zap, CheckCircle2, Award } from 'lucide-react';

export const CCTPInfoCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ArrowRightLeft className="mr-2 h-5 w-5" />
          CCTP V2 跨鏈資金領取
        </CardTitle>
        <CardDescription>獲勝者可選擇目標鏈接收資金</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cross-Chain Transfer Protocol (CCTP) V2是Circle開發的一種安全傳輸USDC的協議，
            可以在不同區塊鏈間無縫轉移資產。在本DAO中，獲勝者可以將資金轉移到自己選擇的區塊鏈上。
          </p>
          
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2 text-yellow-600" />
              獲勝者資金領取流程
            </h4>
            <ul className="text-xs text-gray-700 mt-2 space-y-1 list-disc pl-5">
              <li>DAO投票結束後，得票最高的志願者獲勝</li>
              <li>獲勝者可以選擇將資金轉移到哪條區塊鏈上</li>
              <li>系統使用CCTP V2的Fast Transfer功能，快速完成跨鏈轉賬</li>
              <li>整個轉賬過程在約22秒內完成，遠快於傳統跨鏈方式</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-start">
              <Zap className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium">Fast Transfer</h4>
                <p className="text-xs text-gray-500">實現快於鏈上最終確認的跨鏈轉賬，從分鐘級縮短到約22秒</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium">安全可靠</h4>
                <p className="text-xs text-gray-500">通過原生燃燒和鑄造機制確保USDC 1:1轉移，無需信任第三方</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg mt-4">
            <h4 className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              為什麼使用跨鏈技術？
            </h4>
            <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc pl-5">
              <li>增強使用彈性：獲勝者可以選擇自己慣用或費用更低的區塊鏈網絡</li>
              <li>降低成本：避免在目標鏈上支付高昂的交換或橋接費用</li>
              <li>互操作性：促進不同區塊鏈生態系統之間的資金流動</li>
              <li>用戶體驗：簡化獲勝者接收資金的流程，無需複雜的手動橋接操作</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 