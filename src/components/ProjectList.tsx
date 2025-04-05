"use client";

import React from "react";
import ProjectCard from "./ProjectCard";
import "../app/styles/ProjectList.css";

// 模擬的項目數據 - 在實際應用中，這會從API或資料庫獲取
const sampleProjects = [
  {
    id: "1",
    title: "購買 STEM 科學實驗套件",
    image: "/images/projects/science-kits.jpg",
    teacherName: "王老師",
    schoolName: "明德小學",
    location: "台北市",
    amountNeeded: 5000,
    amountRaised: 3200,
    daysLeft: 15,
    category: "科學",
  },
  {
    id: "2",
    title: "教室圖書館更新計畫",
    image: "/images/projects/classroom-library.jpg",
    teacherName: "李老師",
    schoolName: "和平國小",
    location: "高雄市",
    amountNeeded: 3500,
    amountRaised: 2000,
    daysLeft: 20,
    category: "閱讀",
  },
  {
    id: "3",
    title: "音樂課程樂器添購",
    image: "/images/projects/music.jpg",
    teacherName: "張老師",
    schoolName: "光明國中",
    location: "台中市",
    amountNeeded: 8000,
    amountRaised: 4500,
    daysLeft: 30,
    category: "藝術",
  },
  {
    id: "4",
    title: "特殊教育輔助工具",
    image: "/images/projects/special-ed.jpg",
    teacherName: "林老師",
    schoolName: "希望小學",
    location: "新竹市",
    amountNeeded: 6000,
    amountRaised: 5800,
    daysLeft: 5,
    category: "特殊教育",
  },
  {
    id: "5",
    title: "電腦編程課程設備",
    image: "/images/projects/coding.jpg",
    teacherName: "陳老師",
    schoolName: "科技高中",
    location: "台南市",
    amountNeeded: 12000,
    amountRaised: 4000,
    daysLeft: 25,
    category: "科技",
  },
  {
    id: "6",
    title: "體育課程設備更新",
    image: "/images/projects/sports.jpg",
    teacherName: "黃老師",
    schoolName: "健康國小",
    location: "嘉義市",
    amountNeeded: 4500,
    amountRaised: 2200,
    daysLeft: 18,
    category: "體育",
  },
];

interface ProjectListProps {
  featured?: boolean;
  limit?: number | null;
  category?: string | null;
}

const ProjectList: React.FC<ProjectListProps> = ({
  featured = false,
  limit = null,
  category = null,
}) => {
  let projects = sampleProjects;

  // 篩選邏輯
  if (category) {
    projects = projects.filter((project) => project.category === category);
  }

  // 如果是精選專案，可以添加一些邏輯來選擇精選的內容
  if (featured) {
    // 這裡可以實現精選專案的邏輯，例如最受歡迎或接近目標的項目
  }

  // 限制顯示數量
  if (limit) {
    projects = projects.slice(0, limit);
  }

  return (
    <div className="project-list">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectList;
