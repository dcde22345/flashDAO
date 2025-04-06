'use client';

import { useTokens } from "@/context/TokenContext";
import { Coins } from "lucide-react";

export function TokenDisplay({ className = "" }: { className?: string }) {
  const { tokenBalance } = useTokens();
  
  if (tokenBalance <= 0) {
    return null;
  }
  
  return (
    <div className={`flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md ${className}`}>
      <Coins className="w-4 h-4 mr-1.5 text-blue-500" />
      <span className="font-medium">{tokenBalance} DAO</span>
    </div>
  );
} 