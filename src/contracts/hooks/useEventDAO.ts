'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNexusClient } from '@/hooks/useNexusClient';
import { EventDAOABI } from '../abis/EventDAO';
import { CHAIN_CONFIG, DEFAULT_CHAIN, USDC_DECIMALS } from '../config';
import { EventDAO, Volunteer, Donation, Vote, UserInfo } from '../types';
import { createPublicClient, http, Address } from 'viem';
import { baseSepolia } from 'viem/chains';

// 設置更長的重試延遲，避免頻繁請求
const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000; // 初始延遲 2 秒
const MAX_CONCURRENT_REQUESTS = 3; // 最大並行請求數

// 用於限制並行請求數的隊列
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();
    
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error('Task failed:', error);
      } finally {
        this.running--;
        this.processQueue();
      }
    }
  }
}

// 創建請求隊列
const requestQueue = new RequestQueue(MAX_CONCURRENT_REQUESTS);

// 添加一個帶隊列的重試函數
async function readContractWithRetryAndQueue(client: any, params: any, maxRetries = MAX_RETRIES, initialDelay = INITIAL_DELAY) {
  return requestQueue.add(() => readContractWithRetry(client, params, maxRetries, initialDelay));
}

// 創建客戶端的函數，放在組件外部以避免重複創建
const createClient = () => createPublicClient({
  chain: baseSepolia,
  transport: http(CHAIN_CONFIG[DEFAULT_CHAIN as keyof typeof CHAIN_CONFIG].rpcUrl),
  pollingInterval: 10000, // 每10秒輪詢一次，減少請求頻率
});

// 初始化客戶端
const defaultClient = createClient();

// 原有的重試函數保持不變
async function readContractWithRetry(client: any, params: any, maxRetries = MAX_RETRIES, initialDelay = INITIAL_DELAY) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await client.readContract(params);
    } catch (error: any) {
      // 當錯誤是 429 (Too Many Requests) 時才進行重試
      if (error?.details?.includes('over rate limit') || 
          error?.message?.includes('429') || 
          error?.message?.includes('over rate limit') ||
          error?.message?.includes('rate limit')) {
        retries++;
        
        if (retries >= maxRetries) {
          throw error; // 如果已經達到最大重試次數，拋出錯誤
        }
        
        // 每次重試前的延遲時間呈指數增長 (2秒, 4秒, 8秒...)
        const delay = initialDelay * Math.pow(2, retries - 1);
        console.log(`Rate limit exceeded. Retrying in ${delay}ms... (${retries}/${maxRetries})`);
        
        // 等待指定時間後重試
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // 如果是其他錯誤，直接拋出
      }
    }
  }
}

export const useEventDAO = (daoAddress: string) => {
  const { nexusClient, sendContractTransaction, isLoading: clientLoading, error: clientError } = useNexusClient();
  const [daoInfo, setDaoInfo] = useState<EventDAO | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  
  // 使用預設客戶端而不是每次創建新客戶端
  const publicClient = defaultClient;

  // 當用戶錢包地址發生變化時，更新用戶信息
  useEffect(() => {
    if (nexusClient) {
      // 從 nexusClient 獲取用戶地址
      const address = nexusClient.account?.address;
      if (address) {
        setUserAddress(address as string);
      }
    }
  }, [nexusClient]);

  // 獲取 DAO 的基本信息
  const fetchDAOInfo = useCallback(async () => {
    if (!publicClient || !daoAddress) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching DAO information...');
      
      // 獲取志願者數量（明確先獲取，確保有最新值）
      const volunteersCount = Number(await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'getVolunteerCount',
      }));
      
      console.log('Latest volunteer count:', volunteersCount);
      
      // 獲取基本信息
      const eventName = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'eventName',
      }) as string;
      
      const eventDescription = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'eventDescription',
      }) as string;
      
      const expiresAt = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'expiresAt',
      }) as bigint;
      
      // 不使用默認的 createdAt，而是直接使用 expiresAt 的值
      const createdAt = expiresAt; // 直接使用 expiresAt 作為 createdAt
      
      const isExpired = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'isExpired',
      }) as boolean;
      
      // 修正：調用 tokenName 而不是 name
      const tokenName = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'tokenName',
      }) as string;
      
      // 修正：調用 tokenSymbol 而不是 symbol
      const tokenSymbol = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'tokenSymbol',
      }) as string;
      
      const fundsDistributed = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'fundsDistributed',
      }) as boolean;
      
      const electionConcluded = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'electionConcluded',
      }) as boolean;
      
      // 修正：totalDonations 改為 totalDonationsAmount
      const totalDonations = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'totalDonationsAmount',
      }) as bigint;
      
      // 修正：donorCount 改為 getDonorCount
      const donorCount = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'getDonorCount',
      }) as bigint;
      
      let winningVolunteerIndex = 0;
      let noWinner = false;
      
      // 如果選舉已結束，獲取獲勝者信息
      if (electionConcluded) {
        try {
          winningVolunteerIndex = Number(await readContractWithRetryAndQueue(publicClient, {
            abi: EventDAOABI,
            address: daoAddress as `0x${string}`,
            functionName: 'winningVolunteerIndex',
          }));
        } catch (err) {
          console.log('No winner found:', err);
          noWinner = true;
        }
      }
      
      // 創建 DAO 信息對象
      const dao: EventDAO = {
        address: daoAddress,
        eventName,
        eventDescription,
        expiresAt: Number(expiresAt),
        createdAt: Number(createdAt),
        isExpired,
        fundsDistributed,
        electionConcluded,
        noWinner,
        totalDonations,
        donorCount: Number(donorCount),
        volunteers: volunteers, // 初始使用現有的志願者列表
        volunteersCount, // 使用最新獲取的志願者數量
        winningVolunteerIndex,
        tokenName,
        tokenSymbol,
      };
      
      setDaoInfo(dao);
      console.log('DAO info fetched:', dao);
      
      // 不直接調用 fetchVolunteers，讓 useEffect 處理志願者數據獲取
      
    } catch (err) {
      console.error('Error fetching DAO info:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch DAO information'));
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, daoAddress]);
  
  // 獲取志願者信息
  const fetchVolunteers = useCallback(async () => {
    if (!publicClient || !daoAddress || !daoInfo) {
      return;
    }
    
    try {
      console.log('Fetching volunteers...');
      const volunteersList: Volunteer[] = [];
      
      for (let i = 0; i < daoInfo.volunteersCount; i++) {
        // 修正：使用 getVolunteer 替代 volunteers
        const volunteerInfo = await readContractWithRetryAndQueue(publicClient, {
          abi: EventDAOABI,
          address: daoAddress as `0x${string}`,
          functionName: 'getVolunteer',
          args: [i],
        }) as any;
        
        // 修正：使用 volunteerVotes 替代 getVolunteerVotes
        const votesCount = await readContractWithRetryAndQueue(publicClient, {
          abi: EventDAOABI,
          address: daoAddress as `0x${string}`,
          functionName: 'volunteerVotes',
          args: [i],
        }) as bigint;
        
        volunteersList.push({
          address: volunteerInfo[0],
          name: volunteerInfo[1],
          description: volunteerInfo[2],
          approved: volunteerInfo[3],
          votes: formatVotes(votesCount),
        });
      }
      
      setVolunteers(volunteersList);
      console.log('Volunteers fetched:', volunteersList);
      
      // 更新 DAO 信息中的志願者列表
      setDaoInfo(prev => prev ? { ...prev, volunteers: volunteersList } : null);
      
    } catch (err) {
      console.error('Error fetching volunteers:', err);
    }
  }, [publicClient, daoAddress, daoInfo]);
  
  // 獲取用戶特定信息
  const fetchUserInfo = useCallback(async () => {
    if (!publicClient || !daoAddress || !userAddress) {
      return;
    }
    
    try {
      console.log('Fetching user info for address:', userAddress);
      
      const isVolunteer = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'isVolunteer',
        args: [userAddress as `0x${string}`],
      }) as boolean;
      
      // 如果是志願者，獲取志願者索引
      let volunteerIndex: number | undefined = undefined;
      if (isVolunteer) {
        // 註意：可能需要手動找出志願者索引，因為ABI中可能沒有 getVolunteerIndex 函數
        // 我們可以遍歷所有志願者並檢查地址是否匹配
        const volunteerCount = Number(await readContractWithRetryAndQueue(publicClient, {
          abi: EventDAOABI,
          address: daoAddress as `0x${string}`,
          functionName: 'getVolunteerCount',
        }));
        
        for (let i = 0; i < volunteerCount; i++) {
          const volunteerInfo = await readContractWithRetryAndQueue(publicClient, {
            abi: EventDAOABI,
            address: daoAddress as `0x${string}`,
            functionName: 'getVolunteer',
            args: [i],
          }) as any;
          
          if (volunteerInfo[0].toLowerCase() === userAddress.toLowerCase()) {
            volunteerIndex = i;
            break;
          }
        }
      }
      
      // 獲取用戶捐款數量
      const donations = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'donations',
        args: [userAddress as `0x${string}`],
      }) as bigint;
      
      // 獲取代幣餘額 (投票權)
      const tokenBalance = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      }) as bigint;
      
      // 檢查用戶是否已投票
      const hasVoted = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'hasVoted',
        args: [userAddress as `0x${string}`],
      }) as boolean;
      
      // 檢查用戶是否已領取退款
      const refunded = await readContractWithRetryAndQueue(publicClient, {
        abi: EventDAOABI,
        address: daoAddress as `0x${string}`,
        functionName: 'refunded',
        args: [userAddress as `0x${string}`],
      }) as boolean;
      
      const user: UserInfo = {
        isVolunteer,
        volunteerIndex,
        donations,
        tokenBalance,
        hasVoted,
        refunded,
        votingPower: tokenBalance,
      };
      
      setUserInfo(user);
      console.log('User info fetched:', user);
      
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  }, [publicClient, daoAddress, userAddress]);
  
  // 註冊為志願者
  const registerAsVolunteer = async (name: string, description: string) => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }
    
    try {
      setIsLoading(true);
      
      // 使用空的 bytes 數據作為憑證，略過實際的驗證流程
      // 在正式環境中，這裡應該調用 Self Protocol 相關的方法獲取有效憑證
      const emptyCredentials = "0x"; // 使用空憑證
      
      console.log('提交志願者註冊交易，姓名:', name);
      const txHash = await sendContractTransaction({
        abi: EventDAOABI,
        functionName: 'registerAsVolunteer', // 修正函數名
        args: [name, description, emptyCredentials], // 添加憑證參數
        to: daoAddress,
      });
      
      console.log('志願者註冊已提交，txHash:', txHash);
      
      // 不立即刷新數據，而是先返回交易哈希
      // 讓用戶界面可以響應，後續會通過計時器獲取更新
      
      // 設置計時器，延遲獲取數據，給交易確認留出時間
      setTimeout(async () => {
        console.log('開始更新志願者註冊後的數據');
        try {
          // 先獲取 DAO 基本信息 (包括最新的志願者數量)
          await fetchDAOInfo().catch(e => console.error('Error updating DAO info after registration:', e));
          
          // 然後更新志願者列表
          await fetchVolunteers().catch(e => console.error('Error updating volunteers after registration:', e));
          
          // 最後更新用戶信息 (確認用戶已經是志願者)
          await fetchUserInfo().catch(e => console.error('Error updating user info after registration:', e));
          
          console.log('志願者註冊後數據更新完成');
        } catch (err) {
          console.error('Error refreshing data after volunteer registration:', err);
        }
      }, 5000); // 給交易 5 秒時間確認
      
      return txHash;
    } catch (err) {
      console.error('註冊志願者出錯:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 批准志願者
  const approveVolunteer = async (volunteerIndex: number) => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }
    
    try {
      setIsLoading(true);
      
      const txHash = await sendContractTransaction({
        abi: EventDAOABI,
        functionName: 'approveVolunteer',
        args: [volunteerIndex],
        to: daoAddress,
      });
      
      console.log('Volunteer approved, txHash:', txHash);
      
      // 重新獲取數據
      await fetchVolunteers();
      
      return txHash;
    } catch (err) {
      console.error('Error approving volunteer:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 捐款
  const donate = async (amount: bigint) => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }
    
    try {
      setIsLoading(true);
      
      // 先授權 DAO 合約使用 USDC
      const usdcAddress = CHAIN_CONFIG[DEFAULT_CHAIN as keyof typeof CHAIN_CONFIG].contracts.usdcToken;
      
      console.log('開始 USDC 授權...');
      const approvalTxHash = await sendContractTransaction({
        abi: [
          {
            "inputs": [
              {
                "internalType": "address",
                "name": "spender",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "approve",
            "outputs": [
              {
                "internalType": "bool",
                "name": "",
                "type": "bool"
              }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'approve',
        args: [daoAddress as `0x${string}`, amount],
        to: usdcAddress,
      });
      
      console.log('USDC approval submitted, txHash:', approvalTxHash);
      
      // 等待短暫時間，確保授權交易被網絡處理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('開始捐款交易...');
      // 然後捐款
      const donationTxHash = await sendContractTransaction({
        abi: EventDAOABI,
        functionName: 'donate',
        args: [amount],
        to: daoAddress,
      });
      
      console.log('Donation submitted, txHash:', donationTxHash);
      
      // 不立即獲取數據，而是先返回交易哈希，讓用戶界面可以響應
      return donationTxHash;
    } catch (err) {
      console.error('Error donating:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 投票
  const vote = async (volunteerIndex: number) => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }
    
    try {
      setIsLoading(true);
      
      const txHash = await sendContractTransaction({
        abi: EventDAOABI,
        functionName: 'vote',
        args: [volunteerIndex],
        to: daoAddress,
      });
      
      console.log('Vote submitted, txHash:', txHash);
      
      // 更新本地投票狀態，提供即時反饋
      if (userInfo) {
        // 複製當前志願者列表以便更新
        const updatedVolunteers = [...volunteers];
        if (updatedVolunteers[volunteerIndex]) {
          // 將用戶的投票權加到志願者票數上
          const userVotingPower = formatVotes(userInfo.votingPower); 
          updatedVolunteers[volunteerIndex] = {
            ...updatedVolunteers[volunteerIndex],
            votes: updatedVolunteers[volunteerIndex].votes + userVotingPower
          };
          setVolunteers(updatedVolunteers);
        }
        
        // 更新用戶狀態為已投票
        setUserInfo({
          ...userInfo,
          hasVoted: true
        });
      }
      
      // 等待一定時間後重新獲取數據，確保區塊鏈數據同步
      setTimeout(async () => {
        await fetchVolunteers();
        await fetchUserInfo();
      }, 3000);
      
      return txHash;
    } catch (err) {
      console.error('Error voting:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 結束選舉
  const concludeElection = async () => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }
    
    try {
      setIsLoading(true);
      
      const txHash = await sendContractTransaction({
        abi: EventDAOABI,
        functionName: 'concludeElection',
        args: [],
        to: daoAddress,
      });
      
      console.log('Election concluded, txHash:', txHash);
      
      // 重新獲取數據
      await fetchDAOInfo();
      
      return txHash;
    } catch (err) {
      console.error('Error concluding election:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 分配資金
  const distributeFunds = async () => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }
    
    try {
      setIsLoading(true);
      
      const txHash = await sendContractTransaction({
        abi: EventDAOABI,
        functionName: 'distributeFunds',
        args: [],
        to: daoAddress,
      });
      
      console.log('Funds distributed, txHash:', txHash);
      
      // 重新獲取數據
      await fetchDAOInfo();
      
      return txHash;
    } catch (err) {
      console.error('Error distributing funds:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 獲取退款
  const claimRefund = async () => {
    if (!nexusClient) {
      throw new Error('Nexus client not initialized');
    }
    
    try {
      setIsLoading(true);
      
      const txHash = await sendContractTransaction({
        abi: EventDAOABI,
        functionName: 'claimRefund',
        args: [],
        to: daoAddress,
      });
      
      console.log('Refund claimed, txHash:', txHash);
      
      // 重新獲取數據
      await fetchUserInfo();
      
      return txHash;
    } catch (err) {
      console.error('Error claiming refund:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 重新獲取數據
  const refreshData = useCallback(async () => {
    try {
      console.log('刷新 DAO 資料中...');
      await fetchDAOInfo().catch(err => console.error('Error fetching DAO info:', err));
      await fetchVolunteers().catch(err => console.error('Error fetching volunteers:', err));
      if (userAddress) {
        await fetchUserInfo().catch(err => console.error('Error fetching user info:', err));
      }
      console.log('DAO 資料刷新完成');
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [fetchDAOInfo, fetchVolunteers, fetchUserInfo, userAddress]);
  
  // 初始化時獲取數據
  useEffect(() => {
    fetchDAOInfo();
    
    // 添加定期自動刷新，每 60 秒刷新一次
    const intervalId = setInterval(() => {
      console.log('定期刷新 DAO 資料 (60秒間隔)');
      fetchDAOInfo().catch(err => console.error('Error auto refreshing DAO info:', err));
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [fetchDAOInfo]);
  
  // 當獲取 DAO 信息完成後，獲取志願者信息
  useEffect(() => {
    if (daoInfo) {
      // 只要有 daoInfo，就嘗試獲取志願者信息，不再限制 volunteersCount > 0
      // 這樣即使是空列表也會更新
      console.log('DAO info updated, fetching volunteers...');
      fetchVolunteers();
    }
  }, [daoInfo, fetchVolunteers]);
  
  // 當用戶地址變化時，獲取用戶信息
  useEffect(() => {
    if (userAddress) {
      fetchUserInfo();
    }
  }, [userAddress, fetchUserInfo]);
  
  // 新增格式化票數的輔助函數 (在 useEventDAO hook 內部)
  const formatVotes = (votes: bigint): number => {
    // 假設投票權是以 18 位小數表示的代幣
    // 將其轉換為更易讀的數字，例如顯示為整數
    try {
      // 將 BigInt 轉換為顯示兩位小數的數字
      const divisor = BigInt(10 ** 16); // 除以 10^16 得到兩位小數
      const integerPart = Number(votes / BigInt(10 ** 18));
      const decimalPart = Number((votes % BigInt(10 ** 18)) / divisor) / 100;
      return integerPart + decimalPart;
    } catch (err) {
      console.error('格式化票數錯誤:', err);
      return 0;
    }
  };
  
  return {
    daoInfo,
    userInfo,
    volunteers,
    isLoading: isLoading || clientLoading,
    error: error || clientError,
    registerAsVolunteer,
    approveVolunteer,
    donate,
    vote,
    concludeElection,
    distributeFunds,
    claimRefund,
    refreshData,
  };
}; 