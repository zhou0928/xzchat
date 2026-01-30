/**
 * 主题定制系统单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ThemeManager,
  theme,
  color,
  style,
  formatMessage,
  setTheme,
  getTheme,
  getThemeList,
  Colors,
  PresetThemes
} from '../../lib/themes/index.js';

describe('Theme System', () => {
  let themeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
  });

  afterEach(() => {
    themeManager.reset();
  });

  describe('ThemeManager Class', () => {
    it('should create instance', () => {
      expect(themeManager).toBeInstanceOf(ThemeManager);
      expect(themeManager.getTheme()).toBeNull();
    });

    it('should load preset theme', () => {
      const loaded = themeManager.loadPreset('default');
      expect(loaded.name).toBe('Default');
      expect(loaded.colors).toBeDefined();
      expect(loaded.styles).toBeDefined();
      expect(loaded.formatting).toBeDefined();
    });

    it('should throw error for invalid preset', () => {
      expect(() => {
        themeManager.loadPreset('invalid');
      }).toThrow('Preset theme "invalid" not found');
    });

    it('should load custom theme', () => {
      const customTheme = {
        name: 'Custom',
        colors: {
          user: '\x1b[31m',
          assistant: '\x1b[32m',
          system: '\x1b[33m',
          error: '\x1b[31m',
          warning: '\x1b[33m',
          success: '\x1b[32m',
          info: '\x1b[34m',
          command: '\x1b[35m',
          commandName: '\x1b[35m',
          commandArgs: '\x1b[36m',
          prompt: '\x1b[33m',
          header: '\x1b[37m',
          border: '\x1b[90m',
          separator: '\x1b[90m',
          code: '\x1b[36m',
          codeBlock: '\x1b[40m',
          codeKeyword: '\x1b[35m',
          codeString: '\x1b[32m',
          codeComment: '\x1b[90m',
          codeFunction: '\x1b[33m',
          link: '\x1b[34m',
          highlight: '\x1b[33m',
          muted: '\x1b[90m'
        },
        styles: {
          spinner: '\x1b[36m',
          progress: '\x1b[32m',
          progressBar: '\x1b[90m',
          thinking: '\x1b[90m'
        },
        formatting: {
          bold: '\x1b[1m',
          italic: '\x1b[3m',
          underline: '\x1b[4m',
          code: '\x1b[40m\x1b[36m'
        }
      };

      const loaded = themeManager.loadCustom('my-theme', customTheme);
      expect(loaded.name).toBe('Custom');
    });

    it('should set theme', () => {
      themeManager.setTheme('default');
      expect(themeManager.getTheme().name).toBe('Default');

      themeManager.setTheme('dark');
      expect(themeManager.getTheme().name).toBe('Dark');
    });

    it('should throw error for invalid theme', () => {
      expect(() => {
        themeManager.setTheme('invalid');
      }).toThrow('Theme "invalid" not found');
    });

    it('should colorize text', () => {
      themeManager.loadPreset('default');
      const result = themeManager.colorize('Hello', 'error');
      expect(result).toContain('Hello');
      expect(result).toContain('\x1b[');
    });

    it('should stylize text', () => {
      themeManager.loadPreset('default');
      const result = themeManager.stylize('Hello', 'bold');
      expect(result).toContain('Hello');
      expect(result).toContain('\x1b[1m');
    });

    it('should format message', () => {
      themeManager.loadPreset('default');
      const result = themeManager.formatMessage('Error message', 'error');
      expect(result).toContain('Error message');
      expect(result).toContain('\x1b[');
    });

    it('should format code', () => {
      themeManager.loadPreset('default');
      const result = themeManager.formatCode('console.log("hello")');
      expect(result).toContain('console.log("hello")');
      expect(result).toContain('\x1b[');
    });

    it('should format command', () => {
      themeManager.loadPreset('default');
      const result = themeManager.formatCommand('/session', ['list']);
      expect(result).toContain('/session');
      expect(result).toContain('list');
    });

    it('should format header', () => {
      themeManager.loadPreset('default');
      const result = themeManager.formatHeader('Title', 2);
      expect(result).toContain('## Title');
      expect(result).toContain('\x1b[');
    });

    it('should format link', () => {
      themeManager.loadPreset('default');
      const result = themeManager.formatLink('Click here', 'https://example.com');
      expect(result).toContain('Click here');
      expect(result).toContain('\x1b[');
    });

    it('should create border', () => {
      themeManager.loadPreset('default');
      const result = themeManager.createBorder('─', 40);
      expect(result).toContain('─'.repeat(40));
      expect(result).toContain('\x1b[');
    });

    it('should create separator', () => {
      themeManager.loadPreset('default');
      const result = themeManager.createSeparator(40);
      expect(result).toContain('─'.repeat(40));
    });

    it('should get theme list', () => {
      const list = themeManager.getThemeList();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toHaveProperty('name');
      expect(list[0]).toHaveProperty('type');
      expect(list[0]).toHaveProperty('description');
    });

    it('should export theme', () => {
      themeManager.loadPreset('default');
      const exported = themeManager.exportTheme();
      expect(exported).toHaveProperty('name');
      expect(exported).toHaveProperty('colors');
      expect(exported).toHaveProperty('styles');
      expect(exported).toHaveProperty('formatting');
    });

    it('should import theme', () => {
      themeManager.loadPreset('default');
      const exported = themeManager.exportTheme();
      
      themeManager.reset();
      expect(themeManager.getTheme()).toBeNull();
      
      themeManager.importTheme(exported);
      expect(themeManager.getTheme()).toHaveProperty('name', 'Default');
    });

    it('should create variant', () => {
      const variant = themeManager.createVariant('default', 'my-variant', {
        description: 'My custom variant'
      });
      
      expect(variant.name).toBe('my-variant');
      expect(variant.description).toBe('My custom variant');
      expect(themeManager.customThemes['my-variant']).toBeDefined();
    });

    it('should validate theme structure', () => {
      const validTheme = {
        colors: {},
        styles: {},
        formatting: {}
      };
      
      expect(() => themeManager.validateTheme(validTheme)).not.toThrow();
    });

    it('should throw error for invalid theme', () => {
      const invalidTheme = {
        colors: {}
      };
      
      expect(() => themeManager.validateTheme(invalidTheme)).toThrow();
    });

    it('should clear cache', () => {
      themeManager.loadPreset('default');
      themeManager.colorize('test', 'error');
      expect(themeManager.themeCache.size).toBeGreaterThan(0);
      
      themeManager.clearCache();
      expect(themeManager.themeCache.size).toBe(0);
    });

    it('should reset', () => {
      themeManager.loadPreset('default');
      themeManager.loadCustom('custom', {
        colors: {},
        styles: {},
        formatting: {}
      });
      
      themeManager.reset();
      expect(themeManager.getTheme()).toBeNull();
      expect(Object.keys(themeManager.customThemes).length).toBe(0);
    });
  });

  describe('Global Functions', () => {
    beforeEach(() => {
      setTheme('default');
    });

    afterEach(() => {
      theme.reset();
    });

    it('should colorize using global function', () => {
      const result = color('Hello', 'error');
      expect(result).toContain('Hello');
      expect(result).toContain('\x1b[');
    });

    it('should stylize using global function', () => {
      const result = style('Hello', 'bold');
      expect(result).toContain('Hello');
      expect(result).toContain('\x1b[1m');
    });

    it('should format message using global function', () => {
      const result = formatMessage('Success', 'success');
      expect(result).toContain('Success');
      expect(result).toContain('\x1b[');
    });

    it('should set theme using global function', () => {
      setTheme('dark');
      expect(getTheme().name).toBe('Dark');
    });

    it('should get theme list using global function', () => {
      const list = getThemeList();
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('Preset Themes', () => {
    it('should have default theme', () => {
      expect(PresetThemes.default).toBeDefined();
      expect(PresetThemes.default.name).toBe('Default');
    });

    it('should have dark theme', () => {
      expect(PresetThemes.dark).toBeDefined();
      expect(PresetThemes.dark.name).toBe('Dark');
    });

    it('should have light theme', () => {
      expect(PresetThemes.light).toBeDefined();
      expect(PresetThemes.light.name).toBe('Light');
    });

    it('should have highContrast theme', () => {
      expect(PresetThemes.highContrast).toBeDefined();
      expect(PresetThemes.highContrast.name).toBe('High Contrast');
    });

    it('should have minimal theme', () => {
      expect(PresetThemes.minimal).toBeDefined();
      expect(PresetThemes.minimal.name).toBe('Minimal');
    });

    it('should have neon theme', () => {
      expect(PresetThemes.neon).toBeDefined();
      expect(PresetThemes.neon.name).toBe('Neon');
    });

    it('should have dracula theme', () => {
      expect(PresetThemes.dracula).toBeDefined();
      expect(PresetThemes.dracula.name).toBe('Dracula');
    });

    it('should have nord theme', () => {
      expect(PresetThemes.nord).toBeDefined();
      expect(PresetThemes.nord.name).toBe('Nord');
    });
  });

  describe('Colors Constant', () => {
    it('should have all basic colors', () => {
      expect(Colors.reset).toBe('\x1b[0m');
      expect(Colors.black).toBe('\x1b[30m');
      expect(Colors.red).toBe('\x1b[31m');
      expect(Colors.green).toBe('\x1b[32m');
      expect(Colors.yellow).toBe('\x1b[33m');
      expect(Colors.blue).toBe('\x1b[34m');
      expect(Colors.magenta).toBe('\x1b[35m');
      expect(Colors.cyan).toBe('\x1b[36m');
      expect(Colors.white).toBe('\x1b[37m');
    });

    it('should have bright colors', () => {
      expect(Colors.brightBlack).toBe('\x1b[90m');
      expect(Colors.brightRed).toBe('\x1b[91m');
      expect(Colors.brightGreen).toBe('\x1b[92m');
      expect(Colors.brightYellow).toBe('\x1b[93m');
      expect(Colors.brightBlue).toBe('\x1b[94m');
      expect(Colors.brightMagenta).toBe('\x1b[95m');
      expect(Colors.brightCyan).toBe('\x1b[96m');
      expect(Colors.brightWhite).toBe('\x1b[97m');
    });

    it('should have background colors', () => {
      expect(Colors.bgBlack).toBe('\x1b[40m');
      expect(Colors.bgRed).toBe('\x1b[41m');
      expect(Colors.bgGreen).toBe('\x1b[42m');
      expect(Colors.bgYellow).toBe('\x1b[43m');
      expect(Colors.bgBlue).toBe('\x1b[44m');
      expect(Colors.bgMagenta).toBe('\x1b[45m');
      expect(Colors.bgCyan).toBe('\x1b[46m');
      expect(Colors.bgWhite).toBe('\x1b[47m');
    });

    it('should have styles', () => {
      expect(Colors.bold).toBe('\x1b[1m');
      expect(Colors.dim).toBe('\x1b[2m');
      expect(Colors.italic).toBe('\x1b[3m');
      expect(Colors.underline).toBe('\x1b[4m');
      expect(Colors.inverse).toBe('\x1b[7m');
      expect(Colors.hidden).toBe('\x1b[8m');
      expect(Colors.strikethrough).toBe('\x1b[9m');
    });
  });

  describe('Theme Formats', () => {
    it('should handle 256-color themes (Dracula)', () => {
      themeManager.loadPreset('dracula');
      expect(themeManager.getTheme().name).toBe('Dracula');
    });

    it('should handle 256-color themes (Nord)', () => {
      themeManager.loadPreset('nord');
      expect(themeManager.getTheme().name).toBe('Nord');
    });

    it('should handle basic ANSI themes', () => {
      themeManager.loadPreset('default');
      expect(themeManager.getTheme().name).toBe('Default');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined text', () => {
      themeManager.loadPreset('default');
      expect(themeManager.colorize(null, 'error')).toBeNull();
      expect(themeManager.colorize(undefined, 'error')).toBeUndefined();
    });

    it('should handle empty text', () => {
      themeManager.loadPreset('default');
      const result = themeManager.colorize('', 'error');
      expect(result).toBe('');
    });

    it('should handle invalid color name', () => {
      themeManager.loadPreset('default');
      const result = themeManager.colorize('test', 'invalid');
      expect(result).toBe('test');
    });

    it('should handle invalid style name', () => {
      themeManager.loadPreset('default');
      const result = themeManager.stylize('test', 'invalid');
      expect(result).toBe('test');
    });

    it('should handle zero length border', () => {
      themeManager.loadPreset('default');
      const result = themeManager.createBorder('─', 0);
      expect(result).toBe('');
    });
  });

  describe('Performance', () => {
    it('should handle rapid colorize calls', () => {
      themeManager.loadPreset('default');
      
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        themeManager.colorize(`test ${i}`, 'error');
      }
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle large theme list', () => {
      for (let i = 0; i < 100; i++) {
        themeManager.loadCustom(`theme-${i}`, {
          colors: { user: '\x1b[31m', assistant: '\x1b[32m', system: '\x1b[33m', error: '\x1b[31m', warning: '\x1b[33m', success: '\x1b[32m', info: '\x1b[34m', command: '\x1b[35m', commandName: '\x1b[35m', commandArgs: '\x1b[36m', prompt: '\x1b[33m', header: '\x1b[37m', border: '\x1b[90m', separator: '\x1b[90m', code: '\x1b[36m', codeBlock: '\x1b[40m', codeKeyword: '\x1b[35m', codeString: '\x1b[32m', codeComment: '\x1b[90m', codeFunction: '\x1b[33m', link: '\x1b[34m', highlight: '\x1b[33m', muted: '\x1b[90m' },
          styles: { spinner: '\x1b[36m', progress: '\x1b[32m', progressBar: '\x1b[90m', thinking: '\x1b[90m' },
          formatting: { bold: '\x1b[1m', italic: '\x1b[3m', underline: '\x1b[4m', code: '\x1b[40m\x1b[36m' }
        });
      }
      
      const list = themeManager.getThemeList();
      expect(list.length).toBeGreaterThanOrEqual(100);
    });
  });
});
