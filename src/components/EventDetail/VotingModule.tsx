import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAddress, formatAmount } from '@/contracts/config';
import { AlertCircle, Check, Clock, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VotingModuleProps {
  volunteers: Array<{
    id: number;
    name: string;
    description: string;
    address: string;
    approved: boolean;
    votes: number;
  }>;
  isConnected: boolean;
  hasVoted: boolean;
  isExpired: boolean;
  tokenBalance: bigint;
  onVote: (volunteerId: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  winningVolunteerIndex?: number;
  electionConcluded: boolean;
}

export const VotingModule: React.FC<VotingModuleProps> = ({
  volunteers,
  isConnected,
  hasVoted,
  isExpired,
  tokenBalance,
  onVote,
  onRefresh,
  winningVolunteerIndex,
  electionConcluded
}) => {
  const [votingId, setVotingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const handleVote = async (volunteerId: number) => {
    if (!isConnected) return;
    if (hasVoted) return;
    
    setVotingId(volunteerId);
    setError(null);
    setSuccess(false);
    
    try {
      await onVote(volunteerId);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setVotingId(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '投票失敗');
      setTimeout(() => {
        setError(null);
        setVotingId(null);
      }, 5000);
    }
  };
  
  if (volunteers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>投票</CardTitle>
          <CardDescription>目前還沒有志願者註冊</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">暫無志願者</p>
            <p className="text-sm text-gray-400 mt-2">志願者註冊後將顯示在此處</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const approvedVolunteers = volunteers.filter(v => v.approved);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>投票</CardTitle>
            <CardDescription>選擇一位志願者進行投票</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={votingId !== null}
          >
            刷新
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>未連接</AlertTitle>
            <AlertDescription>請先連接錢包以進行投票</AlertDescription>
          </Alert>
        )}
        
        {isConnected && isExpired && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>投票已結束</AlertTitle>
            <AlertDescription>此 DAO 活動已過期，無法繼續投票</AlertDescription>
          </Alert>
        )}
        
        {isConnected && hasVoted && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>已投票</AlertTitle>
            <AlertDescription>您已經為此 DAO 投票，每個地址只能投票一次</AlertDescription>
          </Alert>
        )}
        
        {isConnected && !hasVoted && !isExpired && tokenBalance === BigInt(0) && (
          <Alert>
            <X className="h-4 w-4" />
            <AlertTitle>無投票權</AlertTitle>
            <AlertDescription>您需要先捐款獲取投票代幣才能投票</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert className="mt-4 bg-red-50 text-red-600 border-red-200">
            <X className="h-4 w-4" />
            <AlertTitle>投票失敗</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mt-4 bg-green-50 text-green-600 border-green-200">
            <Check className="h-4 w-4" />
            <AlertTitle>投票成功</AlertTitle>
            <AlertDescription>您的投票已成功提交並記錄在區塊鏈上</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 mt-4">
          {approvedVolunteers.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">暫無已批准的志願者</p>
              <p className="text-sm text-gray-400 mt-2">管理員批准志願者後將顯示在此處</p>
            </div>
          ) : (
            approvedVolunteers.map((volunteer) => (
              <div 
                key={volunteer.id} 
                className={`p-4 border rounded-lg ${
                  electionConcluded && winningVolunteerIndex === volunteer.id 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {volunteer.name}
                      {electionConcluded && winningVolunteerIndex === volunteer.id && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          獲勝者
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{formatAddress(volunteer.address)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium">{volunteer.votes.toFixed(2)} 票</span>
                      <span className="text-xs text-gray-400">代幣投票權</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2 mb-4">{volunteer.description}</p>
                
                {isConnected && !hasVoted && !isExpired && tokenBalance > BigInt(0) && (
                  <Button 
                    onClick={() => handleVote(volunteer.id)} 
                    disabled={votingId !== null}
                    variant="outline"
                    className="w-full"
                  >
                    {votingId === volunteer.id ? '處理中...' : '投票給此志願者'}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {isConnected && !hasVoted && !isExpired && tokenBalance > BigInt(0) && (
        <CardFooter className="flex-col">
          <div className="w-full text-center text-sm text-gray-500 mb-2">
            您目前有 {formatAmount(tokenBalance, 18)} 投票權。一旦投票，您將無法更改或撤回您的投票。
          </div>
          <div className="w-full text-center text-xs text-gray-400">
            投票權根據您的代幣量決定。每個代幣對應的投票權在智能合約中以1:1的比例計算。
          </div>
        </CardFooter>
      )}
    </Card>
  );
}; 