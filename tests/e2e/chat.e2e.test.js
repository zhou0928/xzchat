/**
 * E2E 测试 - 聊天功能
 *
 * 测试完整的聊天流程，包括消息发送、流式输出、错误处理等
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateCompletion, chatStream } from '../../lib/chat.js';
import { loadConfig, updateConfig } from '../../lib/config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('E2E: 聊天功能', () => {
  let testConfig;
  const testConfigPath = path.join(process.cwd(), '.test-config.json');

  beforeEach(async () => {
    // 创建测试配置
    testConfig = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.test.com/v1',
      model: 'gpt-3.5-turbo',
      provider: 'openai'
    };

    await fs.writeFile(testConfigPath, JSON.stringify(testConfig));
  });

  afterEach(async () => {
    try {
      await fs.unlink(testConfigPath);
    } catch (e) {
      // 忽略错误
    }
  });

  describe('基本聊天功能', () => {
    it('应该能够发送简单消息', async () => {
      const messages = [
        { role: 'user', content: 'Hello' }
      ];

      // Mock fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'Hi there!' }
            }]
          })
        })
      );

      const response = await generateCompletion(testConfig, messages);
      expect(response).toBe('Hi there!');

      vi.restoreAllMocks();
    });

    it('应该能够处理多轮对话', async () => {
      const messages = [
        { role: 'user', content: 'What is 1+1?' },
        { role: 'assistant', content: '2' },
        { role: 'user', content: 'What is 2+2?' }
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: '4' }
            }]
          })
        })
      );

      const response = await generateCompletion(testConfig, messages);
      expect(response).toBe('4');

      vi.restoreAllMocks();
    });

    it('应该支持JSON模式', async () => {
      const messages = [
        { role: 'user', content: 'Return a JSON object' }
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: '{"key": "value"}'
              }
            }]
          })
        })
      );

      const response = await generateCompletion(testConfig, messages, {
        jsonMode: true
      });
      expect(response).toBe('{"key": "value"}');

      vi.restoreAllMocks();
    });
  });

  describe('错误处理', () => {
    it('应该处理400错误', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Bad Request')
        })
      );

      await expect(generateCompletion(testConfig, messages))
        .rejects.toThrow('API Error (400): Bad Request');

      vi.restoreAllMocks();
    });

    it('应该处理500错误并重试', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      let attemptCount = 0;

      global.fetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Internal Server Error')
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'Success' }
            }]
          })
        });
      });

      const response = await generateCompletion(testConfig, messages, {}, 3);
      expect(response).toBe('Success');
      expect(attemptCount).toBeGreaterThan(1);

      vi.restoreAllMocks();
    });

    it('应该处理网络错误', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(generateCompletion(testConfig, messages))
        .rejects.toThrow();

      vi.restoreAllMocks();
    });
  });

  describe('参数配置', () => {
    it('应该使用自定义max_tokens', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = vi.fn((url, options) => {
        const body = JSON.parse(options.body);
        expect(body.max_tokens).toBe(1000);

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'Response' }
            }]
          })
        });
      });

      await generateCompletion(testConfig, messages, {
        max_tokens: 1000
      });

      vi.restoreAllMocks();
    });

    it('应该使用自定义model', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = vi.fn((url, options) => {
        const body = JSON.parse(options.body);
        expect(body.model).toBe('gpt-4');

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'Response' }
            }]
          })
        });
      });

      await generateCompletion(testConfig, messages, {
        model: 'gpt-4'
      });

      vi.restoreAllMocks();
    });
  });

  describe('URL处理', () => {
    it('应该自动添加/v1路径', async () => {
      testConfig.baseUrl = 'https://api.test.com';
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = vi.fn((url) => {
        expect(url).toContain('/v1/chat/completions');

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'Response' }
            }]
          })
        });
      });

      await generateCompletion(testConfig, messages);

      vi.restoreAllMocks();
    });

    it('应该保留已有的/v1路径', async () => {
      testConfig.baseUrl = 'https://api.test.com/v1';
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = vi.fn((url) => {
        expect(url).toBe('https://api.test.com/v1/chat/completions');

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'Response' }
            }]
          })
        });
      });

      await generateCompletion(testConfig, messages);

      vi.restoreAllMocks();
    });
  });

  describe('认证', () => {
    it('应该在请求头中包含API密钥', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = vi.fn((url, options) => {
        expect(options.headers.Authorization).toBe('Bearer test-api-key');

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'Response' }
            }]
          })
        });
      });

      await generateCompletion(testConfig, messages);

      vi.restoreAllMocks();
    });
  });
});
