/**
 * MultiChainDAOFactory多網絡部署腳本
 * 
 * 用法: node scripts/deploy-all-networks.js [network1,network2,...]
 * 例如: node scripts/deploy-all-networks.js sepolia,baseSepolia,avalancheFuji,lineaSepolia
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 可用的網絡列表
const AVAILABLE_NETWORKS = [
  'sepolia',
  'baseSepolia',
  'avalancheFuji',
  'lineaSepolia',
  'optimismSepolia',
  'arbitrumSepolia'
];

// 創建帶時間戳的日誌函數
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 解析命令行參數
function parseNetworks() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    log('沒有指定網絡，將使用預設網絡: sepolia,baseSepolia');
    return ['sepolia', 'baseSepolia'];
  }
  
  const networkArgs = args[0].split(',');
  const networks = networkArgs.filter(network => AVAILABLE_NETWORKS.includes(network));
  
  if (networks.length === 0) {
    log('沒有有效的網絡，將使用預設網絡: sepolia,baseSepolia');
    return ['sepolia', 'baseSepolia'];
  }
  
  return networks;
}

// 部署到指定網絡
async function deployToNetwork(network) {
  log(`開始部署到 ${network}...`);
  
  try {
    // 執行Hardhat部署腳本
    const command = `npx hardhat run scripts/deploy-multichain-factory.js --network ${network}`;
    log(`執行命令: ${command}`);
    
    const output = execSync(command, { encoding: 'utf8' });
    log(output);
    
    // 檢查部署是否成功
    const deploymentsDir = path.join(__dirname, '../deployments');
    const deploymentFile = path.join(deploymentsDir, `${network}-deployment.json`);
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      log(`${network} 部署成功!`);
      log(`Factory地址: ${deploymentData.contracts.multiChainDAOFactory}`);
      return true;
    } else {
      log(`${network} 部署失敗: 找不到部署文件`);
      return false;
    }
  } catch (error) {
    log(`${network} 部署失敗: ${error.message}`);
    return false;
  }
}

// 主要執行函數
async function main() {
  log('=== MultiChainDAOFactory多網絡部署開始 ===');
  
  const networks = parseNetworks();
  log(`將部署到以下網絡: ${networks.join(', ')}`);
  
  const results = {};
  
  // 依次部署到所有網絡
  for (const network of networks) {
    log(`\n--- 部署到 ${network} ---`);
    results[network] = await deployToNetwork(network);
  }
  
  // 輸出部署摘要
  log('\n=== 部署摘要 ===');
  for (const network in results) {
    const status = results[network] ? '✅ 成功' : '❌ 失敗';
    log(`${network}: ${status}`);
  }
  
  // 收集所有成功部署的地址
  log('\n=== 合約地址 ===');
  const deploymentsDir = path.join(__dirname, '../deployments');
  for (const network in results) {
    if (results[network]) {
      const deploymentFile = path.join(deploymentsDir, `${network}-deployment.json`);
      const data = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      log(`${network}:`);
      log(`  Factory: ${data.contracts.multiChainDAOFactory}`);
      log(`  USDC: ${data.contracts.mockUSDC}`);
      log(`  SelfProtocol: ${data.contracts.mockSelfProtocol}`);
    }
  }
  
  log('\n=== 多網絡部署完成 ===');
}

// 執行主函數
main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`部署失敗: ${error.message}`);
    process.exit(1);
  }); 