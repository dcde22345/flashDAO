'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNexusClient } from '@/hooks/useNexusClient';
import { EventDAOFactoryABI } from '../abis/EventDAOFactory';
import { CHAIN_CONFIG, DEFAULT_CHAIN } from '../config';
import { EventDAOInfo } from '../types';
import { formatDate } from '../config';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Move client creation outside the component to prevent recreation on every render
const createClient = () => createPublicClient({
  chain: baseSepolia,
  transport: http(CHAIN_CONFIG[DEFAULT_CHAIN as keyof typeof CHAIN_CONFIG].rpcUrl)
});

export const useEventDAOFactory = () => {
  const { nexusClient, sendContractTransaction, isLoading: clientLoading, error: clientError } = useNexusClient();
  const [daoList, setDaoList] = useState<EventDAOInfo[]>([]);
  const [activeDAOs, setActiveDAOs] = useState<EventDAOInfo[]>([]);
  const [expiredDAOs, setExpiredDAOs] = useState<EventDAOInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const factoryAddress = CHAIN_CONFIG[DEFAULT_CHAIN as keyof typeof CHAIN_CONFIG].contracts.eventDAOFactory;
  
  // Use useMemo to create the client only once
  const publicClient = useMemo(() => createClient(), []);

  // 添加調試日誌
  useEffect(() => {
    console.log('==== useEventDAOFactory Debug Info ====');
    console.log('Nexus Client:', nexusClient ? 'Initialized' : 'Not Initialized');
    console.log('Public Client:', publicClient ? 'Initialized' : 'Not Initialized');
    console.log('Client Loading:', clientLoading);
    console.log('Client Error:', clientError);
    console.log('Factory Address:', factoryAddress);
    console.log('DEFAULT_CHAIN:', DEFAULT_CHAIN);
    console.log('CHAIN_CONFIG:', CHAIN_CONFIG);
  }, [nexusClient, clientLoading, clientError, factoryAddress, publicClient]);

  // 讀取所有DAO信息
  const fetchDAOs = useCallback(async () => {
    if (!publicClient) {
      console.log('Public client not initialized');
      return;
    }

    console.log('Starting fetchDAOs with Viem publicClient...');
    console.log('Using factory address:', factoryAddress);

    setIsLoading(true);
    setError(null);

    try {
      // 獲取活躍的DAO事件
      console.log('Fetching active event IDs...');
      const activeEventIds = await publicClient.readContract({
        abi: EventDAOFactoryABI,
        address: factoryAddress as `0x${string}`,
        functionName: 'getActiveEventDAOs',
      }) as `0x${string}`[];
      console.log('Active event IDs:', activeEventIds);

      // 獲取過期的DAO事件
      console.log('Fetching expired event IDs...');
      const expiredEventIds = await publicClient.readContract({
        abi: EventDAOFactoryABI,
        address: factoryAddress as `0x${string}`,
        functionName: 'getExpiredEventDAOs',
      }) as `0x${string}`[];
      console.log('Expired event IDs:', expiredEventIds);

      // 獲取所有DAO的詳細信息
      console.log('Fetching detailed information for active DAOs...');
      const fetchedActiveDAOs = await Promise.all(activeEventIds.map(async (eventId) => {
        console.log(`Fetching details for active event ID: ${eventId}`);
        const daoInfo = await publicClient.readContract({
          abi: EventDAOFactoryABI,
          address: factoryAddress as `0x${string}`,
          functionName: 'eventDAOs',
          args: [eventId],
        }) as any;
        console.log(`DAO info for ${eventId}:`, daoInfo);

        return {
          id: eventId,
          daoAddress: daoInfo[0],
          eventName: daoInfo[1],
          eventDescription: daoInfo[2],
          createdAt: Number(daoInfo[3]),
          expiresAt: Number(daoInfo[4]),
          exists: daoInfo[5],
          isActive: true,
        };
      }));
      console.log('Fetched active DAOs:', fetchedActiveDAOs);

      console.log('Fetching detailed information for expired DAOs...');
      const fetchedExpiredDAOs = await Promise.all(expiredEventIds.map(async (eventId) => {
        console.log(`Fetching details for expired event ID: ${eventId}`);
        const daoInfo = await publicClient.readContract({
          abi: EventDAOFactoryABI,
          address: factoryAddress as `0x${string}`,
          functionName: 'eventDAOs',
          args: [eventId],
        }) as any;
        console.log(`DAO info for ${eventId}:`, daoInfo);

        return {
          id: eventId,
          daoAddress: daoInfo[0],
          eventName: daoInfo[1],
          eventDescription: daoInfo[2],
          createdAt: Number(daoInfo[3]),
          expiresAt: Number(daoInfo[4]),
          exists: daoInfo[5],
          isActive: false,
        };
      }));
      console.log('Fetched expired DAOs:', fetchedExpiredDAOs);

      setActiveDAOs(fetchedActiveDAOs);
      setExpiredDAOs(fetchedExpiredDAOs);
      setDaoList([...fetchedActiveDAOs, ...fetchedExpiredDAOs]);
      console.log('Updated state with fetched DAOs');
    } catch (err) {
      console.error('Error fetching DAOs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch DAOs'));
    } finally {
      setIsLoading(false);
      console.log('Finished fetchDAOs');
    }
  }, [publicClient, factoryAddress]);

  // 創建新的DAO - 仍然使用 Biconomy NexusClient 處理交易
  const createEventDAO = async (
    eventName: string,
    eventDescription: string,
    lifetime: number = 0 // 0 means use default (7 days)
  ) => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }

    console.log('Creating new DAO...');
    console.log('Event Name:', eventName);
    console.log('Event Description:', eventDescription);
    console.log('Lifetime:', lifetime);

    try {
      const txHash = await sendContractTransaction({
        abi: EventDAOFactoryABI,
        functionName: 'createEventDAO',
        args: [eventName, eventDescription, BigInt(lifetime)],
        to: factoryAddress,
      });

      console.log('DAO created successfully, txHash:', txHash);

      // 重新獲取DAO列表
      await fetchDAOs();
      
      return txHash;
    } catch (err) {
      console.error('Error creating DAO:', err);
      throw err;
    }
  };

  // 初始化時獲取DAO列表
  useEffect(() => {
    // 只要 publicClient 初始化，就可以獲取DAO列表，不依賴於 nexusClient
    console.log('Initial DAO fetch triggered');
    fetchDAOs();
  }, [fetchDAOs]);

  return {
    daoList,
    activeDAOs,
    expiredDAOs,
    isLoading: isLoading || clientLoading,
    error: error || clientError,
    createEventDAO,
    refreshDAOs: fetchDAOs,
  };
}; 