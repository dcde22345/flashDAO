'use client';

import { useState, useCallback } from 'react';
import { useEventDAO } from '@/contracts/hooks/useEventDAO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface VolunteerRegistrationFormProps {
  daoAddress: string;
}

export const VolunteerRegistrationForm = ({ daoAddress }: VolunteerRegistrationFormProps) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 使用 EventDAO Hook
  const { registerAsVolunteer, daoInfo, userInfo, refreshData } = useEventDAO(daoAddress);

  // 驗證表單
  const validateForm = useCallback(() => {
    if (!name.trim()) {
      setError('請輸入您的姓名或團隊名稱');
      return false;
    }

    if (!description.trim()) {
      setError('請輸入您的志願計劃描述');
      return false;
    }

    return true;
  }, [name, description]);

  // 處理註冊提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      setStatusMessage('正在註冊...');

      // 提交註冊 (已略過驗證流程)
      const txHash = await registerAsVolunteer(name, description);
      
      // 顯示成功消息
      setName('');
      setDescription('');
      setSuccessMessage(`註冊成功！交易哈希: ${txHash}`);
      setStatusMessage('交易已提交，等待區塊確認...');
      
      // 設置一系列的刷新，確保數據被更新
      const updateSequence = [
        { delay: 3000, message: '更新 DAO 信息...' },
        { delay: 5000, message: '獲取志願者列表...' },
        { delay: 7000, message: '檢查註冊狀態...' },
        { delay: 9000, message: null } // 最後清除狀態消息
      ];
      
      let currentIndex = 0;
      const runNextUpdate = () => {
        if (currentIndex >= updateSequence.length) return;
        
        const { delay, message } = updateSequence[currentIndex];
        setTimeout(() => {
          setStatusMessage(message);
          if (message) {
            refreshData().catch(e => console.error('Error in refresh sequence:', e));
          }
          currentIndex++;
          runNextUpdate();
        }, delay);
      };
      
      runNextUpdate();
    } catch (err: any) {
      console.error('註冊失敗:', err);
      setError(err.message || '註冊處理時出錯');
      setStatusMessage(null);
    } finally {
      // 確保按鈕可以再次點擊
      setTimeout(() => {
        setIsSubmitting(false);
      }, 10000); // 增加到 10 秒，給刷新順序足夠時間
    }
  };

  // 檢查活動是否已過期或用戶是否已為志願者
  const isExpired = daoInfo?.isExpired || false;
  const isUserVolunteer = userInfo?.isVolunteer || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>成為志願者</CardTitle>
        <CardDescription>
          註冊成為志願者並提出您的計劃，有機會獲得資金支持。
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isExpired ? (
          <div className="flex items-center p-4 bg-amber-50 text-amber-600 rounded-md">
            <AlertCircle className="h-5 w-5 mr-2" />
            此活動已結束，無法註冊為志願者。
          </div>
        ) : isUserVolunteer ? (
          <div className="flex items-center p-4 bg-green-50 text-green-600 rounded-md">
            <AlertCircle className="h-5 w-5 mr-2" />
            您已註冊為此活動的志願者。
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="volunteerName" className="block text-sm font-medium text-gray-700 mb-1">
                姓名/團隊名稱
              </label>
              <input
                type="text"
                id="volunteerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="輸入您的姓名或團隊名稱"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div>
              <label htmlFor="volunteerDescription" className="block text-sm font-medium text-gray-700 mb-1">
                計劃描述
              </label>
              <textarea
                id="volunteerDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述您的救災計劃和資金用途"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm">
                {successMessage}
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full"
            >
              {isSubmitting ? (statusMessage || '處理中...') : '註冊為志願者'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}; 