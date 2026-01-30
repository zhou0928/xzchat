/**
 * 配置验证模块测试
 */

import { describe, it, expect } from 'vitest';
import {
  validateConfig,
  formatValidationResult,
  autoFixConfig,
  getConfigSuggestions,
  CONFIG_SCHEMA
} from '../../lib/utils/config-validator.js';

describe('配置验证模块', () => {
  describe('validateConfig', () => {
    it('应该验证有效的配置', () => {
      const config = {
        apiKey: 'sk-test123',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        provider: 'openai',
        profiles: {
          default: {
            apiKey: 'sk-test123',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4'
          }
        },
        currentProfile: 'default'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测必填字段缺失', () => {
      const config = {};
      const result = validateConfig(config, {
        apiKey: { type: 'string', required: true }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('apiKey: 必填字段缺失');
    });

    it('应该检测类型错误', () => {
      const config = {
        temperature: 'invalid'  // 应该是数字
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('temperature'))).toBe(true);
    });

    it('应该检测范围错误', () => {
      const config = {
        temperature: 3.5  // 超过最大值 2
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('不能大于'))).toBe(true);
    });

    it('应该检测枚举值错误', () => {
      const config = {
        provider: 'invalid-provider'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('必须是'))).toBe(true);
    });

    it('应该检测格式错误', () => {
      const config = {
        apiKey: 'invalid-api-key',  // 不符合 sk- 前缀
        baseUrl: 'not-a-url'  // 不是URL
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该验证嵌套的profiles', () => {
      const config = {
        profiles: {
          default: {
            apiKey: 'invalid',  // 不符合 sk- 前缀
            model: ''
          }
        },
        currentProfile: 'default'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('profiles.default.'))).toBe(true);
    });

    it('应该检测不存在的currentProfile', () => {
      const config = {
        profiles: {
          default: {
            apiKey: 'sk-test'
          }
        },
        currentProfile: 'non-existent'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('currentProfile'))).toBe(true);
    });
  });

  describe('formatValidationResult', () => {
    it('应该格式化成功的验证结果', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: []
      };

      const formatted = formatValidationResult(result);
      expect(formatted).toContain('✅ 配置验证通过');
    });

    it('应该格式化失败的验证结果', () => {
      const result = {
        valid: false,
        errors: ['错误1', '错误2'],
        warnings: ['警告1']
      };

      const formatted = formatValidationResult(result);
      expect(formatted).toContain('❌ 配置验证失败');
      expect(formatted).toContain('错误:');
      expect(formatted).toContain('警告:');
    });

    it('应该正确显示错误和警告', () => {
      const result = {
        valid: false,
        errors: ['apiKey: 必填字段缺失'],
        warnings: ['配置缺少必要的字段']
      };

      const formatted = formatValidationResult(result);
      expect(formatted).toContain('1. apiKey: 必填字段缺失');
      expect(formatted).toContain('1. 配置缺少必要的字段');
    });
  });

  describe('autoFixConfig', () => {
    it('应该自动设置默认currentProfile', () => {
      const config = {
        profiles: {
          default: { apiKey: 'sk-test' },
          custom: { apiKey: 'sk-test2' }
        }
      };

      const { fixed, fixes } = autoFixConfig(config);
      expect(fixed.currentProfile).toBe('default');
      expect(fixes.some(f => f.includes('currentProfile'))).toBe(true);
    });

    it('应该迁移顶层配置到default profile', () => {
      const config = {
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        profiles: {}
      };

      const { fixed, fixes } = autoFixConfig(config);
      expect(fixed.profiles.default).toBeDefined();
      expect(fixed.profiles.default.apiKey).toBe('sk-test');
      expect(fixes.some(f => f.includes('default profile'))).toBe(true);
    });

    it('应该移除空值', () => {
      const config = {
        apiKey: 'sk-test',
        baseUrl: '',
        model: null,
        profiles: {
          default: {
            apiKey: 'sk-test',
            systemPrompt: undefined
          }
        }
      };

      const { fixed } = autoFixConfig(config);
      expect(fixed.profiles.default.baseUrl).toBeUndefined();
      expect(fixed.profiles.default.model).toBeUndefined();
      expect(fixed.profiles.default.systemPrompt).toBeUndefined();
    });

    it('应该验证修复后的配置', () => {
      const config = {
        profiles: {
          default: {
            apiKey: 'sk-test'
          }
        }
      };

      const { validation } = autoFixConfig(config);
      expect(validation.valid).toBe(true);
    });
  });

  describe('getConfigSuggestions', () => {
    it('应该为缺少API Key的配置提供建议', () => {
      const config = {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4'
      };

      const suggestions = getConfigSuggestions(config);
      expect(suggestions.some(s => s.includes('API Key'))).toBe(true);
    });

    it('应该为缺少Base URL的配置提供建议', () => {
      const config = {
        apiKey: 'sk-test',
        model: 'gpt-4'
      };

      const suggestions = getConfigSuggestions(config);
      expect(suggestions.some(s => s.includes('Base URL'))).toBe(true);
    });

    it('应该为缺少Model的配置提供建议', () => {
      const config = {
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1'
      };

      const suggestions = getConfigSuggestions(config);
      expect(suggestions.some(s => s.includes('Model'))).toBe(true);
    });

    it('应该建议使用profiles', () => {
      const config = {
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4'
      };

      const suggestions = getConfigSuggestions(config);
      expect(suggestions.some(s => s.includes('profiles'))).toBe(true);
    });

    it('应该建议添加system prompt或roles', () => {
      const config = {
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        profiles: {}
      };

      const suggestions = getConfigSuggestions(config);
      expect(suggestions.some(s => s.includes('system prompt') || s.includes('roles'))).toBe(true);
    });
  });

  describe('CONFIG_SCHEMA', () => {
    it('应该包含所有必需的字段规则', () => {
      expect(CONFIG_SCHEMA.apiKey).toBeDefined();
      expect(CONFIG_SCHEMA.baseUrl).toBeDefined();
      expect(CONFIG_SCHEMA.model).toBeDefined();
      expect(CONFIG_SCHEMA.provider).toBeDefined();
      expect(CONFIG_SCHEMA.profiles).toBeDefined();
      expect(CONFIG_SCHEMA.roles).toBeDefined();
    });

    it('应该定义正确的类型规则', () => {
      expect(CONFIG_SCHEMA.apiKey.type).toBe('string');
      expect(CONFIG_SCHEMA.baseUrl.type).toBe('string');
      expect(CONFIG_SCHEMA.temperature.type).toBe('number');
      expect(CONFIG_SCHEMA.showThinking.type).toBe('boolean');
    });

    it('应该定义适当的约束', () => {
      expect(CONFIG_SCHEMA.temperature.min).toBe(0);
      expect(CONFIG_SCHEMA.temperature.max).toBe(2);
      expect(CONFIG_SCHEMA.maxTokens.min).toBe(1);
      expect(CONFIG_SCHEMA.maxTokens.max).toBe(128000);
    });
  });
});
