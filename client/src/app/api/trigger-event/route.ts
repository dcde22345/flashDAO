import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: NextRequest) {
  try {
    const eventData = await req.json();
    
    // 将事件数据发送到flashdao/agent/agent.ts
    // 由于这里是前端代码，我们需要通过API调用或文件输出的方式
    // 在实际环境中，你可能需要一个专门的后端API来接收这个请求
    
    // 方法1：尝试直接调用本地agent模块（如果在同一服务器上）
    try {
      const response = await fetch('http://localhost:3001/api/agent/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (response.ok) {
        return NextResponse.json({ success: true, message: '事件已发送到agent处理' });
      }
    } catch (error) {
      console.error('无法直接调用agent API:', error);
      // 失败后继续尝试方法2
    }
    
    // 方法2：记录到日志文件，让agent轮询读取（备选方案）
    const logsDir = path.resolve(process.cwd(), '../../agent/logs');
    
    // 确保日志目录存在
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const filename = `event_${Date.now()}.json`;
    const filePath = path.join(logsDir, filename);
    
    fs.writeFileSync(filePath, JSON.stringify(eventData, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: '事件已记录，等待agent处理',
      method: 'file_log',
      filePath
    });
    
  } catch (error) {
    console.error('处理事件时出错:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 