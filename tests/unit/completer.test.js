/**
 * 命令补全模块测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  completeCommand,
  COMMANDS,
  COMMAND_ARGS,
  formatCompletionSuggestions
} from '../../lib/utils/completer.js';

// Mock 依赖
vi.mock('../../lib/config.js', () => ({
  loadConfig: vi.fn(() => ({
    profiles: { default: {}, work: {} },
    roles: { coder: '', writer: '' }
  }))
}));

vi.mock('../../lib/tools.js', () => ({
  getFileList: vi.fn(() => ['file1.js', 'file2.ts', 'dir/'])
}));

vi.mock('../../lib/utils/session-manager.js', () => ({
  listSessions: vi.fn(() => Promise.resolve([
    { id: 'session-1' },
    { id: 'session-2' }
  ]))
}));

vi.mock('../../lib/utils/branch-manager.js', () => ({
  listBranches: vi.fn(() => Promise.resolve([
    { id: 'branch-1' },
    { id: 'branch-2' }
  ]))
}));

describe('命令补全模块', () => {
  describe('COMMANDS', () => {
    it('应该包含所有基本命令', () => {
      expect(COMMANDS).toContain('/help');
      expect(COMMANDS).toContain('/session');
      expect(COMMANDS).toContain('/load');
      expect(COMMANDS).toContain('/git');
    });

    it('应该包含所有命令的缩写', () => {
      expect(COMMANDS).toContain('/h');
      expect(COMMANDS).toContain('/s');
      expect(COMMANDS).toContain('/l');
      expect(COMMANDS).toContain('/b');
    });
  });

  describe('COMMAND_ARGS', () => {
    it('应该为每个命令定义参数', () => {
      expect(COMMAND_ARGS['/session']).toBeDefined();
      expect(COMMAND_ARGS['/branch']).toBeDefined();
      expect(COMMAND_ARGS['/load']).toBeDefined();
    });

    it('应该包含子命令和选项', () => {
      const sessionArgs = COMMAND_ARGS['/session'];
      expect(sessionArgs).toContain('list');
      expect(sessionArgs).toContain('use');
    });

    it('应该包含选项参数', () => {
      const loadArgs = COMMAND_ARGS['/load'];
      expect(loadArgs.some(arg => arg.startsWith('--'))).toBe(true);
    });
  });

  describe('completeCommand', () => {
    it('应该补全命令', async () => {
      const matches = await completeCommand('/s');
      expect(matches).toContain('/session');
    });

    it('应该不返回不匹配的命令', async () => {
      const matches = await completeCommand('/xyz');
      expect(matches.length).toBe(0);
    });

    it('应该补全子命令', async () => {
      const matches = await completeCommand('/session u');
      expect(matches).toContain('use');
    });

    it('应该补全选项', async () => {
      const matches = await completeCommand('/load --');
      expect(matches.some(m => m.startsWith('--'))).toBe(true);
    });

    it('应该不返回已输入的命令', async () => {
      const matches = await completeCommand('/help');
      expect(matches).not.toContain('/help');
    });
  });

  describe('formatCompletionSuggestions', () => {
    it('应该格式化补全建议', () => {
      const matches = ['option1', 'option2', 'option3'];
      const formatted = formatCompletionSuggestions(matches);

      expect(formatted).toContain('可用选项:');
      expect(formatted).toContain('1. option1');
      expect(formatted).toContain('2. option2');
    });

    it('应该限制显示数量', () => {
      const matches = Array.from({ length: 15 }, (_, i) => `option${i}`);
      const formatted = formatCompletionSuggestions(matches, 10);

      expect(formatted).toContain('还有 5 个选项');
      expect(formatted).not.toContain('11. option10');
    });

    it('应该显示没有匹配的提示', () => {
      const formatted = formatCompletionSuggestions([]);
      expect(formatted).toContain('没有匹配的补全');
    });
  });

  describe('边界情况', () => {
    it('应该处理空输入', async () => {
      const matches = await completeCommand('');
      expect(matches).toEqual([]);
    });

    it('应该处理非命令输入', async () => {
      const matches = await completeCommand('hello');
      expect(matches).toEqual([]);
    });

    it('应该处理只有空格的输入', async () => {
      const matches = await completeCommand('   ');
      expect(matches).toEqual([]);
    });
  });
});
