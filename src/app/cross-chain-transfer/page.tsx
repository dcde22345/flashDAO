"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeftRight, ExternalLink, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../styles/CCTPSimulation.css";
import { useRouter } from "next/navigation";

// 鏈信息
const chains = [
  {
    id: "ethereum",
    name: "Ethereum Sepolia",
    logo: "/images/chains/ethereum.svg",
    explorerUrl: "https://sepolia.etherscan.io/tx/",
  },
  {
    id: "base",
    name: "Base Sepolia",
    logo: "/images/chains/base.svg",
    explorerUrl: "https://sepolia.basescan.org/tx/",
  },
  {
    id: "avalanche",
    name: "Avalanche Fuji",
    logo: "/images/chains/avalanche.svg",
    explorerUrl: "https://testnet.snowtrace.io/tx/",
  },
];

export default function CrossChainTransferPage() {
  const [selectedChain, setSelectedChain] = useState("base");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [txHash, setTxHash] = useState("");
  const router = useRouter();
  // 客戶端渲染標記
  const [isClient, setIsClient] = useState(false);
  
  // 總獎金金額
  const totalFund = 5612.75;
  // 最高票候選人數據
  const winningCandidate = {
    name: "Li Mingqiang",
    votes: 293,
    wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  };

  // 客戶端渲染標記
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 處理跨鏈提款
  const handleWithdraw = async () => {
    setIsProcessing(true);
    
    try {
      // 處理時間
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // 創建交易哈希
      const randomTxHash = '0x' + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      setTxHash(randomTxHash);
      setIsCompleted(true);
      
      toast.success(`Successfully withdrawn funds from ${selectedChain === 'base' ? 'Base Sepolia' : selectedChain === 'avalanche' ? 'Avalanche Fuji' : 'Ethereum Sepolia'}!`, {
        duration: 5000,
      });
    } catch (error) {
      toast.error("An error occurred during the process. Please try again.");
      console.error("Cross-chain operation error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 如果不是客戶端渲染，則返回一個加載占位符
  if (!isClient) {
    return <div className="cctp-container">
      <div className="cctp-header">
        <h1 className="cctp-title">FlashDAO Cross-Chain Fund Transfer</h1>
        <p className="cctp-subtitle">Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="cctp-container">
      {/* 右上角返回按鈕 */}
      <div className="fixed top-6 right-6 z-50">
        <Button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <ArrowLeftRight size={18} />
          <span>Return Home</span>
        </Button>
      </div>

      <div className="cctp-header">
        <h1 className="cctp-title">FlashDAO Cross-Chain Fund Transfer</h1>
        <p className="cctp-subtitle">
          Congratulations <span className="winner-name">{winningCandidate.name}</span> for being the highest-voted volunteer!
          <br />You can choose to withdraw all relief funds through any of the following chains.
        </p>
      </div>

      <div className="cctp-card">
        <div className="card-header">
          <div className="card-title-container">
            <div className="card-icon">
              <ArrowLeftRight size={24} />
            </div>
            <h2 className="card-title">Cross-Chain Fund Transfer</h2>
          </div>
          <p className="card-description">
            Transfer funds to any supported blockchain network
          </p>
        </div>

        <div className="card-content">
          <div className="fund-info">
            <div className="fund-amount">
              <span className="label">Total Fund Amount</span>
              <span className="amount">{totalFund.toLocaleString()} USDC</span>
            </div>
            <div className="wallet-info">
              <span className="label">Recipient Wallet</span>
              <span className="wallet">
                {winningCandidate.wallet.substring(0, 6)}...
                {winningCandidate.wallet.substring(winningCandidate.wallet.length - 4)}
              </span>
            </div>
          </div>

          {!isCompleted ? (
            <>
              <div className="chain-selection">
                <h3 className="selection-title">Select Target Chain</h3>
                <div className="chains-grid">
                  {chains.map((chain) => (
                    <div
                      key={chain.id}
                      className={`chain-option ${selectedChain === chain.id ? 'selected' : ''}`}
                      onClick={() => setSelectedChain(chain.id)}
                    >
                      <div className="chain-logo-container">
                        <Image
                          src={chain.logo}
                          alt={chain.name}
                          width={32}
                          height={32}
                        />
                      </div>
                      <span className="chain-name">{chain.name}</span>
                      {selectedChain === chain.id && (
                        <div className="selection-check">
                          <Check size={18} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="withdraw-button"
                onClick={handleWithdraw}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>Transfer Funds to {selectedChain === 'base' ? 'Base Sepolia' : selectedChain === 'avalanche' ? 'Avalanche Fuji' : 'Ethereum Sepolia'}</>
                )}
              </Button>
            </>
          ) : (
            <div className="success-container">
              <div className="success-icon">
                <Check size={48} className="text-green-500" />
              </div>
              <h3 className="success-title">Fund Transfer Successful!</h3>
              <p className="success-message">
                You have successfully transferred {totalFund.toLocaleString()} USDC to {selectedChain === 'base' ? 'Base Sepolia' : selectedChain === 'avalanche' ? 'Avalanche Fuji' : 'Ethereum Sepolia'}.
              </p>
              <div className="transaction-details">
                <p className="tx-info">Transaction Hash:</p>
                <div className="tx-hash-container">
                  <code className="tx-hash">{txHash}</code>
                  <Link 
                    href={`${chains.find(c => c.id === selectedChain)?.explorerUrl}${txHash}`} 
                    target="_blank" 
                    className="explorer-link"
                  >
                    <ExternalLink size={16} />
                    <span>View Transaction</span>
                  </Link>
                </div>
              </div>
              <Link href="/volunteer">
                <Button className="back-button">
                  Return to Volunteer Page
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 