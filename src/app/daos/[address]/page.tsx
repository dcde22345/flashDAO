'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEventDAO } from '@/contracts/hooks/useEventDAO';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatAddress, formatDate, formatAmount } from '@/contracts/config';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { DonationForm } from '@/components/EventDetail/DonationForm';
import { VolunteerRegistrationForm } from '@/components/EventDetail/VolunteerRegistrationForm';
import { VotingModule } from '@/components/EventDetail/VotingModule';
import { CCTPDemoModule } from '@/components/CrossChainDemo';

interface EventDetailProps {
  params: {
    address: string;
  };
}

export default function EventDetail({ params }: EventDetailProps) {
  const address = params.address;
  const { daoInfo, userInfo, volunteers, isLoading, error, registerAsVolunteer, donate, vote, 
          concludeElection, distributeFunds, claimRefund, refreshData } = useEventDAO(address);
  const { authenticated, user, ready, login } = usePrivy();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [donationAmount, setDonationAmount] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 添加手動刷新功能
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('手動刷新失敗:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // 登錄提示
  const handleAuth = async () => {
    if (!authenticated && ready) {
      await login();
    }
  };
  
  // 捐款
  const handleDonate = async () => {
    if (!authenticated) {
      handleAuth();
      return;
    }
    
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    
    try {
      setProcessingAction(true);
      // 轉換為 USDC 的 6 位小數
      const usdcAmount = BigInt(amount * 1_000_000);
      await donate(usdcAmount);
      setDonationAmount('');
    } catch (err) {
      console.error('Error donating:', err);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // 投票
  const handleVote = async (volunteerIndex: number) => {
    if (!authenticated) {
      handleAuth();
      return;
    }
    
    try {
      setProcessingAction(true);
      await vote(volunteerIndex);
      
      // 添加延遲刷新，確保區塊鏈有時間處理投票結果
      setTimeout(async () => {
        console.log('刷新投票後的數據');
        await refreshData().catch(e => console.error('刷新投票數據出錯:', e));
      }, 5000);
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // 結束選舉
  const handleConcludeElection = async () => {
    if (!authenticated) {
      handleAuth();
      return;
    }
    
    try {
      setProcessingAction(true);
      await concludeElection();
    } catch (err) {
      console.error('Error concluding election:', err);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // 分配資金
  const handleDistributeFunds = async () => {
    if (!authenticated) {
      handleAuth();
      return;
    }
    
    try {
      setProcessingAction(true);
      await distributeFunds();
    } catch (err) {
      console.error('Error distributing funds:', err);
    } finally {
      setProcessingAction(false);
    }
  };
  
  // 獲取退款
  const handleClaimRefund = async () => {
    if (!authenticated) {
      handleAuth();
      return;
    }
    
    try {
      setProcessingAction(true);
      await claimRefund();
    } catch (err) {
      console.error('Error claiming refund:', err);
    } finally {
      setProcessingAction(false);
    }
  };
  
  useEffect(() => {
    if (authenticated) {
      // 僅在首次驗證時獲取數據，之後通過手動刷新或定時刷新獲取
      if (!userInfo) {
        refreshData();
      }
    }
  }, [authenticated, refreshData, userInfo]);
  
  // 渲染事件概覽
  const renderEventOverview = () => {
    if (!daoInfo) return null;
    
    const daoExpired = daoInfo.isExpired;
    const electionConcluded = daoInfo.electionConcluded;
    const fundsDistributed = daoInfo.fundsDistributed;
    
    return (
      <div className="space-y-6">
        <div className="prose max-w-none">
          <h3>事件描述</h3>
          <p>{daoInfo.eventDescription}</p>
        </div>
        
        {authenticated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <DonationForm daoAddress={address} />
            </div>
            
            {!userInfo?.isVolunteer && !daoExpired && (
              <div className="col-span-1">
                <VolunteerRegistrationForm daoAddress={address} />
              </div>
            )}
          </div>
        )}
        
        {daoExpired && !electionConcluded && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>事件已過期</AlertTitle>
            <AlertDescription>
              選舉需要被結束才能確定最終獲勝者。
              {userInfo && userInfo.donations > BigInt(0) && !userInfo.hasVoted && (
                <div className="mt-2">
                  <Button onClick={handleConcludeElection} disabled={processingAction}>
                    {processingAction ? '處理中...' : '結束選舉'}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {electionConcluded && !fundsDistributed && !daoInfo.noWinner && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>選舉已結束</AlertTitle>
            <AlertDescription>
              資金需要被分配給獲勝的志願者。
              {userInfo && userInfo.donations > BigInt(0) && (
                <div className="mt-2">
                  <Button onClick={handleDistributeFunds} disabled={processingAction}>
                    {processingAction ? '處理中...' : '分配資金'}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {daoInfo.noWinner && electionConcluded && userInfo && userInfo.donations > BigInt(0) && !userInfo.refunded && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>可以領取退款</AlertTitle>
            <AlertDescription>
              沒有志願者獲勝，您可以領取退款。
              <div className="mt-2">
                <Button onClick={handleClaimRefund} disabled={processingAction}>
                  {processingAction ? '處理中...' : '領取退款'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  // 渲染志願者列表和投票
  const renderVolunteers = () => {
    if (!daoInfo) return null;
    
    const daoExpired = daoInfo.isExpired;
    const electionConcluded = daoInfo.electionConcluded;
    const winningIndex = daoInfo.winningVolunteerIndex;
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">志願者</h3>
        </div>
        
        <VotingModule 
          volunteers={volunteers.map((volunteer, index) => ({
            id: index,
            name: volunteer.name,
            description: volunteer.description,
            address: volunteer.address,
            approved: volunteer.approved,
            votes: volunteer.votes
          }))}
          isConnected={authenticated}
          hasVoted={userInfo?.hasVoted || false}
          isExpired={daoExpired}
          tokenBalance={userInfo?.tokenBalance || BigInt(0)}
          onVote={handleVote}
          onRefresh={refreshData}
          winningVolunteerIndex={electionConcluded ? winningIndex : undefined}
          electionConcluded={electionConcluded}
        />
      </div>
    );
  };
  
  // DAO狀態
  const getDAOStatus = () => {
    if (!daoInfo) return '加載中';
    
    if (daoInfo.fundsDistributed) return '已完成';
    if (daoInfo.electionConcluded) return '選舉已結束';
    if (daoInfo.isExpired) return '已過期';
    return '進行中';
  };
  
  // 獲取狀態顏色
  const getStatusColor = () => {
    if (!daoInfo) return 'bg-gray-500';
    
    if (daoInfo.fundsDistributed) return 'bg-green-500';
    if (daoInfo.electionConcluded) return 'bg-yellow-500';
    if (daoInfo.isExpired) return 'bg-red-500';
    return 'bg-green-500';
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>無法載入DAO資訊：{error}</AlertDescription>
        </Alert>
      ) : daoInfo ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{daoInfo.eventName}</h1>
              <div className="flex items-center mt-2">
                <span className={`inline-block rounded-full h-2.5 w-2.5 mr-2 ${getStatusColor()}`}></span>
                <span className="text-sm text-gray-500">{getDAOStatus()}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleManualRefresh} disabled={isRefreshing} variant="outline">
                {isRefreshing ? '刷新中...' : '刷新資訊'}
              </Button>
              {authenticated && daoInfo.isExpired && !daoInfo.electionConcluded && userInfo?.isAdmin && (
                <Button size="sm" disabled={processingAction} onClick={handleConcludeElection}>
                  {processingAction ? '處理中...' : '結束選舉'}
                </Button>
              )}
              {authenticated && daoInfo.electionConcluded && !daoInfo.fundsDistributed && userInfo?.isAdmin && (
                <Button size="sm" disabled={processingAction} onClick={handleDistributeFunds}>
                  {processingAction ? '處理中...' : '分配資金'}
                </Button>
              )}
              {authenticated && daoInfo.isExpired && daoInfo.electionConcluded && daoInfo.fundsDistributed && userInfo?.donations > BigInt(0) && !userInfo.hasClaimedRefund && (
                <Button size="sm" disabled={processingAction} onClick={handleClaimRefund}>
                  {processingAction ? '處理中...' : '領取退款'}
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>DAO 基本資訊</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">DAO 地址</dt>
                      <dd className="font-medium mt-1">{formatAddress(address)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">建立者</dt>
                      <dd className="font-medium mt-1">{formatAddress(daoInfo.admin)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">開始日期</dt>
                      <dd className="font-medium mt-1">{formatDate(new Date(Number(daoInfo.startTime) * 1000))}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">結束日期</dt>
                      <dd className="font-medium mt-1">{formatDate(new Date(Number(daoInfo.endTime) * 1000))}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">募集資金</dt>
                      <dd className="font-medium mt-1">{formatAmount(daoInfo.totalDonations)} USDC</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">志願者人數</dt>
                      <dd className="font-medium mt-1">{volunteers.filter(v => v.approved).length} / {volunteers.length}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">概覽</TabsTrigger>
                  <TabsTrigger value="volunteers">志願者</TabsTrigger>
                  <TabsTrigger value="cctp">跨鏈演示</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  {renderEventOverview()}
                </TabsContent>
                <TabsContent value="volunteers" className="mt-6">
                  {renderVolunteers()}
                </TabsContent>
                <TabsContent value="cctp" className="mt-6">
                  <CCTPDemoModule
                    volunteers={volunteers.filter(v => v.approved)}
                    daoExpired={daoInfo.isExpired}
                    daoAddress={address}
                    isConnected={authenticated}
                    userAddress={user?.wallet?.address}
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* 用戶信息卡片 */}
            {authenticated && userInfo && (
              <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border">
                <h3 className="text-lg font-semibold mb-4">您的參與</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">您的捐款</p>
                    <p className="font-medium">{formatAmount(userInfo.donations)} USDC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">投票權</p>
                    <p className="font-medium">{formatAmount(userInfo.tokenBalance, 18)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">身份</p>
                    <p className="font-medium">
                      {userInfo.isVolunteer ? '志願者' : userInfo.donations > BigInt(0) ? '捐贈者' : '訪客'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold">未找到事件</h1>
        </div>
      )}
    </div>
  );
} 