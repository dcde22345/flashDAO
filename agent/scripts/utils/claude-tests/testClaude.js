// Claude API連接測試腳本
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const LOG_FILE = path.join(__dirname, '../../logs/claude_test.log');
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = "claude-3-opus-20240229"; // 使用可用的模型

// 確保日誌目錄存在
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 初始化日誌記錄
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

/**
 * 測試與Claude API的連接
 */
async function testClaudeConnection() {
  log("開始測試Claude API連接...");
  
  if (!CLAUDE_API_KEY) {
    log("錯誤: CLAUDE_API_KEY環境變數未設置");
    process.exit(1);
  }
  
  const testPrompt = "請用一句話介紹你自己，並回覆「連接成功」來確認API連接正常工作。";
  
  try {
    log("發送測試請求到Claude API...");
    
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: CLAUDE_MODEL,
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: testPrompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    const reply = response.data.content[0].text;
    log("收到Claude回應:");
    log("----------------------------------------");
    log(reply);
    log("----------------------------------------");
    log("API連接測試完成，正常工作！");
    
    return true;
  } catch (error) {
    log("API連接測試失敗:");
    if (error.response) {
      log(`狀態碼: ${error.response.status}`);
      log(`錯誤信息: ${JSON.stringify(error.response.data)}`);
    } else {
      log(`錯誤: ${error.message}`);
    }
    return false;
  }
}

// 執行測試
(async () => {
  log("===== Claude API連接測試 =====");
  const success = await testClaudeConnection();
  
  if (success) {
    log("✅ 測試成功 - Claude API連接正常");
    process.exit(0);
  } else {
    log("❌ 測試失敗 - 請檢查API密鑰和網絡連接");
    process.exit(1);
  }
})(); 