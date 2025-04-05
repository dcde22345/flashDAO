const hre = require("hardhat");
const { parseUnits } = require("viem");

async function main() {
  console.log("Deploying FlashDAO system to Base Sepolia...");

  // 使用Base Sepolia測試網上的USDC合約地址
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  console.log("Using USDC at address:", usdcAddress);

  // 設置獎勵階梯
  const donorMilestones = [
    parseUnits("100", 6),  // 100 USDC
    parseUnits("500", 6),  // 500 USDC
    parseUnits("1000", 6), // 1,000 USDC
    parseUnits("5000", 6), // 5,000 USDC
    parseUnits("10000", 6) // 10,000 USDC
  ];

  // 部署獎勵合約
  const flashDAORewards = await hre.viem.deployContract("FlashDAORewards", [donorMilestones]);
  console.log("FlashDAORewards deployed to:", flashDAORewards.address);

  // 部署工廠合約
  const flashDAOFactory = await hre.viem.deployContract("FlashDAOFactory");
  console.log("FlashDAOFactory deployed to:", flashDAOFactory.address);

  // 設置代理參數
  const severityThreshold = 6; // 最低嚴重度（1-10範圍）
  const fundingGoalMultiplier = parseUnits("1000", 6); // 每點嚴重度1000 USDC

  // 部署代理合約
  const flashDAOAgent = await hre.viem.deployContract(
    "FlashDAOAgent",
    [
      flashDAOFactory.address,
      flashDAORewards.address,
      usdcAddress,
      severityThreshold,
      fundingGoalMultiplier
    ]
  );
  console.log("FlashDAOAgent deployed to:", flashDAOAgent.address);

  // 授予代理合約AGENT_ROLE權限
  const AGENT_ROLE = await flashDAOFactory.read.AGENT_ROLE();
  await flashDAOFactory.write.grantRole([AGENT_ROLE, flashDAOAgent.address]);
  console.log("Granted AGENT_ROLE to FlashDAOAgent");

  // 授予Oracle權限
  const ORACLE_ROLE = await flashDAOAgent.read.ORACLE_ROLE();
  const oracleAddress = process.env.ORACLE_ADDRESS; // 從環境變數獲取Oracle地址
  if (oracleAddress) {
    await flashDAOAgent.write.grantRole([ORACLE_ROLE, oracleAddress]);
    console.log("Granted ORACLE_ROLE to:", oracleAddress);
  } else {
    console.warn("Warning: ORACLE_ADDRESS not set in environment variables");
  }

  console.log("-------------------");
  console.log("Deployment completed successfully!");
  console.log("-------------------");
  console.log("Contract Addresses:");
  console.log("USDC (existing):", usdcAddress);
  console.log("FlashDAORewards:", flashDAORewards.address);
  console.log("FlashDAOFactory:", flashDAOFactory.address);
  console.log("FlashDAOAgent:", flashDAOAgent.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 