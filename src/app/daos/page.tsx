'use client';

import { useState, useEffect } from 'react';
import { useEventDAOFactory } from '@/contracts/hooks/useEventDAOFactory';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatAddress, formatDate, formatAmount } from '@/contracts/config';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DAOsPage() {
  const { activeDAOs, expiredDAOs, isLoading, error, refreshDAOs, createEventDAO } = useEventDAOFactory();
  const [createFormVisible, setCreateFormVisible] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    console.log('==== DAOs Page Debug Info ====');
    console.log('Active DAOs:', activeDAOs);
    console.log('Active DAOs Length:', activeDAOs.length);
    console.log('Expired DAOs:', expiredDAOs);
    console.log('Expired DAOs Length:', expiredDAOs.length);
    console.log('Is Loading:', isLoading);
    console.log('Error:', error);
  }, [activeDAOs, expiredDAOs, isLoading, error]);

  const handleRefresh = () => {
    console.log('Manually refreshing DAOs...');
    refreshDAOs();
  };

  const handleCreateDAO = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventName || !eventDescription) return;
    
    try {
      setFormSubmitting(true);
      console.log('Creating new DAO:', { eventName, eventDescription });
      await createEventDAO(eventName, eventDescription);
      setEventName('');
      setEventDescription('');
      setCreateFormVisible(false);
    } catch (err) {
      console.error('Error creating DAO:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const renderDAOCard = (dao: any) => {
    return (
      <Card key={dao.id} className="w-full">
        <CardHeader>
          <CardTitle>{dao.eventName}</CardTitle>
          <CardDescription>{dao.eventDescription.substring(0, 100)}...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>創建時間:</div>
            <div>{formatDate(dao.createdAt)}</div>
            <div>到期時間:</div>
            <div>{formatDate(dao.expiresAt)}</div>
            <div>合約地址:</div>
            <div>{formatAddress(dao.daoAddress)}</div>
          </div>
        </CardContent>
        <CardFooter>
          <Link href={`/daos/${dao.daoAddress}`} className="w-full">
            <Button className="w-full">查看詳情</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">社區活動</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            刷新
          </Button>
          <Button onClick={() => setCreateFormVisible(!createFormVisible)}>
            {createFormVisible ? '取消' : '創建新活動'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="bg-slate-100 p-4 rounded-md mb-6 text-xs font-mono">
        <p>狀態: {isLoading ? '加載中' : '已加載'}</p>
        <p>活躍DAO數量: {activeDAOs.length}</p>
        <p>過期DAO數量: {expiredDAOs.length}</p>
        {error && <p className="text-red-500">錯誤: {error.message}</p>}
      </div>

      {createFormVisible && (
        <div className="bg-card p-6 rounded-lg shadow-md mb-6 border">
          <h2 className="text-xl font-bold mb-4">創建新活動</h2>
          <form onSubmit={handleCreateDAO}>
            <div className="space-y-4">
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium mb-1">
                  活動名稱
                </label>
                <input
                  type="text"
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="eventDescription" className="block text-sm font-medium mb-1">
                  活動描述
                </label>
                <textarea
                  id="eventDescription"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={formSubmitting || !eventName || !eventDescription}>
                  {formSubmitting ? '創建中...' : '創建活動'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">進行中 ({activeDAOs.length})</TabsTrigger>
          <TabsTrigger value="expired">已結束 ({expiredDAOs.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : activeDAOs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDAOs.map(renderDAOCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">暫無進行中的活動</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="expired">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : expiredDAOs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiredDAOs.map(renderDAOCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">暫無已結束的活動</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 