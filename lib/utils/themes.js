/**
 * 主题系统
 * 支持自定义界面主题和颜色方案
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 预定义主题
 */
export const PREDEFINED_THEMES = {
  default: {
    name: '默认主题',
    description: '经典 xzChat 主题',
    colors: {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      prompt: '👤 您',
      assistant: '🤖 AI',
      system: '⚙️',
      tool: '🔧',
      code: '📝',
      file: '📄',
      folder: '📁',
      git: '🐙',
      database: '🗄️',
      network: '🌐',
      arrow: '→',
      separator: '─',
      bullet: '•',
      check: '✓',
      cross: '✗',
      star: '★',
      heart: '♥'
    },
    styles: {
      header: 'bold',
      emphasis: 'bold',
      command: 'cyan',
      code: 'dim',
      path: 'green',
      url: 'underline',
      error: 'red',
      warning: 'yellow',
      success: 'green',
      info: 'blue'
    }
  },

  minimal: {
    name: '极简主题',
    description: '干净的极简风格',
    colors: {
      success: '[OK]',
      error: '[ERROR]',
      warning: '[WARN]',
      info: '[INFO]',
      prompt: '您',
      assistant: 'AI',
      system: '系统',
      tool: '工具',
      code: '代码',
      file: '文件',
      folder: '目录',
      git: 'Git',
      database: 'DB',
      network: '网络',
      arrow: '>',
      separator: '-',
      bullet: '*',
      check: '✓',
      cross: '✗',
      star: '*',
      heart: '♥'
    },
    styles: {
      header: 'dim',
      emphasis: 'underline',
      command: 'dim',
      code: 'dim',
      path: 'dim',
      url: 'dim',
      error: 'bold',
      warning: 'bold',
      success: 'bold',
      info: 'dim'
    }
  },

  emoji: {
    name: 'Emoji主题',
    description: '丰富的表情符号',
    colors: {
      success: '🎉',
      error: '😢',
      warning: '⚡',
      info: '💡',
      prompt: '👋 您',
      assistant: '🤖 AI',
      system: '⚙️',
      tool: '🛠️',
      code: '💻',
      file: '📎',
      folder: '📂',
      git: '🌿',
      database: '💾',
      network: '🌐',
      arrow: '➡️',
      separator: '─',
      bullet: '●',
      check: '✅',
      cross: '❌',
      star: '⭐',
      heart: '❤️'
    },
    styles: {
      header: 'bold',
      emphasis: 'bold',
      command: 'cyan',
      code: 'dim',
      path: 'green',
      url: 'underline',
      error: 'red',
      warning: 'yellow',
      success: 'green',
      info: 'blue'
    }
  },

  hacker: {
    name: '黑客主题',
    description: '矩阵风格',
    colors: {
      success: '[+]',
      error: '[-]',
      warning: '[!]',
      info: '[*]',
      prompt: '> root@xzchat:~$',
      assistant: '< AI:',
      system: '[SYS]',
      tool: '[TOOL]',
      code: '[CODE]',
      file: '[FILE]',
      folder: '[DIR]',
      git: '[GIT]',
      database: '[DB]',
      network: '[NET]',
      arrow: '>>',
      separator: '==',
      bullet: '>',
      check: '+',
      cross: '-',
      star: '*',
      heart: '<3'
    },
    styles: {
      header: 'green',
      emphasis: 'green',
      command: 'green',
      code: 'green',
      path: 'green',
      url: 'green',
      error: 'red',
      warning: 'yellow',
      success: 'green',
      info: 'cyan'
    }
  },

  pastel: {
    name: '柔和主题',
    description: '温和的色调',
    colors: {
      success: '🌸',
      error: '🥀',
      warning: '🍋',
      info: '💭',
      prompt: '🌺 您',
      assistant: '🌻 AI',
      system: '🍀',
      tool: '🌈',
      code: '🦋',
      file: '🌼',
      folder: '🪻',
      git: '🌿',
      database: '🫐',
      network: '🌊',
      arrow: '👉',
      separator: '‧',
      bullet: '°',
      check: '✓',
      cross: '✕',
      star: '★',
      heart: '♥'
    },
    styles: {
      header: 'bold',
      emphasis: 'bold',
      command: 'magenta',
      code: 'dim',
      path: 'green',
      url: 'underline',
      error: 'red',
      warning: 'yellow',
      success: 'green',
      info: 'blue'
    }
  },

  retro: {
    name: '复古主题',
    description: '经典终端风格',
    colors: {
      success: '(+)',
      error: '(-)',
      warning: '(!)',
      info: '(i)',
      prompt: 'USER>',
      assistant: 'AI>',
      system: 'SYS>',
      tool: 'T>',
      code: 'C>',
      file: 'F>',
      folder: 'D>',
      git: 'G>',
      database: 'D>',
      network: 'N>',
      arrow: '=>',
      separator: '=',
      bullet: '+',
      check: '+',
      cross: '-',
      star: '*',
      heart: '<3'
    },
    styles: {
      header: 'bold',
      emphasis: 'bold',
      command: 'yellow',
      code: 'dim',
      path: 'green',
      url: 'underline',
      error: 'red',
      warning: 'yellow',
      success: 'green',
      info: 'cyan'
    }
  }
};

/**
 * 主题管理器类
 */
export class ThemeManager {
  constructor(options = {}) {
    this.currentTheme = options.theme || 'default';
    this.customThemes = new Map();
    this.themeDir = options.themeDir || path.join(__dirname, '..', 'themes');
  }

  /**
   * 设置当前主题
   */
  setTheme(themeName) {
    if (this.customThemes.has(themeName)) {
      this.currentTheme = themeName;
      return true;
    }
    if (PREDEFINED_THEMES[themeName]) {
      this.currentTheme = themeName;
      return true;
    }
    return false;
  }

  /**
   * 获取当前主题
   */
  getTheme() {
    if (this.customThemes.has(this.currentTheme)) {
      return this.customThemes.get(this.currentTheme);
    }
    return PREDEFINED_THEMES[this.currentTheme] || PREDEFINED_THEMES.default;
  }

  /**
   * 获取图标
   */
  getIcon(iconName) {
    const theme = this.getTheme();
    return theme.colors?.[iconName] || PREDEFINED_THEMES.default.colors?.[iconName] || '';
  }

  /**
   * 获取样式
   */
  getStyle(styleName) {
    const theme = this.getTheme();
    return theme.styles?.[styleName] || 'reset';
  }

  /**
   * 应用样式到文本
   */
  applyStyle(text, styleName) {
    const style = this.getStyle(styleName);
    const styleCodes = {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      italic: '\x1b[3m',
      underline: '\x1b[4m',
      blink: '\x1b[5m',
      reverse: '\x1b[7m',
      hidden: '\x1b[8m',
      black: '\x1b[30m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m'
    };

    const code = styleCodes[style] || styleCodes.reset;
    return `${code}${text}\x1b[0m`;
  }

  /**
   * 格式化成功消息
   */
  formatSuccess(message) {
    return `${this.getIcon('success')} ${message}`;
  }

  /**
   * 格式化错误消息
   */
  formatError(message) {
    const icon = this.getIcon('error');
    const styled = this.applyStyle(message, 'error');
    return `${icon} ${styled}`;
  }

  /**
   * 格式化警告消息
   */
  formatWarning(message) {
    const icon = this.getIcon('warning');
    const styled = this.applyStyle(message, 'warning');
    return `${icon} ${styled}`;
  }

  /**
   * 格式化信息消息
   */
  formatInfo(message) {
    const icon = this.getIcon('info');
    const styled = this.applyStyle(message, 'info');
    return `${icon} ${styled}`;
  }

  /**
   * 格式化命令
   */
  formatCommand(command) {
    const styled = this.applyStyle(command, 'command');
    return styled;
  }

  /**
   * 格式化代码
   */
  formatCode(code) {
    const icon = this.getIcon('code');
    const styled = this.applyStyle(code, 'code');
    return `${icon} ${styled}`;
  }

  /**
   * 格式化路径
   */
  formatPath(path) {
    const styled = this.applyStyle(path, 'path');
    return styled;
  }

  /**
   * 创建分隔线
   */
  createSeparator(length = 50) {
    const separator = this.getIcon('separator');
    return separator.repeat(Math.ceil(length / separator.length));
  }

  /**
   * 创建列表项
   */
  createListItem(text, index = null) {
    const bullet = index !== null ? `[${index}]` : this.getIcon('bullet');
    return `  ${bullet} ${text}`;
  }

  /**
   * 注册自定义主题
   */
  async registerCustomTheme(name, theme) {
    // 验证主题结构
    this.validateTheme(theme);

    this.customThemes.set(name, theme);

    // 可选：保存到文件
    try {
      await fs.mkdir(this.themeDir, { recursive: true });
      const themeFile = path.join(this.themeDir, `${name}.json`);
      await fs.writeFile(themeFile, JSON.stringify(theme, null, 2));
    } catch (error) {
      console.warn('Failed to save theme file:', error.message);
    }
  }

  /**
   * 从文件加载主题
   */
  async loadThemeFromFile(name) {
    const themeFile = path.join(this.themeDir, `${name}.json`);
    try {
      const data = await fs.readFile(themeFile, 'utf-8');
      const theme = JSON.parse(data);
      this.validateTheme(theme);
      this.customThemes.set(name, theme);
      return true;
    } catch (error) {
      console.error('Failed to load theme:', error.message);
      return false;
    }
  }

  /**
   * 验证主题结构
   */
  validateTheme(theme) {
    if (!theme.name || !theme.colors || !theme.styles) {
      throw new Error('Invalid theme structure');
    }

    const requiredColors = ['success', 'error', 'warning', 'info'];
    for (const color of requiredColors) {
      if (!theme.colors[color]) {
        throw new Error(`Missing required color: ${color}`);
      }
    }
  }

  /**
   * 获取所有可用主题
   */
  listThemes() {
    const themes = [];

    // 添加预定义主题
    for (const [key, theme] of Object.entries(PREDEFINED_THEMES)) {
      themes.push({
        key,
        name: theme.name,
        description: theme.description,
        isCustom: false
      });
    }

    // 添加自定义主题
    for (const [key, theme] of this.customThemes) {
      themes.push({
        key,
        name: theme.name,
        description: theme.description || 'Custom theme',
        isCustom: true
      });
    }

    return themes;
  }

  /**
   * 重置为默认主题
   */
  resetToDefault() {
    this.currentTheme = 'default';
  }
}

/**
 * 创建全局主题实例
 */
let globalTheme = null;

export function createThemeInstance(options = {}) {
  globalTheme = new ThemeManager(options);
  return globalTheme;
}

export function getThemeInstance() {
  if (!globalTheme) {
    globalTheme = new ThemeManager();
  }
  return globalTheme;
}

/**
 * 便捷函数
 */
export function formatSuccess(message) {
  return getThemeInstance().formatSuccess(message);
}

export function formatError(message) {
  return getThemeInstance().formatError(message);
}

export function formatWarning(message) {
  return getThemeInstance().formatWarning(message);
}

export function formatInfo(message) {
  return getThemeInstance().formatInfo(message);
}

export function formatCommand(command) {
  return getThemeInstance().formatCommand(command);
}

export function formatCode(code) {
  return getThemeInstance().formatCode(code);
}

export function formatPath(path) {
  return getThemeInstance().formatPath(path);
}

export function setTheme(themeName) {
  return getThemeInstance().setTheme(themeName);
}

export function getTheme() {
  return getThemeInstance();
}
