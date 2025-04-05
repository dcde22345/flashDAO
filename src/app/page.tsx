"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Shield, Heart, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import "./styles/HomePage.css";
import "./styles/DonateModal.css";

// Example disaster/event data
const exampleEarthquakeEvent = {
  type: "Earthquake",
  name: "Hualien Earthquake",
  description:
    "A magnitude 7.2 earthquake hit Hualien County, causing significant damage to infrastructure and displacing thousands of residents.",
  severity: 8,
  location: "Hualien County, Taiwan",
  date: new Date().toISOString(),
};

export default function HomePage() {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponseId, setCurrentResponseId] = useState<number | null>(
    null
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 監聽點擊模態框外的事件
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowDonateModal(false);
      }
    }

    if (showDonateModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDonateModal]);

  // 處理預設金額的點擊
  const handlePresetClick = (amount: string) => {
    setSelectedPreset(amount);
    setDonationAmount(amount);
  };

  // 處理捐款
  const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error("請輸入有效的捐款金額");
      return;
    }

    setIsProcessing(true);

    try {
      // 僅模擬交易過程，不實際打開錢包或轉賬
      toast.info(`準備處理 ${donationAmount} USDTC 的捐贈`);

      // 延遲一秒模擬處理過程
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`成功捐贈 ${donationAmount} USDTC!`);

      // 延遲一秒後導航到志願者頁面
      setTimeout(() => {
        router.push("/volunteer");
      }, 1000);
    } catch (error) {
      console.error("捐款處理錯誤:", error);
      toast.error("捐款處理過程中發生錯誤");
      setIsProcessing(false);
    }
  };

  // 捐款模態框組件
  const DonateModal = () => {
    if (!showDonateModal) return null;

    return (
      <div className="donate-modal-overlay">
        <div className="donate-modal-container" ref={modalRef}>
          {isProcessing && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p className="loading-text">模擬捐贈處理中，請稍候...</p>
            </div>
          )}

          <div className="donate-modal-header">
            <h2 className="donate-modal-title">支持緊急響應</h2>
            <p className="donate-modal-description">
              這是演示模式，您的捐款將模擬用於
              {currentResponseId
                ? activeResponses.find((r) => r.id === currentResponseId)?.name
                : "緊急災害"}
              的救援工作
            </p>
            <button
              className="donate-modal-close"
              onClick={() => setShowDonateModal(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="donate-modal-content">
            <div className="amount-input-container">
              <label className="amount-input-label">捐款金額</label>
              <div className="amount-input-wrapper">
                <input
                  type="number"
                  className="amount-input"
                  value={donationAmount}
                  onChange={(e) => {
                    setDonationAmount(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <span className="currency-label">USDTC</span>
              </div>

              <div className="preset-amounts">
                <button
                  className={`preset-amount-btn ${
                    selectedPreset === "10" ? "active" : ""
                  }`}
                  onClick={() => handlePresetClick("10")}
                >
                  10
                </button>
                <button
                  className={`preset-amount-btn ${
                    selectedPreset === "25" ? "active" : ""
                  }`}
                  onClick={() => handlePresetClick("25")}
                >
                  25
                </button>
                <button
                  className={`preset-amount-btn ${
                    selectedPreset === "50" ? "active" : ""
                  }`}
                  onClick={() => handlePresetClick("50")}
                >
                  50
                </button>
                <button
                  className={`preset-amount-btn ${
                    selectedPreset === "100" ? "active" : ""
                  }`}
                  onClick={() => handlePresetClick("100")}
                >
                  100
                </button>
              </div>
            </div>
          </div>

          <div className="donation-buttons">
            <button
              className="cancel-button"
              onClick={() => setShowDonateModal(false)}
              disabled={isProcessing}
            >
              取消
            </button>
            <button
              className="donate-button"
              onClick={handleDonate}
              disabled={
                isProcessing ||
                !donationAmount ||
                parseFloat(donationAmount) <= 0
              }
            >
              立即捐贈
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Active emergency responses
  const activeResponses = [
    {
      id: 1,
      name: exampleEarthquakeEvent.name,
      description: exampleEarthquakeEvent.description,
      raised: "561 USDTC",
      participants: 129,
      image: "/images/disasters/hualien_earthquake.svg",
      location: exampleEarthquakeEvent.location,
      eventType: exampleEarthquakeEvent.type,
      severity: exampleEarthquakeEvent.severity,
    },
  ];

  return (
    <main className="flex flex-col min-h-screen">
      {/* 捐款模態框 */}
      <DonateModal />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">FlashDAO</h1>
              <p className="hero-subtitle">
                Global emergencies could self-organize resources and talent
                across borders within seconds — without governments, NGOs, or
                intermediaries.
              </p>
              {/* <div className="hero-buttons">
                <Button
                  className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-6 text-lg rounded-lg font-semibold"
                  onClick={() => (window.location.href = "/projects")}
                >
                  View Emergency Responses
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
              </div> */}
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
                  Active Emergency Responses
                </p>
                <p className="text-3xl font-bold text-blue-900">3 Events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured DAOs */}
      <section className="featured-daos">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Active Emergency Responses</h2>
            <Link href="/projects" className="view-all">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="dao-grid">
            {activeResponses.map((response) => (
              <div key={response.id} className="dao-card">
                <div className="dao-image">
                  <Image
                    src={response.image}
                    alt={response.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="dao-content">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="dao-title">{response.name}</h3>
                    <span className="event-type">{response.eventType}</span>
                  </div>
                  <p className="dao-location mb-2">
                    <span className="text-gray-500">Location:</span>{" "}
                    {response.location}
                  </p>
                  <p className="dao-description">{response.description}</p>
                  <div className="dao-stats">
                    <div className="dao-stat">
                      <span className="dao-stat-label">Raised</span>
                      <span className="dao-stat-value">{response.raised}</span>
                    </div>
                    <div className="dao-stat">
                      <span className="dao-stat-label">Participants</span>
                      <span className="dao-stat-value">
                        {response.participants}
                      </span>
                    </div>
                    <div className="dao-stat">
                      <span className="dao-stat-label">Severity</span>
                      <span className="dao-stat-value">
                        {response.severity}/10
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setCurrentResponseId(response.id);
                      setShowDonateModal(true);
                    }}
                  >
                    Respond
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
                Link your cryptocurrency wallet for instant response to
                emergency situations.
              </p>
            </div>
            <div className="step">
              <div className="step-icon">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="step-title">Support Emergency Response</h3>
              <p className="step-description">
                Choose which emergency situations to support with direct funding
                and resources.
              </p>
            </div>
            <div className="step">
              <div className="step-icon">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="step-title">Track Real-Time Impact</h3>
              <p className="step-description">
                See in real-time how resources are deployed across borders
                during emergencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="trust-signals">
        <div className="container">
          <div className="trust-header">
            <h2 className="trust-title">Why Choose FlashDAO</h2>
            <p className="trust-subtitle">
              We&apos;ve built a secure platform for self-organizing resources
              and talent during global emergencies.
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
              onClick={() => {
                setCurrentResponseId(null);
                setShowDonateModal(true);
              }}
            >
              Respond Now
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
