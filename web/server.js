/**
 * Web UI 服务器
 * 提供基于Web的聊天界面
 */

import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupChatRoutes } from './api/chat.js';
import { setupSessionRoutes } from './api/session.js';
import { setupConfigRoutes } from './api/config.js';
import { setupPluginRoutes } from './api/plugins.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Web服务器类
 */
class WebServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || '0.0.0.0';
    this.app = express();
    this.server = null;
    this.io = null;

    this._setupMiddleware();
    this._setupRoutes();
  }

  /**
   * 设置中间件
   */
  _setupMiddleware() {
    // JSON解析
    this.app.use(express.json());

    // 静态文件
    const distPath = path.join(__dirname, 'dist');
    this.app.use(express.static(distPath));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * 设置路由
   */
  _setupRoutes() {
    // API 路由
    setupChatRoutes(this.app);
    setupSessionRoutes(this.app);
    setupConfigRoutes(this.app);
    setupPluginRoutes(this.app, this.io);

    // API 状态
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'ok',
        version: '2.3.5',
        timestamp: new Date().toISOString()
      });
    });

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ healthy: true });
    });

    // SPA fallback
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  /**
   * 启动服务器
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.app);
      this.io = new SocketServer(this.server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      });

      this._setupSocketIO();

      this.server.listen(this.port, this.host, () => {
        const url = `http://${this.host === '0.0.0.0' ? 'localhost' : this.host}:${this.port}`;
        console.log(`\n✅ Web UI 服务器启动成功!`);
        console.log(`   🌐 访问地址: ${url}`);
        console.log(`   📡 WebSocket: ws://${this.host === '0.0.0.0' ? 'localhost' : this.host}:${this.port}`);
        console.log(`   🔍 健康检查: ${url}/health`);
        console.log(`   📊 API 状态: ${url}/api/status`);
        console.log(`\n⚠️  提示: 在 xz-chat 控制台使用 Ctrl+C 停止服务器\n`);
        resolve();
      });

      this.server.on('error', (error) => {
        console.error('启动失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 设置Socket.IO
   */
  _setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log(`客户端连接: ${socket.id}`);

      // 加入房间
      socket.on('join', (sessionId) => {
        socket.join(sessionId);
        console.log(`客户端 ${socket.id} 加入会话 ${sessionId}`);
      });

      // 消息
      socket.on('message', async (data) => {
        const { sessionId, message } = data;

        // 广播给同一会话的其他客户端
        socket.to(sessionId).emit('message', {
          ...message,
          timestamp: new Date().toISOString()
        });

        // 这里可以添加AI回复逻辑
        console.log(`会话 ${sessionId} 收到消息:`, message.content.substring(0, 50));
      });

      // 断开连接
      socket.on('disconnect', () => {
        console.log(`客户端断开: ${socket.id}`);
      });
    });
  }

  /**
   * 停止服务器
   */
  async stop() {
    if (this.io) {
      this.io.close();
    }
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
    }
    console.log('服务器已停止');
  }
}

/**
 * 启动Web UI
 */
export async function startWebUI(options = {}) {
  const server = new WebServer(options);
  await server.start();
  return server;
}

export default {
  WebServer,
  startWebUI
};
