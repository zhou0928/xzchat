/**
 * 快捷键管理模块
 * 提供键盘快捷键功能,包括 Ctrl+L、Ctrl+R、Ctrl+C 等
 */

import readline from 'node:readline';
import { logger } from './logger.js';

/**
 * 快捷键配置
 */
export const KeyBindings = {
  // Ctrl+L: 清屏
  CLEAR: { key: 'l', ctrl: true, name: 'Ctrl+L', description: '清屏', action: 'clear' },
  // Ctrl+R: 清除当前行
  CLEAR_LINE: { key: 'r', ctrl: true, name: 'Ctrl+R', description: '清除当前行', action: 'clearLine' },
  // Ctrl+C: 中断或确认退出
  INTERRUPT: { key: 'c', ctrl: true, name: 'Ctrl+C', description: '中断/退出', action: 'interrupt' },
  // Ctrl+D: 退出
  EXIT: { key: 'd', ctrl: true, name: 'Ctrl+D', description: '退出', action: 'exit' },
  // Ctrl+U: 删除到行首
  KILL_LINE: { key: 'u', ctrl: true, name: 'Ctrl+U', description: '删除到行首', action: 'killLine' },
  // Ctrl+K: 删除到行尾
  KILL_EOL: { key: 'k', ctrl: true, name: 'Ctrl+K', description: '删除到行尾', action: 'killEol' },
  // Ctrl+A: 跳到行首
  BEGINNING_OF_LINE: { key: 'a', ctrl: true, name: 'Ctrl+A', description: '跳到行首', action: 'beginningOfLine' },
  // Ctrl+E: 跳到行尾
  END_OF_LINE: { key: 'e', ctrl: true, name: 'Ctrl+E', description: '跳到行尾', action: 'endOfLine' },
  // Ctrl+W: 删除上一个词
  BACKWARD_KILL_WORD: { key: 'w', ctrl: true, name: 'Ctrl+W', description: '删除上一个词', action: 'backwardKillWord' },
  // Alt+Left: 上一个词
  BACKWARD_WORD: { key: 'left', alt: true, name: 'Alt+Left', description: '上一个词', action: 'backwardWord' },
  // Alt+Right: 下一个词
  FORWARD_WORD: { key: 'right', alt: true, name: 'Alt+Right', description: '下一个词', action: 'forwardWord' },
  // Up Arrow: 历史上一条
  PREVIOUS_HISTORY: { key: 'up', name: '↑', description: '历史上一条', action: 'previousHistory' },
  // Down Arrow: 历史下一条
  NEXT_HISTORY: { key: 'down', name: '↓', description: '历史下一条', action: 'nextHistory' },
  // Esc: 清除当前行或退出
  ESCAPE: { key: 'escape', name: 'Esc', description: '清除行/退出', action: 'escape' },
};

/**
 * 快捷键管理器类
 */
export class KeyBindingManager {
  constructor(options = {}) {
    this.rl = options.rl;
    this.abortController = options.abortController;
    this.customHandlers = new Map();
    this.isProcessing = options.isProcessing || (() => false);
    this.onClear = options.onClear || (() => {});
    this.onExit = options.onExit || (() => {});
    this.onInterrupt = options.onInterrupt || (() => {});
    this.isProcessing = options.isProcessing;
  }

  /**
   * 注册自定义快捷键处理
   */
  register(action, handler) {
    this.customHandlers.set(action, handler);
  }

  /**
   * 处理按键事件
   */
  handleKey(str, key) {
    if (!key) return false;

    logger.debug(`Key pressed: ${JSON.stringify(key)}`);

    // Ctrl+L: 清屏
    if (key.ctrl && key.name === 'l') {
      this._handleClear();
      return true;
    }

    // Ctrl+R: 清除当前行
    if (key.ctrl && key.name === 'r') {
      this._handleClearLine();
      return true;
    }

    // Ctrl+C: 中断或退出
    if (key.ctrl && key.name === 'c') {
      this._handleInterrupt();
      return true;
    }

    // Ctrl+D: 退出
    if (key.ctrl && key.name === 'd') {
      this._handleExit();
      return true;
    }

    // Esc: 清除当前行或退出
    if (key.name === 'escape') {
      this._handleEscape();
      return true;
    }

    // Ctrl+U: 删除到行首
    if (key.ctrl && key.name === 'u') {
      this.rl.write(null, { ctrl: true, name: 'u' });
      return true;
    }

    // Ctrl+K: 删除到行尾
    if (key.ctrl && key.name === 'k') {
      this.rl.write(null, { ctrl: true, name: 'k' });
      return true;
    }

    // Ctrl+A: 跳到行首
    if (key.ctrl && key.name === 'a') {
      this.rl.write(null, { ctrl: true, name: 'a' });
      return true;
    }

    // Ctrl+E: 跳到行尾
    if (key.ctrl && key.name === 'e') {
      this.rl.write(null, { ctrl: true, name: 'e' });
      return true;
    }

    // Ctrl+W: 删除上一个词
    if (key.ctrl && key.name === 'w') {
      this.rl.write(null, { ctrl: true, name: 'w' });
      return true;
    }

    // Alt+Left: 上一个词
    if (key.alt && key.name === 'left') {
      this.rl.write(null, { alt: true, name: 'left' });
      return true;
    }

    // Alt+Right: 下一个词
    if (key.alt && key.name === 'right') {
      this.rl.write(null, { alt: true, name: 'right' });
      return true;
    }

    // 检查自定义处理程序
    for (const [action, handler] of this.customHandlers) {
      if (this._matchKeyBinding(action, key)) {
        try {
          handler(key);
          return true;
        } catch (error) {
          logger.error(`快捷键处理错误 [${action}]:`, error);
        }
      }
    }

    return false;
  }

  /**
   * 匹配快捷键绑定
   */
  _matchKeyBinding(action, key) {
    const binding = Object.values(KeyBindings).find(b => b.action === action);
    if (!binding) return false;

    if (binding.ctrl && !key.ctrl) return false;
    if (binding.alt && !key.alt) return false;
    if (binding.shift && !key.shift) return false;
    if (binding.name.toLowerCase() !== key.name.toLowerCase()) return false;

    return true;
  }

  /**
   * 处理清屏 (Ctrl+L)
   */
  _handleClear() {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    this.rl.prompt();
    logger.info('已清屏');
    if (this.onClear) this.onClear();
  }

  /**
   * 处理清除当前行 (Ctrl+R)
   */
  _handleClearLine() {
    readline.clearLine(process.stdout, 0);
    this.rl.prompt();
  }

  /**
   * 处理中断 (Ctrl+C)
   */
  _handleInterrupt() {
    if (this.abortController) {
      // 如果正在处理请求,中断它
      this.abortController.abort();
      this.abortController = null;
      console.log("\n🛑 已中断 (Ctrl+C)");
      logger.info('请求已中断');
      if (this.onInterrupt) this.onInterrupt();
    } else {
      // 如果有输入内容,清空当前行
      if (this.rl.line && this.rl.line.length > 0) {
        this.rl.write(null, { ctrl: true, name: 'u' });
        console.log("\n✏️  已清除输入 (Ctrl+C)");
      } else {
        // 否则确认退出
        this.rl.question('\n确定要退出吗? (y/n) ', (ans) => {
          if (ans.match(/^y/i)) {
            this._handleExit();
          } else {
            this.rl.prompt();
          }
        });
      }
    }
  }

  /**
   * 处理退出 (Ctrl+D)
   */
  _handleExit() {
    if (this.onExit) {
      this.onExit();
    } else {
      process.exit(0);
    }
  }

  /**
   * 处理 Esc 键
   */
  _handleEscape() {
    if (this.abortController) {
      // 如果正在处理请求,中断它
      this.abortController.abort();
      this.abortController = null;
      console.log("\n🛑 已中断 (Esc)");
      logger.info('请求已中断');
      if (this.onInterrupt) this.onInterrupt();
    } else {
      // 如果当前有输入内容,先清空
      if (this.rl.line && this.rl.line.length > 0) {
        this.rl.write(null, { ctrl: true, name: 'u' });
        console.log("\n✏️  已清除输入 (Esc)");
      } else {
        // 否则直接退出
        this._handleExit();
      }
    }
  }

  /**
   * 显示所有快捷键
   */
  showKeyBindings() {
    console.log('\n🎹 可用快捷键:');
    console.log('──────────────────────────────────────────────────────────');
    console.log('  Ctrl+L      清屏');
    console.log('  Ctrl+R      清除当前行');
    console.log('  Ctrl+U      删除到行首');
    console.log('  Ctrl+K      删除到行尾');
    console.log('  Ctrl+A      跳到行首');
    console.log('  Ctrl+E      跳到行尾');
    console.log('  Ctrl+W      删除上一个词');
    console.log('  Alt+Left    上一个词');
    console.log('  Alt+Right   下一个词');
    console.log('  ↑/↓        历史上一条/下一条');
    console.log('  Esc/Ctrl+C  中断或退出');
    console.log('──────────────────────────────────────────────────────────\n');
  }

  /**
   * 获取快捷键帮助文本
   */
  getHelpText() {
    const bindings = [
      'Ctrl+L   清屏',
      'Ctrl+R   清除当前行',
      'Ctrl+U   删除到行首',
      'Ctrl+K   删除到行尾',
      'Ctrl+A   跳到行首',
      'Ctrl+E   跳到行尾',
      'Ctrl+W   删除上一个词',
      'Esc/Ctrl+C  中断/退出',
    ];
    return bindings.join('  |  ');
  }
}

/**
 * 创建快捷键管理器实例
 */
export function createKeyBindingManager(options) {
  return new KeyBindingManager(options);
}

/**
 * 辅助函数: 设置 stdin 原始模式以捕获特殊按键
 */
export function setupRawMode() {
  if (process.stdin.isTTY && !process.stdin.isRaw) {
    process.stdin.setRawMode(true);
  }
}

/**
 * 辅助函数: 恢复 stdin 正常模式
 */
export function restoreRawMode() {
  if (process.stdin.isTTY && process.stdin.isRaw) {
    process.stdin.setRawMode(false);
  }
}

/**
 * 辅助函数: 检测按键组合
 */
export function detectKeyBinding(str, key) {
  const modifiers = [];
  if (key.ctrl) modifiers.push('Ctrl');
  if (key.alt) modifiers.push('Alt');
  if (key.shift) modifiers.push('Shift');

  const name = key.name || '';
  return modifiers.length > 0 
    ? `${modifiers.join('+')}+${name}`
    : name.toUpperCase();
}
