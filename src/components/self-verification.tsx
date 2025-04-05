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
    // 当组件挂载时生成用户ID
    setUserId(uuidv4());
  }, []);

  if (!userId) return null;

  // 创建SelfApp配置 - 更新为使用新的API端点
  const selfApp = new SelfAppBuilder({
    appName: "FlashDAO Volunteer",
    scope: "flashdao-volunteer-verification",
    endpoint: "/api/verify", // 使用相对路径指向我们的API
    userId,
  }).build();

  return (
    <div className="verify-container">
      <h2 className="verify-title">扫描二维码验证身份</h2>
      <p className="verify-description">
        使用Self App扫描此二维码完成身份验证流程
      </p>

      <div className="qrcode-container">
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={() => {
            console.log("验证成功!");
            // 调用父组件传入的成功回调
            if (onSuccess) {
              onSuccess();
            }
          }}
          size={250}
        />
      </div>

      <p className="verify-id">验证ID: {userId.substring(0, 8)}...</p>

      <div className="buttons-container">
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
