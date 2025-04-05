// FlashDAO - 合約生成API端點
const { handleEvent } = require('../scripts/ai/llmContractGeneratorApi');

// 禁用默認body解析，以便正確處理流式響應
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * 從請求中讀取JSON數據
 * @param {http.IncomingMessage} req - 請求對象 
 * @returns {Promise<Object>} - 解析後的JSON數據
 */
async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        resolve(data);
      } catch (error) {
        reject(new Error('無法解析請求數據'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * 合約生成API處理程序
 * @param {http.IncomingMessage} req - 請求對象
 * @param {http.ServerResponse} res - 響應對象
 */
export default async function handler(req, res) {
  // 只允許POST請求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: '方法不允許' });
    return;
  }

  try {
    // 檢查是否請求流式輸出
    const isStream = req.headers['accept'] === 'text/event-stream';
    
    // 讀取請求數據
    const data = await readRequestBody(req);
    
    // 驗證必填字段
    const requiredFields = ['type', 'name', 'description', 'severity', 'location'];
    for (const field of requiredFields) {
      if (!data[field]) {
        if (isStream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.write(`event: error\n`);
          res.write(`data: ${JSON.stringify({ message: `缺少必要字段: ${field}` })}\n\n`);
          res.write(`event: complete\n`);
          res.write(`data: ${JSON.stringify({ success: false, message: '請求驗證失敗' })}\n\n`);
          res.end();
        } else {
          res.status(400).json({ message: `缺少必要字段: ${field}` });
        }
        return;
      }
    }
    
    // 設置事件日期（如果沒有提供）
    if (!data.date) {
      data.date = new Date().toISOString();
    }
    
    // 處理嚴重性
    if (typeof data.severity === 'string') {
      data.severity = parseInt(data.severity, 10);
    }
    
    if (isNaN(data.severity) || data.severity < 1 || data.severity > 10) {
      if (isStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ message: '嚴重性必須是1到10之間的數字' })}\n\n`);
        res.write(`event: complete\n`);
        res.write(`data: ${JSON.stringify({ success: false, message: '請求驗證失敗' })}\n\n`);
        res.end();
      } else {
        res.status(400).json({ message: '嚴重性必須是1到10之間的數字' });
      }
      return;
    }
    
    // 流式響應
    if (isStream) {
      await handleEvent(data, res);
      res.end();
    } 
    // 標準JSON響應
    else {
      const result = await handleEvent(data);
      res.status(result.success ? 200 : 500).json(result);
    }
  } catch (error) {
    console.error('API錯誤:', error);
    
    if (req.headers['accept'] === 'text/event-stream') {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: `伺服器錯誤: ${error.message}` })}\n\n`);
      res.write(`event: complete\n`);
      res.write(`data: ${JSON.stringify({ success: false, message: '處理失敗' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ 
        success: false, 
        message: '伺服器錯誤', 
        error: error.message 
      });
    }
  }
} 