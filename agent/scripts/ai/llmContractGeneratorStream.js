// LLM-powered Smart Contract Generator Agent with Streaming Output
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
  // 保存到agent_gen_contracts目錄
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
    
    // Step 3: Compile the contract
    const compilationSuccessful = await compileContract(filePath);
    
    if (!compilationSuccessful) {
      log("合約編譯失敗");
      return false;
    }
    
    // Step 4: Generate deployment script using existing FlashDAOFactory
    const scriptPath = await generateDeploymentScript(contractDetails);
    
    log(`事件處理完成，準備部署。`);
    log(`合約已保存到 ${filePath}`);
    log(`部署腳本已生成: ${scriptPath}`);
    log(`部署命令: cd contract && npx hardhat run ${path.relative(path.join(__dirname, '../../../contract'), scriptPath)} --network sepolia`);
    
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
      log("🎉 成功生成智能合約！");
      log(`合約已保存到 contract/agent_gen_contracts 目錄`);
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