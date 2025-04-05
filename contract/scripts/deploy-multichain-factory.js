/**
 * 部署MultiChainDAOFactory合約的腳本
 * 
 * 用法: npx hardhat run scripts/deploy-multichain-factory.js --network <network>
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting MultiChainDAOFactory deployment...");
  
  // Get the account that will be used for deployment
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Log account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);
  
  // Default transaction options to control gas costs
  const txOptions = {
    maxFeePerGas: hre.ethers.parseUnits("0.5", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("0.1", "gwei")
  };
  
  // Deploy MockUSDC contract (for local testing)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("contracts/mocks/MockUSDC.sol:MockUSDC");
  const mockUSDC = await MockUSDC.deploy(txOptions);
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`MockUSDC deployed to: ${usdcAddress}`);
  
  // Deploy MockSelfProtocol contract (for local testing)
  console.log("Deploying MockSelfProtocol...");
  const MockSelfProtocol = await hre.ethers.getContractFactory("contracts/mocks/MockSelfProtocol.sol:MockSelfProtocol");
  const mockSelfProtocol = await MockSelfProtocol.deploy(txOptions);
  await mockSelfProtocol.waitForDeployment();
  const selfProtocolAddress = await mockSelfProtocol.getAddress();
  console.log(`MockSelfProtocol deployed to: ${selfProtocolAddress}`);
  
  // Deploy FlashDAOToken contract
  console.log("Deploying FlashDAOToken...");
  const FlashDAOToken = await hre.ethers.getContractFactory("FlashDAOToken");
  const flashDAOToken = await FlashDAOToken.deploy(txOptions);
  await flashDAOToken.waitForDeployment();
  const tokenAddress = await flashDAOToken.getAddress();
  console.log(`FlashDAOToken deployed to: ${tokenAddress}`);
  
  // Deploy VolunteerRegistry contract
  console.log("Deploying VolunteerRegistry...");
  const VolunteerRegistry = await hre.ethers.getContractFactory("VolunteerRegistry");
  const volunteerRegistry = await VolunteerRegistry.deploy(selfProtocolAddress, txOptions);
  await volunteerRegistry.waitForDeployment();
  const registryAddress = await volunteerRegistry.getAddress();
  console.log(`VolunteerRegistry deployed to: ${registryAddress}`);
  
  // Deploy FlashDAOTreasury contract
  console.log("Deploying FlashDAOTreasury...");
  const FlashDAOTreasury = await hre.ethers.getContractFactory("FlashDAOTreasury");
  const flashDAOTreasury = await FlashDAOTreasury.deploy(
    usdcAddress,
    tokenAddress,
    registryAddress,
    txOptions
  );
  await flashDAOTreasury.waitForDeployment();
  const treasuryAddress = await flashDAOTreasury.getAddress();
  console.log(`FlashDAOTreasury deployed to: ${treasuryAddress}`);
  
  // Deploy FlashDAOGovernance contract
  console.log("Deploying FlashDAOGovernance...");
  const FlashDAOGovernance = await hre.ethers.getContractFactory("FlashDAOGovernance");
  const flashDAOGovernance = await FlashDAOGovernance.deploy(
    tokenAddress,
    usdcAddress,
    registryAddress,
    selfProtocolAddress,
    deployer.address,
    txOptions
  );
  await flashDAOGovernance.waitForDeployment();
  const governanceAddress = await flashDAOGovernance.getAddress();
  console.log(`FlashDAOGovernance deployed to: ${governanceAddress}`);
  
  // Set governance role in the treasury
  console.log("Setting governance role in treasury...");
  await flashDAOTreasury.setGovernance(governanceAddress, txOptions);
  console.log("Governance role set successfully");
  
  // Finally, deploy the MultiChainDAOFactory contract
  console.log("Deploying MultiChainDAOFactory...");
  const MultiChainDAOFactory = await hre.ethers.getContractFactory("MultiChainDAOFactory");
  const multiChainDAOFactory = await MultiChainDAOFactory.deploy(txOptions);
  await multiChainDAOFactory.waitForDeployment();
  const factoryAddress = await multiChainDAOFactory.getAddress();
  console.log(`MultiChainDAOFactory deployed to: ${factoryAddress}`);
  
  // Create a new DAO using the factory
  console.log("Creating a new DAO using the factory...");
  const createTx = await multiChainDAOFactory.createNewDAO(
    "FlashDAO Base Sepolia",
    usdcAddress,
    selfProtocolAddress,
    txOptions
  );
  await createTx.wait();
  console.log("New DAO created successfully");
  
  // Save deployment information to file
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      mockUSDC: usdcAddress,
      mockSelfProtocol: selfProtocolAddress,
      flashDAOToken: tokenAddress,
      volunteerRegistry: registryAddress,
      flashDAOTreasury: treasuryAddress,
      flashDAOGovernance: governanceAddress,
      multiChainDAOFactory: factoryAddress
    },
    timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const filePath = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment information saved to ${filePath}`);
  
  console.log("Deployment completed successfully!");
  
  // Update the config.js file with the factory address if available
  try {
    const configPath = path.join(__dirname, '../../config.js');
    if (fs.existsSync(configPath)) {
      console.log("Updating config.js with factory address...");
      
      const config = require(configPath);
      config.updateContractAddress(
        hre.network.name,
        'factoryAddress',
        factoryAddress
      );
      
      console.log("Config updated successfully!");
    }
  } catch (error) {
    console.error("Error updating config.js:", error.message);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 