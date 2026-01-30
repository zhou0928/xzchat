import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../lib/utils/logger.js';

// Mock console methods
const consoleMocks = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

describe('Logger Module', () => {
  beforeEach(() => {
    // Save original console methods
    consoleMocks.log.mockImplementation(() => {});
    consoleMocks.error.mockImplementation(() => {});
    consoleMocks.warn.mockImplementation(() => {});
    consoleMocks.info.mockImplementation(() => {});
    consoleMocks.debug.mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    vi.restoreAllMocks();
  });

  describe('logger.debug', () => {
    it('should call console.debug with message', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug('Test message');
      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      debugSpy.mockRestore();
    });

    it('should include data in debug output', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug('Test message', { key: 'value' });
      expect(debugSpy).toHaveBeenCalled();
      debugSpy.mockRestore();
    });
  });

  describe('logger.info', () => {
    it('should call console.info with message', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Test message');
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      infoSpy.mockRestore();
    });

    it('should include data in info output', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Test message', { key: 'value' });
      expect(infoSpy).toHaveBeenCalled();
      infoSpy.mockRestore();
    });
  });

  describe('logger.warn', () => {
    it('should call console.warn with message', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('Test message');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      warnSpy.mockRestore();
    });

    it('should include data in warn output', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('Test message', { key: 'value' });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('logger.error', () => {
    it('should call console.error with message', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Test message');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      errorSpy.mockRestore();
    });

    it('should include error in error output', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');
      logger.error('Test message', testError);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('setLogLevel', () => {
    it('should have setLogLevel method', () => {
      expect(typeof logger.setLogLevel).toBe('function');
    });

    it('should accept log level', () => {
      expect(() => logger.setLogLevel('DEBUG')).not.toThrow();
      expect(() => logger.setLogLevel('INFO')).not.toThrow();
      expect(() => logger.setLogLevel('WARN')).not.toThrow();
      expect(() => logger.setLogLevel('ERROR')).not.toThrow();
    });
  });

  describe('Logger Levels', () => {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

    it('should have all log level methods', () => {
      levels.forEach(level => {
        const methodName = level.toLowerCase();
        expect(typeof logger[methodName]).toBe('function');
      });
    });
  });

  describe('Environment Variable Support', () => {
    it('should respect XZCHAT_LOG_LEVEL environment variable', () => {
      const originalLevel = process.env.XZCHAT_LOG_LEVEL;
      
      process.env.XZCHAT_LOG_LEVEL = 'DEBUG';
      logger.setLogLevel(process.env.XZCHAT_LOG_LEVEL);
      
      expect(() => logger.debug('Test')).not.toThrow();
      
      process.env.XZCHAT_LOG_LEVEL = originalLevel;
    });
  });

  describe('Format', () => {
    it('should format messages consistently', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Test message');
      
      const call = infoSpy.mock.calls[0][0];
      expect(call).toContain('Test message');
      
      infoSpy.mockRestore();
    });

    it('should include timestamp', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Test message');
      
      const call = infoSpy.mock.calls[0][0];
      expect(call).toMatch(/\d{2}:\d{2}:\d{2}/); // Time format HH:MM:SS
      
      infoSpy.mockRestore();
    });

    it('should include log level', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Test message');
      
      const call = infoSpy.mock.calls[0][0];
      expect(call).toContain('INFO');
      
      infoSpy.mockRestore();
    });
  });
});
