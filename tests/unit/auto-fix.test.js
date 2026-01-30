/**
 * 自动修复系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AutoFixEngine,
  ErrorDetector,
  FixSuggestionGenerator,
  analyzeAndSuggest,
  analyzeError,
  formatSuggestions
} from '../../lib/utils/auto-fix.js';
import {
  ConfigError,
  APIError,
  FileSystemError,
  NetworkError,
  ValidationError
} from '../../lib/utils/errors.js';

describe('AutoFixEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AutoFixEngine();
  });

  describe('构造函数', () => {
    it('应该使用默认配置', () => {
      const defaultEngine = new AutoFixEngine();
      expect(defaultEngine.options.maxSuggestions).toBe(5);
      expect(defaultEngine.options.autoFixEnabled).toBe(false);
    });

    it('应该接受自定义配置', () => {
      const customEngine = new AutoFixEngine({
        maxSuggestions: 10,
        autoFixEnabled: true
      });
      expect(customEngine.options.maxSuggestions).toBe(10);
      expect(customEngine.options.autoFixEnabled).toBe(true);
    });
  });

  describe('错误检测器', () => {
    it('应该检测 API Key 错误', () => {
      const error = new ConfigError('API Key is missing', { code: 'API_KEY_MISSING' });
      const detections = engine.detector.detect(error);

      expect(detections).toHaveLength(1);
      expect(detections[0].ruleName).toBe('API_KEY_MISSING');
      expect(detections[0].severity).toBe('critical');
    });

    it('应该检测模型错误', () => {
      const error = new APIError('Model not found', 404);
      const detections = engine.detector.detect(error);

      expect(detections).toHaveLength(1);
      expect(detections[0].ruleName).toBe('MODEL_NOT_FOUND');
      expect(detections[0].severity).toBe('high');
    });

    it('应该检测网络错误', () => {
      const error = new NetworkError('Connection refused');
      error.code = 'ECONNREFUSED';
      const detections = engine.detector.detect(error);

      expect(detections).toHaveLength(1);
      expect(detections[0].ruleName).toBe('NETWORK_ERROR');
      expect(detections[0].severity).toBe('medium');
    });

    it('应该检测速率限制错误', () => {
      const error = new APIError('Too many requests', 429);
      const detections = engine.detector.detect(error);

      expect(detections).toHaveLength(1);
      expect(detections[0].ruleName).toBe('RATE_LIMIT');
      expect(detections[0].severity).toBe('medium');
    });

    it('应该检测认证错误', () => {
      const error = new APIError('Unauthorized', 401);
      const detections = engine.detector.detect(error);

      expect(detections).toHaveLength(1);
      expect(detections[0].ruleName).toBe('AUTH_ERROR');
      expect(detections[0].severity).toBe('critical');
    });

    it('应该检测文件不存在错误', () => {
      const error = new FileSystemError('File not found');
      error.code = 'ENOENT';
      const detections = engine.detector.detect(error);

      expect(detections).toHaveLength(1);
      expect(detections[0].ruleName).toBe('FILE_NOT_FOUND');
      expect(detections[0].severity).toBe('low');
    });

    it('应该处理未知错误', () => {
      const error = new Error('Unknown error');
      const detections = engine.detector.detect(error);

      expect(detections).toHaveLength(0);
    });
  });

  describe('修复建议生成', () => {
    it('应该为 API Key 错误生成建议', () => {
      const error = new ConfigError('API Key is missing');
      const suggestions = engine.generator.generateSuggestions(error);

      expect(suggestions.length).toBeGreaterThan(0);

      const apiKeySuggestion = suggestions.find(s => s.title.includes('API Key'));
      expect(apiKeySuggestion).toBeDefined();
      expect(apiKeySuggestion.actions).toBeDefined();
      expect(apiKeySuggestion.actions.length).toBeGreaterThan(0);
    });

    it('应该为 401 错误生成建议', () => {
      const error = new APIError('Unauthorized', 401);
      const suggestions = engine.generator.generateSuggestions(error);

      const authSuggestion = suggestions.find(s => s.title.includes('401') || s.title.includes('认证'));
      expect(authSuggestion).toBeDefined();
      expect(authSuggestion.actions).toBeDefined();
    });

    it('应该为 404 错误生成建议', () => {
      const error = new APIError('Not found', 404);
      const suggestions = engine.generator.generateSuggestions(error);

      const notFoundSuggestion = suggestions.find(s => s.title.includes('404'));
      expect(notFoundSuggestion).toBeDefined();
    });

    it('应该为 429 错误生成建议', () => {
      const error = new APIError('Rate limit', 429);
      const suggestions = engine.generator.generateSuggestions(error);

      const rateLimitSuggestion = suggestions.find(s => s.title.includes('429') || s.title.includes('速率'));
      expect(rateLimitSuggestion).toBeDefined();
    });

    it('应该为 5xx 错误生成建议', () => {
      const error = new APIError('Internal server error', 500);
      const suggestions = engine.generator.generateSuggestions(error);

      const serverErrorSuggestion = suggestions.find(s => s.title.includes('5xx') || s.title.includes('服务器'));
      expect(serverErrorSuggestion).toBeDefined();
    });

    it('应该为文件系统错误生成建议', () => {
      const error = new FileSystemError('File not found');
      error.code = 'ENOENT';
      const suggestions = engine.generator.generateSuggestions(error);

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('应该为网络错误生成建议', () => {
      const error = new NetworkError('Connection refused');
      error.code = 'ECONNREFUSED';
      const suggestions = engine.generator.generateSuggestions(error);

      const networkSuggestion = suggestions.find(s => s.title.includes('网络'));
      expect(networkSuggestion).toBeDefined();
    });

    it('应该为验证错误生成建议', () => {
      const error = new ValidationError('Invalid input');
      const suggestions = engine.generator.generateSuggestions(error);

      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('错误分析', () => {
    it('应该分析 API Key 错误', () => {
      const error = new ConfigError('API Key is missing', { code: 'API_KEY_MISSING' });
      const analysis = engine.analyzeError(error);

      expect(analysis.error.name).toBe('ConfigError');
      expect(analysis.error.message).toBe('API Key is missing');
      expect(analysis.detections).toHaveLength(1);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.summary).toBeDefined();
    });

    it('应该分析 API 错误', () => {
      const error = new APIError('Unauthorized', 401);
      const analysis = engine.analyzeError(error);

      expect(analysis.error.name).toBe('APIError');
      expect(analysis.error.statusCode).toBe(401);
      expect(analysis.detections.length).toBeGreaterThan(0);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('应该限制建议数量', () => {
      const engine = new AutoFixEngine({ maxSuggestions: 2 });
      const error = new NetworkError('Connection failed');
      const analysis = engine.analyzeError(error);

      expect(analysis.suggestions.length).toBeLessThanOrEqual(2);
    });

    it('应该包含上下文信息', () => {
      const error = new ConfigError('Invalid config');
      const context = { configPath: '/test/config.json' };
      const analysis = engine.analyzeError(error, context);

      expect(analysis.error).toBeDefined();
    });
  });

  describe('格式化输出', () => {
    it('应该格式化分析结果', () => {
      const error = new ConfigError('API Key missing');
      const analysis = engine.analyzeError(error);
      const output = engine.formatOutput(analysis);

      expect(output).toContain('自动修复建议');
      expect(output).toContain('错误信息');
      expect(output).toContain('ConfigError');
      expect(output).toContain('API Key missing');
      expect(output).toContain('修复建议');
    });

    it('应该包含检测结果的严重程度', () => {
      const error = new APIError('Unauthorized', 401);
      const analysis = engine.analyzeError(error);
      const output = engine.formatOutput(analysis);

      expect(output).toContain('CRITICAL');
    });

    it('应该包含建议标题和描述', () => {
      const error = new APIError('Not found', 404);
      const analysis = engine.analyzeError(error);
      const output = engine.formatOutput(analysis);

      expect(output).toContain('修复建议');
    });

    it('应该包含代码示例', () => {
      const error = new ConfigError('API Key missing');
      const analysis = engine.analyzeError(error);
      const output = engine.formatOutput(analysis);

      expect(output).toContain('示例代码');
    });

    it('应该包含摘要', () => {
      const error = new NetworkError('Connection failed');
      const analysis = engine.analyzeError(error);
      const output = engine.formatOutput(analysis);

      expect(output).toContain('摘要');
    });
  });

  describe('JSON 输出', () => {
    it('应该生成 JSON 格式的分析结果', () => {
      const error = new ConfigError('Test error');
      const json = engine.toJSON(error);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.error).toBeDefined();
      expect(parsed.detections).toBeDefined();
      expect(parsed.suggestions).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });
  });
});

describe('快捷函数', () => {
  describe('analyzeAndSuggest', () => {
    it('应该分析并打印建议', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const error = new ConfigError('Test error');

      const result = analyzeAndSuggest(error);

      expect(result.error).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('analyzeError', () => {
    it('应该仅分析错误', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const error = new ConfigError('Test error');

      const result = analyzeError(error);

      expect(result.error).toBeDefined();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('formatSuggestions', () => {
    it('应该格式化分析结果', () => {
      const error = new ConfigError('Test error');
      const analysis = analyzeError(error);
      const output = formatSuggestions(analysis);

      expect(typeof output).toBe('string');
      expect(output).toContain('自动修复建议');
    });
  });
});

describe('ErrorDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new ErrorDetector();
  });

  describe('规则注册', () => {
    it('应该注册检测规则', () => {
      const rule = {
        name: 'TEST_RULE',
        priority: 50,
        matcher: () => true,
        analyzer: () => ({ severity: 'low', category: 'test', message: 'Test' })
      };

      detector.registerRule(rule);
      expect(detector.detectionRules).toHaveLength(1);
      expect(detector.detectionRules[0].name).toBe('TEST_RULE');
    });

    it('应该按优先级排序规则', () => {
      const rule1 = {
        name: 'RULE_1',
        priority: 30,
        matcher: () => true,
        analyzer: () => ({ severity: 'low', category: 'test', message: 'Test1' })
      };
      const rule2 = {
        name: 'RULE_2',
        priority: 70,
        matcher: () => true,
        analyzer: () => ({ severity: 'low', category: 'test', message: 'Test2' })
      };

      detector.registerRule(rule1);
      detector.registerRule(rule2);

      expect(detector.detectionRules[0].priority).toBeGreaterThan(detector.detectionRules[1].priority);
    });
  });

  describe('错误检测', () => {
    it('应该检测匹配的错误', () => {
      const rule = {
        name: 'TEST_RULE',
        priority: 50,
        matcher: (error) => error.message === 'test',
        analyzer: () => ({ severity: 'low', category: 'test', message: 'Detected' })
      };

      detector.registerRule(rule);
      const error = new Error('test');
      const detections = detector.detect(error);

      expect(detections).toHaveLength(1);
      expect(detections[0].message).toBe('Detected');
    });

    it('应该忽略不匹配的错误', () => {
      const rule = {
        name: 'TEST_RULE',
        priority: 50,
        matcher: (error) => error.message === 'test',
        analyzer: () => ({ severity: 'low', category: 'test', message: 'Detected' })
      };

      detector.registerRule(rule);
      const error = new Error('other');
      const detections = detector.detect(error);

      expect(detections).toHaveLength(0);
    });
  });
});

describe('FixSuggestionGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new FixSuggestionGenerator();
  });

  describe('模板注册', () => {
    it('应该注册修复模板', () => {
      const generatorFn = () => [{ title: 'Test' }];
      generator.registerTemplate('TEST_ERROR', generatorFn);

      expect(generator.fixTemplates.has('TEST_ERROR')).toBe(true);
    });
  });

  describe('建议生成', () => {
    it('应该为不同类型的错误生成建议', () => {
      const errors = [
        new ConfigError('API Key missing'),
        new APIError('Unauthorized', 401),
        new FileSystemError('File not found'),
        new NetworkError('Connection failed'),
        new ValidationError('Invalid input'),
        new Error('Generic error')
      ];

      errors.forEach(error => {
        const suggestions = generator.generateSuggestions(error);
        expect(Array.isArray(suggestions)).toBe(true);
      });
    });

    it('应该包含通用建议', () => {
      const error = new Error('Generic error');
      const suggestions = generator.generateSuggestions(error);

      const helpSuggestion = suggestions.find(s => s.title.includes('帮助'));
      expect(helpSuggestion).toBeDefined();
    });
  });
});

describe('集成测试', () => {
  it('应该处理完整的错误分析流程', () => {
    const engine = new AutoFixEngine();
    const error = new APIError('Unauthorized', 401);

    const analysis = engine.analyzeError(error);
    const output = engine.formatOutput(analysis);

    expect(analysis.detections.length).toBeGreaterThan(0);
    expect(analysis.suggestions.length).toBeGreaterThan(0);
    expect(output).toContain('认证失败');
  });

  it('应该处理多种错误类型', () => {
    const engine = new AutoFixEngine();
    const errors = [
      new ConfigError('API Key missing'),
      new APIError('Not found', 404),
      new FileSystemError('File not found', { code: 'ENOENT' }),
      new NetworkError('Connection refused', { code: 'ECONNREFUSED' })
    ];

    errors.forEach(error => {
      const analysis = engine.analyzeError(error);
      expect(analysis.error.name).toBeDefined();
      expect(analysis.detections).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
      expect(analysis.summary).toBeDefined();
    });
  });
});

describe('边界情况', () => {
  it('应该处理空错误', () => {
    const engine = new AutoFixEngine();
    const error = new Error('');
    const analysis = engine.analyzeError(error);

    expect(analysis).toBeDefined();
    expect(analysis.error.message).toBe('');
  });

  it('应该处理没有代码的错误', () => {
    const engine = new AutoFixEngine();
    const error = new Error('No code');
    const analysis = engine.analyzeError(error);

    expect(analysis.error.code).toBeUndefined();
  });

  it('应该处理 maxSuggestions 为 0', () => {
    const engine = new AutoFixEngine({ maxSuggestions: 0 });
    const error = new NetworkError('Connection failed');
    const analysis = engine.analyzeError(error);

    expect(analysis.suggestions).toHaveLength(0);
  });

  it('应该处理非常大的 maxSuggestions', () => {
    const engine = new AutoFixEngine({ maxSuggestions: 100 });
    const error = new NetworkError('Connection failed');
    const analysis = engine.analyzeError(error);

    expect(analysis.suggestions.length).toBeLessThanOrEqual(100);
  });
});
