'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useChain } from '@/context/RoleContext';
import { useNexusClient } from '@/hooks/useNexusClient';

export function WalletConnector() {
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { selectedChain, setSelectedChain } = useChain();
  const { nexusClient, isLoading, error } = useNexusClient();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [showFullAddresses, setShowFullAddresses] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // 在 nexusClient 變更時獲取智能賬戶地址
  useEffect(() => {
    if (nexusClient) {
      setSmartAccountAddress(nexusClient.account.address);
    } else {
      setSmartAccountAddress(null);
    }
  }, [nexusClient]);

  // 處理鏈選擇變更
  const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chain = e.target.value === '' ? null : e.target.value as 'ethereum' | 'base' | 'avalanche' | 'linea';
    setSelectedChain(chain);
  };

  // 複製地址到剪貼板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };

  // 格式化地址顯示
  const formatAddress = (address: string, full: boolean) => {
    if (full) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!authenticated) {
    return (
      <div className="p-4 rounded border-gray-200 shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-4">連接錢包</h2>
        <button
          onClick={login}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          使用 Privy 登入
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded border-gray-200 shadow-sm bg-white space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">錢包已連接</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullAddresses(!showFullAddresses)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
          >
            {showFullAddresses ? '簡化地址' : '顯示完整地址'}
          </button>
          <button
            onClick={logout}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            登出
          </button>
        </div>
      </div>

      {user && (
        <div className="text-sm">
          <p className="font-medium">使用者: {user.email?.address || '未知使用者'}</p>
        </div>
      )}

      {wallets.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-indigo-700">已連接錢包:</h3>
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <div key={wallet.address} className="bg-gray-50 p-2 rounded border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{wallet.walletClientType} 錢包:</span>
                  <button
                    onClick={() => copyToClipboard(wallet.address)}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  >
                    {copiedAddress === wallet.address ? '已複製!' : '複製'}
                  </button>
                </div>
                <code className="block bg-gray-100 p-2 rounded text-xs overflow-auto break-all">
                  {formatAddress(wallet.address, showFullAddresses)}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-medium">選擇網絡:</h3>
        <select
          value={selectedChain || ''}
          onChange={handleChainChange}
          className="w-full p-2 border rounded"
        >
          <option value="">請選擇網絡</option>
          <option value="ethereum">Ethereum (Sepolia)</option>
          <option value="base">Base (Sepolia)</option>
          <option value="avalanche">Avalanche (Fuji)</option>
          <option value="linea">Linea (Testnet)</option>
        </select>
      </div>

      {isLoading && (
        <div className="bg-blue-50 p-2 rounded flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-blue-600">智能賬戶載入中...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-2 rounded text-sm">
          錯誤: {error.message}
        </div>
      )}

      {smartAccountAddress && (
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-green-700">智能賬戶已創建!</h3>
            <button
              onClick={() => copyToClipboard(smartAccountAddress)}
              className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded text-green-800"
            >
              {copiedAddress === smartAccountAddress ? '已複製!' : '複製地址'}
            </button>
          </div>
          <div className="bg-white border border-green-100 p-2 rounded">
            <p className="text-xs text-green-800 font-medium mb-1">智能賬戶地址:</p>
            <code className="block bg-green-50 p-2 rounded text-xs overflow-auto break-all">
              {formatAddress(smartAccountAddress, showFullAddresses)}
            </code>
          </div>
          <p className="mt-2 text-xs text-green-600">
            這是您的 Biconomy 智能賬戶，您可以使用它來發送無 Gas 費交易。
          </p>
        </div>
      )}
    </div>
  );
} 