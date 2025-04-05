"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus, Vote, X } from "lucide-react";
import SelfQRcodeWrapper, { SelfAppBuilder } from "@selfxyz/qrcode";
import { v4 as uuidv4 } from "uuid";
import "../styles/VolunteerPage.css";

export default function VolunteerPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [hasDonated, setHasDonated] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

    // Check if user came from donation
    const checkDonation = () => {
      // 如果是從主頁的捐款模態框跳轉過來，顯示感謝信息
      const referrer = document.referrer;
      if (referrer.includes("/") && !hasDonated) {
        setHasDonated(true);
        toast.success("感謝您的捐款支持！您現在可以參與DAO的治理。", {
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

  // Create the SelfApp configuration - make sure this runs only on client side
  const generateSelfApp = () => {
    if (typeof window === "undefined" || !userId) return undefined;

    try {
      return new SelfAppBuilder({
        appName: "FlashDAO Volunteer",
        scope: "flashdao-volunteer-verification",
        endpoint: "https://9aaa-111-235-226-130.ngrok-free.app/api/verify",
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

  // Custom Modal for Identity Verification
  const VerificationModal = () => {
    if (!showVerifyModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-container" ref={modalRef}>
          <div className="modal-header">
            <h2 className="modal-title">Identity Verification</h2>
            <p className="modal-description">
              Please verify your identity using Self app
            </p>
            <button
              className="modal-close"
              onClick={() => setShowVerifyModal(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="modal-content">
            <div className="verification-container">
              <p className="text-center mb-4">
                Scan this QR code with the Self app to verify your identity
              </p>

              <div className="qr-code-wrapper">
                {typeof window !== "undefined" && (
                  <SelfQRcodeWrapper
                    // @ts-expect-error - SelfAppBuilder 類型兼容性問題
                    selfApp={generateSelfApp()}
                    onSuccess={() => {
                      // Handle successful verification
                      console.log("Verification successful!");
                      setIsVerified(true);
                      toast.success("Identity verification successful");
                    }}
                    size={250}
                  />
                )}
              </div>

              <p className="text-sm text-gray-500 text-center mt-2">
                Verification ID: {userId?.substring(0, 8)}...
              </p>

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
            <h2 className="modal-title">選擇您支持的候選人</h2>
            <p className="modal-description">
              以下候選人按照獲得的支持票數排序，總計 {totalVotes} DAO
            </p>
            <button
              className="modal-close"
              onClick={() => setShowVoteModal(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="modal-content">
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
                    <Button
                      className="candidate-vote-button"
                      onClick={() => {
                        // 增加投票數
                        setCandidates(
                          candidates.map((c) =>
                            c.name === candidate.name
                              ? { ...c, votes: c.votes + 1 }
                              : c
                          )
                        );
                        setHasVoted(true);
                        toast.success(`您已成功投票給 ${candidate.name} 🎉`);
                        setShowVoteModal(false);
                      }}
                    >
                      投票
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="volunteer-container">
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
              <h2 className="card-title">為候選人投票</h2>
            </div>
            <p className="card-description">
              通過投票選出值得信任的志願者，協助資金分配與救災行動
            </p>
          </div>
          <div className="card-content">
            <ul className="requirements-list">
              <li>目前共有 {candidates.length} 名候選人</li>
              <li>
                總計{" "}
                {candidates.reduce(
                  (sum, candidate) => sum + candidate.votes,
                  0
                )}{" "}
                DAO 已參與投票
              </li>
              <li>
                排名第一的候選人:{" "}
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
            </ul>
            <Button
              className="action-button vote-button"
              onClick={() => setShowVoteModal(true)}
              disabled={hasVoted}
            >
              {hasVoted ? "您已投票" : "查看候選人並投票"}
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
