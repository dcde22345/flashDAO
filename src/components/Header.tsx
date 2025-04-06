"use client";

// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import "../app/styles/Header.css";
import { WalletButton } from "./WalletButton";

// 定義以太坊窗口接口擴展
interface WindowWithEthereum extends Window {
  ethereum?: {
    request: (args: { method: string }) => Promise<string[]>;
  };
}

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 確保組件已掛載（客戶端渲染）
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
              <WalletButton variant="outline" showAddress={true} />
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
              <img src="/images/daos/dog.png" alt="FlashDAO" />
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
            <WalletButton variant="outline" showAddress={true} />
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
