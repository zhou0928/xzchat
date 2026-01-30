/**
 * MCP Lite模块单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient } from '../../lib/mcp-lite.js';

describe('MCP Lite模块', () => {
  let client;

  beforeEach(() => {
    // Mock WebSocket or HTTP connection
    global.MockMCPConnection = vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(),
      send: vi.fn().mockResolvedValue(),
      close: vi.fn().mockResolvedValue(),
      on: vi.fn()
    }));
  });

  afterEach(() => {
    delete global.MockMCPConnection;
  });

  describe('构造函数', () => {
    it('应该创建MCP客户端实例', () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('应该使用默认配置', () => {
      client = new MCPClient();
      expect(client).toBeInstanceOf(MCPClient);
    });

    it('应该设置连接超时', () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp',
        timeout: 5000
      });
      expect(client.timeout).toBe(5000);
    });
  });

  describe('连接管理', () => {
    it('应该连接到MCP服务器', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();
      expect(client.connected).toBe(true);
    });

    it('应该处理连接失败', async () => {
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn()
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await expect(client.connect()).rejects.toThrow('Connection failed');
    });

    it('应该断开连接', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();
      await client.disconnect();
      expect(client.connected).toBe(false);
    });

    it('应该自动重连', async () => {
      let connectCount = 0;
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockImplementation(async () => {
          connectCount++;
          if (connectCount < 2) {
            throw new Error('Temporary error');
          }
        }),
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn()
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp',
        autoReconnect: true,
        maxRetries: 3
      });

      await client.connect();
      expect(connectCount).toBeGreaterThan(1);
    });
  });

  describe('工具调用', () => {
    it('应该调用MCP工具', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();

      const result = await client.callTool('test-tool', { param: 'value' });
      expect(result).toBeDefined();
    });

    it('应该传递参数到工具', async () => {
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(),
        send: vi.fn().mockImplementation((data) => {
          expect(data.tool).toBe('test-tool');
          expect(data.params).toEqual({ param: 'value' });
          return Promise.resolve();
        }),
        close: vi.fn(),
        on: vi.fn()
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();
      await client.callTool('test-tool', { param: 'value' });
    });

    it('应该处理工具调用错误', async () => {
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(),
        send: vi.fn().mockRejectedValue(new Error('Tool error')),
        close: vi.fn(),
        on: vi.fn()
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();

      await expect(client.callTool('test-tool', {}))
        .rejects.toThrow('Tool error');
    });
  });

  describe('资源访问', () => {
    it('应该访问MCP资源', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();

      const resource = await client.getResource('file:///path/to/file.txt');
      expect(resource).toBeDefined();
    });

    it('应该处理资源不存在', async () => {
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(),
        send: vi.fn().mockResolvedValue({
          error: 'Resource not found'
        }),
        close: vi.fn(),
        on: vi.fn()
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();

      await expect(client.getResource('file:///nonexistent.txt'))
        .rejects.toThrow();
    });
  });

  describe('提示模板', () => {
    it('应该执行提示模板', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();

      const result = await client.executePrompt('summary', { text: 'Test content' });
      expect(result).toBeDefined();
    });

    it('应该传递参数到提示', async () => {
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(),
        send: vi.fn().mockImplementation((data) => {
          expect(data.prompt).toBe('summary');
          expect(data.params).toEqual({ text: 'Test content' });
          return Promise.resolve();
        }),
        close: vi.fn(),
        on: vi.fn()
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();
      await client.executePrompt('summary', { text: 'Test content' });
    });
  });

  describe('事件处理', () => {
    it('应该监听连接事件', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      let connected = false;
      client.on('connected', () => {
        connected = true;
      });

      await client.connect();
      expect(connected).toBe(true);
    });

    it('应该监听断开事件', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();

      let disconnected = false;
      client.on('disconnected', () => {
        disconnected = true;
      });

      await client.disconnect();
      expect(disconnected).toBe(true);
    });

    it('应该监听错误事件', async () => {
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockRejectedValue(new Error('Connection error')),
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Connection error'));
          }
        })
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      let errorReceived = false;
      client.on('error', () => {
        errorReceived = true;
      });

      try {
        await client.connect();
      } catch (e) {
        // 忽略
      }

      expect(errorReceived).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理空参数', async () => {
      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp'
      });

      await client.connect();

      const result = await client.callTool('test-tool');
      expect(result).toBeDefined();
    });

    it('应该处理超时', async () => {
      const mockConn = vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue(),
        send: vi.fn().mockImplementation(() => {
          return new Promise(resolve => setTimeout(resolve, 6000));
        }),
        close: vi.fn(),
        on: vi.fn()
      }));

      global.MockMCPConnection = mockConn;

      client = new MCPClient({
        endpoint: 'http://localhost:3000/mcp',
        timeout: 1000
      });

      await client.connect();

      await expect(client.callTool('test-tool'))
        .rejects.toThrow();
    });
  });
});
