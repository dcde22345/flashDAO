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
  const modalRef = useRef<HTMLDivElement>(null);
  const candidates = [
    "Li Mingqiang",
    "Zhang Yuqing",
    "Wang Weicheng",
    "Chen Jiajing",
  ];

  useEffect(() => {
    // Generate a user ID when the component mounts
    setUserId(uuidv4());

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
  }, [showVerifyModal, showVoteModal]);

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

    return (
      <div className="modal-overlay">
        <div className="modal-container" ref={modalRef}>
          <div className="modal-header">
            <h2 className="modal-title">Choose the candidate you support</h2>
            <p className="modal-description">
              Select a volunteer to support with your vote
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
              {candidates.map((name) => (
                <div key={name} className="candidate-item">
                  <span className="candidate-name">{name}</span>
                  <Button
                    className="candidate-vote-button"
                    onClick={() => {
                      setHasVoted(true);
                      toast.success(
                        `You have successfully voted for ${name} 🎉`
                      );
                      setShowVoteModal(false);
                    }}
                  >
                    Vote
                  </Button>
                </div>
              ))}
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
              <h2 className="card-title">Vote for Volunteers</h2>
            </div>
            <p className="card-description">
              Support the volunteers you trust and help shape the DAO direction
            </p>
          </div>
          <div className="card-content">
            <p className="card-description">
              Your contribution gives you voting rights. Number of votes =
              amount donated.
            </p>
            <Button
              className={`action-button ${!hasVoted ? "vote-button" : ""}`}
              disabled={hasVoted}
              onClick={() => setShowVoteModal(true)}
            >
              {hasVoted ? "Voted" : "Start Voting"}
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
