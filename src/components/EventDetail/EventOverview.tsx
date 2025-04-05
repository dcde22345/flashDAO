import React from 'react';

interface EventOverviewProps {
  description: string;
  tokenName: string;
  tokenSymbol: string;
  isConnected: boolean;
  onRegisterVolunteer: () => void;
  onDonate: () => void;
}

export default function EventOverview({
  description,
  tokenName,
  tokenSymbol,
  isConnected,
  onRegisterVolunteer,
  onDonate,
}: EventOverviewProps) {
  return (
    <div>
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">事件描述</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">如何運作</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">1</div>
            <p className="text-gray-700">志願者註冊參與救援活動，並提出他們的資金使用計劃。</p>
          </div>
          <div className="flex items-start">
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">2</div>
            <p className="text-gray-700">捐款人捐款並獲得治理代幣，用於投票選擇志願者。</p>
          </div>
          <div className="flex items-start">
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">3</div>
            <p className="text-gray-700">獲得最多票數的志願者將獲得所有捐款資金，用於執行他們的救援計劃。</p>
          </div>
          <div className="flex items-start">
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">4</div>
            <p className="text-gray-700">事件結束後，資金會自動轉移給獲勝的志願者。如果沒有志願者獲勝，捐款將按比例退還。</p>
          </div>
        </div>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">代幣信息</h2>
        <p className="text-gray-600 mb-4">捐款後您將獲得治理代幣，用於投票選擇最適合的志願者。代幣數量按照對數曲線計算，意味著較小金額的捐款者也能獲得有意義的投票權。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">代幣名稱</p>
            <p className="font-medium">{tokenName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">代幣符號</p>
            <p className="font-medium">{tokenSymbol}</p>
          </div>
        </div>
      </div>
      
      {isConnected && (
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={onRegisterVolunteer} className="btn btn-secondary">
            註冊為志願者
          </button>
          <button onClick={onDonate} className="btn btn-primary">
            捐款支持
          </button>
        </div>
      )}
    </div>
  );
} 