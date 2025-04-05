/**
 * Deployment script for Event DAO system
 * 
 * This script deploys the EventDAOFactory and SelfProtocolMock
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// USDC addresses on different test networks
const USDC_ADDRESSES = {
  // Base Sepolia USDC
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  // Ethereum Sepolia USDC
  sepolia: "0xda9d4f9b69ac6C22e444eD9aF0CfC043b7a7f53f",
  // Avalanche Fuji USDC
  fuji: "0x5425890298aed601595a70AB815c96711a31Bc65",
};

async function main() {
  console.log("Starting Event DAO System Deployment");
  console.log("---------------------------------------");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Get the network
  const network = hre.network.name;
  console.log(`Deploying to ${network}...`);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Get USDC address for the network
  const usdcAddress = USDC_ADDRESSES[network] || process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    throw new Error(`No USDC address configured for network ${network}`);
  }
  console.log(`Using USDC address: ${usdcAddress}`);
  
  // Deploy SelfProtocolMock
  console.log("Deploying SelfProtocolMock...");
  const SelfProtocolMock = await hre.ethers.getContractFactory("SelfProtocolMock");
  const selfProtocolMock = await SelfProtocolMock.deploy();
  await selfProtocolMock.waitForDeployment();
  const selfProtocolAddress = await selfProtocolMock.getAddress();
  console.log(`SelfProtocolMock deployed to: ${selfProtocolAddress}`);
  
  // Deploy EventDAOFactory
  console.log("Deploying EventDAOFactory...");
  const EventDAOFactory = await hre.ethers.getContractFactory("EventDAOFactory");
  const eventDAOFactory = await EventDAOFactory.deploy(usdcAddress, selfProtocolAddress);
  await eventDAOFactory.waitForDeployment();
  const eventDAOFactoryAddress = await eventDAOFactory.getAddress();
  console.log(`EventDAOFactory deployed to: ${eventDAOFactoryAddress}`);
  
  // Save deployment to file
  const deployment = {
    network,
    deployer: deployer.address,
    usdcAddress,
    selfProtocolAddress,
    eventDAOFactoryAddress,
    deploymentDate: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(deploymentsDir, `${network}_deployment.json`),
    JSON.stringify(deployment, null, 2)
  );
  
  console.log("\nDeployment complete!");
  console.log(`Deployment details saved to ${path.join(deploymentsDir, `${network}_deployment.json`)}`);
  
  // Wait a bit before verification
  console.log("\nWaiting 30 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Verify contracts on Etherscan (if applicable)
  if (["sepolia", "baseSepolia", "fuji"].includes(network)) {
    console.log("Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: selfProtocolAddress,
        constructorArguments: []
      });
      console.log("SelfProtocolMock verified!");
    } catch (error) {
      console.error("Error verifying SelfProtocolMock:", error);
    }
    
    try {
      await hre.run("verify:verify", {
        address: eventDAOFactoryAddress,
        constructorArguments: [usdcAddress, selfProtocolAddress]
      });
      console.log("EventDAOFactory verified!");
    } catch (error) {
      console.error("Error verifying EventDAOFactory:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 