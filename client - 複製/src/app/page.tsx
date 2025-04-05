"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Shield, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import "./styles/HomePage.css";

// 定義以太坊窗口接口擴展
interface WindowWithEthereum extends Window {
  ethereum?: {
    request: (args: { method: string }) => Promise<string[]>;
  };
}

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window !== "undefined") {
      const windowWithEthereum = window as WindowWithEthereum;
      if (windowWithEthereum.ethereum) {
        try {
          const accounts = await windowWithEthereum.ethereum.request({
            method: "eth_requestAccounts",
          });
          setIsConnected(true);
          setWalletAddress(accounts[0]);
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        alert("Please install MetaMask to connect your wallet");
      }
    }
  };

  // Top contributing DAOs
  const topDAOs = [
    {
      id: 1,
      name: "FlashDAO",
      description: "Emergency response funding for natural disasters",
      raised: "46.52 USDTC",
      participants: 1327,
      image: "/images/daos/flashdao.svg",
    },
    {
      id: 2,
      name: "EduDAO",
      description: "Supporting educational initiatives in developing regions",
      raised: "28.75 ETH",
      participants: 952,
      image: "/images/daos/edudao.svg",
    },
    {
      id: 3,
      name: "GreenDAO",
      description: "Funding climate action and environmental protection",
      raised: "15.3 ETH",
      participants: 743,
      image: "/images/daos/greendao.svg",
    },
  ];

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Fund the Future with Transparent DAOs
              </h1>
              <p className="hero-subtitle">
                Join a new generation of decentralized organizations making real
                impact through transparent funding.
              </p>
              <div className="hero-buttons">
                <Button
                  className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-6 text-lg rounded-lg font-semibold"
                  onClick={() => (window.location.href = "/projects")}
                >
                  Explore DAOs
                </Button>
                {!isConnected ? (
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-lg font-semibold"
                    onClick={connectWallet}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-lg font-semibold"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    {walletAddress.substring(0, 6)}...
                    {walletAddress.substring(walletAddress.length - 4)}
                  </Button>
                )}
              </div>
            </div>
            <div className="hero-image-container">
              <Image
                src="/images/dao-banner.svg"
                alt="DAO Funding Platform"
                fill
                style={{ objectFit: "cover" }}
                className="rounded-xl"
                priority
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl">
                <p className="text-blue-900 font-semibold">
                  Total raised by DAOs
                </p>
                <p className="text-3xl font-bold text-blue-900">$3.2M+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured DAOs */}
      <section className="featured-daos">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured DAOs</h2>
            <Link href="/projects" className="view-all">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="dao-grid">
            {topDAOs.map((dao) => (
              <div key={dao.id} className="dao-card">
                <div className="dao-image">
                  <Image
                    src={dao.image}
                    alt={dao.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="dao-content">
                  <h3 className="dao-title">{dao.name}</h3>
                  <p className="dao-description">{dao.description}</p>
                  <div className="dao-stats">
                    <div className="dao-stat">
                      <span className="dao-stat-label">Raised</span>
                      <span className="dao-stat-value">{dao.raised}</span>
                    </div>
                    <div className="dao-stat">
                      <span className="dao-stat-label">Participants</span>
                      <span className="dao-stat-value">{dao.participants}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      (window.location.href = `/projects/${dao.id}`)
                    }
                  >
                    Contribute
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title text-center mb-16">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-icon">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="step-title">Connect Your Wallet</h3>
              <p className="step-description">
                Link your cryptocurrency wallet to make secure and transparent
                donations.
              </p>
            </div>
            <div className="step">
              <div className="step-icon">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="step-title">Choose DAOs to Support</h3>
              <p className="step-description">
                Browse active DAOs and select causes that align with your
                values.
              </p>
            </div>
            <div className="step">
              <div className="step-icon">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="step-title">Track Your Impact</h3>
              <p className="step-description">
                Monitor how your contribution is being used with full blockchain
                transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="trust-signals">
        <div className="container">
          <div className="trust-header">
            <h2 className="trust-title">Why Choose Our Platform</h2>
            <p className="trust-subtitle">
              We&apos;ve built a secure, transparent ecosystem for DAO funding
              that you can trust.
            </p>
          </div>

          <div className="trust-grid">
            <div className="trust-card">
              <h3 className="trust-card-title">100% Transparent</h3>
              <p className="trust-card-description">
                All transactions are recorded on the blockchain and publicly
                viewable.
              </p>
            </div>
            <div className="trust-card">
              <h3 className="trust-card-title">Secure Funding</h3>
              <p className="trust-card-description">
                Smart contracts ensure funds are only released when governance
                approves.
              </p>
            </div>
            <div className="trust-card">
              <h3 className="trust-card-title">Community Governed</h3>
              <p className="trust-card-description">
                DAOs are controlled by their members, not by centralized
                authorities.
              </p>
            </div>
            <div className="trust-card">
              <h3 className="trust-card-title">Real Impact</h3>
              <p className="trust-card-description">
                Track exactly how your contributions make a difference in the
                world.
              </p>
            </div>
          </div>

          <div className="cta-container">
            <Button
              className="cta-button"
              onClick={() => (window.location.href = "/projects")}
            >
              Start Contributing Today
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
