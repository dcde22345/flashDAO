const { ethers } = require("hardhat");

async function main() {
  console.log("🚨 Starting earthquake simulation...");

  // --------------------------
  // 📦 Setup & Deploy Contracts
  // --------------------------
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  const decimals = 6;
  const mintAmount = ethers.parseUnits("10000", decimals);

  // Deploy MockUSDC
  const mockUSDC = await (await ethers.getContractFactory("MockUSDC")).deploy();
  await mockUSDC.waitForDeployment();
  console.log("💵 MockUSDC deployed:", await mockUSDC.getAddress());

  // Mint to users
  for (let user of [user1, user2, user3]) {
    await mockUSDC.mint(user.address, mintAmount);
  }
  console.log("✅ USDC minted to test users");

  // Deploy FlashDAOFactory
  const factory = await (await ethers.getContractFactory("FlashDAOFactory")).deploy();
  await factory.waitForDeployment();
  console.log("🏭 FlashDAOFactory deployed:", await factory.getAddress());

  // Deploy FlashDAORewards
  const milestones = [100, 500, 1000, 5000, 10000].map(n => ethers.parseUnits(n.toString(), decimals));
  const rewards = await (await ethers.getContractFactory("FlashDAORewards")).deploy(milestones);
  await rewards.waitForDeployment();
  console.log("🎁 FlashDAORewards deployed:", await rewards.getAddress());

  // Deploy FlashDAOAgent
  const severityThreshold = 6;
  const fundingGoalMultiplier = ethers.parseUnits("1000", decimals);

  const agent = await (await ethers.getContractFactory("FlashDAOAgent")).deploy(
    await factory.getAddress(),
    await rewards.getAddress(),
    await mockUSDC.getAddress(),
    severityThreshold,
    fundingGoalMultiplier
  );
  await agent.waitForDeployment();
  console.log("🧠 FlashDAOAgent deployed:", await agent.getAddress());

  // --------------------------
  // 🔐 Grant Roles
  // --------------------------
  const AGENT_ROLE = await factory.AGENT_ROLE();
  const ORACLE_ROLE = await agent.ORACLE_ROLE();

  await factory.grantRole(AGENT_ROLE, await agent.getAddress());
  await agent.grantRole(ORACLE_ROLE, deployer.address);
  console.log("🔐 Roles granted (AGENT_ROLE, ORACLE_ROLE)");

  // --------------------------
  // 🌍 Simulate Earthquake Event
  // --------------------------
  const earthquake = {
    name: "Hualien Earthquake",
    description: "A magnitude 7.2 earthquake hit Hualien County, causing significant damage to infrastructure and displacing thousands of residents.",
    severity: 8,
    fundingDuration: 5 * 24 * 60 * 60, // 5 days
    votingDuration: 2 * 24 * 60 * 60   // 2 days
  };

  console.log(`\n🌋 Earthquake Detected: ${earthquake.name}`);
  console.log(`Severity: ${earthquake.severity}/10 | Funding: ${earthquake.fundingDuration / 86400} days | Voting: ${earthquake.votingDuration / 86400} days`);

  const tx = await agent.detectDisaster(
    earthquake.name,
    earthquake.description,
    earthquake.severity,
    earthquake.fundingDuration,
    earthquake.votingDuration
  );
  const receipt = await tx.wait();

  // --------------------------
  // 🧱 Retrieve FlashDAO Info
  // --------------------------
  const event = receipt.logs
    .filter(log => log.fragment?.name === 'DAOCreated')
    .map(log => agent.interface.parseLog({ topics: log.topics, data: log.data }))[0];

  if (!event) return console.log("❌ FlashDAO creation failed");

  const { daoAddress, disasterName, fundingGoal } = event.args;
  console.log(`\n✅ FlashDAO Created:
  DAO Address: ${daoAddress}
  Disaster: ${disasterName}
  Funding Goal: ${ethers.formatUnits(fundingGoal, decimals)} USDC`);

  const FlashDAO = await ethers.getContractFactory("FlashDAO");
  const flashDAO = FlashDAO.attach(daoAddress);

  // --------------------------
  // 🙋 User3 Registers as Volunteer
  // --------------------------
  console.log("\n🙋 User3 registering as volunteer...");
  await (await flashDAO.connect(user3).registerVolunteer("John Doe", "self_xyz_verification_123")).wait();
  console.log(`Volunteer registered: ${user3.address}`);

  // --------------------------
  // 💸 Donations
  // --------------------------
  const donation1 = ethers.parseUnits("1000", decimals);
  const donation2 = ethers.parseUnits("500", decimals);

  await mockUSDC.connect(user1).approve(daoAddress, donation1);
  await mockUSDC.connect(user2).approve(daoAddress, donation2);

  await flashDAO.connect(user1).donate(0, donation1);
  console.log(`💰 User1 donated ${ethers.formatUnits(donation1, decimals)} USDC`);

  await flashDAO.connect(user2).donate(0, donation2);
  console.log(`💰 User2 donated ${ethers.formatUnits(donation2, decimals)} USDC`);

  const disaster = await flashDAO.disasters(0);
  console.log(`\n📊 Total Raised: ${ethers.formatUnits(disaster.totalRaised, decimals)} USDC`);

  console.log("\n✅ Simulation completed successfully!");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
