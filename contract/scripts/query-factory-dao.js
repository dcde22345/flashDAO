// 查詢工廠合約獲取DAO地址
// 運行命令: npx hardhat run scripts/query-factory-dao.js --network baseSepolia

const { ethers } = require("hardhat");

async function main() {
  console.log("查詢工廠合約獲取DAO地址...");
  
  // 工廠合約地址（Base Sepolia網絡）
  const factoryAddress = "0xB1614282AfB92D9E596Ab69C6bcb75384437F1a1";
  console.log("工廠合約地址:", factoryAddress);
  
  // 獲取Signer
  const [deployer] = await ethers.getSigners();
  console.log("使用賬戶:", deployer.address);
  
  // 連接到工廠合約
  const factoryABI = [
    "function getEventDAOCount() external view returns (uint256)",
    "function allEventIds(uint256) external view returns (bytes32)",
    "function eventDAOs(bytes32) external view returns (address daoAddress, string eventName, string eventDescription, uint256 createdAt, uint256 expiresAt, bool exists)"
  ];
  
  const factory = new ethers.Contract(factoryAddress, factoryABI, deployer);
  
  try {
    // 獲取事件總數
    const eventCount = await factory.getEventDAOCount();
    console.log(`\n事件總數: ${eventCount.toString()}`);
    
    if (Number(eventCount) > 0) {
      console.log("\n最新創建的DAO事件:");
      
      // 獲取最新事件ID (索引是從0開始，所以最後一個是eventCount-1)
      const latestIndex = Number(eventCount) - 1;
      const eventId = await factory.allEventIds(latestIndex);
      
      // 獲取該事件的詳細信息
      const eventInfo = await factory.eventDAOs(eventId);
      
      console.log(`- 事件ID: ${eventId}`);
      console.log(`- DAO地址: ${eventInfo.daoAddress}`);
      console.log(`- 事件名稱: ${eventInfo.eventName}`);
      console.log(`- 創建時間: ${new Date(Number(eventInfo.createdAt) * 1000).toISOString()}`);
      console.log(`- 過期時間: ${new Date(Number(eventInfo.expiresAt) * 1000).toISOString()}`);
      
      // 如果需要，列出所有事件
      if (Number(eventCount) > 1) {
        console.log("\n所有創建的DAO事件:");
        
        for (let i = 0; i < Number(eventCount); i++) {
          const id = await factory.allEventIds(i);
          const info = await factory.eventDAOs(id);
          
          console.log(`\n[${i+1}] 事件: ${info.eventName}`);
          console.log(`   DAO地址: ${info.daoAddress}`);
          console.log(`   創建時間: ${new Date(Number(info.createdAt) * 1000).toISOString()}`);
        }
      }
    } else {
      console.log("工廠合約尚未創建任何DAO");
    }
  } catch (error) {
    console.error("查詢失敗:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 