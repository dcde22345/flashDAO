// FlashDAO - 智能合約日誌API端點
const fs = require('fs');
const path = require('path');

/**
 * 合約日誌API處理程序
 * @param {http.IncomingMessage} req - 請求對象
 * @param {http.ServerResponse} res - 響應對象
 */
export default async function handler(req, res) {
  // 只允許GET請求
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: '方法不允許' });
    return;
  }

  try {
    const logsDir = path.join(process.cwd(), 'logs/contracts');
    
    // 檢查logs目錄是否存在
    if (!fs.existsSync(logsDir)) {
      return res.status(200).json({ contracts: [] });
    }
    
    // 獲取指定文件內容
    const fileName = req.query.file;
    if (fileName) {
      const filePath = path.join(logsDir, fileName);
      
      // 檢查該檔案是否存在且在 logs/contracts 下（安全檢查）
      if (!fs.existsSync(filePath) || !filePath.startsWith(logsDir)) {
        return res.status(404).json({ message: '檔案不存在' });
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      return res.status(200).json({ fileName, content });
    }
    
    // 獲取所有合約日誌文件
    const files = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.sol'))
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        // 嘗試從文件開頭讀取元數據
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').slice(0, 5);
        
        // 解析元數據
        const metadata = {
          name: '',
          type: '',
          location: '',
          severity: '',
          date: ''
        };
        
        lines.forEach(line => {
          if (line.includes('Generated for:')) metadata.name = line.split('Generated for:')[1].trim();
          if (line.includes('Event Type:')) metadata.type = line.split('Event Type:')[1].trim();
          if (line.includes('Location:')) metadata.location = line.split('Location:')[1].trim();
          if (line.includes('Severity:')) metadata.severity = line.split('Severity:')[1].trim();
          if (line.includes('Generated at:')) metadata.date = line.split('Generated at:')[1].trim();
        });
        
        return {
          fileName: file,
          created: stats.birthtime,
          size: stats.size,
          ...metadata
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created)); // 最新的排在前面
    
    res.status(200).json({ contracts: files });
  } catch (error) {
    console.error('API錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '伺服器錯誤', 
      error: error.message 
    });
  }
} 