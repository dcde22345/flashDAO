// LLM-powered Smart Contract Generator Agent
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const LOG_FILE = path.join(__dirname, '../../../logs/llm_agent.log');
const CONTRACTS_DIR = path.join(__dirname, '../../../contract/contracts');
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = "claude-3-opus-20240229"; // 使用可用的Claude模型

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Initialize logger
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

/**
 * Generate smart contract using Claude API with streaming output
 * @param {Object} eventData - Data about the disaster event
 * @returns {Object} - Generated contract details
 */
async function generateSmartContract(eventData) {
  log(`生成智能合約: ${eventData.type} - ${eventData.name}`);
  
  const prompt = createPrompt(eventData);
  
  try {
    log("連接Claude API並開始生成...");
    log("========== 開始生成智能合約 ==========");
    
    // 使用流式API
    const response = await axios({
      method: 'post',
      url: CLAUDE_API_URL,
      data: {
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: true // 啟用流式輸出
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      responseType: 'stream'
    });
    
    // 收集完整的合約代碼
    let contractCode = '';
    let buffer = '';
    
    // 處理流式響應
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // 尋找完整的SSE事件 (data: {...}\n\n)
        let boundaryIndex;
        while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
          const line = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // 移除 "data: " 前綴
            
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta') {
                // 增量內容更新
                const textDelta = parsed.delta?.text || '';
                if (textDelta) {
                  process.stdout.write(textDelta); // 即時顯示到控制台
                  contractCode += textDelta;
                }
              }
            } catch (err) {
              log(`\n解析JSON時出錯: ${err.message}`);
            }
          }
        }
      });
      
      response.data.on('end', () => {
        log("\n========== 智能合約生成完成 ==========");
        log(`合約代碼長度: ${contractCode.length} 字元`);
        resolve(parseGeneratedContract(contractCode, eventData));
      });
      
      response.data.on('error', (err) => {
        log(`\n流式API連接出錯: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    log(`生成合約時出錯: ${error.message}`);
    throw error;
  }
}

/**
 * Create a prompt for the LLM based on event data
 * @param {Object} eventData - Data about the disaster event
 * @returns {string} - Prompt for the LLM
 */
function createPrompt(eventData) {
  const contractName = `${eventData.name.replace(/\s+/g, '')}DAO`;
  
  return `You are an AI specialized in writing Solidity smart contracts. Create a clean, secure, gas-optimized smart contract with proper documentation.

Generate a Solidity smart contract for a FlashDAO to respond to the following disaster/event:

Event Type: ${eventData.type}
Event Name: ${eventData.name}
Event Description: ${eventData.description}
Severity: ${eventData.severity}/10
Location: ${eventData.location}
Date: ${eventData.date}

The contract should:
1. Inherit from OpenZeppelin's Ownable.sol for permission management
2. Use IERC20 for handling token transfers (USDC) (do not inherit from ERC20)
3. Include the following core functionality:
   - Donation collection with proper accounting
   - Volunteer registration with identity verification
   - Voting mechanism for donors to select volunteers
   - Fund distribution to the selected volunteer
   - Appropriate events for all major actions

Technical requirements:
- Use Solidity version 0.8.20
- Follow best practices for security and gas optimization
- Include ReentrancyGuard from OpenZeppelin for secure transfers
- Include thorough documentation with NatSpec format
- DO NOT make the contract upgradeable (use simple inheritance)
- Ensure all import paths are correct (e.g., import "@openzeppelin/contracts/access/Ownable.sol")

The contract MUST be named "${contractName}" (exactly as shown here)

Return ONLY the complete Solidity code without explanation or additional text.`;
}

/**
 * Parse the generated contract and extract code, factory code, etc.
 * @param {string} contractCode - Raw contract code from LLM
 * @param {Object} eventData - Data about the disaster event
 * @returns {Object} - Parsed contract details
 */
function parseGeneratedContract(contractCode, eventData) {
  // Clean up the code (remove markdown code block delimiters if present)
  let cleanCode = contractCode.replace(/```solidity|```\s*$/g, '').trim();
  
  // Extract contract name
  const contractNameMatch = cleanCode.match(/contract\s+(\w+)/);
  let contractName;
  
  if (contractNameMatch && contractNameMatch[1]) {
    contractName = contractNameMatch[1];
    log(`Extracted contract name from code: ${contractName}`);
  } else {
    // Fallback to using event name for the contract name
    contractName = `${eventData.name.replace(/\s+/g, '')}DAO`;
    log(`Using fallback contract name: ${contractName}`);
  }
  
  // Create file name
  const fileName = `${contractName}.sol`;
  
  return {
    code: cleanCode,
    name: contractName,
    fileName: fileName,
    eventData: eventData
  };
}

/**
 * Save the generated contract to a file
 * @param {Object} contractDetails - Details of the generated contract
 * @returns {string} - Path to the saved file
 */
async function saveContractToFile(contractDetails) {
  let fileName = contractDetails.fileName;
  let filePath = path.join(CONTRACTS_DIR, fileName);
  
  // Check if file already exists, if so, add timestamp to avoid overwriting
  if (fs.existsSync(filePath)) {
    const timestamp = Date.now();
    const fileNameParts = fileName.split('.');
    fileName = `${fileNameParts[0]}_${timestamp}.${fileNameParts[1]}`;
    filePath = path.join(CONTRACTS_DIR, fileName);
    
    log(`Contract file already exists. Using new filename: ${fileName}`);
    
    // Update contract details
    contractDetails.fileName = fileName;
  }
  
  fs.writeFileSync(filePath, contractDetails.code);
  log(`Contract saved to ${filePath}`);
  
  return filePath;
}

/**
 * Compile the generated contract
 * @param {string} filePath - Path to the contract file
 * @returns {boolean} - Whether compilation was successful
 */
async function compileContract(filePath) {
  log("Compiling contract...");
  
  try {
    const { stdout, stderr } = await execAsync('cd contract && npx hardhat compile');
    
    if (stderr) {
      log(`Compilation warnings: ${stderr}`);
    }
    
    log("Contract compiled successfully");
    return true;
  } catch (error) {
    log(`Compilation error: ${error.message}`);
    return false;
  }
}

/**
 * Generate a factory contract for the disaster DAO
 * @param {Object} contractDetails - Details of the main contract
 * @returns {Object} - Factory contract details
 */
async function generateFactoryContract(contractDetails) {
  log(`Generating factory contract for ${contractDetails.name}`);
  
  const factoryFileName = `${contractDetails.name}Factory.sol`;
  const factoryFilePath = path.join(CONTRACTS_DIR, factoryFileName);
  
  // Check if factory file already exists, if so, add timestamp to avoid overwriting
  let actualFactoryFileName = factoryFileName;
  let actualFactoryFilePath = factoryFilePath;
  
  if (fs.existsSync(actualFactoryFilePath)) {
    const timestamp = Date.now();
    const fileNameParts = factoryFileName.split('.');
    actualFactoryFileName = `${fileNameParts[0]}_${timestamp}.${fileNameParts[1]}`;
    actualFactoryFilePath = path.join(CONTRACTS_DIR, actualFactoryFileName);
    
    log(`Factory contract file already exists. Using new filename: ${actualFactoryFileName}`);
  }
  
  const factoryCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./${contractDetails.fileName}";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ${contractDetails.name}Factory
 * @dev Factory for creating and managing ${contractDetails.name} instances
 */
contract ${contractDetails.name}Factory is Ownable {
    // List of deployed DAOs
    address[] public deployedDAOs;
    
    // Event emitted when a new DAO is created
    event DAOCreated(
        address indexed daoAddress, 
        string eventName, 
        string eventType,
        uint256 severity,
        uint256 fundingGoal
    );
    
    // Role for agents that can create DAOs
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new ${contractDetails.name} instance
     * @param usdcAddress Address of the USDC token to use for donations
     * @return The address of the newly created DAO
     */
    function createDAO(address usdcAddress) external onlyOwner returns (address) {
        ${contractDetails.name} newDAO = new ${contractDetails.name}(usdcAddress);
        
        // Transfer ownership to the factory owner
        newDAO.transferOwnership(owner());
        
        deployedDAOs.push(address(newDAO));
        
        emit DAOCreated(
            address(newDAO),
            "${contractDetails.eventData.name}",
            "${contractDetails.eventData.type}",
            ${contractDetails.eventData.severity},
            calculateFundingGoal(${contractDetails.eventData.severity})
        );
        
        return address(newDAO);
    }
    
    /**
     * @dev Calculates funding goal based on severity
     * @param severity Severity of the disaster (1-10)
     * @return Funding goal in USDC (with 6 decimal places)
     */
    function calculateFundingGoal(uint256 severity) public pure returns (uint256) {
        require(severity > 0 && severity <= 10, "Severity must be between 1 and 10");
        // Base amount + severity multiplier (e.g., 10,000 USDC for severity 10)
        return 1000 * 10**6 + (severity * 1000 * 10**6);
    }
    
    /**
     * @dev Returns the number of deployed DAOs
     * @return The number of deployed DAOs
     */
    function getDeployedDAOsCount() external view returns (uint256) {
        return deployedDAOs.length;
    }
}`;
  
  fs.writeFileSync(actualFactoryFilePath, factoryCode);
  log(`Factory contract saved to ${actualFactoryFilePath}`);
  
  return {
    code: factoryCode,
    name: `${contractDetails.name}Factory`,
    fileName: actualFactoryFileName,
    filePath: actualFactoryFilePath
  };
}

/**
 * Generate deployment script for the contracts
 * @param {Object} contractDetails - Details of the main contract
 * @param {Object} factoryDetails - Details of the factory contract
 * @returns {string} - Path to the saved script
 */
async function generateDeploymentScript(contractDetails, factoryDetails) {
  const scriptName = `deploy_${contractDetails.name.toLowerCase()}.js`;
  const scriptPath = path.join(__dirname, '../../../contract/scripts', scriptName);
  
  // Ensure the deploy directory exists
  const deployDir = path.dirname(scriptPath);
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  
  const scriptCode = `// Deployment script for ${contractDetails.name} and ${factoryDetails.name}
// 運行命令: npx hardhat run scripts/${scriptName} --network sepolia

async function main() {
  console.log("Deploying contracts for ${contractDetails.eventData.name}...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy MockUSDC for testing
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
  await mockUSDC.deployed();
  console.log("MockUSDC deployed to:", mockUSDC.address);
  
  // Deploy factory
  const Factory = await ethers.getContractFactory("${factoryDetails.name}");
  const factory = await Factory.deploy();
  await factory.deployed();
  console.log("${factoryDetails.name} deployed to:", factory.address);
  
  // Create DAO instance through factory
  const tx = await factory.createDAO(mockUSDC.address);
  const receipt = await tx.wait();
  
  // Find the DAOCreated event
  const daoCreatedEvent = receipt.events
    .filter(event => event.event === 'DAOCreated')
    [0];
  
  if (daoCreatedEvent) {
    const daoAddress = daoCreatedEvent.args.daoAddress;
    console.log("${contractDetails.name} deployed to:", daoAddress);
    
    // Connect to the created DAO
    const DAO = await ethers.getContractFactory("${contractDetails.name}");
    const dao = DAO.attach(daoAddress);
    
    console.log("Deployment completed successfully!");
  } else {
    console.log("Failed to create DAO");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`;
  
  fs.writeFileSync(scriptPath, scriptCode);
  log(`Deployment script saved to ${scriptPath}`);
  
  return scriptPath;
}

/**
 * Handle a new disaster/event
 * @param {Object} eventData - Data about the disaster event
 */
async function handleEvent(eventData) {
  log("==================================================");
  log(`Processing new event: ${eventData.type} - ${eventData.name}`);
  log("==================================================");
  
  try {
    // Step 1: Generate the smart contract
    const contractDetails = await generateSmartContract(eventData);
    
    // Step 2: Save the contract to a file
    const filePath = await saveContractToFile(contractDetails);
    
    // Step 3: Generate factory contract
    const factoryDetails = await generateFactoryContract(contractDetails);
    
    // Step 4: Compile the contracts
    const compilationSuccessful = await compileContract(filePath);
    
    if (!compilationSuccessful) {
      log("Failed to compile the generated contracts");
      return false;
    }
    
    // Step 5: Generate deployment script
    const scriptPath = await generateDeploymentScript(contractDetails, factoryDetails);
    
    log(`Event processing completed successfully. Ready for deployment.`);
    log(`To deploy the contracts, run: cd contract && npx hardhat run scripts/${scriptName} --network sepolia`);
    
    return true;
  } catch (error) {
    log(`Error handling event: ${error.message}`);
    return false;
  }
}

// Example disaster/event data
const exampleEarthquakeEvent = {
  type: "Earthquake",
  name: "Hualien Earthquake",
  description: "A magnitude 7.2 earthquake hit Hualien County, causing significant damage to infrastructure and displacing thousands of residents.",
  severity: 8,
  location: "Hualien County, Taiwan",
  date: new Date().toISOString()
};

const exampleFloodEvent = {
  type: "Flood",
  name: "Kaohsiung Flooding",
  description: "Heavy rainfall has caused severe flooding in Kaohsiung, affecting multiple districts and leaving thousands without shelter.",
  severity: 7,
  location: "Kaohsiung, Taiwan",
  date: new Date().toISOString()
};

const exampleFireEvent = {
  type: "Wildfire",
  name: "Taipei Mountain Fire",
  description: "A wildfire has spread across forested areas in Taipei's mountain regions, threatening nearby communities and wildlife.",
  severity: 6,
  location: "Taipei, Taiwan",
  date: new Date().toISOString()
};

// Function to demonstrate the agent with a specific event
async function demonstrateAgent(eventType) {
  let eventData;
  
  try {
    log(`Starting contract generation for ${eventType} event...`);
    
    switch (eventType.toLowerCase()) {
      case 'earthquake':
        eventData = exampleEarthquakeEvent;
        break;
      case 'flood':
        eventData = exampleFloodEvent;
        break;
      case 'fire':
      case 'wildfire':
        eventData = exampleFireEvent;
        break;
      default:
        log(`Unknown event type: ${eventType}`);
        log("Available event types: earthquake, flood, fire");
        return false;
    }
    
    log(`Selected event: ${eventData.type} - ${eventData.name}`);
    log(`Severity: ${eventData.severity}/10`);
    log(`Location: ${eventData.location}`);
    
    const result = await handleEvent(eventData);
    
    if (result) {
      log("🎉 成功生成智能合約和工廠合約！");
      log("你可以在contract/contracts目錄中找到生成的合約。");
      log("部署腳本已生成，請按照上述指示運行它。");
      return true;
    } else {
      log("❌ 合約生成過程中出現錯誤。");
      return false;
    }
  } catch (error) {
    log(`致命錯誤: ${error.message}`);
    log(error.stack);
    return false;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log("Please specify an event type: earthquake, flood, or fire");
    process.exit(1);
  }
  
  demonstrateAgent(args[0])
    .catch(error => {
      log(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  handleEvent,
  generateSmartContract,
  demonstrateAgent
}; 