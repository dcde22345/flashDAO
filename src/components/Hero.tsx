// src/components/Hero.jsx
import React from "react";
import Link from "next/link";
import "../app/styles/Header.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          支持教師和學生，
          <br />
          改變教育未來
        </h1>
        <p>
          直接捐贈給教室專案，幫助教師獲得他們所需的資源，為學生提供更好的教育體驗。
        </p>

        <div className="hero-buttons">
          <Link href="/projects" className="btn btn-primary btn-lg">
            瀏覽專案
          </Link>
          <Link
            href="/teachers/create-project"
            className="btn btn-outline btn-lg"
          >
            我是教師，發布專案
          </Link>
        </div>

        <div className="search-container">
          <form className="hero-search">
            <input
              type="text"
              placeholder="搜尋學校、專案或主題..."
              className="search-input"
            />
            <button type="submit" className="search-btn">
              搜尋
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Hero;
