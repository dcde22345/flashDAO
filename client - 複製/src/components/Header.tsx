"use client";

// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import "../app/styles/Header.css";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

// 定義以太坊窗口接口擴展
interface WindowWithEthereum extends Window {
  ethereum?: {
    request: (args: { method: string }) => Promise<string[]>;
  };
}

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // 確保組件已掛載（客戶端渲染）
  useEffect(() => {
    setIsMounted(true);
    checkIfWalletIsConnected();
  }, []);

  // 檢查錢包是否已連接
  const checkIfWalletIsConnected = async () => {
    try {
      const windowWithEthereum = window as WindowWithEthereum;
      if (windowWithEthereum.ethereum) {
        // 檢查是否已授權連接
        const accounts = await windowWithEthereum.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  // 連接錢包功能
  const connectWallet = async () => {
    try {
      const windowWithEthereum = window as WindowWithEthereum;
      if (windowWithEthereum.ethereum) {
        const accounts = await windowWithEthereum.ethereum.request({
          method: "eth_requestAccounts",
        });
        setIsConnected(true);
        setWalletAddress(accounts[0]);
      } else {
        alert("Please install MetaMask to connect your wallet");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  // 如果組件尚未掛載，返回預渲染狀態
  if (!isMounted) {
    return (
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Link href="/">
                <img src="/images/logo.svg" alt="FlashDAO" />
              </Link>
            </div>

            <nav className="main-nav">
              <ul>
                <li>
                  <Link href="/projects">Browse DAOs</Link>
                </li>
                <li>
                  <Link href="/volunteer">Become a Volunteer</Link>
                </li>
                <li>
                  <Link href="/about">About Us</Link>
                </li>
                <li>
                  <Link href="/how-it-works">How It Works</Link>
                </li>
              </ul>
            </nav>

            <div className="header-actions">
              <Button className="wallet-button" variant="outline" disabled>
                <Wallet className="mr-2 h-4 w-4" />
                <span>Connect Wallet</span>
              </Button>
              <Link href="/projects" className="btn btn-primary">
                Contribute
              </Link>
            </div>

            <button className="mobile-menu-toggle">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link href="/">
              <img src="/images/logo.svg" alt="FlashDAO" />
            </Link>
          </div>

          <nav className={`main-nav ${mobileMenuOpen ? "active" : ""}`}>
            <ul>
              <li>
                <Link href="/projects">Browse DAOs</Link>
              </li>
              <li>
                <Link href="/volunteer">Become a Volunteer</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/how-it-works">How It Works</Link>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            {!isConnected ? (
              <Button
                onClick={connectWallet}
                className="wallet-button"
                variant="outline"
              >
                <Wallet className="mr-2 h-4 w-4" />
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <Button className="wallet-connected" variant="outline">
                <Wallet className="mr-2 h-4 w-4" />
                <span>
                  {walletAddress.substring(0, 6)}...
                  {walletAddress.substring(walletAddress.length - 4)}
                </span>
              </Button>
            )}
            <Link href="/projects" className="btn btn-primary">
              Contribute
            </Link>
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
