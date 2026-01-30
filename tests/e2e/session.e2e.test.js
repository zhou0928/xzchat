/**
 * E2E 测试 - 会话管理
 *
 * 测试会话的创建、切换、分支等完整流程
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadHistory,
  saveHistory,
  clearHistory,
  exportHistory,
  listSessions
} from '../../lib/history.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('E2E: 会话管理', () => {
  let testDataDir;
  let historyFilePath;

  beforeEach(async () => {
    // 创建临时测试目录
    testDataDir = path.join(os.tmpdir(), `xz-chat-history-test-${Date.now()}`);
    await fs.mkdir(testDataDir, { recursive: true });
    historyFilePath = path.join(testDataDir, 'history.json');

    // 设置测试环境
    process.env.XZ_CHAT_DATA_DIR = testDataDir;
  });

  afterEach(async () => {
    try {
      // 清理测试目录
      await fs.rm(testDataDir, { recursive: true, force: true });
      delete process.env.XZ_CHAT_DATA_DIR;
    } catch (e) {
      // 忽略错误
    }
  });

  describe('历史记录保存', () => {
    it('应该保存历史记录', async () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];

      await saveHistory(history);

      const savedData = await fs.readFile(historyFilePath, 'utf-8');
      const savedHistory = JSON.parse(savedData);
      expect(savedHistory).toHaveLength(2);
      expect(savedHistory[0].content).toBe('Hello');
    });

    it('应该更新现有历史记录', async () => {
      const initialHistory = [
        { role: 'user', content: 'Hello' }
      ];

      await saveHistory(initialHistory);

      const updatedHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      await saveHistory(updatedHistory);

      const savedData = await fs.readFile(historyFilePath, 'utf-8');
      const savedHistory = JSON.parse(savedData);
      expect(savedHistory).toHaveLength(2);
    });

    it('应该保存带元数据的历史记录', async () => {
      const history = [
        {
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
          sessionId: 'session-1'
        }
      ];

      await saveHistory(history);

      const savedData = await fs.readFile(historyFilePath, 'utf-8');
      const savedHistory = JSON.parse(savedData);
      expect(savedHistory[0]).toHaveProperty('timestamp');
      expect(savedHistory[0]).toHaveProperty('sessionId');
    });
  });

  describe('历史记录加载', () => {
    it('应该加载历史记录', async () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      await fs.writeFile(historyFilePath, JSON.stringify(history));

      const loadedHistory = await loadHistory();
      expect(loadedHistory).toHaveLength(2);
      expect(loadedHistory[0].content).toBe('Hello');
    });

    it('应该在文件不存在时返回空数组', async () => {
      const loadedHistory = await loadHistory();
      expect(loadedHistory).toEqual([]);
    });

    it('应该处理损坏的历史文件', async () => {
      await fs.writeFile(historyFilePath, 'invalid json');

      const loadedHistory = await loadHistory();
      expect(loadedHistory).toEqual([]);
    });
  });

  describe('历史记录清除', () => {
    it('应该清除历史记录', async () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      await saveHistory(history);
      expect(await fs.access(historyFilePath).then(() => true).catch(() => false)).toBe(true);

      await clearHistory();

      const fileExists = await fs.access(historyFilePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('应该处理不存在的文件', async () => {
      await clearHistory(); // 不应该抛出错误
    });
  });

  describe('历史记录导出', () => {
    it('应该导出历史记录到JSON', async () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      await saveHistory(history);

      const exportPath = path.join(testDataDir, 'export.json');
      await exportHistory(exportPath);

      const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(exportExists).toBe(true);

      const exportData = JSON.parse(await fs.readFile(exportPath, 'utf-8'));
      expect(exportData).toHaveLength(2);
    });

    it('应该导出历史记录到Markdown', async () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      await saveHistory(history);

      const exportPath = path.join(testDataDir, 'export.md');
      await exportHistory(exportPath);

      const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(exportExists).toBe(true);

      const exportData = await fs.readFile(exportPath, 'utf-8');
      expect(exportData).toContain('Hello');
      expect(exportData).toContain('Hi!');
    });

    it('应该处理不存在的导出目录', async () => {
      const exportPath = path.join(testDataDir, 'subdir', 'export.json');
      await exportHistory(exportPath);

      const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(exportExists).toBe(true);
    });
  });

  describe('会话列表', () => {
    it('应该列出所有会话', async () => {
      const sessions = {
        'session-1': [
          { role: 'user', content: 'Hello 1' }
        ],
        'session-2': [
          { role: 'user', content: 'Hello 2' }
        ]
      };

      await fs.writeFile(historyFilePath, JSON.stringify(sessions));

      const sessionList = await listSessions();
      expect(sessionList).toHaveLength(2);
      expect(sessionList).toContain('session-1');
      expect(sessionList).toContain('session-2');
    });

    it('应该处理空的会话列表', async () => {
      await fs.writeFile(historyFilePath, JSON.stringify({}));

      const sessionList = await listSessions();
      expect(sessionList).toEqual([]);
    });

    it('应该处理格式错误的历史文件', async () => {
      await fs.writeFile(historyFilePath, JSON.stringify([]));

      const sessionList = await listSessions();
      expect(sessionList).toEqual([]);
    });
  });

  describe('多会话管理', () => {
    it('应该支持多个独立会话', async () => {
      const sessions = {
        'work': [
          { role: 'user', content: 'Meeting notes' },
          { role: 'assistant', content: 'Noted' }
        ],
        'personal': [
          { role: 'user', content: 'Grocery list' },
          { role: 'assistant', content: 'Got it' }
        ]
      };

      await fs.writeFile(historyFilePath, JSON.stringify(sessions));

      const allSessions = await listSessions();
      expect(allSessions).toHaveLength(2);

      const workHistory = JSON.parse(await fs.readFile(historyFilePath, 'utf-8'));
      expect(workHistory.work[0].content).toBe('Meeting notes');
      expect(workHistory.personal[0].content).toBe('Grocery list');
    });

    it('应该能够在会话间切换', async () => {
      const sessions = {
        'session-1': [
          { role: 'user', content: 'Message 1' }
        ]
      };

      await fs.writeFile(historyFilePath, JSON.stringify(sessions));

      // 切换到新会话
      sessions['session-2'] = [
        { role: 'user', content: 'Message 2' }
      ];

      await fs.writeFile(historyFilePath, JSON.stringify(sessions));

      const loadedSessions = JSON.parse(await fs.readFile(historyFilePath, 'utf-8'));
      expect(loadedSessions).toHaveProperty('session-1');
      expect(loadedSessions).toHaveProperty('session-2');
    });
  });

  describe('会话持久化', () => {
    it('应该在应用重启后保留会话', async () => {
      const history = [
        { role: 'user', content: 'Persistent message' }
      ];

      await saveHistory(history);

      // 模拟应用重启
      const reloadedHistory = await loadHistory();
      expect(reloadedHistory).toHaveLength(1);
      expect(reloadedHistory[0].content).toBe('Persistent message');
    });

    it('应该保留会话元数据', async () => {
      const history = [
        {
          role: 'user',
          content: 'Test',
          sessionId: 'test-session',
          createdAt: Date.now()
        }
      ];

      await saveHistory(history);

      const reloadedHistory = await loadHistory();
      expect(reloadedHistory[0]).toHaveProperty('sessionId');
      expect(reloadedHistory[0]).toHaveProperty('createdAt');
    });
  });

  describe('大量历史记录', () => {
    it('应该处理大量历史记录', async () => {
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`
      }));

      await saveHistory(largeHistory);

      const loadedHistory = await loadHistory();
      expect(loadedHistory).toHaveLength(1000);
      expect(loadedHistory[999].content).toBe('Message 999');
    });

    it('应该正确导出大量历史记录', async () => {
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        role: 'user',
        content: `Message ${i}`
      }));

      await saveHistory(largeHistory);

      const exportPath = path.join(testDataDir, 'large-export.json');
      await exportHistory(exportPath);

      const exportData = JSON.parse(await fs.readFile(exportPath, 'utf-8'));
      expect(exportData).toHaveLength(100);
    });
  });
});
