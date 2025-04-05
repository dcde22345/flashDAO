// Claude API流式輸出簡單測試腳本
require('dotenv').config();
const https = require('https');

// 配置
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'api.anthropic.com';
const CLAUDE_MODEL = "claude-3-opus-20240229"; // 使用可用的模型

// 初始化日誌記錄
function log(message) {
  console.log(message);
}

/**
 * 使用Node.js原生HTTPS進行流式測試
 */
function testClaudeStreamWithHttps() {
  log("===== Claude API流式輸出測試 (使用HTTPS) =====");
  log("開始測試Claude API流式連接...");
  
  if (!CLAUDE_API_KEY) {
    log("錯誤: CLAUDE_API_KEY環境變數未設置");
    process.exit(1);
  }
  
  const testPrompt = "請用5個段落詳細介紹台灣的地震歷史，每個段落至少100字。";
  
  const data = JSON.stringify({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    stream: true,
    messages: [
      {
        role: "user",
        content: testPrompt
      }
    ]
  });
  
  const options = {
    hostname: CLAUDE_API_URL,
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    }
  };
  
  log("發送請求到Claude API...");
  log("----------------------------------------");
  
  const req = https.request(options, (res) => {
    let dataBuffer = '';
    
    res.on('data', (chunk) => {
      // 輸出原始數據查看結構
      const rawData = chunk.toString();
      dataBuffer += rawData;
      
      // 特別輸出原始數據以了解結構
      process.stdout.write(rawData);
    });
    
    res.on('end', () => {
      log("\n----------------------------------------");
      log("API回應接收完畢");
      log(`狀態碼: ${res.statusCode}`);
      log(`完整回應長度: ${dataBuffer.length} 字元`);
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    log(`錯誤: ${error.message}`);
    process.exit(1);
  });
  
  // 寫入請求數據
  req.write(data);
  req.end();
}

// 直接執行測試
testClaudeStreamWithHttps(); 