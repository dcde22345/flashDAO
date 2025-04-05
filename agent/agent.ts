//  从前端post資料過來
import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';

// 定义事件接口
interface DisasterEvent {
  type: string;
  name: string;
  description: string;
  severity: number;
  location: string;
  date: string;
}

// 创建express应用
const app = express();
app.use(cors());
app.use(express.json());

// 创建日志目录
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 处理事件的函数
function processEvent(event: DisasterEvent) {
  console.log('收到灾害事件:', event);
  
  // 记录事件到日志
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(logsDir, `event_${timestamp}.json`);
  fs.writeFileSync(logFile, JSON.stringify(event, null, 2));
  
  // TODO: 根据事件类型和严重程度进行不同的处理
  if (event.type === 'Earthquake' && event.severity >= 7) {
    console.log('严重地震事件! 启动紧急响应流程...');
    // 这里可以添加紧急响应逻辑
  }
  
  return { success: true, message: '事件已处理', logFile };
}

// API路由 - 接收事件触发
app.post('/api/agent/trigger', (req: Request, res: Response) => {
  try {
    const eventData = req.body as DisasterEvent;
    const result = processEvent(eventData);
    res.json(result);
  } catch (error) {
    console.error('处理事件时出错:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// 检查日志文件夹中的事件
app.get('/api/agent/events', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(logsDir).filter(file => file.startsWith('event_'));
    const events = files.map(file => {
      const filePath = path.join(logsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        filename: file,
        timestamp: file.replace('event_', '').replace('.json', ''),
        data: JSON.parse(content)
      };
    });
    
    res.json({ success: true, events });
  } catch (error) {
    console.error('获取事件列表时出错:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// 启动服务器
const PORT = 3001;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Agent服务器运行在: http://localhost:${PORT}`);
});

// 处理关闭
process.on('SIGINT', () => {
  console.log('关闭agent服务器...');
  server.close(() => {
    console.log('Agent服务器已关闭');
    process.exit(0);
  });
});