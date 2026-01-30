/**
 * 插件验证器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PluginValidator } from '../../lib/plugins/plugin-validator.js';
import { PluginMetadata } from '../../lib/plugins/plugin-manager.js';

describe('PluginValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new PluginValidator();
  });

  describe('validateMetadata', () => {
    it('should validate valid metadata', () => {
      const metadata = new PluginMetadata({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test Author',
        main: 'index.js'
      });

      const result = validator.validateMetadata(metadata);

      expect(result.errors).toEqual([]);
    });

    it('should reject metadata without name', () => {
      const metadata = new PluginMetadata({
        version: '1.0.0'
      });

      const result = validator.validateMetadata(metadata);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('name'))).toBe(true);
    });

    it('should reject metadata without version', () => {
      const metadata = new PluginMetadata({
        name: 'test-plugin'
      });

      const result = validator.validateMetadata(metadata);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('version'))).toBe(true);
    });

    it('should reject invalid version format', () => {
      const metadata = new PluginMetadata({
        name: 'test-plugin',
        version: 'invalid'
      });

      const result = validator.validateMetadata(metadata);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('version'))).toBe(true);
    });
  });

  describe('validateCodeQuality', () => {
    it('should validate clean code', () => {
      const code = `
        // Clean code
        function test() {
          return true;
        }
      `;

      const result = validator.validateCodeQuality({ code });

      expect(result.errors).toEqual([]);
    });

    it('should detect suspicious patterns', () => {
      const code = `
        eval('dangerous');
        require('fs');
      `;

      const result = validator.validateCodeQuality({ code });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSecurity', () => {
    it('should validate secure plugin', () => {
      const code = `
        export default {
          activate() {
            console.log('activated');
          }
        };
      `;

      const result = validator.validateSecurity({ code, permissions: [] });

      expect(result.errors).toEqual([]);
    });

    it('should detect unsafe operations', () => {
      const code = `
        import fs from 'fs';
        fs.unlinkSync('/etc/passwd');
      `;

      const result = validator.validateSecurity({ code, permissions: [] });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validatePerformance', () => {
    it('should validate performant code', () => {
      const code = `
        const arr = [1, 2, 3];
        arr.forEach(x => x * 2);
      `;

      const result = validator.validatePerformance({ code, enablePerformanceMonitoring: true });

      expect(result.errors).toEqual([]);
    });

    it('should detect performance issues', () => {
      const code = `
        while (true) {
          // infinite loop
        }
      `;

      const result = validator.validatePerformance({ code, enablePerformanceMonitoring: true });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('should run all validations', () => {
      const plugin = {
        metadata: new PluginMetadata({
          name: 'test-plugin',
          version: '1.0.0',
          main: 'index.js'
        }),
        path: '/valid/path',
        code: 'export default {}'
      };

      const result = validator.validate(plugin);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('calculateScore', () => {
    it('should calculate score from errors and warnings', () => {
      const errors = [{ message: 'Error 1' }, { message: 'Error 2' }];
      const warnings = [{ message: 'Warning 1' }, { message: 'Warning 2' }];

      const score = validator.calculateScore(errors, warnings);

      // 100 - (2 * 10) - (2 * 2) = 100 - 20 - 4 = 76
      expect(score).toBe(76);
    });

    it('should return 0 when score is negative', () => {
      const errors = Array.from({ length: 20 }, (_, i) => ({ message: `Error ${i}` }));
      const warnings = [];

      const score = validator.calculateScore(errors, warnings);

      expect(score).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate detailed report', () => {
      const plugin = {
        metadata: new PluginMetadata({
          name: 'test-plugin',
          version: '1.0.0'
        }),
        path: '/valid/path',
        code: 'export default {}'
      };

      const validation = validator.validate(plugin);
      const report = validator.generateReport(plugin, validation);

      expect(report).toContain('test-plugin');
      expect(report).toContain('Score');
    });
  });
});
