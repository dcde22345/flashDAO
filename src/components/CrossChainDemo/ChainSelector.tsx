import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChainOption, getAvailableDestinationChains, getChainDetails } from '@/services/cctpService';

// 鏈圖標映射
const ChainIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'ethereum':
      return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">E</div>;
    case 'avalanche':
      return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">A</div>;
    case 'base':
      return <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white">B</div>;
    case 'linea':
      return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">L</div>;
    default:
      return <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-700">?</div>;
  }
};

interface ChainSelectorProps {
  onSelect: (chain: ChainOption) => void;
  onCancel: () => void;
  sourceDomainId?: number;
  disabled?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  onSelect,
  onCancel,
  sourceDomainId = 1, // 默認源鏈為Avalanche Fuji
  disabled = false
}) => {
  const availableChains = getAvailableDestinationChains(sourceDomainId);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  
  const handleSubmit = () => {
    if (selectedChainId !== null) {
      const selectedChain = getChainDetails(selectedChainId);
      if (selectedChain) {
        onSelect(selectedChain);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>選擇目標鏈</CardTitle>
        <CardDescription>
          選擇您希望接收資金的區塊鏈網絡
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg border p-3 bg-gray-50">
            <div className="flex items-center space-x-3">
              <ChainIcon type={getChainDetails(sourceDomainId)?.icon || ''} />
              <div>
                <p className="font-medium">{getChainDetails(sourceDomainId)?.name || '未知鏈'}</p>
                <p className="text-xs text-gray-500">當前資金所在鏈 (源鏈)</p>
              </div>
            </div>
          </div>
          
          <RadioGroup value={selectedChainId?.toString()} onValueChange={(value) => setSelectedChainId(parseInt(value))}>
            <div className="space-y-3">
              {availableChains.map((chain) => (
                <div
                  key={chain.id}
                  className={`flex items-center space-x-3 rounded-lg border p-4 hover:border-primary transition-colors ${
                    selectedChainId === chain.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <RadioGroupItem 
                    value={chain.id.toString()} 
                    id={`chain-${chain.id}`} 
                    className="h-5 w-5"
                    disabled={disabled}
                  />
                  <Label 
                    htmlFor={`chain-${chain.id}`} 
                    className="flex flex-1 items-center cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <ChainIcon type={chain.icon} />
                      <div>
                        <p className="font-medium">{chain.name}</p>
                        <p className="text-xs text-gray-500">{chain.description}</p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={disabled}>
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={selectedChainId === null || disabled}
        >
          確認選擇
        </Button>
      </CardFooter>
    </Card>
  );
}; 