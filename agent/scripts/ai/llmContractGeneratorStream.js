// LLM-powered Smart Contract Generator Agent with Streaming Output
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const LOG_FILE = path.join(__dirname, '../../../logs/llm_agent.log');
const CONTRACTS_DIR = path.join(__dirname, '../../../contract/agent_gen_contracts');
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = "claude-3-opus-20240229"; // 使用可用的模型

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Ensure contracts directory exists
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
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
    
    // 指定使用Node.js內置的fetch
    const fetch = globalThis.fetch;
    
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        stream: true,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`API錯誤: ${response.status} ${response.statusText}`);
      log(errorText);
      throw new Error(`API錯誤: ${response.status}`);
    }
    
    // 獲取ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let contractCode = '';
    
    // 手動處理流
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解碼並處理當前數據塊
      const chunk = decoder.decode(value, { stream: true });
      
      // 處理事件流數據
      const lines = chunk.split('\n');
      for (const line of lines) {
        // 尋找data: 行
        if (line.startsWith('data: ')) {
          try {
            // 從"data:"後面解析JSON
            const data = line.substring(6).trim();
            if (!data || data === '[DONE]') continue;
            
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content_block_delta' && 
                parsed.delta && 
                parsed.delta.type === 'text_delta' && 
                parsed.delta.text) {
              // 輸出文本
              process.stdout.write(parsed.delta.text);
              contractCode += parsed.delta.text;
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    }
    
    log("\n========== 智能合約生成完成 ==========");
    log(`合約代碼長度: ${contractCode.length} 字元`);
    
    return parseGeneratedContract(contractCode, eventData);
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
- Include ReentrancyGuard from OpenZeppelin
- IMPORTANT: Use correct import paths for OpenZeppelin v5:
  - import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
  - import "@openzeppelin/contracts/access/Ownable.sol";
  - import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
- Include thorough documentation with NatSpec format
- DO NOT make the contract upgradeable (use simple inheritance)

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
  // 生成時間戳記
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const eventType = contractDetails.eventData.type.toLowerCase();
  
  // 創建包含事件名稱和時間戳記的檔案名稱
  let fileName = `${eventType}_${timestamp}.sol`;
  let filePath = path.join(CONTRACTS_DIR, fileName);
  
  // 更新contractDetails的fileName
  contractDetails.fileName = fileName;
  
  fs.writeFileSync(filePath, contractDetails.code);
  log(`Contract saved to ${filePath}`);
  
  // 同時保存到logs/contracts目錄
  const logFileName = fileName;
  const logDir = path.join(__dirname, '../../../logs/contracts');
  
  // 確保logs/contracts目錄存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFilePath = path.join(logDir, logFileName);
  
  // 在合約開頭添加生成的事件資訊
  const contractWithMetadata = 
`// Generated for: ${contractDetails.eventData.name}
// Event Type: ${contractDetails.eventData.type}
// Location: ${contractDetails.eventData.location}
// Severity: ${contractDetails.eventData.severity}/10
// Generated at: ${timestamp}
// ----------------------------------------------------------------

${contractDetails.code}`;

  fs.writeFileSync(logFilePath, contractWithMetadata);
  log(`Contract log saved to ${logFilePath}`);
  
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
    // 修改編譯命令，使用根目錄的Hardhat配置
    const { stdout, stderr } = await execAsync('npx hardhat compile');
    
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
  
  // 使用主合約相同的命名邏輯，只在檔案名增加Factory字樣
  const fileNameParts = contractDetails.fileName.split('.');
  const factoryFileName = `${fileNameParts[0]}_factory.${fileNameParts[1]}`;
  const factoryFilePath = path.join(CONTRACTS_DIR, factoryFileName);
  
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
  
  fs.writeFileSync(factoryFilePath, factoryCode);
  log(`Factory contract saved to ${factoryFilePath}`);
  
  return {
    code: factoryCode,
    name: `${contractDetails.name}Factory`,
    fileName: factoryFileName,
    filePath: factoryFilePath
  };
}

/**
 * Generate deployment script for the contracts
 * @param {Object} contractDetails - Details of the main contract
 * @param {Object} factoryDetails - Details of the factory contract
 * @returns {string} - Path to the saved script
 */
async function generateDeploymentScript(contractDetails, factoryDetails) {
  // 使用與主合約相同的命名邏輯，但改副檔名為js
  const fileNameParts = contractDetails.fileName.split('.');
  const scriptName = `${fileNameParts[0]}_deploy.js`;
  const scriptPath = path.join(CONTRACTS_DIR, scriptName);
  
  const scriptCode = `// Deployment script for ${contractDetails.name} and ${factoryDetails.name}
// 運行命令: npx hardhat run agent_gen_contracts/${scriptName} --network sepolia

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
  log(`處理新事件: ${eventData.type} - ${eventData.name}`);
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
      log("合約編譯失敗");
      return false;
    }
    
    // Step 5: Generate deployment script
    const scriptPath = await generateDeploymentScript(contractDetails, factoryDetails);
    
    log(`事件處理完成，準備部署。`);
    log(`部署命令: npx hardhat run ${path.relative(process.cwd(), scriptPath)} --network sepolia`);
    
    return true;
  } catch (error) {
    log(`處理事件時發生錯誤: ${error.message}`);
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
    log(`開始為 ${eventType} 事件生成合約...`);
    
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
        log(`未知事件類型: ${eventType}`);
        log("可用事件類型: earthquake, flood, fire");
        return false;
    }
    
    log(`選擇事件: ${eventData.type} - ${eventData.name}`);
    log(`嚴重程度: ${eventData.severity}/10`);
    log(`位置: ${eventData.location}`);
    
    const result = await handleEvent(eventData);
    
    if (result) {
      log("🎉 成功生成智能合約和工廠合約！");
      log("你可以在agent_gen_contracts目錄中找到生成的合約。");
      log("部署腳本已生成，請按照上述指示運行它。");
      return true;
    } else {
      log("❌ 合約生成過程中出現錯誤。");
      return false;
    }
  } catch (error) {
    log(`處理事件時發生錯誤: ${error.message}`);
    return false;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log("請指定事件類型: earthquake, flood, 或 fire");
    process.exit(1);
  }
  
  demonstrateAgent(args[0])
    .catch(error => {
      log(`致命錯誤: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  handleEvent,
  generateSmartContract,
  demonstrateAgent
};