/**
 * Multi-chain deployment script for FlashDAO
 * 
 * This script deploys the FlashDAO system on multiple test networks:
 * - Ethereum Sepolia
 * - Avalanche Fuji
 * - Base Sepolia
 */
const hre = require("hardhat");
const { parseUnits } = require("viem");
const fs = require("fs");
const path = require("path");

// USDC addresses on different test networks
const USDC_ADDRESSES = {
  // Base Sepolia USDC
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  // Ethereum Sepolia USDC
  sepolia: "0xda9d4f9b69ac6C22e444eD9aF0CfC043b7a7f53f", // Example address - replace with actual
  // Avalanche Fuji USDC
  fuji: "0x5425890298aed601595a70AB815c96711a31Bc65", // Example address - replace with actual
};

// Network names to chain IDs mapping
const CHAIN_IDS = {
  baseSepolia: 84532,
  sepolia: 11155111,
  fuji: 43113,
};

async function main() {
  console.log("Starting Multi-Chain FlashDAO Deployment");
  console.log("---------------------------------------");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Generate a unique DAO ID (can be replaced with a more meaningful identifier)
  const daoId = "0x" + Date.now().toString(16) + Math.floor(Math.random() * 1000).toString(16).padStart(3, '0');
  console.log(`Generated DAO ID: ${daoId}`);
  
  // Deploy on each network
  const networks = process.env.NETWORKS ? process.env.NETWORKS.split(",") : ["baseSepolia"];
  const deployments = {};
  
  for (const network of networks) {
    if (!USDC_ADDRESSES[network]) {
      console.warn(`Skipping ${network}: No USDC address configured`);
      continue;
    }
    
    console.log(`\nDeploying to ${network}...`);
    
    try {
      // Switch network
      await hre.run("compile");
      await hre.changeNetwork(network);
      
      console.log(`Deploying on ${network} (Chain ID: ${CHAIN_IDS[network]})`);
      
      // Deploy MultiChainDAOFactory
      console.log("Deploying MultiChainDAOFactory...");
      const factory = await hre.viem.deployContract("MultiChainDAOFactory");
      console.log(`MultiChainDAOFactory deployed to: ${factory.address}`);
      
      // Deploy the DAO system using the factory
      console.log(`Deploying DAO system with USDC at ${USDC_ADDRESSES[network]}...`);
      const selfProtocolAddress = process.env.SELF_PROTOCOL_ADDRESS || "0x0000000000000000000000000000000000000000";
      
      const tx = await factory.write.deployDAO([
        daoId,
        USDC_ADDRESSES[network],
        selfProtocolAddress
      ]);
      
      // Wait for confirmations
      console.log(`Transaction sent: ${tx}`);
      
      // Get deployment details
      const deploymentDetails = await factory.read.getDeploymentOnCurrentChain([daoId]);
      
      // Format deployment information
      const deployment = {
        factory: factory.address,
        volunteerRegistry: deploymentDetails[0],
        governanceToken: deploymentDetails[1],
        treasury: deploymentDetails[2],
        governance: deploymentDetails[3],
        deploymentTime: Number(deploymentDetails[4]),
        chainId: CHAIN_IDS[network],
        network: network,
        usdcAddress: USDC_ADDRESSES[network]
      };
      
      deployments[network] = deployment;
      
      // Save deployment to file
      const deploymentPath = path.join(deploymentsDir, `${network}_deployment.json`);
      fs.writeFileSync(
        deploymentPath,
        JSON.stringify(deployment, null, 2)
      );
      
      console.log(`Deployment on ${network} completed and saved to ${deploymentPath}`);
      
    } catch (error) {
      console.error(`Error deploying to ${network}:`, error);
    }
  }
  
  // Save combined deployment information
  fs.writeFileSync(
    path.join(deploymentsDir, "all_deployments.json"),
    JSON.stringify({
      daoId: daoId,
      deploymentDate: new Date().toISOString(),
      deployments: deployments
    }, null, 2)
  );
  
  console.log("\n---------------------------------------");
  console.log("Multi-Chain Deployment Summary:");
  
  for (const network in deployments) {
    console.log(`\n${network.toUpperCase()}:`);
    console.log(`  Factory: ${deployments[network].factory}`);
    console.log(`  VolunteerRegistry: ${deployments[network].volunteerRegistry}`);
    console.log(`  GovernanceToken: ${deployments[network].governanceToken}`);
    console.log(`  Treasury: ${deployments[network].treasury}`);
    console.log(`  Governance: ${deployments[network].governance}`);
  }
  
  console.log("\nDeployment complete!");
  console.log(`All deployment details saved to ${path.join(deploymentsDir, "all_deployments.json")}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 