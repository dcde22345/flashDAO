// Claude API流式輸出測試腳本
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const LOG_FILE = path.join(__dirname, '../../logs/claude_stream_test.log');
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
 * 使用流式API測試與Claude API的連接
 */
async function testClaudeStreamConnection() {
  log("開始測試Claude API流式連接...");
  
  if (!CLAUDE_API_KEY) {
    log("錯誤: CLAUDE_API_KEY環境變數未設置");
    process.exit(1);
  }
  
  const testPrompt = "請用5個段落詳細介紹台灣的地震歷史，每個段落至少100字。";
  
  try {
    log("發送流式請求到Claude API...");
    log("----------------------------------------");
    
    const response = await axios({
      method: 'post',
      url: CLAUDE_API_URL,
      data: {
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: testPrompt
          }
        ],
        stream: true // 啟用流式輸出
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      responseType: 'stream' // 將響應類型設置為stream
    });
    
    // 處理流式響應
    let fullResponse = '';
    let buffer = '';
    
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
              
              // 檢查是否有delta內容
              if (parsed.type === 'content_block_start') {
                // 新的內容塊開始
                log('開始接收內容...');
              } else if (parsed.type === 'content_block_delta') {
                // 增量內容更新
                const textDelta = parsed.delta?.text || '';
                if (textDelta) {
                  process.stdout.write(textDelta); // 即時顯示到控制台
                  fullResponse += textDelta;
                }
              } else if (parsed.type === 'content_block_stop') {
                // 內容塊結束
                log('\n內容接收完畢');
              } else if (parsed.type === 'message_stop') {
                // 整個消息結束
                log('\n完整回應已接收');
              } else {
                log(`接收到其他類型的事件: ${parsed.type}`);
              }
            } catch (err) {
              log(`\n解析JSON時出錯: ${err.message}`);
              log(`問題數據: ${data}`);
            }
          }
        }
      });
      
      response.data.on('end', () => {
        log("\n----------------------------------------");
        log("流式API連接測試完成，正常工作！");
        log(`完整回應長度: ${fullResponse.length} 字元`);
        resolve(true);
      });
      
      response.data.on('error', (err) => {
        log(`流式API連接出錯: ${err.message}`);
        reject(err);
      });
    });
    
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
  log("===== Claude API流式輸出測試 =====");
  try {
    const success = await testClaudeStreamConnection();
    
    if (success) {
      log("✅ 測試成功 - Claude API流式連接正常");
      process.exit(0);
    } else {
      log("❌ 測試失敗 - 請檢查API密鑰和網絡連接");
      process.exit(1);
    }
  } catch (error) {
    log(`致命錯誤: ${error.message}`);
    process.exit(1);
  }
})(); 