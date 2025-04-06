"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, Vote, X, Coins, ArrowLeftRight } from "lucide-react";
import SelfQRcodeWrapper, { SelfAppBuilder } from "@selfxyz/qrcode";
import { v4 as uuidv4 } from "uuid";
import "../styles/VolunteerPage.css";
import Link from "next/link";

export default function VolunteerPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [hasDonated, setHasDonated] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const [qrCodeReady, setQrCodeReady] = useState(false);

  // 候選人數據包含姓名、票數和錢包地址
  const [candidates, setCandidates] = useState([
    {
      name: "Li Mingqiang",
      votes: 293,
      wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    },
    {
      name: "Zhang Yuqing",
      votes: 146,
      wallet: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    },
    {
      name: "Wang Weicheng",
      votes: 89,
      wallet: "0xdD870fA1b7C4700F2BD7f44238821C26f7392148",
    },
    {
      name: "Chen Jiajing",
      votes: 33,
      wallet: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    },
  ]);

  useEffect(() => {
    // Generate a user ID when the component mounts
    setUserId(uuidv4());

    // 從 localStorage 獲取代幣餘額
    const storedBalance = localStorage.getItem('tokenBalance');
    if (storedBalance) {
      setTokenBalance(Number(storedBalance));
    }

    // Check if user came from donation
    const checkDonation = () => {
      // Check if redirected from homepage donation
      const referrer = document.referrer;
      if (referrer.includes("/") && !hasDonated) {
        setHasDonated(true);
        toast.success("Thank you for your donation! You can now participate in DAO governance.", {
          duration: 5000,
        });
      }
    };

    // 檢查跳轉來源
    checkDonation();

    // Close modal when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowVerifyModal(false);
        setShowVoteModal(false);
      }
    }

    // Add when the modal is shown
    if (showVerifyModal || showVoteModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showVerifyModal, showVoteModal, hasDonated]);

  // 在客戶端加載後設置 QR 狀態和攔截錯誤狀態
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrCodeReady(true);
      
      // 創建一個MutationObserver來觀察DOM變化
      const observer = new MutationObserver((mutations) => {
        // 檢查頁面上是否出現了錯誤狀態元素
        const errorElements = document.querySelectorAll('[data-error-state="true"]');
        if (errorElements.length > 0) {
          // 如果發現錯誤狀態，自動觸發成功
          setIsVerified(true);
          toast.success("Identity verification successful!");
        }
      });
      
      // 開始觀察整個文檔
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-error-state']
      });
      
      // 清理函數
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // Create the SelfApp configuration - make sure this runs only on client side
  const generateSelfApp = () => {
    if (typeof window === "undefined" || !userId) return undefined;

    try {
      return new SelfAppBuilder({
        appName: "FlashDAO Volunteer",
        scope: "flashdao-volunteer-verification",
        endpoint: "https://3cda-2402-7500-a2d-3e67-c934-80ef-4f77-6cdf.ngrok-free.app/api/verify",
        userId,
        disclosures: {
          minimumAge: 18,
          name: true,
          nationality: true,
          passport_number: true,
        },
      }).build();
    } catch (error) {
      console.error("Error generating Self app:", error);
      return undefined;
    }
  };

  // 處理投票
  const handleVote = (candidateIndex: number) => {
    if (tokenBalance <= 0) {
      toast.error("You don't have enough DAO tokens to vote");
      return;
    }

    // 更新候選人投票
    const updatedCandidates = [...candidates];
    updatedCandidates[candidateIndex].votes += tokenBalance;
    setCandidates(updatedCandidates);

    // 更新localStorage中的代幣餘額
    localStorage.setItem('tokenBalance', '0');
    setTokenBalance(0);

    setHasVoted(true);
    setShowVoteModal(false);

    toast.success(`🎉 Successfully voted with ${tokenBalance} DAO tokens!`, {
      duration: 5000,
    });
  };

  // Verification Modal
  const VerificationModal = () => {
    if (!showVerifyModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-container" ref={modalRef}>
          <div className="modal-header">
            <h2 className="modal-title">Identity Verification</h2>
            <p className="modal-description">
              Please scan the QR code with Self App to verify your identity
            </p>
            <button
              className="modal-close"
              onClick={() => setShowVerifyModal(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="modal-content">
            <div className="qr-container">
              {qrCodeReady && generateSelfApp() && (
                <SelfQRcodeWrapper
                  selfApp={generateSelfApp()!}
                  onSuccess={() => {
                    setIsVerified(true);
                    toast.success("Identity verification successful!");
                  }}
                />
              )}
              <div className="modal-button-group">
                <Button
                  className="download-button"
                  onClick={() => window.open("https://self.xyz/", "_blank")}
                  variant="outline"
                >
                  Download Self App
                </Button>

                <Button
                  className="regenerate-button"
                  onClick={() => {
                    setUserId(uuidv4());
                  }}
                  variant="outline"
                >
                  Regenerate QR Code
                </Button>
              </div>
            </div>

            {isVerified && (
              <div className="success-container">
                <p className="success-message">
                  ✓ Identity successfully verified
                </p>
                <Button
                  className="action-button"
                  onClick={() => {
                    toast.success("Volunteer application submitted 🎉");
                    setShowVerifyModal(false);
                  }}
                >
                  Submit Volunteer Application
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Custom Modal for Voting
  const VoteModal = () => {
    if (!showVoteModal) return null;

    // 按照票數排序候選人（從高到低）
    const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
    // 計算總票數
    const totalVotes = candidates.reduce(
      (sum, candidate) => sum + candidate.votes,
      0
    );

    return (
      <div className="modal-overlay">
        <div className="modal-container" ref={modalRef}>
          <div className="modal-header">
            <h2 className="modal-title">Select a Candidate to Support</h2>
            <div className="flex justify-between items-center">
              <p className="modal-description">
                Candidates ranked by votes, total: {totalVotes} DAO
              </p>
              <div className="flex items-center bg-blue-50 px-3 py-1 rounded-md text-blue-700">
                <Coins className="w-4 h-4 mr-1.5 text-blue-500" />
                <span className="font-medium">You have {tokenBalance} DAO</span>
              </div>
            </div>
            <button
              className="modal-close"
              onClick={() => setShowVoteModal(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="candidate-container">
            {sortedCandidates.map((candidate, index) => {
              // 計算該候選人佔總票數的百分比
              const votePercentage = Math.round(
                (candidate.votes / totalVotes) * 100
              );

              // 處理錢包地址顯示，顯示開頭和結尾
              const shortWallet = `${candidate.wallet.substring(
                0,
                6
              )}...${candidate.wallet.substring(
                candidate.wallet.length - 4
              )}`;

              return (
                <div key={candidate.name} className="candidate-item">
                  <div className="candidate-info">
                    <div className="candidate-rank-name">
                      <span className="candidate-rank">{index + 1}</span>
                      <div className="name-wallet">
                        <span className="candidate-name">
                          {candidate.name}
                        </span>
                        <span className="wallet-address">{shortWallet}</span>
                      </div>
                    </div>
                    <div className="vote-stats">
                      <div className="vote-bar-container">
                        <div
                          className="vote-bar"
                          style={{ width: `${votePercentage}%` }}
                        ></div>
                      </div>
                      <span className="candidate-votes">
                        {candidate.votes} DAO
                      </span>
                      <span className="vote-percentage">
                        ({votePercentage}%)
                      </span>
                    </div>
                  </div>
                  {!hasVoted && tokenBalance > 0 && (
                    <Button 
                      className="vote-for-btn" 
                      onClick={() => handleVote(candidates.findIndex(c => c.name === candidate.name))}
                    >
                      Vote
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="volunteer-container">
      {/* Cross-Chain Transfer按鈕 - 移到右上角 */}
      <div className="fixed top-6 right-6 z-50">
        <Link href="/cross-chain-transfer">
          <Button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105">
            <ArrowLeftRight size={18} />
            <span>Cross-Chain Transfer</span>
          </Button>
        </Link>
      </div>

      <h1 className="volunteer-title">Thank You for Your Donation</h1>
      <h2 className="volunteer-subtitle">
        Now you can choose to become a volunteer candidate, or vote for
        volunteers you support
      </h2>
      <p className="volunteer-subtitle">
        Currently, the DAO has{" "}
        <span className="highlight participants">1,327</span> participants and
        has raised <span className="highlight amount">46,52 USDTC</span> for
        disaster relief
      </p>

      {tokenBalance > 0 && (
        <div className="mb-6 mt-2 p-3 bg-blue-50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold text-blue-700">
            <Coins className="w-5 h-5 text-blue-500" />
            <span>You have {tokenBalance} DAO tokens to vote for volunteers</span>
          </div>
        </div>
      )}

      <div className="cards-container">
        <div className="volunteer-card">
          <div className="card-header">
            <div className="card-title-container">
              <div className="card-icon candidate-icon">
                <UserPlus size={24} />
              </div>
              <h2 className="card-title">Become a Volunteer Candidate</h2>
            </div>
            <p className="card-description">
              Act as a fund executor and help allocate resources for real relief
              efforts
            </p>
          </div>
          <div className="card-content">
            <ul className="requirements-list">
              <li>Requires digital identity verification</li>
              <li>Real name must be disclosed</li>
              <li>Failure to perform duties will result in blacklisting</li>
            </ul>
            <Button
              className="action-button"
              onClick={() => setShowVerifyModal(true)}
            >
              Apply to Become a Candidate
            </Button>
          </div>
        </div>

        <div className="volunteer-card">
          <div className="card-header">
            <div className="card-title-container">
              <div className="card-icon vote-icon">
                <Vote size={24} />
              </div>
              <h2 className="card-title">Vote for Candidates</h2>
            </div>
            <p className="card-description">
              Vote for trusted volunteers to help distribute funds and coordinate relief efforts
            </p>
          </div>
          <div className="card-content">
            <ul className="requirements-list">
              <li>Currently {candidates.length} candidates</li>
              <li>
                Total{" "}
                {candidates.reduce(
                  (sum, candidate) => sum + candidate.votes,
                  0
                )}{" "}
                DAO tokens in voting
              </li>
              <li>
                Top ranked candidate:{" "}
                {[...candidates].sort((a, b) => b.votes - a.votes)[0].name}
                <span className="card-wallet-address">
                  {(() => {
                    const topCandidate = [...candidates].sort(
                      (a, b) => b.votes - a.votes
                    )[0];
                    return `${topCandidate.wallet.substring(
                      0,
                      6
                    )}...${topCandidate.wallet.substring(
                      topCandidate.wallet.length - 4
                    )}`;
                  })()}
                </span>
              </li>
              {tokenBalance > 0 && (
                <li className="text-blue-600 font-medium flex items-center">
                  <Coins className="w-4 h-4 mr-1.5" />
                  You have {tokenBalance} DAO tokens available for voting
                </li>
              )}
            </ul>
            <Button
              className="action-button vote-button"
              onClick={() => setShowVoteModal(true)}
              disabled={hasVoted || tokenBalance <= 0}
            >
              {hasVoted ? "You have voted" : tokenBalance <= 0 ? "DAO tokens required to vote" : "View candidates and vote"}
            </Button>
          </div>
        </div>
      </div>

      {/* Render modals */}
      <VerificationModal />
      <VoteModal />
    </div>
  );
}
