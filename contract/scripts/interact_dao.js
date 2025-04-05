/**
 * 與已部署的EventDAO互動的腳本
 * 演示如何進行捐款、註冊志願者、投票等操作
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("開始與EventDAO互動");
  console.log("---------------------------------------");
  
  const network = hre.network.name;
  console.log(`在 ${network} 網絡上執行`);
  
  // 讀取部署信息
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${network}_deployment.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`找不到網絡 ${network} 的部署信息。請先運行部署腳本。`);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log("使用部署信息:", deployment);
  
  // 獲取測試帳戶 - 在測試網上僅使用單一帳戶模擬多個角色
  const [admin] = await hre.ethers.getSigners();
  const donor1 = admin;
  const donor2 = admin;
  const volunteer1 = admin;
  const volunteer2 = admin;
  
  console.log(`使用管理員: ${admin.address}`);
  console.log(`使用捐贈者/志願者 (相同地址): ${admin.address}`);
  
  // 連接到EventDAOFactory
  const eventDAOFactory = await hre.ethers.getContractAt(
    "EventDAOFactory", 
    deployment.eventDAOFactoryAddress
  );
  console.log(`已連接到EventDAOFactory: ${deployment.eventDAOFactoryAddress}`);
  
  // 獲取最新的DAO
  const eventCount = await eventDAOFactory.getEventDAOCount();
  
  if (eventCount.toString() === "0") {
    throw new Error("沒有找到已部署的DAO。請先運行 test_factory.js 創建DAO。");
  }
  
  const lastEventId = await eventDAOFactory.allEventIds(eventCount.toString() - 1);
  const daoInfo = await eventDAOFactory.eventDAOs(lastEventId);
  const daoAddress = daoInfo.daoAddress;
  console.log(`獲取最新的DAO地址: ${daoAddress}`);
  
  // 連接到DAO和相關合約
  const eventDAO = await hre.ethers.getContractAt("EventDAO", daoAddress);
  const usdcTokenAddress = await eventDAO.usdcToken();
  const selfProtocolAddress = await eventDAO.selfProtocol();
  
  const usdc = await hre.ethers.getContractAt("IERC20", usdcTokenAddress);
  const selfProtocol = await hre.ethers.getContractAt("SelfProtocolMock", selfProtocolAddress);
  
  console.log(`\n相關合約地址:`);
  console.log(`- DAO: ${daoAddress}`);
  console.log(`- USDC: ${usdcTokenAddress}`);
  console.log(`- Self Protocol: ${selfProtocolAddress}`);
  
  // 模擬USDC (在真實環境中，你需要從水龍頭或交易所獲取USDC)
  // 這裡我們假設USDC已經存在，或我們使用模擬版本
  
  // 為志願者添加憑證
  console.log("\n為志願者添加憑證...");
  await selfProtocol.connect(admin).verifyUser(admin.address);
  
  console.log(`用戶 (${admin.address}) 已驗證: ${await selfProtocol.hasVerifiedIdentity(admin.address)}`);
  
  // 註冊志願者
  console.log("\n註冊志願者...");
  try {
    // 空憑證 (在真實環境中，這將是從Self Protocol獲取的憑證)
    const emptyCredentials = "0x";
    
    await eventDAO.connect(admin).registerAsVolunteer(
      "志願者組織1", 
      "我們是專注於社區服務的組織",
      emptyCredentials
    );
    console.log("志願者已註冊");
    
    // 檢查註冊結果
    const volunteerCount = await eventDAO.getVolunteerCount();
    console.log(`DAO中的志願者數量: ${volunteerCount.toString()}`);
    
    // 管理員批准志願者
    console.log("\n管理員批准志願者...");
    await eventDAO.connect(admin).approveVolunteer(0); // 批准志願者
    console.log("志願者已獲批准");
    
    // 捐款和投票 (模擬)
    console.log("\n注意: 在此測試環境中，由於缺少實際的USDC，無法完成實際的捐款和投票流程。");
    console.log("在生產環境中，您需要完成以下步驟:");
    console.log("1. 獲取真實的USDC代幣");
    console.log("2. 使用 usdc.approve(daoAddress, amount) 批准DAO花費您的USDC");
    console.log("3. 使用 eventDAO.donate(amount) 進行捐款");
    console.log("4. 使用 eventDAO.vote(volunteerIndex) 進行投票");
    
    // 互動完成
    console.log("\n測試完成！已成功與DAO進行互動。");
    
  } catch (error) {
    console.error("互動過程中發生錯誤:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 