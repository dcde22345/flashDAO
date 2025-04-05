/**
 * 跨鏈部署腳本 - 使用MultiChainDAOFactory將DAO從Base Sepolia部署到其他測試網
 * 
 * 用法: node scripts/cross-chain-deploy.js <targetNetwork>
 * 例如: node scripts/cross-chain-deploy.js avalancheFuji
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// 可用的目標網絡
const AVAILABLE_NETWORKS = [
  'sepolia',
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

// 解析網絡參數，使用當前Hardhat網絡
function getTargetNetwork() {
  // 使用Hardhat運行時的網絡名稱
  const targetNetwork = hre.network.name;
  
  if (!AVAILABLE_NETWORKS.includes(targetNetwork) && targetNetwork !== 'baseSepolia') {
    log(`警告: 當前網絡 ${targetNetwork} 不在已知測試網列表中，但仍將繼續執行`);
  }
  
  return targetNetwork;
}

// 獲取目標鏈的chainId
function getChainId(network) {
  const networkConfig = {
    'sepolia': 11155111,
    'avalancheFuji': 43113,
    'lineaSepolia': 59141,
    'optimismSepolia': 11155420,
    'arbitrumSepolia': 421614,
    'baseSepolia': 84532
  };
  
  // 如果網絡在配置中不存在，使用當前鏈ID
  return networkConfig[network] || hre.network.config.chainId || 0;
}

async function main() {
  log('=== MultiChainDAO 跨鏈部署開始 ===');
  
  // 獲取目標網絡
  const targetNetwork = getTargetNetwork();
  const targetChainId = getChainId(targetNetwork);
  log(`目標網絡: ${targetNetwork} (chainId: ${targetChainId})`);
  
  // 如果是Base Sepolia，我們不需要部署新的工廠
  if (targetNetwork === 'baseSepolia') {
    log('當前網絡是Base Sepolia，請使用deploy-multichain-factory.js腳本進行部署');
    return;
  }
  
  // 加載配置
  const config = require('../../config.js');
  const baseSepolia = {
    factoryAddress: config.getContractAddress('baseSepolia', 'factoryAddress'),
    usdcAddress: config.getContractAddress('baseSepolia', 'usdcAddress'),
    selfProtocolAddress: config.getContractAddress('baseSepolia', 'selfProtocolAddress')
  };
  
  if (!baseSepolia.factoryAddress) {
    log('錯誤: 無法從配置中獲取Base Sepolia上的工廠合約地址');
    process.exit(1);
  }
  
  log(`Base Sepolia工廠合約地址: ${baseSepolia.factoryAddress}`);
  
  try {
    // 獲取部署者帳戶
    const [deployer] = await hre.ethers.getSigners();
    log(`部署者地址: ${deployer.address}`);
    
    // 檢查帳戶餘額
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    log(`帳戶餘額: ${hre.ethers.formatEther(balance)} ETH`);
    
    // 如果餘額太低，發出警告
    if (balance < hre.ethers.parseEther("0.01")) {
      log(`警告: 帳戶餘額過低，可能無法完成部署。請先獲取${targetNetwork}測試幣。`);
    }
    
    // 默認交易選項來控制gas成本
    const txOptions = {
      maxFeePerGas: hre.ethers.parseUnits("0.5", "gwei"),
      maxPriorityFeePerGas: hre.ethers.parseUnits("0.1", "gwei")
    };
    
    // 步驟1: 部署目標鏈上的模擬合約
    log(`步驟1: 在${targetNetwork}上部署模擬合約...`);
    
    // 部署USDC模擬合約
    log('部署USDC模擬合約...');
    const MockUSDC = await hre.ethers.getContractFactory("contracts/mocks/MockUSDC.sol:MockUSDC");
    const mockUSDC = await MockUSDC.deploy(txOptions);
    await mockUSDC.waitForDeployment();
    const usdcAddress = await mockUSDC.getAddress();
    log(`USDC模擬合約已部署到: ${usdcAddress}`);
    
    // 部署SelfProtocol模擬合約
    log('部署SelfProtocol模擬合約...');
    const MockSelfProtocol = await hre.ethers.getContractFactory("contracts/mocks/MockSelfProtocol.sol:MockSelfProtocol");
    const mockSelfProtocol = await MockSelfProtocol.deploy(txOptions);
    await mockSelfProtocol.waitForDeployment();
    const selfProtocolAddress = await mockSelfProtocol.getAddress();
    log(`SelfProtocol模擬合約已部署到: ${selfProtocolAddress}`);
    
    // 步驟2: 部署工廠合約
    log(`步驟2: 在${targetNetwork}上部署MultiChainDAOFactory...`);
    const MultiChainDAOFactory = await hre.ethers.getContractFactory("MultiChainDAOFactory");
    const factory = await MultiChainDAOFactory.deploy(txOptions);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    log(`MultiChainDAOFactory已部署到: ${factoryAddress}`);
    
    // 步驟3: 呼叫Base Sepolia上的工廠合約請求跨鏈部署
    log('步驟3: 請求從Base Sepolia部署到目標鏈...');
    log('注意: 需要切換到Base Sepolia網絡執行手動步驟...');
    log(`1. 連接到Base Sepolia網絡`);
    log(`2. 訪問工廠合約: ${baseSepolia.factoryAddress}`);
    log(`3. 呼叫requestCrossChainDeployment函數，參數為：`);
    log(`   - 第一個參數為DAO ID (請從Base Sepolia上的事件日誌獲取)`);
    log(`   - 第二個參數為目標鏈ID: ${targetChainId}`);
    
    // 步驟4: 在目標鏈上部署DAO
    log('步驟4: 在目標鏈上部署DAO...');
    log('注意: 當Base Sepolia上的請求發出後，您需要在目標鏈上執行以下步驟:');
    log(`1. 連接到${targetNetwork}網絡`);
    log(`2. 訪問工廠合約: ${factoryAddress}`);
    log(`3. 呼叫deployFromOtherChain函數，參數為：`);
    log(`   - originalDaoId: 來自Base Sepolia的DAO ID`);
    log(`   - originalChainId: 84532 (Base Sepolia的鏈ID)`);
    log(`   - name: 與原始DAO相同的名稱`);
    log(`   - usdcAddress: ${usdcAddress}`);
    log(`   - selfProtocolAddress: ${selfProtocolAddress}`);
    
    // 保存部署資訊
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        usdc: usdcAddress,
        selfProtocol: selfProtocolAddress,
        factory: factoryAddress
      },
      sourceNetwork: {
        name: 'baseSepolia',
        chainId: 84532,
        factoryAddress: baseSepolia.factoryAddress
      }
    };
    
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    const filePath = path.join(deploymentsDir, `${targetNetwork}-deployment.json`);
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    log(`部署資訊已保存到: ${filePath}`);
    
    // 更新配置文件
    config.updateContractAddress(targetNetwork, 'factoryAddress', factoryAddress);
    config.updateContractAddress(targetNetwork, 'usdcAddress', usdcAddress);
    config.updateContractAddress(targetNetwork, 'selfProtocolAddress', selfProtocolAddress);
    log(`配置已更新`);
    
    log('=== 部署摘要 ===');
    log(`網絡: ${targetNetwork} (chainId: ${targetChainId})`);
    log(`USDC模擬合約: ${usdcAddress}`);
    log(`SelfProtocol模擬合約: ${selfProtocolAddress}`);
    log(`MultiChainDAOFactory: ${factoryAddress}`);
    log('\n跨鏈部署準備完成，請按照上述步驟完成實際的跨鏈部署操作。');
    
  } catch (error) {
    log(`錯誤: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 執行主函數
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 