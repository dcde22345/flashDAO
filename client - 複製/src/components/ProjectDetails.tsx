// src/app/projects/[id]/page.js
import React from "react";
import DonationForm from "../../../components/DonationForm";
import "../../styles/ProjectDetails.css";

// 模擬的單一專案數據 - 實際應用中會根據ID從API獲取
const getProjectById = (id) => {
  return {
    id: id,
    title: "購買 STEM 科學實驗套件",
    image: "/images/projects/science-kits.jpg",
    teacherName: "王老師",
    schoolName: "明德小學",
    location: "台北市",
    amountNeeded: 5000,
    amountRaised: 3200,
    daysLeft: 15,
    category: "科學",
    description: `我們的科學課程需要實踐機會，但我們缺乏必要的工具和材料。這些STEM科學實驗套件將使學生能夠動手探索科學原理，從簡單的物理定律到化學反應。

這些實驗套件專為小學生設計，內含安全、易用的材料，並配有詳細的指導手冊。通過這些套件，我希望能夠激發學生對科學的興趣，培養他們的批判性思維和問題解決能力。

您的支持將直接影響30名四年級學生，並且這些套件可以在未來幾年繼續使用，惠及更多學生。謝謝您考慮支持我們的科學教育！`,
    teacherMessage:
      "作為一名科學老師，我相信動手實踐是學習的最佳方式。這些套件將改變我們的課堂體驗！",
    items: [
      { name: "基礎物理實驗套件", cost: 1200, quantity: 2 },
      { name: "化學反應觀察套件", cost: 1500, quantity: 1 },
      { name: "可重複使用的實驗工具", cost: 800, quantity: 1 },
      { name: "學生安全護具", cost: 500, quantity: 10 },
    ],
    updates: [
      {
        date: "2025-03-15",
        message: "我們已經籌集了60%的資金！非常感謝所有的支持者。",
      },
    ],
    donors: [
      { name: "陳小姐", amount: 500, message: "希望孩子們喜歡這些實驗套件！" },
      { name: "匿名", amount: 1000, message: "支持科學教育！" },
      { name: "林先生", amount: 200, message: null },
      { name: "黃家庭", amount: 1500, message: "祝實驗順利！" },
    ],
  };
};

export default function ProjectDetailsPage({ params }) {
  const { id } = params;
  const project = getProjectById(id);

  // 計算募資進度
  const progress = (project.amountRaised / project.amountNeeded) * 100;

  return (
    <div className="project-details-page">
      <div className="container">
        <div className="project-details-grid">
          <div className="project-main">
            <div className="project-header">
              <h1>{project.title}</h1>
              <div className="project-meta">
                <p className="teacher-info">由 {project.teacherName} 發起</p>
                <p className="school-info">
                  {project.schoolName}, {project.location}
                </p>
              </div>
            </div>

            <div className="project-image-large">
              <img src={project.image} alt={project.title} />
            </div>

            <div className="project-tabs">
              <div className="tab-nav">
                <button className="tab-btn active">專案介紹</button>
                <button className="tab-btn">需求清單</button>
                <button className="tab-btn">專案更新</button>
                <button className="tab-btn">捐贈者</button>
              </div>

              <div className="tab-content active">
                <div className="project-description">
                  <h2>專案介紹</h2>
                  <div className="teacher-message">
                    <blockquote>"{project.teacherMessage}"</blockquote>
                  </div>
                  <div className="description-content">
                    {project.description.split("\n\n").map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tab-content">
                <div className="project-items">
                  <h2>需求清單</h2>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>項目</th>
                        <th>單價</th>
                        <th>數量</th>
                        <th>總計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>${item.cost}</td>
                          <td>{item.quantity}</td>
                          <td>${item.cost * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="tab-content">
                <div className="project-updates">
                  <h2>專案更新</h2>
                  {project.updates.length > 0 ? (
                    <div className="updates-list">
                      {project.updates.map((update, idx) => (
                        <div key={idx} className="update-item">
                          <div className="update-date">{update.date}</div>
                          <div className="update-message">{update.message}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>尚無專案更新</p>
                  )}
                </div>
              </div>

              <div className="tab-content">
                <div className="project-donors">
                  <h2>捐贈者</h2>
                  <div className="donors-list">
                    {project.donors.map((donor, idx) => (
                      <div key={idx} className="donor-item">
                        <div className="donor-info">
                          <span className="donor-name">{donor.name}</span>
                          <span className="donor-amount">${donor.amount}</span>
                        </div>
                        {donor.message && (
                          <div className="donor-message">{donor.message}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="project-sidebar">
            <div className="donation-progress">
              <div className="progress-stats">
                <div className="raised">
                  <span className="amount">${project.amountRaised}</span>
                  <span>已募集，目標 ${project.amountNeeded}</span>
                </div>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="progress-info">
                <span className="donors-count">
                  {project.donors.length} 位捐贈者
                </span>
                <span className="days-left">{project.daysLeft} 天剩餘</span>
              </div>
            </div>

            <DonationForm projectId={id} />

            <div className="share-project">
              <h3>分享這個專案</h3>
              <div className="share-buttons">
                <button className="share-btn facebook">Facebook</button>
                <button className="share-btn twitter">Twitter</button>
                <button className="share-btn email">Email</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
