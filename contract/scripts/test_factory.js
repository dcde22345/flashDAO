/**
 * 測試EventDAOFactory創建DAO及基本功能的腳本
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("開始測試EventDAOFactory功能");
  console.log("---------------------------------------");
  
  const network = hre.network.name;
  console.log(`在 ${network} 網絡上測試`);
  
  // 讀取部署信息
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${network}_deployment.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`找不到網絡 ${network} 的部署信息。請先運行部署腳本。`);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log("使用部署信息:", deployment);
  
  // 獲取已部署的合約
  const [admin] = await hre.ethers.getSigners();
  const donor1 = admin;
  const donor2 = admin;
  const volunteer1 = admin;
  const volunteer2 = admin;
  console.log(`使用帳戶: ${admin.address}`);
  
  // 連接到EventDAOFactory
  const eventDAOFactory = await hre.ethers.getContractAt(
    "EventDAOFactory", 
    deployment.eventDAOFactoryAddress
  );
  console.log(`已連接到EventDAOFactory: ${deployment.eventDAOFactoryAddress}`);
  
  // 連接到SelfProtocolMock
  const selfProtocol = await hre.ethers.getContractAt(
    "SelfProtocolMock", 
    deployment.selfProtocolAddress
  );
  console.log(`已連接到SelfProtocolMock: ${deployment.selfProtocolAddress}`);
  
  // 為測試用戶添加憑證
  console.log("為測試用戶添加憑證");
  await selfProtocol.verifyUser(admin.address);
  
  // 檢查憑證是否添加成功
  const isVerified = await selfProtocol.hasVerifiedIdentity(admin.address);
  console.log(`用戶 ${admin.address} 已驗證: ${isVerified}`);
  
  // 創建DAO事件
  console.log("\n創建新的DAO事件...");
  const eventName = "測試事件";
  const eventDescription = "這是一個測試事件";
  const lifetime = 7 * 24 * 60 * 60; // 7天（秒）
  
  const tx = await eventDAOFactory.createEventDAO(
    eventName,
    eventDescription,
    lifetime
  );
  
  const receipt = await tx.wait();
  console.log(`創建DAO交易已確認: ${receipt.hash}`);
  
  // 獲取事件中的DAO地址
  const eventLogs = receipt.logs;
  let daoAddress;
  for (const log of eventLogs) {
    try {
      const decodedLog = eventDAOFactory.interface.parseLog(log);
      if (decodedLog && decodedLog.name === "EventDAOCreated") {
        daoAddress = decodedLog.args[2]; // daoAddress位置
        console.log(`從事件中獲取DAO地址: ${daoAddress}`);
        break;
      }
    } catch (e) {
      // 跳過無法解析的日誌
      continue;
    }
  }
  
  if (!daoAddress) {
    console.log("無法從事件中獲取DAO地址，嘗試從區塊鏈獲取最新創建的DAO");
    // 嘗試獲取已部署的DAO地址列表
    const eventCount = await eventDAOFactory.getEventDAOCount();
    console.log(`總共有 ${eventCount} 個DAO`);
    
    if (eventCount.toString() > 0) {
      const lastEventId = await eventDAOFactory.allEventIds(eventCount.toString() - 1);
      const daoInfo = await eventDAOFactory.eventDAOs(lastEventId);
      daoAddress = daoInfo.daoAddress;
      console.log(`獲取最新的DAO地址: ${daoAddress}`);
    } else {
      throw new Error("找不到已部署的DAO");
    }
  }
  
  // 連接到創建的DAO
  const eventDAO = await hre.ethers.getContractAt("EventDAO", daoAddress);
  
  // 獲取DAO基本信息
  console.log("\nDAO基本信息:");
  console.log(`- 事件名稱: ${await eventDAO.eventName()}`);
  console.log(`- 事件描述: ${await eventDAO.eventDescription()}`);
  
  // 處理expiresAt（需要將BigNumber轉為JavaScript數字）
  const expiresAt = await eventDAO.expiresAt();
  const timestamp = parseInt(expiresAt.toString()) * 1000; // 轉為JavaScript時間戳（毫秒）
  const expiresAtDate = new Date(timestamp);
  console.log(`- 到期時間: ${expiresAtDate.toISOString()}`);
  
  // 獲取關聯的合約
  const usdcTokenAddress = await eventDAO.usdcToken();
  const selfProtocolAddress = await eventDAO.selfProtocol();
  console.log(`\n相關合約:`);
  console.log(`- USDC Token: ${usdcTokenAddress}`);
  console.log(`- Self Protocol: ${selfProtocolAddress}`);
  
  // 獲取志願者信息
  const volunteerCount = await eventDAO.getVolunteerCount();
  console.log(`\n志願者數量: ${volunteerCount.toString()}`);
  
  // 獲取捐款信息
  const totalDonations = await eventDAO.getTotalDonations();
  console.log(`總捐款金額: ${totalDonations.toString()} USDC`);
  
  // 測試完成
  console.log("\n測試完成！DAO創建成功。");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });