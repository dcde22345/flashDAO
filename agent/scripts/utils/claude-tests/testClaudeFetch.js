// Claude API流式輸出測試腳本 (使用fetch API)
require('dotenv').config();

// 配置
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = "claude-3-opus-20240229"; // 使用可用的模型

// 使用fetch API測試Claude流式輸出
async function testClaudeStream() {
  console.log("===== Claude API流式輸出測試 =====");
  console.log("開始測試Claude API流式連接...");
  
  if (!CLAUDE_API_KEY) {
    console.error("錯誤: CLAUDE_API_KEY環境變數未設置");
    process.exit(1);
  }
  
  const testPrompt = "請用5個段落詳細介紹台灣的地震歷史，每個段落至少100字。";
  
  // 指定使用Node.js內置的fetch
  const fetch = globalThis.fetch;
  
  try {
    console.log("發送請求到Claude API...");
    console.log("----------------------------------------");
    
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        stream: true,
        messages: [{
          role: "user",
          content: testPrompt
        }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API錯誤: ${response.status} ${response.statusText}`);
      console.error(errorText);
      process.exit(1);
    }
    
    // 獲取ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
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
              fullText += parsed.delta.text;
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    }
    
    console.log("\n----------------------------------------");
    console.log("流式傳輸完成");
    console.log(`總文本長度: ${fullText.length} 字元`);
    
  } catch (error) {
    console.error(`錯誤: ${error.message}`);
    process.exit(1);
  }
}

// 執行測試
testClaudeStream().catch(err => {
  console.error("未處理的錯誤:", err);
  process.exit(1);
}); 