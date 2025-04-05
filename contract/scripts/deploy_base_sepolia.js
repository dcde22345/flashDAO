/**
 * 簡化的部署腳本 - 僅部署 EventDAOFactory 到 Base Sepolia
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Base Sepolia USDC address
const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  console.log("\n簡化部署 - 僅部署 EventDAOFactory 到 Base Sepolia");
  console.log("-----------------------------------------------");
  
  // 獲取部署賬戶
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署賬戶:", deployer.address);
  console.log("賬戶餘額:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  try {
    console.log(`使用 Base Sepolia USDC: ${BASE_SEPOLIA_USDC}`);
    
    // 部署 SelfProtocolMock
    console.log("\n部署 SelfProtocolMock...");
    const SelfProtocolMock = await hre.ethers.getContractFactory("SelfProtocolMock");
    const mockSelfProtocol = await SelfProtocolMock.deploy();
    await mockSelfProtocol.waitForDeployment();
    const selfProtocolAddress = await mockSelfProtocol.getAddress();
    console.log(`SelfProtocolMock 部署成功，地址: ${selfProtocolAddress}`);
    
    // 部署 EventDAOFactory
    console.log("\n部署 EventDAOFactory...");
    const EventDAOFactory = await hre.ethers.getContractFactory("EventDAOFactory");
    const factory = await EventDAOFactory.deploy(BASE_SEPOLIA_USDC, selfProtocolAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log(`EventDAOFactory 部署成功，地址: ${factoryAddress}`);
    
    // 保存部署結果
    console.log("\n部署完成！請將以下地址保存到配置檔案：");
    console.log("-----------------------------------------------");
    console.log(`USDC_ADDRESS=${BASE_SEPOLIA_USDC}`);
    console.log(`SELF_PROTOCOL_ADDRESS=${selfProtocolAddress}`);
    console.log(`EVENT_DAO_FACTORY_ADDRESS=${factoryAddress}`);
    console.log("-----------------------------------------------");
    
    // 創建部署資訊文件
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const deploymentInfo = {
      network: "baseSepolia",
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        usdc: BASE_SEPOLIA_USDC,
        selfProtocol: selfProtocolAddress,
        factory: factoryAddress
      }
    };
    
    fs.writeFileSync(
      path.join(deploymentDir, "baseSepolia_deployment.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`部署資訊已保存到 deployments/baseSepolia_deployment.json`);
    
    return deploymentInfo;
  } catch (error) {
    console.error("\n部署失敗:", error);
    process.exit(1);
  }
}

// 執行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main; 