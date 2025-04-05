// 部署FlashDAO合約到Base網絡
require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 日誌函數
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function main() {
  log('準備部署FlashDAO合約到Base網絡...');
  
  // 確認部署網絡
  const network = process.argv[2] || 'baseSepolia';
  if (network !== 'baseSepolia' && network !== 'baseMainnet') {
    log('錯誤: 請指定正確的網絡 (baseSepolia 或 baseMainnet)');
    process.exit(1);
  }
  
  const isMainnet = network === 'baseMainnet';
  log(`部署網絡: ${isMainnet ? 'Base主網' : 'Base Sepolia測試網'}`);
  
  // 顯示當前配置
  log('檢查環境配置...');
  const rpcUrl = isMainnet 
    ? process.env.BASE_MAINNET_RPC_URL 
    : process.env.BASE_SEPOLIA_RPC_URL;
  
  if (!rpcUrl) {
    log(`錯誤: 未設置${isMainnet ? 'BASE_MAINNET_RPC_URL' : 'BASE_SEPOLIA_RPC_URL'}環境變數`);
    process.exit(1);
  }
  
  if (!process.env.DEPLOY_WALLET_1) {
    log('錯誤: 未設置DEPLOY_WALLET_1環境變數');
    process.exit(1);
  }
  
  log('環境配置正確，開始部署...');
  
  try {
    // 執行Hardhat部署
    const deployCmd = `cd contract && npx hardhat run ../scripts/deployImprovedFlashDAO.js --network ${network}`;
    log(`執行部署命令: ${deployCmd}`);
    
    // 執行命令並捕獲輸出
    const output = execSync(deployCmd, { encoding: 'utf8' });
    console.log(output);
    
    // 從輸出中提取合約地址
    const addressMatch = output.match(/ImprovedFlashDAO deployed to: (0x[a-fA-F0-9]{40})/);
    const usdcMatch = output.match(/USDC_ADDRESS=(0x[a-fA-F0-9]{40})/);
    
    if (addressMatch && addressMatch[1]) {
      const contractAddress = addressMatch[1];
      const usdcAddress = usdcMatch ? usdcMatch[1] : '';
      
      log('部署成功!');
      log(`合約地址: ${contractAddress}`);
      if (usdcAddress) {
        log(`USDC地址: ${usdcAddress}`);
      }
      
      // 更新.env文件
      log('更新.env文件...');
      let envContent = fs.readFileSync('.env', 'utf8');
      envContent = envContent.replace(
        /IMPROVED_FLASHDAO_ADDRESS=0x[a-fA-F0-9]{40}|IMPROVED_FLASHDAO_ADDRESS=$/m, 
        `IMPROVED_FLASHDAO_ADDRESS=${contractAddress}`
      );
      
      if (usdcAddress) {
        envContent = envContent.replace(
          /USDC_ADDRESS=0x[a-fA-F0-9]{40}|USDC_ADDRESS=$/m, 
          `USDC_ADDRESS=${usdcAddress}`
        );
      }
      
      fs.writeFileSync('.env', envContent);
      log('.env文件更新完成');
      
      // 提供區塊瀏覽器鏈接
      const explorerUrl = isMainnet 
        ? `https://basescan.org/address/${contractAddress}` 
        : `https://sepolia.basescan.org/address/${contractAddress}`;
      log(`在區塊瀏覽器查看合約: ${explorerUrl}`);
    } else {
      log('警告: 無法從輸出中提取合約地址，請手動更新.env文件');
    }
  } catch (error) {
    log(`部署失敗: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('部署失敗:', error);
    process.exit(1);
  }); 