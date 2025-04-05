/**
 * 部署EventDAOFactory合約
 * 運行命令: npx hardhat run scripts/deploy-event-dao-factory.js --network <network>
 */

async function main() {
  console.log("\n準備部署EventDAOFactory合約...");
  
  // 獲取部署賬戶
  const [deployer] = await ethers.getSigners();
  console.log("部署賬戶:", deployer.address);
  
  try {
    // 部署 ERC20Mock 作為 USDC
    console.log("部署 ERC20Mock (模擬USDC)...");
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const mockUSDC = await ERC20Mock.deploy("USD Coin", "USDC", 6);
    await mockUSDC.deploymentTransaction().wait();
    console.log("Mock USDC 部署地址:", mockUSDC.target);
    
    // 部署 SelfProtocolMock
    console.log("部署 SelfProtocolMock...");
    const SelfProtocolMock = await ethers.getContractFactory("SelfProtocolMock");
    const mockSelfProtocol = await SelfProtocolMock.deploy();
    await mockSelfProtocol.deploymentTransaction().wait();
    console.log("Mock SelfProtocol 部署地址:", mockSelfProtocol.target);
    
    // 部署 EventDAOFactory
    console.log("部署EventDAOFactory...");
    const EventDAOFactory = await ethers.getContractFactory("EventDAOFactory");
    const eventDAOFactory = await EventDAOFactory.deploy(mockUSDC.target, mockSelfProtocol.target);
    await eventDAOFactory.deploymentTransaction().wait();
    console.log("EventDAOFactory 部署地址:", eventDAOFactory.target);
    
    // 更新配置檔案
    console.log("\n部署完成！請將以下地址保存到配置檔案：");
    console.log("USDC_ADDRESS=", mockUSDC.target);
    console.log("SELF_PROTOCOL_ADDRESS=", mockSelfProtocol.target);
    console.log("EVENT_DAO_FACTORY_ADDRESS=", eventDAOFactory.target);
    
    // 如果是在本地網絡，則開始測試功能
    if (network.name === 'localhost' || network.name === 'hardhat') {
      console.log("\n在本地網絡進行功能測試...");
      
      // 創建測試DAO
      console.log("通過工廠創建測試DAO...");
      const tx = await eventDAOFactory.createEventDAO(
        "測試地震事件",
        "這是一個測試地震事件DAO",
        7 * 24 * 60 * 60 // 7天有效期
      );
      
      const receipt = await tx.wait();
      
      // 尋找DAO創建事件
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'EventDAOCreated'
      );
      
      if (event) {
        const eventId = event.args[0];
        const daoAddress = event.args[1];
        console.log("創建成功！");
        console.log("事件ID:", eventId);
        console.log("DAO地址:", daoAddress);
      } else {
        console.log("無法找到DAO創建事件");
      }
    }
    
    return {
      mockUSDC: mockUSDC.target,
      mockSelfProtocol: mockSelfProtocol.target,
      eventDAOFactory: eventDAOFactory.target
    };
  } catch (error) {
    console.error("部署失敗:", error);
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