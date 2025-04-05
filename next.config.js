/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 添加模塊替換配置，使我們的補丁生效
  webpack: (config, { isServer }) => {
    // 修复 Biconomy 相關問題
    config.resolve.alias = {
      ...config.resolve.alias,
      '@biconomy/abstractjs/dist/_esm/constants/index.js': path.resolve(__dirname, './src/patches/@biconomy/abstractjs/dist/_esm/constants/index.js'),
    };
    
    return config;
  },
}

module.exports = nextConfig