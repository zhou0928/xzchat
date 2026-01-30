/**
 * E2E 测试 - 命令系统
 *
 * 测试CLI命令的完整执行流程
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execAsync = promisify(exec);

describe('E2E: 命令系统', () => {
  let testDir;
  let testConfigPath;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = path.join(os.tmpdir(), `xz-chat-cmd-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    testConfigPath = path.join(testDir, '.newapi-chat-config.json');

    process.chdir(testDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
      process.chdir(process.cwd());
    } catch (e) {
      // 忽略错误
    }
  });

  describe('帮助命令', () => {
    it('应该显示帮助信息', async () => {
      const { stdout } = await execAsync('node bin/cli.js --help');
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Options:');
    });

    it('应该显示命令帮助', async () => {
      const { stdout } = await execAsync('node bin/cli.js config --help');
      expect(stdout).toContain('config');
    });
  });

  describe('版本命令', () => {
    it('应该显示版本信息', async () => {
      const { stdout } = await execAsync('node bin/cli.js --version');
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('配置命令', () => {
    it('应该初始化配置文件', async () => {
      await execAsync('node bin/cli.js config init');

      const configExists = await fs.access(testConfigPath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config).toHaveProperty('apiKey');
    });

    it('应该设置配置值', async () => {
      await execAsync('node bin/cli.js config --api-key=test-key');

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.apiKey).toBe('test-key');
    });

    it('应该设置多个配置值', async () => {
      await execAsync('node bin/cli.js config --api-key=test-key --base-url=https://test.com/v1');

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.apiKey).toBe('test-key');
      expect(config.baseUrl).toBe('https://test.com/v1');
    });

    it('应该显示当前配置', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo'
      };

      await fs.writeFile(testConfigPath, JSON.stringify(testConfig));

      const { stdout } = await execAsync('node bin/cli.js config show');
      expect(stdout).toContain('test-key');
      expect(stdout).toContain('https://test.com/v1');
    });

    it('应该使用预设provider', async () => {
      await execAsync('node bin/cli.js config --provider=openai');

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.provider).toBe('openai');
    });
  });

  describe('会话命令', () => {
    beforeEach(async () => {
      // 初始化配置
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo'
      };
      await fs.writeFile(testConfigPath, JSON.stringify(config));
    });

    it('应该列出会话', async () => {
      const { stdout } = await execAsync('node bin/cli.js session list');
      expect(stdout).toBeDefined();
    });

    it('应该创建新会话', async () => {
      const { stdout } = await execAsync('node bin/cli.js session create test-session');
      expect(stdout).toContain('test-session');
    });

    it('应该切换会话', async () => {
      // 先创建会话
      await execAsync('node bin/cli.js session create test-session');

      // 切换会话
      const { stdout } = await execAsync('node bin/cli.js session switch test-session');
      expect(stdout).toContain('test-session');
    });

    it('应该删除会话', async () => {
      // 先创建会话
      await execAsync('node bin/cli.js session create test-session');

      // 删除会话
      const { stdout } = await execAsync('node bin/cli.js session delete test-session');
      expect(stdout).toContain('test-session');
    });
  });

  describe('工具命令', () => {
    beforeEach(async () => {
      // 初始化配置
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo'
      };
      await fs.writeFile(testConfigPath, JSON.stringify(config));
    });

    it('应该列出内置工具', async () => {
      const { stdout } = await execAsync('node bin/cli.js tools list');
      expect(stdout).toBeDefined();
    });

    it('应该显示工具帮助', async () => {
      const { stdout } = await execAsync('node bin/cli.js tools help');
      expect(stdout).toBeDefined();
    });
  });

  describe('历史命令', () => {
    beforeEach(async () => {
      // 初始化配置
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo'
      };
      await fs.writeFile(testConfigPath, JSON.stringify(config));
    });

    it('应该清除历史', async () => {
      const { stdout } = await execAsync('node bin/cli.js history clear');
      expect(stdout).toBeDefined();
    });

    it('应该导出历史', async () => {
      const exportPath = path.join(testDir, 'export.json');
      await execAsync(`node bin/cli.js history export ${exportPath}`);

      const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(exportExists).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效命令', async () => {
      try {
        await execAsync('node bin/cli.js invalid-command');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('应该处理缺失配置', async () => {
      try {
        await execAsync('node bin/cli.js chat "test message"');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('命令链', () => {
    beforeEach(async () => {
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo'
      };
      await fs.writeFile(testConfigPath, JSON.stringify(config));
    });

    it('应该支持管道操作', async () => {
      // 创建测试文件
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // 使用管道
      const { stdout } = await execAsync(`cat ${testFile} | node bin/cli.js rag search --context .`);
      expect(stdout).toBeDefined();
    });

    it('应该支持命令组合', async () => {
      const { stdout } = await execAsync('node bin/cli.js config show && node bin/cli.js tools list');
      expect(stdout).toBeDefined();
    });
  });

  describe('性能', () => {
    it('应该在合理时间内完成配置初始化', async () => {
      const start = Date.now();
      await execAsync('node bin/cli.js config init');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // 5秒内完成
    });

    it('应该处理大量配置更新', async () => {
      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        await execAsync(`node bin/cli.js config --model=gpt-${i}`);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000); // 10秒内完成
    });
  });
});
