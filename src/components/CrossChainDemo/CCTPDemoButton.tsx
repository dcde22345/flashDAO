import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Check, X, ArrowRightCircle, Trophy } from 'lucide-react';
import { 
  performFastTransfer, 
  getFastTransferFee,
  ChainOption,
  getChainDetails
} from '@/services/cctpService';
import { ChainSelector } from './ChainSelector';

interface CCTPDemoButtonProps {
  volunteers: Array<{
    id: number;
    name: string;
    address: string;
    votes: number;
  }>;
  daoExpired: boolean;
  daoAddress: string;
  isConnected: boolean;
  isWinner?: boolean; // 當前用戶是否為勝出者
}

type TransferStep = 'idle' | 'chain_selection' | 'transferring' | 'success' | 'error';

export const CCTPDemoButton: React.FC<CCTPDemoButtonProps> = ({
  volunteers,
  daoExpired,
  daoAddress,
  isConnected,
  isWinner = false // 演示時可設為true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<TransferStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [fee, setFee] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<ChainOption | null>(null);
  
  // 獲取票數最高的志願者
  const getTopVolunteer = () => {
    if (volunteers.length === 0) return null;
    
    return volunteers
      .filter(v => v.votes > 0)
      .sort((a, b) => b.votes - a.votes)[0] || null;
  };
  
  const topVolunteer = getTopVolunteer();

  // 處理鏈選擇
  const handleChainSelect = (chain: ChainOption) => {
    setSelectedChain(chain);
    handleCrossChainTransfer(chain.id);
  };
  
  // 處理選擇取消
  const handleCancel = () => {
    setStep('idle');
  };
  
  // 啟動鏈選擇
  const startChainSelection = () => {
    setStep('chain_selection');
  };
  
  // 執行跨鏈轉賬
  const handleCrossChainTransfer = async (destDomainId: number) => {
    if (!isConnected || !topVolunteer) return;
    
    setIsLoading(true);
    setStep('transferring');
    setErrorMessage(null);
    
    try {
      // 獲取費用信息
      const feeAmount = await getFastTransferFee(1, destDomainId);
      setFee(feeAmount);
      
      // 模擬轉賬金額 (在實際應用中，這將是DAO中的USDC餘額)
      const transferAmount = '10.0'; // 假設10 USDC
      
      // 執行跨鏈轉賬
      const result = await performFastTransfer(
        topVolunteer.address, 
        transferAmount,
        destDomainId
      );
      
      if (result.success && result.txHash) {
        setTxHash(result.txHash);
        
        // 模擬Fast Transfer時間（約22秒）
        await new Promise(resolve => setTimeout(resolve, 19000));
        
        setStep('success');
      } else {
        throw new Error(result.errorMessage || '跨鏈轉賬失敗');
      }
    } catch (error: any) {
      console.error('跨鏈轉賬失敗:', error);
      setStep('error');
      setErrorMessage(error.message || '跨鏈轉賬失敗');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>跨鏈資金領取</CardTitle>
          <CardDescription>使用CCTP V2跨鏈轉賬資金給得票最高者</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <X className="h-4 w-4" />
            <AlertTitle>未連接</AlertTitle>
            <AlertDescription>請先連接錢包以使用跨鏈資金領取功能</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // 鏈選擇界面
  if (step === 'chain_selection') {
    return (
      <ChainSelector 
        onSelect={handleChainSelect} 
        onCancel={handleCancel} 
        sourceDomainId={1} // 默認源鏈為Avalanche Fuji
        disabled={isLoading}
      />
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          跨鏈資金領取
        </CardTitle>
        <CardDescription>
          投票獲勝者可將DAO資金跨鏈轉移到指定網絡
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {volunteers.length === 0 && (
          <Alert>
            <X className="h-4 w-4" />
            <AlertTitle>無志願者</AlertTitle>
            <AlertDescription>目前還沒有志願者參與，無法執行跨鏈轉賬演示</AlertDescription>
          </Alert>
        )}
        
        {volunteers.length > 0 && !topVolunteer && (
          <Alert>
            <X className="h-4 w-4" />
            <AlertTitle>無票數</AlertTitle>
            <AlertDescription>還沒有志願者獲得票數，無法確定得票最高者</AlertDescription>
          </Alert>
        )}
        
        {topVolunteer && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium">得票最高者</h3>
              <p className="text-sm text-gray-600 mt-1">{topVolunteer.name}</p>
              <p className="text-sm text-gray-500">地址: {topVolunteer.address}</p>
              <p className="text-sm font-medium mt-2">票數: {topVolunteer.votes.toFixed(2)}</p>
              
              {isWinner && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200 text-yellow-700 text-sm">
                  <p className="font-medium">您是本次DAO投票的獲勝者！</p>
                  <p className="text-xs mt-1">可以將DAO中的資金跨鏈轉移到您選擇的網絡。</p>
                </div>
              )}
            </div>
            
            {selectedChain && (
              <div className="p-3 border rounded-lg bg-blue-50">
                <h4 className="text-sm font-medium">已選擇的目標鏈</h4>
                <div className="flex items-center mt-1">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
                    {selectedChain.icon.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm">{selectedChain.name}</span>
                </div>
              </div>
            )}
            
            {step === 'transferring' && (
              <Alert className="bg-blue-50 text-blue-600 border-blue-200">
                <Clock className="h-4 w-4 animate-spin" />
                <AlertTitle>跨鏈轉賬進行中</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>正在使用CCTP V2 Fast Transfer進行跨鏈轉賬（約需22秒）</p>
                    {fee && <p className="text-xs">Fast Transfer費用: {fee} USDC</p>}
                    {txHash && <p className="text-xs">交易哈希: {txHash}</p>}
                    {selectedChain && (
                      <p className="text-xs">從 Avalanche Fuji → {selectedChain.name}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {step === 'success' && (
              <Alert className="bg-green-50 text-green-600 border-green-200">
                <Check className="h-4 w-4" />
                <AlertTitle>跨鏈轉賬成功</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>已成功使用CCTP V2將資金跨鏈轉給得票最高者!</p>
                    {fee && <p className="text-xs">Fast Transfer費用: {fee} USDC</p>}
                    {txHash && <p className="text-xs">交易哈希: {txHash}</p>}
                    {selectedChain && (
                      <p className="text-xs">從 Avalanche Fuji → {selectedChain.name}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {step === 'error' && (
              <Alert className="bg-red-50 text-red-600 border-red-200">
                <X className="h-4 w-4" />
                <AlertTitle>跨鏈轉賬失敗</AlertTitle>
                <AlertDescription>{errorMessage || '處理過程中發生錯誤'}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isWinner && topVolunteer && step === 'idle' ? (
          <Button 
            className="w-full"
            onClick={startChainSelection}
            disabled={isLoading}
          >
            <span className="flex items-center">
              <ArrowRightCircle className="mr-2 h-4 w-4" />
              選擇目標鏈並領取資金
            </span>
          </Button>
        ) : !isWinner && topVolunteer && step === 'idle' ? (
          <Button 
            className="w-full"
            onClick={startChainSelection}
            disabled={isLoading}
          >
            <span className="flex items-center">
              <ArrowRightCircle className="mr-2 h-4 w-4" />
              演示跨鏈資金領取
            </span>
          </Button>
        ) : (
          <Button 
            className="w-full"
            disabled={true}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                處理中...
              </span>
            ) : step === 'success' ? (
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4" />
                轉賬完成
              </span>
            ) : (
              <span className="flex items-center">
                <ArrowRightCircle className="mr-2 h-4 w-4" />
                選擇目標鏈
              </span>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 