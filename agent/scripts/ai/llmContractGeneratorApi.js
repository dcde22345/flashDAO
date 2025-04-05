// LLM-powered Smart Contract Generator Agent API Version
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const LOG_FILE = path.join(__dirname, '../../../logs/llm_agent.log');
const CONTRACTS_DIR = path.join(__dirname, '../../../contract/agent_gen_contracts');
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = "claude-3-opus-20240229"; 

// Ensure directories exist
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

// Logger
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

/**
 * Generate smart contract using Claude API
 * @param {Object} eventData - Data about the disaster event
 * @returns {Object} - Generated contract details
 */
async function generateSmartContract(eventData) {
  log(`生成智能合約: ${eventData.type} - ${eventData.name}`);
  
  const prompt = createPrompt(eventData);
  
  try {
    log("連接Claude API並開始生成...");
    
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
    
    const responseData = await response.json();
    const contractCode = responseData.content[0].text;
    
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
- The contract MUST be compatible with our FlashDAOFactory
- The constructor MUST accept an ERC20 token address parameter: constructor(address _donationToken) Ownable(msg.sender)
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
  const contractNameMatch = cleanCode.match(/contract\s+([a-zA-Z0-9_]+)/);
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
  // 保存到contract/agent_gen_contracts目錄
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
  
  // 同時保存到logs/contracts目錄
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const eventType = contractDetails.eventData.type.toLowerCase();
  const logFileName = `${eventType}_${timestamp}.sol`;
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
 * Generate deployment script for the contracts
 * @param {Object} contractDetails - Details of the main contract
 * @returns {string} - Path to the saved script
 */
async function generateDeploymentScript(contractDetails) {
  const scriptName = `deploy_${contractDetails.name.toLowerCase()}.js`;
  const scriptPath = path.join(CONTRACTS_DIR, scriptName);
  
  // Ensure the directory exists
  if (!fs.existsSync(CONTRACTS_DIR)) {
    fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
  }
  
  const scriptCode = `// Deployment script for ${contractDetails.name} using FlashDAOFactory
// 運行命令: npx hardhat run scripts/${scriptName} --network sepolia

async function main() {
  console.log("為 ${contractDetails.eventData.name} 部署合約...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("使用帳戶部署:", deployer.address);
  
  // Deploy MockUSDC for testing
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
  await mockUSDC.deployed();
  console.log("MockUSDC 已部署到:", mockUSDC.address);
  
  // 獲取現有的FlashDAOFactory
  // 在實際使用時，替換為您的工廠合約地址
  const factoryAddress = "YOUR_FACTORY_ADDRESS"; // 替換為FlashDAOFactory合約地址
  const factory = await ethers.getContractAt("FlashDAOFactory", factoryAddress);
  console.log("使用現有的 FlashDAOFactory:", factoryAddress);
  
  // 通過工廠部署DAO合約
  console.log("正在通過工廠部署 ${contractDetails.name}...");
  const tx = await factory.createDAO(
    mockUSDC.address,
    "${contractDetails.eventData.name}",
    "${contractDetails.eventData.description}",
    ${contractDetails.eventData.severity * 1000 * 10**6}, // funding goal based on severity
    604800, // 7 days funding duration
    259200  // 3 days voting duration
  );
  
  const receipt = await tx.wait();
  
  // Find the DAOCreated event
  const daoCreatedEvent = receipt.events
    .filter(event => event.event === 'DAOCreated')
    [0];
  
  if (daoCreatedEvent) {
    const daoAddress = daoCreatedEvent.args.daoAddress;
    console.log("${contractDetails.name} 已部署到:", daoAddress);
    console.log("部署完成!");
  } else {
    console.log("DAO 創建失敗");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`;
  
  fs.writeFileSync(scriptPath, scriptCode);
  log(`部署腳本已保存到 ${scriptPath}`);
  
  return scriptPath;
}

/**
 * Handle a new disaster/event via API
 * @param {Object} eventData - Data about the disaster event
 * @returns {Object} - Result of the handling process
 */
async function handleEventAPI(eventData) {
  log("==================================================");
  log(`處理新API事件: ${eventData.type} - ${eventData.name}`);
  log("==================================================");
  
  try {
    // Step 1: Generate the smart contract
    const contractDetails = await generateSmartContract(eventData);
    
    // Step 2: Save the contract to a file
    const filePath = await saveContractToFile(contractDetails);
    
    // Step 3: Compile the contract
    const compilationSuccessful = await compileContract(filePath);
    
    if (!compilationSuccessful) {
      log("合約編譯失敗");
      return {
        success: false,
        error: "Compilation failed",
        contractDetails: contractDetails
      };
    }
    
    // Step 4: Generate deployment script using existing FlashDAOFactory
    const scriptPath = await generateDeploymentScript(contractDetails);
    
    log(`事件處理完成，準備部署。`);
    log(`合約已保存到 ${filePath}`);
    log(`部署腳本已生成: ${scriptPath}`);
    log(`部署命令: cd contract && npx hardhat run ${path.relative(path.join(__dirname, '../../../contract'), scriptPath)} --network sepolia`);
    
    return {
      success: true,
      contractDetails: contractDetails,
      contractFilePath: filePath,
      deploymentScriptPath: scriptPath,
      deploymentCommand: `cd contract && npx hardhat run ${path.relative(path.join(__dirname, '../../../contract'), scriptPath)} --network sepolia`
    };
  } catch (error) {
    log(`處理事件時發生錯誤: ${error.message}`);
    return {
      success: false,
      error: error.message,
      contractDetails: null
    };
  }
}

module.exports = {
  handleEventAPI,
  generateSmartContract,
  parseGeneratedContract
}; 