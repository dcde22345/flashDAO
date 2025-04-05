'use client';

import React, { useState } from 'react';
import { useEventDAO } from '@/contracts/hooks/useEventDAO';
import { useUSDCBalance } from '@/contracts/hooks/useUSDCBalance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/contracts/config';
import { AlertCircle, Check, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DonationFormProps {
  daoAddress: string;
}

export const DonationForm: React.FC<DonationFormProps> = ({ daoAddress }) => {
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { donate, daoInfo, userInfo, refreshData } = useEventDAO(daoAddress);
  const { balance: usdcBalance, isLoading: balanceLoading, refetch: refetchBalance } = useUSDCBalance();

  // 處理捐款
  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      setError('請輸入有效的金額');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      setStatusMessage('處理捐款中...');

      // 轉換為 USDC 的 6 位小數
      const usdcAmount = BigInt(Math.floor(donationAmount * 1_000_000));
      
      // 檢查餘額
      if (usdcBalance < usdcAmount) {
        setError(`餘額不足。您當前有 ${formatAmount(usdcBalance)} USDC，需要 ${formatAmount(usdcAmount)} USDC`);
        setStatusMessage(null);
        setIsSubmitting(false);
        return;
      }
      
      // 提交捐款
      const txHash = await donate(usdcAmount);
      
      // 顯示成功消息
      setAmount('');
      setSuccess(true);
      setStatusMessage('交易已提交，等待區塊確認...');
      
      // 設置一系列的刷新，確保數據被更新
      const updateSequence = [
        { delay: 3000, message: '更新 DAO 信息...' },
        { delay: 6000, message: '獲取投票權資訊...' },
        { delay: 9000, message: null } // 最後清除狀態消息
      ];
      
      let currentIndex = 0;
      const runNextUpdate = async () => {
        if (currentIndex >= updateSequence.length) {
          setIsSubmitting(false);
          return;
        }
        
        const { delay, message } = updateSequence[currentIndex];
        await new Promise(resolve => setTimeout(resolve, delay));
        
        setStatusMessage(message);
        if (message) {
          await Promise.all([
            refreshData().catch(e => console.error('Error in refresh sequence:', e)),
            refetchBalance().catch(e => console.error('Error fetching balance:', e))
          ]);
        }
        
        currentIndex++;
        runNextUpdate();
      };
      
      runNextUpdate();
    } catch (err: any) {
      console.error('捐款失敗:', err);
      setError(err.message || '處理捐款時出錯');
      setStatusMessage(null);
      setIsSubmitting(false);
    }
  };

  // 快速金額按鈕
  const quickAmounts = [5, 10, 50, 100];
  
  // 選擇預設金額
  const selectAmount = (amt: number) => {
    setAmount(amt.toString());
  };

  // 檢查活動是否已過期
  const isExpired = daoInfo?.isExpired || false;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>捐款</CardTitle>
        <CardDescription>
          捐款後您將獲得投票權，可以選出志願者
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isExpired ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>活動已結束</AlertTitle>
            <AlertDescription>此活動已過期，無法再捐款</AlertDescription>
          </Alert>
        ) : userInfo?.hasVoted ? (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>已投票</AlertTitle>
            <AlertDescription>您已經為此 DAO 投票，不能再捐款</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleDonate} className="space-y-4">
            <div>
              <label htmlFor="donationAmount" className="block text-sm font-medium text-gray-700 mb-1">
                捐款金額 (USDC)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="donationAmount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="輸入捐款金額"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => selectAmount(amt)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                    disabled={isSubmitting}
                  >
                    {amt} USDC
                  </button>
                ))}
              </div>
              
              {!balanceLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  餘額: {formatAmount(usdcBalance)} USDC
                </p>
              )}
            </div>
            
            {error && (
              <Alert className="bg-red-50 text-red-600 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>捐款失敗</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 text-green-600 border-green-200">
                <Check className="h-4 w-4" />
                <AlertTitle>捐款成功</AlertTitle>
                <AlertDescription>謝謝您的捐贈！您的投票權已更新。</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !amount} 
              className="w-full"
            >
              {isSubmitting ? (statusMessage || '處理中...') : '捐款並獲取投票權'}
            </Button>
          </form>
        )}
      </CardContent>
      
      {!isExpired && userInfo && userInfo.tokenBalance > BigInt(0) && (
        <CardFooter>
          <div className="w-full text-center text-sm text-gray-500">
            您目前有 {formatAmount(userInfo.tokenBalance, 18)} 投票權
          </div>
        </CardFooter>
      )}
    </Card>
  );
}; 