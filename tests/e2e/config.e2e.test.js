/**
 * E2E 测试 - 配置管理
 *
 * 测试配置文件的创建、加载、更新等完整流程
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadConfig,
  updateConfig,
  initConfigFile,
  initProjectConfigFile,
  setProfileValue,
  getActiveConfig
} from '../../lib/config.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('E2E: 配置管理', () => {
  let testConfigDir;
  let testConfigPath;

  beforeEach(async () => {
    // 创建临时测试目录
    testConfigDir = path.join(os.tmpdir(), `xz-chat-test-${Date.now()}`);
    await fs.mkdir(testConfigDir, { recursive: true });
    testConfigPath = path.join(testConfigDir, '.newapi-chat-config.json');

    process.chdir(testConfigDir);
  });

  afterEach(async () => {
    try {
      // 清理测试目录
      await fs.rm(testConfigDir, { recursive: true, force: true });
      process.chdir(process.cwd());
    } catch (e) {
      // 忽略错误
    }
  });

  describe('配置文件初始化', () => {
    it('应该创建默认配置文件', async () => {
      initConfigFile(testConfigPath);

      const configExists = await fs.access(testConfigPath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('model');
    });

    it('应该初始化项目配置文件', async () => {
      const projectConfigPath = path.join(testConfigDir, 'newapi-chat.config.json');

      initProjectConfigFile(projectConfigPath);

      const configExists = await fs.access(projectConfigPath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);
    });
  });

  describe('配置加载', () => {
    it('应该加载现有的配置文件', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo',
        provider: 'openai'
      };

      await fs.writeFile(testConfigPath, JSON.stringify(testConfig));

      const config = loadConfig(testConfigPath);
      expect(config.apiKey).toBe('test-key');
      expect(config.baseUrl).toBe('https://test.com/v1');
      expect(config.model).toBe('gpt-3.5-turbo');
    });

    it('应该在配置不存在时返回空对象', async () => {
      const config = loadConfig('/nonexistent/config.json');
      expect(config).toEqual({});
    });

    it('应该优先使用项目目录配置', async () => {
      const projectConfig = {
        apiKey: 'project-key',
        baseUrl: 'https://project.com/v1',
        model: 'gpt-4'
      };

      await fs.writeFile(
        path.join(testConfigDir, 'newapi-chat.config.json'),
        JSON.stringify(projectConfig)
      );

      const config = loadConfig(null);
      expect(config.apiKey).toBe('project-key');
    });
  });

  describe('配置更新', () => {
    it('应该更新配置字段', async () => {
      const testFilePath = path.join(testConfigDir, 'test-config.json');
      const initialConfig = {
        apiKey: 'old-key',
        baseUrl: 'https://old.com/v1',
        model: 'gpt-3.5-turbo'
      };

      await fs.writeFile(testFilePath, JSON.stringify(initialConfig));

      updateConfig('apiKey', 'new-key', testFilePath);

      const config = JSON.parse(await fs.readFile(testFilePath, 'utf-8'));
      expect(config.apiKey).toBe('new-key');
      expect(config.baseUrl).toBe('https://old.com/v1'); // 其他字段保持不变
    });

    it('应该更新多个字段', async () => {
      const testFilePath = path.join(testConfigDir, 'test-config.json');
      const initialConfig = {
        apiKey: 'old-key',
        baseUrl: 'https://old.com/v1',
        model: 'gpt-3.5-turbo'
      };

      await fs.writeFile(testFilePath, JSON.stringify(initialConfig));

      updateConfig('apiKey', 'new-key', testFilePath);
      updateConfig('baseUrl', 'https://new.com/v1', testFilePath);
      updateConfig('model', 'gpt-4', testFilePath);

      const config = JSON.parse(await fs.readFile(testFilePath, 'utf-8'));
      expect(config.apiKey).toBe('new-key');
      expect(config.baseUrl).toBe('https://new.com/v1');
      expect(config.model).toBe('gpt-4');
    });

    it('应该创建配置文件(如果不存在)', async () => {
      const testFilePath = path.join(testConfigDir, 'new-test-config.json');
      const initialConfig = {
        apiKey: 'new-key',
        baseUrl: 'https://new.com/v1'
      };

      // 初始化配置文件
      initConfigFile(testFilePath);

      const configExists = await fs.access(testFilePath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      const config = JSON.parse(await fs.readFile(testFilePath, 'utf-8'));
      expect(config.apiKey).toBe('');
    });
  });

  describe('配置文件(profile)管理', () => {
    it('应该设置profile值', async () => {
      const testFilePath = path.join(testConfigDir, 'test-config.json');
      initConfigFile(testFilePath);

      setProfileValue('profiles.dev', 'model', 'gpt-4', testFilePath);

      const config = JSON.parse(await fs.readFile(testFilePath, 'utf-8'));
      expect(config.profiles.dev.model).toBe('gpt-4');
    });

    it('应该设置嵌套profile值', async () => {
      const testFilePath = path.join(testConfigDir, 'test-config.json');
      initConfigFile(testFilePath);

      // 使用新 API
      setProfileValue('profiles.dev.settings.temperature', 0.8, null, testFilePath);

      const config = JSON.parse(await fs.readFile(testFilePath, 'utf-8'));
      expect(config.profiles.dev.settings.temperature).toBe(0.8);
    });
  });

  describe('获取活动配置', () => {
    it('应该返回默认配置', async () => {
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo',
        profiles: {
          default: {
            apiKey: 'test-key',
            baseUrl: 'https://test.com/v1',
            model: 'gpt-3.5-turbo'
          }
        }
      };

      await fs.writeFile(testConfigPath, JSON.stringify(config));

      const activeConfig = getActiveConfig(config);
      expect(activeConfig.apiKey).toBe('test-key');
      expect(activeConfig.baseUrl).toBe('https://test.com/v1');
      expect(activeConfig.model).toBe('gpt-3.5-turbo');
    });

    it('应该使用指定profile', async () => {
      const config = {
        apiKey: 'default-key',
        baseUrl: 'https://default.com/v1',
        model: 'gpt-3.5-turbo',
        profiles: {
          dev: {
            apiKey: 'dev-key',
            baseUrl: 'https://dev.com/v1',
            model: 'gpt-4'
          }
        }
      };

      await fs.writeFile(testConfigPath, JSON.stringify(config));

      const activeConfig = getActiveConfig('dev', testConfigPath);
      expect(activeConfig.apiKey).toBe('dev-key');
      expect(activeConfig.model).toBe('gpt-4');
    });
  });

  describe('配置验证', () => {
    it('应该验证必需字段', async () => {
      const testFilePath = path.join(testConfigDir, 'test-config.json');
      initConfigFile(testFilePath);
      const invalidConfig = {
        apiKey: '',
        baseUrl: 'https://test.com/v1'
      };

      await fs.writeFile(testFilePath, JSON.stringify(invalidConfig));

      const config = loadConfig(testFilePath);
      expect(config.apiKey).toBe('');
    });

    it('应该处理无效的JSON', async () => {
      await fs.writeFile(testConfigPath, 'invalid json');

      const config = loadConfig(testConfigPath);
      expect(config).toEqual({});
    });
  });

  describe('配置迁移', () => {
    it('应该处理旧版配置格式', async () => {
      const oldConfig = {
        API_KEY: 'old-key',
        BASE_URL: 'https://old.com/v1'
      };

      await fs.writeFile(testConfigPath, JSON.stringify(oldConfig));

      const config = loadConfig(testConfigPath);
      const migrated = {
        apiKey: config.API_KEY || config.apiKey,
        baseUrl: config.BASE_URL || config.baseUrl,
        model: config.MODEL || config.model || 'gpt-3.5-turbo'
      };

      expect(migrated.apiKey).toBe('old-key');
      expect(migrated.baseUrl).toBe('https://old.com/v1');
    });
  });
});
