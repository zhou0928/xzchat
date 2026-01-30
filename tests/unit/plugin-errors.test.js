/**
 * 插件错误类型测试
 */

import { describe, it, expect } from 'vitest';
import {
  PluginLoadError,
  PluginValidationError,
  DependencyError,
  PluginVersionError,
  PluginAlreadyLoadedError,
  PluginNotFoundError,
  PluginEnableError,
  PluginDisableError,
  PluginHookError,
  PluginCommandError,
  PluginTimeoutError,
  PluginSecurityError,
  PluginPermissionError,
  PluginConfigurationError
} from '../../lib/errors/plugin-errors.js';

describe('Plugin Errors', () => {
  describe('PluginLoadError', () => {
    it('should create error with correct structure', () => {
      const error = new PluginLoadError('test-plugin', 'File not found');

      expect(error.name).toBe('PluginLoadError');
      expect(error.pluginId).toBe('test-plugin');
      expect(error.message).toContain('test-plugin');
      expect(error.message).toContain('File not found');
      expect(error.code).toBe('PLUGIN_LOAD_ERROR');
    });

    it('should convert to JSON correctly', () => {
      const error = new PluginLoadError('test-plugin', 'File not found');
      const json = error.toJSON();

      expect(json.name).toBe('PluginLoadError');
      expect(json.pluginId).toBe('test-plugin');
      expect(json.details).toBe('File not found');
    });
  });

  describe('PluginValidationError', () => {
    it('should create error with validation errors', () => {
      const errors = ['Name is required', 'Version is invalid'];
      const error = new PluginValidationError('test-plugin', errors);

      expect(error.name).toBe('PluginValidationError');
      expect(error.pluginId).toBe('test-plugin');
      expect(error.validationErrors).toEqual(errors);
      expect(error.code).toBe('PLUGIN_VALIDATION_ERROR');
    });

    it('should display all validation errors in message', () => {
      const errors = ['Name is required', 'Version is invalid'];
      const error = new PluginValidationError('test-plugin', errors);

      expect(error.message).toContain('Name is required');
      expect(error.message).toContain('Version is invalid');
    });
  });

  describe('DependencyError', () => {
    it('should create error with missing dependencies', () => {
      const error = new DependencyError('test-plugin', ['dep1', 'dep2'], []);

      expect(error.name).toBe('DependencyError');
      expect(error.pluginId).toBe('test-plugin');
      expect(error.missing).toEqual(['dep1', 'dep2']);
      expect(error.message).toContain('dep1');
      expect(error.message).toContain('dep2');
    });

    it('should create error with unsatisfied versions', () => {
      const unsatisfied = [
        { dependency: 'dep1', required: '2.0.0', installed: '1.0.0' }
      ];
      const error = new DependencyError('test-plugin', [], unsatisfied);

      expect(error.unsatisfied).toEqual(unsatisfied);
      expect(error.message).toContain('dep1');
    });

    it('should create error with custom message', () => {
      const error = new DependencyError('test-plugin', [], [], 'Custom error');

      expect(error.message).toContain('Custom error');
    });
  });

  describe('PluginVersionError', () => {
    it('should create error with version information', () => {
      const error = new PluginVersionError('test-plugin', '1.0.0', '2.0.0');

      expect(error.name).toBe('PluginVersionError');
      expect(error.pluginId).toBe('test-plugin');
      expect(error.expectedVersion).toBe('1.0.0');
      expect(error.actualVersion).toBe('2.0.0');
      expect(error.code).toBe('PLUGIN_VERSION_ERROR');
    });
  });

  describe('PluginAlreadyLoadedError', () => {
    it('should create error for already loaded plugin', () => {
      const error = new PluginAlreadyLoadedError('test-plugin');

      expect(error.name).toBe('PluginAlreadyLoadedError');
      expect(error.pluginId).toBe('test-plugin');
      expect(error.code).toBe('PLUGIN_ALREADY_LOADED');
    });
  });

  describe('PluginNotFoundError', () => {
    it('should create error for missing plugin', () => {
      const error = new PluginNotFoundError('test-plugin');

      expect(error.name).toBe('PluginNotFoundError');
      expect(error.pluginId).toBe('test-plugin');
      expect(error.code).toBe('PLUGIN_NOT_FOUND');
    });
  });

  describe('Other Error Types', () => {
    it('PluginEnableError should work correctly', () => {
      const error = new PluginEnableError('test-plugin', 'Dependency missing');

      expect(error.name).toBe('PluginEnableError');
      expect(error.code).toBe('PLUGIN_ENABLE_ERROR');
    });

    it('PluginDisableError should work correctly', () => {
      const error = new PluginDisableError('test-plugin', 'Plugin in use');

      expect(error.name).toBe('PluginDisableError');
      expect(error.code).toBe('PLUGIN_DISABLE_ERROR');
    });

    it('PluginHookError should work correctly', () => {
      const error = new PluginHookError('test-plugin', 'onLoad', 'Hook failed');

      expect(error.name).toBe('PluginHookError');
      expect(error.hookName).toBe('onLoad');
    });

    it('PluginCommandError should work correctly', () => {
      const error = new PluginCommandError('test-plugin', '/test', 'Command failed');

      expect(error.name).toBe('PluginCommandError');
      expect(error.commandName).toBe('/test');
    });

    it('PluginTimeoutError should work correctly', () => {
      const error = new PluginTimeoutError('test-plugin', 5000);

      expect(error.name).toBe('PluginTimeoutError');
      expect(error.timeout).toBe(5000);
      expect(error.code).toBe('PLUGIN_TIMEOUT');
    });

    it('PluginSecurityError should work correctly', () => {
      const error = new PluginSecurityError('test-plugin', 'Unsafe code detected');

      expect(error.name).toBe('PluginSecurityError');
      expect(error.code).toBe('PLUGIN_SECURITY_ERROR');
    });

    it('PluginPermissionError should work correctly', () => {
      const error = new PluginPermissionError('test-plugin', 'readFiles');

      expect(error.name).toBe('PluginPermissionError');
      expect(error.permission).toBe('readFiles');
      expect(error.code).toBe('PLUGIN_PERMISSION_ERROR');
    });

    it('PluginConfigurationError should work correctly', () => {
      const error = new PluginConfigurationError('test-plugin', 'Invalid config');

      expect(error.name).toBe('PluginConfigurationError');
      expect(error.code).toBe('PLUGIN_CONFIGURATION_ERROR');
    });
  });

  describe('Error Inheritance', () => {
    it('all errors should be instances of Error', () => {
      const errors = [
        new PluginLoadError('test', 'reason'),
        new PluginValidationError('test', []),
        new DependencyError('test', [], []),
        new PluginVersionError('test', '1.0.0', '2.0.0'),
        new PluginAlreadyLoadedError('test'),
        new PluginNotFoundError('test'),
        new PluginEnableError('test', 'reason'),
        new PluginDisableError('test', 'reason'),
        new PluginHookError('test', 'hook', 'reason'),
        new PluginCommandError('test', 'cmd', 'reason'),
        new PluginTimeoutError('test', 5000),
        new PluginSecurityError('test', 'reason'),
        new PluginPermissionError('test', 'perm'),
        new PluginConfigurationError('test', 'reason')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('all errors should have stack trace', () => {
      const error = new PluginLoadError('test', 'reason');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });
});
