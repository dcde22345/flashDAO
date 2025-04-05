const hre = require("hardhat");

async function main() {
  console.log("Creating DAO for Hualien Earthquake");
  
  const factoryAddress = "0x9d42a0BCaAAe90042C2528756abAe57B7114C671";
  const factory = await hre.ethers.getContractAt("MultiChainDAOFactory", factoryAddress);
  
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const selfProtocolAddress = "0x58296BdcfC5061905ba5ED52534BD1330067B06F";
  
  console.log("Parameters:");
  console.log("- DAO Name: Hualien Earthquake");
  console.log("- USDC Address: " + usdcAddress);
  console.log("- SelfProtocol Address: " + selfProtocolAddress);
  
  // 設置更低的gas價格
  const txOptions = {
    gasPrice: hre.ethers.parseUnits("0.05", "gwei"),
    gasLimit: 2000000
  };
  
  console.log("Gas options:");
  console.log("- Gas Price: " + hre.ethers.formatUnits(txOptions.gasPrice, "gwei") + " gwei");
  console.log("- Gas Limit: " + txOptions.gasLimit);
  
  console.log("Sending transaction to create DAO...");
  const tx = await factory.createNewDAO(
    "Hualien Earthquake",
    usdcAddress,
    selfProtocolAddress,
    txOptions
  );
  
  console.log("Transaction sent, waiting for confirmation...");
  console.log("Transaction hash: " + tx.hash);
  const receipt = await tx.wait();
  
  console.log("Transaction confirmed!");
  console.log("Events:", receipt.events.length);
  
  // 查找DAOCreated事件
  let daoId = null;
  for (const event of receipt.events) {
    console.log("Event:", event.event);
    if (event.event === "DAOCreated") {
      daoId = event.args.daoId;
      console.log("DAO created successfully!");
      console.log("DAO ID: " + daoId);
      console.log("DAO Name: " + event.args.name);
      console.log("DAO Token Address: " + event.args.tokenAddress);
      console.log("DAO Treasury Address: " + event.args.treasuryAddress);
      console.log("DAO Governance Address: " + event.args.governanceAddress);
      console.log("DAO Volunteer Registry: " + event.args.volunteerRegistryAddress);
      break;
    }
  }
  
  if (!daoId) {
    console.log("Failed to get DAO creation event");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
