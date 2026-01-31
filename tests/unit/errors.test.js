/**
 * 错误处理模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  XZChatError,
  ConfigError,
  APIError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  formatError,
  isErrorRetryable
} from '../../lib/utils/errors.js';

describe('错误处理模块', () => {
  describe('自定义错误类', () => {
    it('应该创建XZChatError', () => {
      const error = new XZChatError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('XZChatError');
    });

    it('应该创建ConfigError', () => {
      const error = new ConfigError('Config error');
      expect(error).toBeInstanceOf(XZChatError);
      expect(error.name).toBe('ConfigError');
    });

    it('应该创建APIError', () => {
      const error = new APIError('API error', 500);
      expect(error).toBeInstanceOf(XZChatError);
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('APIError');
    });

    it('应该创建ValidationError', () => {
      const error = new ValidationError('Validation failed');
      expect(error).toBeInstanceOf(XZChatError);
      expect(error.name).toBe('ValidationError');
    });

    it('应该创建AuthenticationError', () => {
      const error = new AuthenticationError('Auth failed');
      expect(error).toBeInstanceOf(XZChatError);
      expect(error.name).toBe('AuthenticationError');
    });

    it('应该创建NetworkError', () => {
      const error = new NetworkError('Network failed');
      expect(error).toBeInstanceOf(XZChatError);
      expect(error.name).toBe('NetworkError');
    });
  });

  describe('错误格式化', () => {
    it('应该格式化简单错误', () => {
      const error = new Error('Simple error');
      const formatted = formatError(error);
      expect(formatted).toContain('Simple error');
    });

    it('应该格式化XZChatError', () => {
      const error = new ConfigError('Config error');
      const formatted = formatError(error);
      expect(formatted).toContain('ConfigError');
      expect(formatted).toContain('Config error');
    });

    it('应该格式化带堆栈的错误', () => {
      const error = new Error('Test');
      error.stack = 'Error: Test\n  at test';
      const formatted = formatError(error, true);
      expect(formatted).toContain('at test');
    });

    it('应该处理null/undefined错误', () => {
      expect(formatError(null)).toBe('Unknown error');
      expect(formatError(undefined)).toBe('Unknown error');
    });

    it('应该处理字符串错误', () => {
      const formatted = formatError('String error');
      expect(formatted).toBe('String error');
    });
  });

  describe('错误重试判断', () => {
    it('应该判断可重试的错误', () => {
      const error = new APIError('Server error', 503);
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('应该判断不可重试的错误', () => {
      const error = new APIError('Bad request', 400);
      expect(isErrorRetryable(error)).toBe(false);
    });

    it('应该判断网络错误为可重试', () => {
      const error = new NetworkError('Network failed');
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('应该判断验证错误为不可重试', () => {
      const error = new ValidationError('Invalid input');
      expect(isErrorRetryable(error)).toBe(false);
    });

    it('应该判断认证错误为不可重试', () => {
      const error = new AuthenticationError('Auth failed');
      expect(isErrorRetryable(error)).toBe(false);
    });

    it('应该判断408超时为可重试', () => {
      const error = new APIError('Timeout', 408);
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('应该判断429限流为可重试', () => {
      const error = new APIError('Rate limit', 429);
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('应该判断500-504为可重试', () => {
      for (let status = 500; status <= 504; status++) {
        const error = new APIError('Server error', status);
        expect(isErrorRetryable(error)).toBe(true);
      }
    });
  });

  describe('错误链', () => {
    it('应该支持错误链', () => {
      const originalError = new Error('Original');
      const wrappedError = new ConfigError('Wrapped', { cause: originalError });
      expect(wrappedError.cause).toBe(originalError);
    });

    it('应该保留原始错误信息', () => {
      const originalError = new Error('Original');
      const wrappedError = new APIError('Wrapped', 500, { cause: originalError });
      const formatted = formatError(wrappedError, true);
      expect(formatted).toContain('Original');
    });
  });

  describe('错误元数据', () => {
    it('应该支持错误元数据', () => {
      const error = new APIError('API error', 500);
      error.metadata = {
        endpoint: '/api/test',
        requestId: '123'
      };
      expect(error.metadata).toBeDefined();
      expect(error.metadata.endpoint).toBe('/api/test');
    });

    it('应该在格式化时包含元数据', () => {
      const error = new APIError('API error', 500);
      error.metadata = { endpoint: '/api/test' };
      const formatted = formatError(error, true);
      expect(formatted).toContain('/api/test');
    });
  });

  describe('边界情况', () => {
    it('应该处理没有消息的错误', () => {
      const error = new Error();
      expect(error.message).toBe('');
      const formatted = formatError(error);
      expect(formatted).toBeDefined();
    });

    it('应该处理超长错误消息', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new Error(longMessage);
      const formatted = formatError(error);
      expect(formatted).toBeDefined();
    });

    it('应该处理特殊字符', () => {
      const error = new Error('Error with \n\t\r special chars');
      const formatted = formatError(error);
      expect(formatted).toBeDefined();
    });
  });
});
