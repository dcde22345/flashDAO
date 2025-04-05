'use client';

import { useState } from 'react';
import { useNexusClient } from '@/hooks/useNexusClient';

export function GaslessTransaction() {
  const { nexusClient, isLoading, error, sendGaslessTransaction } = useNexusClient();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [data, setData] = useState('0x');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [showFullAddresses, setShowFullAddresses] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // 複製到剪貼板
  const copyToClipboard = (text: string, isTxHash = false) => {
    navigator.clipboard.writeText(text).then(() => {
      if (isTxHash) {
        setCopiedTxHash(true);
        setTimeout(() => setCopiedTxHash(false), 2000);
      } else {
        setCopiedAddress(text);
        setTimeout(() => setCopiedAddress(null), 2000);
      }
    });
  };

  // 格式化地址顯示
  const formatAddress = (address: string, full: boolean) => {
    if (full) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 處理發送交易
  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxHash(null);
    setTxError(null);

    if (!nexusClient) {
      setTxError('Nexus 客戶端未初始化，請先選擇網絡');
      return;
    }

    if (!recipientAddress || !recipientAddress.startsWith('0x')) {
      setTxError('請輸入有效的收件人地址');
      return;
    }

    try {
      // 將金額轉換為 bigint (wei)
      const valueBigInt = amount ? BigInt(Math.floor(parseFloat(amount) * 1e18)) : BigInt(0);
      
      // 發送交易
      const hash = await sendGaslessTransaction(recipientAddress, valueBigInt, data);
      setTxHash(hash);
    } catch (error) {
      console.error('交易發送錯誤:', error);
      setTxError(error instanceof Error ? error.message : '發送交易時發生未知錯誤');
    }
  };

  if (!nexusClient) {
    return (
      <div className="p-4 rounded border-gray-200 shadow-sm bg-white">
        <h2 className="text-xl font-bold mb-2">無 Gas 費交易</h2>
        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-700">
          請先連接錢包並選擇網絡
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded border-gray-200 shadow-sm bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">無 Gas 費交易</h2>
        <button
          onClick={() => setShowFullAddresses(!showFullAddresses)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
        >
          {showFullAddresses ? '簡化地址' : '顯示完整地址'}
        </button>
      </div>
      
      {/* 發送者地址信息 */}
      <div className="mb-6 bg-blue-50 p-3 rounded border border-blue-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-blue-700">發送者信息</h3>
          <button
            onClick={() => copyToClipboard(nexusClient.account.address)}
            className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded text-blue-800"
          >
            {copiedAddress === nexusClient.account.address ? '已複製!' : '複製地址'}
          </button>
        </div>
        <div className="bg-white border border-blue-100 p-2 rounded">
          <p className="text-xs text-blue-800 font-medium mb-1">智能賬戶地址:</p>
          <code className="block bg-blue-50 p-2 rounded text-xs overflow-auto break-all">
            {formatAddress(nexusClient.account.address, showFullAddresses)}
          </code>
        </div>
      </div>
      
      {/* 交易表單 */}
      <form onSubmit={handleSendTransaction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">收件人地址</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">金額 (ETH)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000001"
            min="0"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">數據 (可選)</label>
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="0x"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 w-full"
        >
          {isLoading ? '處理中...' : '發送交易'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 bg-red-50 text-red-500 p-2 rounded text-sm">
          客戶端錯誤: {error.message}
        </div>
      )}
      
      {txError && (
        <div className="mt-4 bg-red-50 text-red-500 p-2 rounded text-sm">
          交易錯誤: {txError}
        </div>
      )}
      
      {txHash && (
        <div className="mt-4 bg-green-50 p-3 rounded border border-green-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-green-700">交易已提交!</h3>
            <button
              onClick={() => copyToClipboard(txHash, true)}
              className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded text-green-800"
            >
              {copiedTxHash ? '已複製!' : '複製交易哈希'}
            </button>
          </div>
          <div className="bg-white border border-green-100 p-2 rounded">
            <p className="text-xs text-green-800 font-medium mb-1">交易哈希:</p>
            <code className="block bg-green-50 p-2 rounded text-xs overflow-auto break-all">
              {txHash}
            </code>
          </div>
          <p className="mt-2 text-xs text-green-600">
            您可以在區塊瀏覽器中查看此交易的狀態。
          </p>
        </div>
      )}
    </div>
  );
} 