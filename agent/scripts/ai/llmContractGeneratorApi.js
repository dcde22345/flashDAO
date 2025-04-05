// LLM-powered Smart Contract Generator API Module
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CONTRACTS_DIR = path.join(__dirname, '../../../contract/contracts');
const LOG_FILE = path.join(__dirname, '../../../logs/llm_agent.log');
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = "claude-3-opus-20240229"; // 使用可用的Claude模型

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logger function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Helper for sending SSE events
function sendSSE(res, event, data) {
  if (res) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

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

async function generateFactoryContract(contractDetails, res = null) {
  log(`Generating factory contract for ${contractDetails.name}`);
  
  if (res) {
    sendSSE(res, 'progress', {
      status: 'generating',
      step: 'factory',
      message: '生成工廠合約',
      progress: 92
    });
  }
  
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
 * Save the generated contract to a file
 * @param {Object} contractDetails - Details of the generated contract
 * @param {http.ServerResponse} res - Express response object for streaming
 * @returns {string} - Path to the saved file
 */
async function saveContractToFile(contractDetails, res = null) {
  // 保存到contracts目錄
  let fileName = contractDetails.fileName;
  let filePath = path.join(CONTRACTS_DIR, fileName);
  
  if (res) {
    sendSSE(res, 'progress', {
      status: 'saving',
      step: 'contract',
      message: '保存智能合約文件',
      progress: 90
    });
  }
  
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
  
  if (res) {
    sendSSE(res, 'info', {
      message: `合約已保存到日誌：${logFileName}`,
      logFile: logFileName
    });
  }
  
  return filePath;
} 