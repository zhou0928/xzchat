/**
 * 文件加载器单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  loadFile,
  loadJSON,
  loadText,
  fileExists,
  ensureDir
} from '../../lib/utils/file-loader.js';

describe('文件加载器', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `file-loader-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // 忽略
    }
  });

  describe('loadFile', () => {
    it('应该加载文件', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'Test content');

      const content = await loadFile(filePath);
      expect(content).toBe('Test content');
    });

    it('应该抛出文件不存在错误', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');

      await expect(loadFile(filePath)).rejects.toThrow();
    });

    it('应该支持指定编码', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, '测试内容', 'utf-8');

      const content = await loadFile(filePath, 'utf-8');
      expect(content).toBe('测试内容');
    });

    it('应该处理空文件', async () => {
      const filePath = path.join(testDir, 'empty.txt');
      await fs.writeFile(filePath, '');

      const content = await loadFile(filePath);
      expect(content).toBe('');
    });
  });

  describe('loadJSON', () => {
    it('应该加载JSON文件', async () => {
      const filePath = path.join(testDir, 'test.json');
      const data = { key: 'value', number: 42 };
      await fs.writeFile(filePath, JSON.stringify(data));

      const loaded = await loadJSON(filePath);
      expect(loaded).toEqual(data);
    });

    it('应该抛出无效JSON错误', async () => {
      const filePath = path.join(testDir, 'invalid.json');
      await fs.writeFile(filePath, '{ invalid json }');

      await expect(loadJSON(filePath)).rejects.toThrow();
    });

    it('应该支持JSON带注释', async () => {
      const filePath = path.join(testDir, 'test.json');
      await fs.writeFile(filePath, '{\n  "key": "value" // comment\n}');

      const loaded = await loadJSON(filePath);
      expect(loaded).toEqual({ key: 'value' });
    });

    it('应该处理空JSON对象', async () => {
      const filePath = path.join(testDir, 'empty.json');
      await fs.writeFile(filePath, '{}');

      const loaded = await loadJSON(filePath);
      expect(loaded).toEqual({});
    });
  });

  describe('loadText', () => {
    it('应该加载文本文件', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'Line 1\nLine 2\nLine 3');

      const text = await loadText(filePath);
      expect(text).toBe('Line 1\nLine 2\nLine 3');
    });

    it('应该处理不同换行符', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'Line 1\r\nLine 2\rLine 3');

      const text = await loadText(filePath);
      expect(text).toContain('Line 1');
      expect(text).toContain('Line 2');
      expect(text).toContain('Line 3');
    });

    it('应该处理UTF-8编码', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, '中文测试', 'utf-8');

      const text = await loadText(filePath);
      expect(text).toBe('中文测试');
    });
  });

  describe('fileExists', () => {
    it('应该返回true对于存在的文件', async () => {
      const filePath = path.join(testDir, 'exists.txt');
      await fs.writeFile(filePath, 'content');

      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('应该返回false对于不存在的文件', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');

      const exists = await fileExists(filePath);
      expect(exists).toBe(false);
    });

    it('应该返回true对于存在的目录', async () => {
      const exists = await fileExists(testDir);
      expect(exists).toBe(true);
    });

    it('应该处理相对路径', async () => {
      process.chdir(testDir);
      await fs.writeFile('test.txt', 'content');

      const exists = await fileExists('test.txt');
      expect(exists).toBe(true);
    });
  });

  describe('ensureDir', () => {
    it('应该创建不存在的目录', async () => {
      const newDir = path.join(testDir, 'new', 'nested', 'dir');
      await ensureDir(newDir);

      const exists = await fileExists(newDir);
      expect(exists).toBe(true);
    });

    it('不应该抛出错误如果目录已存在', async () => {
      await expect(ensureDir(testDir)).resolves.not.toThrow();
    });

    it('应该创建多级目录', async () => {
      const deepDir = path.join(testDir, 'a', 'b', 'c', 'd');
      await ensureDir(deepDir);

      const exists = await fileExists(deepDir);
      expect(exists).toBe(true);
    });

    it('应该处理空路径', async () => {
      await expect(ensureDir('')).resolves.not.toThrow();
    });

    it('应该处理当前目录', async () => {
      await expect(ensureDir('.')).resolves.not.toThrow();
    });
  });

  describe('组合操作', () => {
    it('应该确保目录后加载文件', async () => {
      const dataDir = path.join(testDir, 'data');
      const filePath = path.join(dataDir, 'config.json');

      await ensureDir(dataDir);
      await fs.writeFile(filePath, JSON.stringify({ test: true }));

      const loaded = await loadJSON(filePath);
      expect(loaded).toEqual({ test: true });
    });

    it('应该检查文件是否存在后加载', async () => {
      const filePath = path.join(testDir, 'test.json');

      const exists = await fileExists(filePath);
      expect(exists).toBe(false);

      await fs.writeFile(filePath, '{}');

      const existsAfter = await fileExists(filePath);
      expect(existsAfter).toBe(true);

      const loaded = await loadJSON(filePath);
      expect(loaded).toEqual({});
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊文件名', async () => {
      const specialNames = [
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file_with_underscores.txt',
        '文件.txt',
        'файл.txt'
      ];

      for (const name of specialNames) {
        const filePath = path.join(testDir, name);
        await fs.writeFile(filePath, name);
        const content = await loadText(filePath);
        expect(content).toBe(name);
      }
    });

    it('应该处理大型文件', async () => {
      const filePath = path.join(testDir, 'large.txt');
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB
      await fs.writeFile(filePath, largeContent);

      const content = await loadText(filePath);
      expect(content).toBe(largeContent);
    });

    it('应该处理二进制文件', async () => {
      const filePath = path.join(testDir, 'binary.bin');
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xFF]);
      await fs.writeFile(filePath, binaryContent);

      const content = await loadFile(filePath, null);
      expect(Buffer.isBuffer(content)).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理权限错误', async () => {
      const filePath = path.join(testDir, 'restricted.txt');
      await fs.writeFile(filePath, 'content');
      await fs.chmod(filePath, 0o000);

      try {
        await loadFile(filePath);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        await fs.chmod(filePath, 0o644);
      }
    });

    it('应该处理目录作为文件路径', async () => {
      await expect(loadFile(testDir)).rejects.toThrow();
    });

    it('应该处理无效路径', async () => {
      const invalidPath = '\0invalid';
      await expect(loadFile(invalidPath)).rejects.toThrow();
    });
  });
});
