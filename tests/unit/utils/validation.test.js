import { describe, it, expect } from 'vitest';
import {
  validateFilePath,
  validateModelName,
  validateApiKey,
  validateUrl,
  validateBranchId,
  validateSessionId,
  validateUserInput,
  validateCommandArgs,
  sanitizeInput,
  validateJson,
  validateInteger,
  validateEmail,
  ValidationError
} from '../lib/utils/validation.js';

describe('Validation Module', () => {
  describe('validateFilePath', () => {
    it('should validate valid file paths', () => {
      expect(validateFilePath('test.txt')).toBe('test.txt');
      expect(validateFilePath('dir/test.txt')).toBe('dir/test.txt');
    });

    it('should reject empty paths', () => {
      expect(() => validateFilePath('')).toThrow('文件路径不能为空');
      expect(() => validateFilePath(null)).toThrow('文件路径不能为空');
    });

    it('should reject paths with spaces at ends', () => {
      expect(() => validateFilePath(' test.txt')).toThrow('文件路径不能包含前后空格');
      expect(() => validateFilePath('test.txt ')).toThrow('文件路径不能包含前后空格');
    });

    it('should reject path traversal attempts', () => {
      expect(() => validateFilePath('../etc/passwd')).toThrow('文件路径不能包含 ".." 路径遍历');
      expect(() => validateFilePath('..\\windows\\system32')).toThrow('文件路径不能包含 ".." 路径遍历');
    });

    it('should reject invalid extensions', () => {
      expect(() => validateFilePath('test.txt', { allowedExtensions: ['js', 'json'] }))
        .toThrow('不支持的文件扩展名');
    });

    it('should reject paths with newlines', () => {
      expect(() => validateFilePath('test\ntxt')).toThrow('文件路径不能包含换行符');
    });
  });

  describe('validateModelName', () => {
    it('should validate valid model names', () => {
      expect(validateModelName('gpt-4')).toBe('gpt-4');
      expect(validateModelName('gpt-3.5-turbo')).toBe('gpt-3.5-turbo');
      expect(validateModelName('claude-3-opus-20240229')).toBe('claude-3-opus-20240229');
      expect(validateModelName('deepseek-chat')).toBe('deepseek-chat');
    });

    it('should reject empty model names', () => {
      expect(() => validateModelName('')).toThrow('模型名称不能为空');
      expect(() => validateModelName(null)).toThrow('模型名称不能为空');
    });

    it('should reject model names with spaces', () => {
      expect(() => validateModelName(' gpt-4')).toThrow('模型名称不能包含前后空格');
      expect(() => validateModelName('gpt-4 ')).toThrow('模型名称不能包含前后空格');
    });
  });

  describe('validateApiKey', () => {
    it('should validate valid API keys', () => {
      expect(validateApiKey('sk-abcdefghijklmnopqrstuvwxyz1234567890123456789')).toBeDefined();
    });

    it('should reject empty API keys', () => {
      expect(() => validateApiKey('')).toThrow('API Key 不能为空');
      expect(() => validateApiKey(null)).toThrow('API Key 不能为空');
    });

    it('should reject API keys that are too short', () => {
      expect(() => validateApiKey('sk-abc')).toThrow('API Key 长度太短');
    });

    it('should reject API keys with spaces', () => {
      expect(() => validateApiKey(' sk-xxx')).toThrow('API Key 不能包含前后空格');
    });
  });

  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      expect(validateUrl('https://api.openai.com/v1')).toBe('https://api.openai.com/v1');
      expect(validateUrl('http://localhost:8080', { allowLocalhost: true }))
        .toBe('http://localhost:8080');
    });

    it('should reject empty URLs', () => {
      expect(() => validateUrl('')).toThrow('URL 不能为空');
      expect(() => validateUrl(null)).toThrow('URL 不能为空');
    });

    it('should reject URLs with spaces', () => {
      expect(() => validateUrl(' https://example.com')).toThrow('URL 不能包含前后空格');
    });

    it('should reject invalid protocols', () => {
      expect(() => validateUrl('ftp://example.com')).toThrow('URL 协议必须是');
    });

    it('should reject localhost by default', () => {
      expect(() => validateUrl('http://localhost:8080')).toThrow('URL 不能使用 localhost');
    });

    it('should allow localhost when specified', () => {
      expect(validateUrl('http://localhost:8080', { allowLocalhost: true }))
        .toBe('http://localhost:8080');
    });

    it('should reject malformed URLs', () => {
      expect(() => validateUrl('not-a-url')).toThrow('无效的 URL');
    });
  });

  describe('validateBranchId', () => {
    it('should validate valid branch IDs', () => {
      expect(validateBranchId('branch_1234567890_abc123')).toBe('branch_1234567890_abc123');
    });

    it('should reject empty branch IDs', () => {
      expect(() => validateBranchId('')).toThrow('分支 ID 不能为空');
      expect(() => validateBranchId(null)).toThrow('分支 ID 不能为空');
    });

    it('should reject invalid formats', () => {
      expect(() => validateBranchId('invalid')).toThrow('分支 ID 格式不正确');
      expect(() => validateBranchId('branch_123')).toThrow('分支 ID 格式不正确');
    });
  });

  describe('validateSessionId', () => {
    it('should validate valid session IDs', () => {
      expect(validateSessionId('session-1')).toBe('session-1');
      expect(validateSessionId('default')).toBe('default');
    });

    it('should reject empty session IDs', () => {
      expect(() => validateSessionId('')).toThrow('会话 ID 不能为空');
      expect(() => validateSessionId(null)).toThrow('会话 ID 不能为空');
    });

    it('should reject session IDs with spaces', () => {
      expect(() => validateSessionId(' session-1')).toThrow('会话 ID 不能包含前后空格');
    });

    it('should reject session IDs that are too long', () => {
      const longId = 'a'.repeat(256);
      expect(() => validateSessionId(longId)).toThrow('会话 ID 长度必须在 1-255 之间');
    });

    it('should reject session IDs with invalid characters', () => {
      expect(() => validateSessionId('session/1')).toThrow('会话 ID 包含非法字符');
      expect(() => validateSessionId('session\\1')).toThrow('会话 ID 包含非法字符');
    });
  });

  describe('validateUserInput', () => {
    it('should validate valid input', () => {
      expect(validateUserInput('Hello World')).toBe('Hello World');
    });

    it('should allow empty input when specified', () => {
      expect(validateUserInput('', { allowEmpty: true })).toBe('');
    });

    it('should reject empty input by default', () => {
      expect(() => validateUserInput('')).toThrow('输入文本不能为空');
    });

    it('should enforce minimum length', () => {
      expect(() => validateUserInput('a', { minLength: 5 })).toThrow('输入文本长度不能少于 5 个字符');
    });

    it('should enforce maximum length', () => {
      const longText = 'a'.repeat(100001);
      expect(() => validateUserInput(longText)).toThrow('输入文本长度不能超过 100000 个字符');
    });
  });

  describe('validateCommandArgs', () => {
    it('should validate args against schema', () => {
      const schema = {
        name: { required: true, type: String },
        age: { required: false, type: Number, default: 18 },
        role: { enum: ['user', 'admin'] }
      };

      const result = validateCommandArgs(
        { name: 'John', age: 25, role: 'admin' },
        schema
      );

      expect(result).toEqual({ name: 'John', age: 25, role: 'admin' });
    });

    it('should apply default values', () => {
      const schema = {
        name: { required: true },
        age: { default: 18 }
      };

      const result = validateCommandArgs({ name: 'John' }, schema);
      expect(result.age).toBe(18);
    });

    it('should enforce required fields', () => {
      const schema = {
        name: { required: true }
      };

      expect(() => validateCommandArgs({}, schema)).toThrow('缺少必填参数');
    });

    it('should enforce enum values', () => {
      const schema = {
        role: { enum: ['user', 'admin'] }
      };

      expect(() => validateCommandArgs({ role: 'guest' }, schema))
        .toThrow('参数 role 值无效');
    });

    it('should enforce number range', () => {
      const schema = {
        age: { type: Number, min: 0, max: 120 }
      };

      expect(() => validateCommandArgs({ age: 150 }, schema))
        .toThrow('参数 age 值过大');
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should remove multiple spaces', () => {
      expect(sanitizeInput('hello   world')).toBe('hello world');
    });

    it('should not trim when disabled', () => {
      expect(sanitizeInput('  hello  ', { trim: false })).toBe('  hello  ');
    });
  });

  describe('validateJson', () => {
    it('should validate valid JSON', () => {
      const result = validateJson('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should reject invalid JSON', () => {
      expect(() => validateJson('{not valid json}')).toThrow('无效的 JSON');
    });

    it('should reject empty string', () => {
      expect(() => validateJson('')).toThrow('JSON 字符串不能为空');
    });
  });

  describe('validateInteger', () => {
    it('should validate valid integers', () => {
      expect(validateInteger('123')).toBe(123);
      expect(validateInteger('-456')).toBe(-456);
    });

    it('should reject non-integer strings', () => {
      expect(() => validateInteger('abc')).toThrow('无效的整数');
      expect(() => validateInteger('12.5')).toThrow('无效的整数');
    });

    it('should enforce range', () => {
      expect(() => validateInteger('150', { min: 0, max: 120 }))
        .toThrow('整数超出范围');
    });
  });

  describe('validatePort', () => {
    it('should validate valid ports', () => {
      expect(validatePort('80')).toBe(80);
      expect(validatePort('8080')).toBe(8080);
      expect(validatePort('65535')).toBe(65535);
    });

    it('should reject invalid ports', () => {
      expect(() => validatePort('0')).toThrow('整数超出范围');
      expect(() => validatePort('65536')).toThrow('整数超出范围');
      expect(() => validatePort('abc')).toThrow('无效的整数');
    });
  });

  describe('validateEmail', () => {
    it('should validate valid emails', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com');
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe('user.name+tag@domain.co.uk');
    });

    it('should convert to lowercase', () => {
      expect(validateEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should reject invalid emails', () => {
      expect(() => validateEmail('')).toThrow('邮箱不能为空');
      expect(() => validateEmail('not-an-email')).toThrow('无效的邮箱地址');
      expect(() => validateEmail('@example.com')).toThrow('无效的邮箱地址');
    });
  });
});
