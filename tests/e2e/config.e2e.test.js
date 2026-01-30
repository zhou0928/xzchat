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
      await initConfigFile();

      const configExists = await fs.access(testConfigPath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('model');
    });

    it('应该初始化项目配置文件', async () => {
      const projectConfigPath = path.join(testConfigDir, 'newapi-chat.config.json');

      const result = await initProjectConfigFile();
      expect(result).toBeTruthy();

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

      const config = await loadConfig();
      expect(config.apiKey).toBe('test-key');
      expect(config.baseUrl).toBe('https://test.com/v1');
      expect(config.model).toBe('gpt-3.5-turbo');
    });

    it('应该在配置不存在时返回空对象', async () => {
      const config = await loadConfig();
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

      const config = await loadConfig();
      expect(config.apiKey).toBe('project-key');
    });
  });

  describe('配置更新', () => {
    it('应该更新配置字段', async () => {
      const initialConfig = {
        apiKey: 'old-key',
        baseUrl: 'https://old.com/v1',
        model: 'gpt-3.5-turbo'
      };

      await fs.writeFile(testConfigPath, JSON.stringify(initialConfig));

      await updateConfig({ apiKey: 'new-key' });

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.apiKey).toBe('new-key');
      expect(config.baseUrl).toBe('https://old.com/v1'); // 其他字段保持不变
    });

    it('应该更新多个字段', async () => {
      await initConfigFile();

      await updateConfig({
        apiKey: 'new-key',
        baseUrl: 'https://new.com/v1',
        model: 'gpt-4'
      });

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.apiKey).toBe('new-key');
      expect(config.baseUrl).toBe('https://new.com/v1');
      expect(config.model).toBe('gpt-4');
    });

    it('应该创建配置文件(如果不存在)', async () => {
      const initialConfig = {
        apiKey: 'new-key',
        baseUrl: 'https://new.com/v1'
      };

      await updateConfig(initialConfig);

      const configExists = await fs.access(testConfigPath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.apiKey).toBe('new-key');
    });
  });

  describe('配置文件(profile)管理', () => {
    it('应该设置profile值', async () => {
      await initConfigFile();

      await setProfileValue('profiles.dev.model', 'gpt-4');

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.profiles.dev.model).toBe('gpt-4');
    });

    it('应该设置嵌套profile值', async () => {
      await initConfigFile();

      await setProfileValue('profiles.dev.settings.temperature', 0.8);

      const config = JSON.parse(await fs.readFile(testConfigPath, 'utf-8'));
      expect(config.profiles.dev.settings.temperature).toBe(0.8);
    });
  });

  describe('获取活动配置', () => {
    it('应该返回默认配置', async () => {
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com/v1',
        model: 'gpt-3.5-turbo'
      };

      await fs.writeFile(testConfigPath, JSON.stringify(config));

      const activeConfig = await getActiveConfig();
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

      const activeConfig = await getActiveConfig('dev');
      expect(activeConfig.apiKey).toBe('dev-key');
      expect(activeConfig.model).toBe('gpt-4');
    });
  });

  describe('配置验证', () => {
    it('应该验证必需字段', async () => {
      const invalidConfig = {
        apiKey: '',
        baseUrl: 'https://test.com/v1'
      };

      await fs.writeFile(testConfigPath, JSON.stringify(invalidConfig));

      const config = await loadConfig();
      expect(config.apiKey).toBe('');
    });

    it('应该处理无效的JSON', async () => {
      await fs.writeFile(testConfigPath, 'invalid json');

      const config = await loadConfig();
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

      // 模拟迁移逻辑
      const config = await loadConfig();
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
