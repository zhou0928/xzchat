import { describe, it, expect } from 'vitest';
import {
  COMMAND_HELP,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  WARNING_MESSAGES,
  INFO_MESSAGES,
  showCommandHelp,
  showAllCommands,
  showError,
  showSuccess,
  showWarning,
  showInfo,
  formatList,
  formatTable
} from '../../lib/utils/messages.js';

describe('Messages Module', () => {
  describe('COMMAND_HELP', () => {
    it('should have help for session command', () => {
      expect(COMMAND_HELP.session).toBeDefined();
      expect(COMMAND_HELP.session.summary).toBe('管理会话');
    });

    it('should have help for branch command', () => {
      expect(COMMAND_HELP.branch).toBeDefined();
      expect(COMMAND_HELP.branch.summary).toBe('管理对话分支');
    });

    it('should have help for token command', () => {
      expect(COMMAND_HELP.token).toBeDefined();
      expect(COMMAND_HELP.token.summary).toBe('查看 Token 使用和成本');
    });

    it('should have subcommands for commands that need them', () => {
      expect(COMMAND_HELP.session.subcommands).toBeDefined();
      expect(COMMAND_HELP.branch.subcommands).toBeDefined();
    });

    it('should have examples', () => {
      expect(COMMAND_HELP.session.examples).toBeDefined();
      expect(Array.isArray(COMMAND_HELP.session.examples)).toBe(true);
    });

    it('should have tips', () => {
      expect(COMMAND_HELP.session.tips).toBeDefined();
      expect(Array.isArray(COMMAND_HELP.session.tips)).toBe(true);
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have format method', () => {
      expect(ERROR_MESSAGES.format).toBeInstanceOf(Function);
    });

    it('should format error messages with context', () => {
      const message = ERROR_MESSAGES.format('FILE_NOT_FOUND', { file: 'test.js' });
      expect(message).toContain('test.js');
    });

    it('should return error message for known error codes', () => {
      expect(ERROR_MESSAGES.UNKNOWN_COMMAND).toBe('未知命令，使用 /help 查看帮助');
      expect(ERROR_MESSAGES.FILE_NOT_FOUND).toBe('文件不存在');
    });

    it('should have all common error types', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.API_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.RATE_LIMITED).toBeDefined();
      expect(ERROR_MESSAGES.PERMISSION_DENIED).toBeDefined();
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    it('should have format method', () => {
      expect(SUCCESS_MESSAGES.format).toBeInstanceOf(Function);
    });

    it('should format success messages with context', () => {
      const message = SUCCESS_MESSAGES.format('SESSION_CREATED', { name: 'test-session' });
      expect(message).toContain('test-session');
    });

    it('should have all common success types', () => {
      expect(SUCCESS_MESSAGES.SESSION_CREATED).toBeDefined();
      expect(SUCCESS_MESSAGES.BRANCH_CREATED).toBeDefined();
      expect(SUCCESS_MESSAGES.FILE_LOADED).toBeDefined();
      expect(SUCCESS_MESSAGES.GIT_COMMITTED).toBeDefined();
    });
  });

  describe('WARNING_MESSAGES', () => {
    it('should have format method', () => {
      expect(WARNING_MESSAGES.format).toBeInstanceOf(Function);
    });

    it('should format warning messages with context', () => {
      const message = WARNING_MESSAGES.format('LARGE_FILE', { size: '500' });
      expect(message).toContain('500');
    });

    it('should have all common warning types', () => {
      expect(WARNING_MESSAGES.LARGE_FILE).toBeDefined();
      expect(WARNING_MESSAGES.NO_API_KEY).toBeDefined();
      expect(WARNING_MESSAGES.RATE_LIMITED).toBeDefined();
    });
  });

  describe('INFO_MESSAGES', () => {
    it('should have format method', () => {
      expect(INFO_MESSAGES.format).toBeInstanceOf(Function);
    });

    it('should have all common info types', () => {
      expect(INFO_MESSAGES.LOADING).toBeDefined();
      expect(INFO_MESSAGES.PROCESSING).toBeDefined();
      expect(INFO_MESSAGES.SEARCHING).toBeDefined();
      expect(INFO_MESSAGES.THINKING).toBeDefined();
    });
  });

  describe('showCommandHelp', () => {
    it('should be a function', () => {
      expect(showCommandHelp).toBeInstanceOf(Function);
    });
  });

  describe('showAllCommands', () => {
    it('should be a function', () => {
      expect(showAllCommands).toBeInstanceOf(Function);
    });
  });

  describe('formatList', () => {
    it('should format simple string list', () => {
      const items = ['item1', 'item2', 'item3'];
      const formatted = formatList(items);
      expect(formatted).toContain('item1');
      expect(formatted).toContain('item2');
      expect(formatted).toContain('item3');
    });

    it('should format numbered list', () => {
      const items = ['item1', 'item2'];
      const formatted = formatList(items, { numbered: true });
      expect(formatted).toContain('[1]');
      expect(formatted).toContain('[2]');
    });

    it('should format object list', () => {
      const items = [
        { name: 'test1', description: 'desc1' },
        { name: 'test2', description: 'desc2' }
      ];
      const formatted = formatList(items);
      expect(formatted).toContain('test1');
      expect(formatted).toContain('desc1');
    });

    it('should use custom prefix', () => {
      const items = ['item1', 'item2'];
      const formatted = formatList(items, { prefix: '>> ' });
      expect(formatted).toContain('>> ');
    });
  });

  describe('formatTable', () => {
    it('should format table with headers and rows', () => {
      const headers = ['Name', 'Age'];
      const rows = [['Alice', 25], ['Bob', 30]];
      const result = formatTable(headers, rows);
      
      expect(result.header).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(result.full).toBeDefined();
    });

    it('should handle empty rows', () => {
      const headers = ['Name', 'Age'];
      const rows = [];
      const result = formatTable(headers, rows);
      
      expect(result.full).toContain('Name');
      expect(result.full).toContain('Age');
    });

    it('should use custom padding', () => {
      const headers = ['Name'];
      const rows = [['Test']];
      const result = formatTable(headers, rows, { padding: 4 });
      
      expect(result.full).toBeDefined();
    });
  });

  describe('emoji support', () => {
    it('should include emojis in messages', () => {
      expect(ERROR_MESSAGES.UNKNOWN_COMMAND).toContain('📖');
      expect(SUCCESS_MESSAGES.SESSION_CREATED).toContain('✅');
      expect(WARNING_MESSAGES.LARGE_FILE).toContain('⚠️');
      expect(INFO_MESSAGES.LOADING).toContain('📥');
    });
  });

  describe('message format', () => {
    it('should preserve original message format', () => {
      expect(COMMAND_HELP.session.subcommands.list).toContain('/session list');
      expect(COMMAND_HELP.branch.examples[0]).toContain('/branch');
    });

    it('should have consistent formatting', () => {
      const sessionExamples = COMMAND_HELP.session.examples;
      expect(sessionExamples.every(ex => ex.startsWith('/'))).toBe(true);
    });
  });
});
