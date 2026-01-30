/**
 * 快捷键模块测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import readline from 'node:readline';
import { 
  KeyBindingManager, 
  createKeyBindingManager, 
  detectKeyBinding,
  setupRawMode,
  restoreRawMode
} from '../lib/utils/keybindings.js';

describe('KeyBindingManager', () => {
  let rl;
  let abortController;
  let manager;
  let isProcessing;

  beforeEach(() => {
    // Mock readline
    rl = {
      write: vi.fn(),
      line: '',
      prompt: vi.fn(),
      question: vi.fn(),
    };

    abortController = null;
    isProcessing = vi.fn(() => false);

    manager = createKeyBindingManager({
      rl,
      abortController: () => abortController,
      isProcessing,
      onClear: vi.fn(),
      onExit: vi.fn(),
      onInterrupt: vi.fn(),
    });
  });

  describe('创建管理器', () => {
    it('应该创建管理器实例', () => {
      expect(manager).toBeInstanceOf(KeyBindingManager);
    });

    it('应该注册自定义处理程序', () => {
      const handler = vi.fn();
      manager.register('custom', handler);
      expect(manager.customHandlers.has('custom')).toBe(true);
    });
  });

  describe('按键处理', () => {
    it('应该处理 Ctrl+L (清屏)', () => {
      const key = { name: 'l', ctrl: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(manager.onClear).toHaveBeenCalled();
    });

    it('应该处理 Ctrl+R (清除当前行)', () => {
      const key = { name: 'r', ctrl: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });

    it('应该处理 Ctrl+U (删除到行首)', () => {
      const key = { name: 'u', ctrl: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });

    it('应该处理 Ctrl+K (删除到行尾)', () => {
      const key = { name: 'k', ctrl: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });

    it('应该处理 Ctrl+A (跳到行首)', () => {
      const key = { name: 'a', ctrl: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });

    it('应该处理 Ctrl+E (跳到行尾)', () => {
      const key = { name: 'e', ctrl: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });

    it('应该处理 Ctrl+W (删除上一个词)', () => {
      const key = { name: 'w', ctrl: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });

    it('应该处理 Alt+Left (上一个词)', () => {
      const key = { name: 'left', alt: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });

    it('应该处理 Alt+Right (下一个词)', () => {
      const key = { name: 'right', alt: true };
      const result = manager.handleKey('', key);
      expect(result).toBe(true);
      expect(rl.write).toHaveBeenCalledWith(null, expect.anything());
    });
  });

  describe('中断和退出', () => {
    it('Ctrl+C 应该中断正在处理的请求', () => {
      abortController = { abort: vi.fn() };
      manager.abortController = () => abortController;
      
      const key = { name: 'c', ctrl: true };
      manager.handleKey('', key);
      
      expect(abortController.abort).toHaveBeenCalled();
      expect(manager.onInterrupt).toHaveBeenCalled();
    });

    it('Ctrl+C 应该清除非空输入', () => {
      abortController = null;
      manager.abortController = () => abortController;
      rl.line = 'some text';
      
      const key = { name: 'c', ctrl: true };
      manager.handleKey('', key);
      
      expect(rl.write).toHaveBeenCalledWith(null, { ctrl: true, name: 'u' });
    });

    it('Esc 应该中断正在处理的请求', () => {
      abortController = { abort: vi.fn() };
      manager.abortController = () => abortController;
      
      const key = { name: 'escape' };
      manager.handleKey('', key);
      
      expect(abortController.abort).toHaveBeenCalled();
    });

    it('Ctrl+D 应该退出', () => {
      const key = { name: 'd', ctrl: true };
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      manager.handleKey('', key);
      
      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });
  });

  describe('自定义快捷键', () => {
    it('应该调用自定义处理程序', () => {
      const customHandler = vi.fn();
      manager.register('customAction', customHandler);
      
      // 模拟匹配的按键
      const key = { name: 'x', ctrl: true };
      manager._matchKeyBinding = vi.fn().mockReturnValue(true);
      
      manager.handleKey('', key);
      
      expect(customHandler).toHaveBeenCalledWith(key);
    });
  });

  describe('帮助和显示', () => {
    it('应该显示快捷键帮助', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      manager.showKeyBindings();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('应该返回帮助文本', () => {
      const helpText = manager.getHelpText();
      expect(helpText).toContain('Ctrl+L');
      expect(helpText).toContain('Ctrl+R');
      expect(helpText).toContain('Esc/Ctrl+C');
    });
  });
});

describe('detectKeyBinding', () => {
  it('应该检测 Ctrl 组合键', () => {
    const key = { name: 'l', ctrl: true };
    const result = detectKeyBinding('', key);
    expect(result).toBe('Ctrl+l');
  });

  it('应该检测 Alt 组合键', () => {
    const key = { name: 'left', alt: true };
    const result = detectKeyBinding('', key);
    expect(result).toBe('Alt+left');
  });

  it('应该检测 Shift 组合键', () => {
    const key = { name: 'a', shift: true };
    const result = detectKeyBinding('', key);
    expect(result).toBe('Shift+a');
  });

  it('应该检测多个修饰键组合', () => {
    const key = { name: 'd', ctrl: true, shift: true };
    const result = detectKeyBinding('', key);
    expect(result).toBe('Ctrl+Shift+d');
  });

  it('应该处理普通按键', () => {
    const key = { name: 'enter' };
    const result = detectKeyBinding('', key);
    expect(result).toBe('ENTER');
  });
});

describe('Raw Mode', () => {
  it('setupRawMode 应该设置原始模式', () => {
    const setRawModeSpy = vi.spyOn(process.stdin, 'setRawMode').mockImplementation(() => true);
    
    setupRawMode();
    expect(setRawModeSpy).toHaveBeenCalledWith(true);
    
    setRawModeSpy.mockRestore();
  });

  it('restoreRawMode 应该恢复正常模式', () => {
    const setRawModeSpy = vi.spyOn(process.stdin, 'setRawMode').mockImplementation(() => true);
    
    restoreRawMode();
    expect(setRawModeSpy).toHaveBeenCalledWith(false);
    
    setRawModeSpy.mockRestore();
  });
});

describe('KeyBindings 常量', () => {
  it('应该导出所有快捷键常量', async () => {
    const { KeyBindings } = await import('../lib/utils/keybindings.js');
    expect(KeyBindings).toBeDefined();
    expect(KeyBindings.CLEAR).toBeDefined();
    expect(KeyBindings.CLEAR.action).toBe('clear');
  });
});
