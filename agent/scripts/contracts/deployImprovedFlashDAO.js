// Script for deploying ImprovedFlashDAO contract to Flow EVM chain
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Deploying ImprovedFlashDAO contract to Flow EVM chain...");
  
  // Get network
  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Use predefined USDC address or deploy mock USDC for testing
  let usdcAddress;
  
  if (process.env.USDC_ADDRESS) {
    usdcAddress = process.env.USDC_ADDRESS;
    console.log(`Using existing USDC address: ${usdcAddress}`);
  } else {
    console.log("No USDC address provided, deploying mock USDC token...");
    
    // Deploy mock USDC token for testing
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await mockUSDC.deployed();
    
    usdcAddress = mockUSDC.address;
    console.log(`Deployed mock USDC token at: ${usdcAddress}`);
  }
  
  // Deploy ImprovedFlashDAO contract
  const ImprovedFlashDAO = await ethers.getContractFactory("ImprovedFlashDAO");
  const flashDAO = await ImprovedFlashDAO.deploy(usdcAddress);
  
  console.log("Waiting for deployment transaction to be mined...");
  await flashDAO.deployed();
  
  console.log(`ImprovedFlashDAO deployed to: ${flashDAO.address}`);
  console.log("\nUpdate your .env file with these values:");
  console.log(`IMPROVED_FLASHDAO_ADDRESS=${flashDAO.address}`);
  console.log(`USDC_ADDRESS=${usdcAddress}`);
  
  // Verify contract on block explorer if on a supported network
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nWaiting for block confirmations...");
    // Wait for 6 block confirmations to ensure the contract is deployed
    await flashDAO.deployTransaction.wait(6);
    
    console.log("Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: flashDAO.address,
        constructorArguments: [usdcAddress],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Error verifying contract:", error.message);
    }
  }
  
  console.log("\nDeployment complete!");
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 