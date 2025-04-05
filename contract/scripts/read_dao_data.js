/**
 * 腳本用於查詢 DAO 合約中的數據
 */
const hre = require("hardhat");

async function main() {
  const daoAddress = "0xfD71C218476F2b2baD28759A3e3fdeF688Fd0E5f";
  
  // 連接到 DAO 合約
  const eventDAO = await hre.ethers.getContractAt("EventDAO", daoAddress);
  
  console.log("===== 基本 DAO 信息 =====");
  const eventName = await eventDAO.eventName();
  const eventDescription = await eventDAO.eventDescription();
  const expiresAt = await eventDAO.expiresAt();
  const tokenName = await eventDAO.tokenName();
  const tokenSymbol = await eventDAO.tokenSymbol();
  
  console.log(`事件名稱: ${eventName}`);
  console.log(`事件描述: ${eventDescription}`);
  console.log(`到期時間: ${new Date(parseInt(expiresAt.toString()) * 1000).toISOString()}`);
  console.log(`代幣名稱: ${tokenName}`);
  console.log(`代幣符號: ${tokenSymbol}`);
  
  console.log("\n===== 志願者信息 =====");
  const volunteerCount = await eventDAO.getVolunteerCount();
  console.log(`志願者總數: ${volunteerCount.toString()}`);
  
  // 獲取所有志願者信息
  // 修改這裡：使用 parseInt 而不是 toNumber()
  const volunteerCountNum = parseInt(volunteerCount.toString());
  for (let i = 0; i < volunteerCountNum; i++) {
    const volunteer = await eventDAO.getVolunteer(i);
    console.log(`志願者 #${i}:`);
    console.log(`  地址: ${volunteer[0]}`);
    console.log(`  名稱: ${volunteer[1]}`);
    console.log(`  描述: ${volunteer[2]}`);
    console.log(`  已批准: ${volunteer[3]}`);
    console.log(`  票數: ${volunteer[4].toString()}`);
  }
  
  console.log("\n===== 捐款和投票數據 =====");
  const totalDonations = await eventDAO.getTotalDonations();
  console.log(`總捐款金額: ${totalDonations.toString()} (USDC的6位小數)`);
  
  const donorCount = await eventDAO.getDonorCount();
  console.log(`捐贈者數量: ${donorCount.toString()}`);
  
  // 修改這裡：使用 parseInt 而不是 toNumber()
  const donorCountNum = parseInt(donorCount.toString());
  if (donorCountNum > 0) {
    const donors = await eventDAO.getDonors();
    console.log("捐贈者地址:");
    for (const donor of donors) {
      const donation = await eventDAO.donations(donor);
      const balance = await eventDAO.balanceOf(donor);
      const votingPower = await eventDAO.votingPower(donor);
      const hasVoted = await eventDAO.hasVoted(donor);
      
      console.log(`  ${donor}:`);
      console.log(`    捐款金額: ${donation.toString()}`);
      console.log(`    治理代幣餘額: ${balance.toString()}`);
      console.log(`    投票權: ${votingPower.toString()}`);
      console.log(`    已投票: ${hasVoted}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });