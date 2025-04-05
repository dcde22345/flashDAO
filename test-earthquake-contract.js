// 測試LLM合約生成 - 地震事件測試腳本
const path = require('path');
const fs = require('fs');

// 使用agent目錄中的環境變數
process.env.DOTENV_CONFIG_PATH = path.join(__dirname, 'agent/.env');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH });

// 確保日誌目錄存在
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 設置日誌文件
const LOG_FILE = path.join(logDir, 'test-earthquake.log');

// 日誌函數
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

// 自定義地震事件數據
const customEarthquakeEvent = {
  type: "Earthquake",
  name: "Taiwan East Coast Earthquake",
  description: "A magnitude 6.8 earthquake struck off Taiwan's east coast, causing damage to buildings and infrastructure in coastal communities.",
  severity: 7,
  location: "East Coast, Taiwan",
  date: new Date().toISOString()
};

// 主函數
async function testEarthquakeContract() {
  log("==================================================");
  log("開始測試地震智能合約生成");
  log("==================================================");
  
  try {
    log("測試場景: 台灣東海岸地震");
    log(`事件類型: ${customEarthquakeEvent.type}`);
    log(`事件名稱: ${customEarthquakeEvent.name}`);
    log(`嚴重程度: ${customEarthquakeEvent.severity}/10`);
    log(`位置: ${customEarthquakeEvent.location}`);
    
    // 使用自定義事件直接調用handleEvent
    const { handleEvent } = require('./agent/scripts/ai/llmContractGenerator');
    log("正在生成合約...");
    
    const result = await handleEvent(customEarthquakeEvent);
    
    if (result) {
      log("✅ 測試成功: 合約生成完成");
      log("合約文件已保存到 contract/contracts 目錄");
      log("==================================================");
    } else {
      log("❌ 測試失敗: 合約生成過程中出現錯誤");
      log("==================================================");
      process.exit(1);
    }
  } catch (error) {
    log(`❌ 測試過程中發生錯誤: ${error.message}`);
    if (error.stack) {
      log(error.stack);
    }
    log("==================================================");
    process.exit(1);
  }
}

// 執行測試
testEarthquakeContract()
  .then(() => {
    log("測試腳本執行完畢");
    process.exit(0);
  })
  .catch(error => {
    log(`致命錯誤: ${error.message}`);
    process.exit(1);
  }); 