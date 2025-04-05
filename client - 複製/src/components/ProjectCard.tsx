"use client";

// src/components/ProjectCard.tsx
import React, { useState } from "react";
import Link from "next/link";
import "../app/styles/ProjectCard.css";

interface Project {
  id: string;
  title: string;
  image: string;
  teacherName: string;
  schoolName: string;
  location: string;
  amountNeeded: number;
  amountRaised: number;
  daysLeft: number;
  category: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const {
    id,
    title,
    image,
    teacherName,
    schoolName,
    location,
    amountNeeded,
    amountRaised,
    daysLeft,
    category,
  } = project;

  const progress = (amountRaised / amountNeeded) * 100;
  const [imgSrc, setImgSrc] = useState(image);
  const fallbackImage = "/example.png";

  return (
    <div className="project-card">
      <div className="project-image">
        <img
          src={imgSrc}
          alt={title}
          onError={() => setImgSrc(fallbackImage)}
        />
        <span className="project-category">{category}</span>
      </div>

      <div className="project-content">
        <h3 className="project-title">
          <Link href={`/projects/${id}`}>{title}</Link>
        </h3>

        <div className="project-meta">
          <p className="teacher-info">{teacherName}</p>
          <p className="school-info">
            {schoolName}, {location}
          </p>
        </div>

        <div className="project-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="progress-stats">
            <div className="funded">
              <span className="amount">${amountRaised}</span> 已募集
            </div>
            <div className="goal">目標: ${amountNeeded}</div>
          </div>
        </div>

        <div className="project-footer">
          <span className="days-left">{daysLeft} 天剩餘</span>
          <Link href={`/projects/${id}`} className="btn btn-sm btn-primary">
            捐贈支持
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
