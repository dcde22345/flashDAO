"use client";

import React, { useState, useEffect } from "react";
import SelfQRcodeWrapper, { SelfAppBuilder } from "@selfxyz/qrcode";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";

interface SelfVerificationProps {
  onSuccess?: () => void;
}

export default function SelfVerification({ onSuccess }: SelfVerificationProps) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Generate user ID when component mounts
    setUserId(uuidv4());
  }, []);

  if (!userId) return null;

  // Create SelfApp configuration - updated to use new API endpoint
  const selfApp = new SelfAppBuilder({
    appName: "FlashDAO Volunteer",
    scope: "flashdao-volunteer-verification",
    endpoint: "/api/verify", // Use relative path pointing to our API
    userId,
  }).build();

  return (
    <div className="verify-container">
      <h2 className="verify-title">Scan QR Code to Verify Identity</h2>
      <p className="verify-description">
        Use the Self App to scan this QR code and complete the identity
        verification process.
      </p>

      <div className="qrcode-container">
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={() => {
            console.log("Verification successful!");
            // Call the success callback passed from the parent component
            if (onSuccess) {
              onSuccess();
            }
          }}
          size={250}
        />
      </div>

      <p className="verify-id">Verification ID: {userId.substring(0, 8)}...</p>

      <div
        className="buttons-container"
        style={{ display: "flex", gap: "0.5rem" }}
      >
        <Button
          onClick={() => window.open("https://self.xyz/", "_blank")}
          className="download-button"
          style={{ flex: 1 }}
        >
          Download Self App
        </Button>

        <Button
          variant="outline"
          onClick={() => setUserId(uuidv4())}
          className="regenerate-button"
          style={{ flex: 1 }}
        >
          Regenerate
        </Button>
      </div>
    </div>
  );
}
