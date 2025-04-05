// src/components/DonationForm.jsx
import React, { useState } from "react";
import "../styles/DonationForm.css";

const DonationForm = ({ projectId }) => {
  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const predefinedAmounts = [25, 50, 100, 200];

  const handleAmountSelect = (amount) => {
    setDonationAmount(amount.toString());
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setDonationAmount("custom");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 計算最終捐贈金額
    const finalAmount =
      donationAmount === "custom"
        ? parseFloat(customAmount)
        : parseFloat(donationAmount);

    // 在實際應用中，這裡會處理提交捐贈表單的邏輯
    console.log("提交捐贈:", {
      projectId,
      amount: finalAmount,
      name: anonymous ? "匿名" : donorName,
      email: donorEmail,
      message: donorMessage,
      anonymous,
    });

    // 清空表單或導航到支付頁面等後續處理
    alert("感謝您的捐贈！我們將跳轉到支付頁面");
  };

  return (
    <div className="donation-form">
      <h2>支持這個專案</h2>

      <form onSubmit={handleSubmit}>
        <div className="amount-selection">
          <label>選擇捐贈金額：</label>
          <div className="amount-buttons">
            {predefinedAmounts.map((amount) => (
              <button
                type="button"
                key={amount}
                className={`amount-btn ${
                  donationAmount === amount.toString() ? "active" : ""
                }`}
                onClick={() => handleAmountSelect(amount)}
              >
                ${amount}
              </button>
            ))}
            <button
              type="button"
              className={`amount-btn ${
                donationAmount === "custom" ? "active" : ""
              }`}
              onClick={() => setDonationAmount("custom")}
            >
              自訂
            </button>
          </div>

          {donationAmount === "custom" && (
            <div className="custom-amount">
              <label htmlFor="customAmount">輸入金額：</label>
              <div className="custom-amount-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  id="customAmount"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="donor-info">
          <div className="form-group">
            <label htmlFor="donorName">您的名字：</label>
            <input
              type="text"
              id="donorName"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              disabled={anonymous}
              required={!anonymous}
            />
          </div>

          <div className="form-group">
            <label htmlFor="donorEmail">電子郵件：</label>
            <input
              type="email"
              id="donorEmail"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="donorMessage">留言（選填）：</label>
            <textarea
              id="donorMessage"
              value={donorMessage}
              onChange={(e) => setDonorMessage(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <label htmlFor="anonymous">匿名捐贈</label>
          </div>
        </div>

        <button type="submit" className="donate-btn btn btn-primary btn-lg">
          立即捐贈
        </button>

        <div className="donation-footer">
          <p className="donation-secure">
            <span className="secure-icon">🔒</span> 安全捐贈
          </p>
          <p className="donation-note">
            您的捐贈將直接用於購買教師列出的物資，並幫助學生獲得更好的學習體驗。
          </p>
        </div>
      </form>
    </div>
  );
};

export default DonationForm;
