/**
 * 主题定制系统
 * 提供可自定义的输出主题支持
 */

/**
 * ANSI 颜色代码
 */
export const Colors = {
  reset: '\x1b[0m',
  
  // 前景色
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // 背景色
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  
  // 样式
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m'
};

/**
 * 预设主题
 */
export const PresetThemes = {
  /**
   * 默认主题
   */
  default: {
    name: 'Default',
    description: '默认配色方案',
    colors: {
      // 消息类型
      user: Colors.brightBlue,
      assistant: Colors.brightGreen,
      system: Colors.brightCyan,
      error: Colors.red,
      warning: Colors.yellow,
      success: Colors.green,
      info: Colors.blue,
      
      // 命令相关
      command: Colors.magenta,
      commandName: Colors.brightMagenta,
      commandArgs: Colors.cyan,
      
      // UI 元素
      prompt: Colors.brightYellow,
      header: Colors.bold + Colors.brightWhite,
      border: Colors.brightBlack,
      separator: Colors.brightBlack,
      
      // 代码
      code: Colors.cyan,
      codeBlock: Colors.brightBlack,
      codeKeyword: Colors.brightMagenta,
      codeString: Colors.green,
      codeComment: Colors.brightBlack,
      codeFunction: Colors.yellow,
      
      // 链接
      link: Colors.blue + Colors.underline,
      
      // 高亮
      highlight: Colors.bold + Colors.yellow,
      muted: Colors.brightBlack + Colors.dim
    },
    styles: {
      spinner: Colors.cyan,
      progress: Colors.green,
      progressBar: Colors.brightBlack,
      thinking: Colors.dim
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: Colors.bgBlack + Colors.cyan
    }
  },
  
  /**
   * 暗色主题
   */
  dark: {
    name: 'Dark',
    description: '深色主题',
    colors: {
      user: Colors.cyan,
      assistant: Colors.green,
      system: Colors.blue,
      error: Colors.brightRed,
      warning: Colors.brightYellow,
      success: Colors.brightGreen,
      info: Colors.brightCyan,
      
      command: Colors.magenta,
      commandName: Colors.brightMagenta,
      commandArgs: Colors.cyan,
      
      prompt: Colors.yellow,
      header: Colors.bold + Colors.white,
      border: Colors.brightBlack,
      separator: Colors.brightBlack,
      
      code: Colors.cyan,
      codeBlock: Colors.black,
      codeKeyword: Colors.magenta,
      codeString: Colors.green,
      codeComment: Colors.dim,
      codeFunction: Colors.yellow,
      
      link: Colors.blue + Colors.underline,
      highlight: Colors.bold + Colors.yellow,
      muted: Colors.dim
    },
    styles: {
      spinner: Colors.cyan,
      progress: Colors.green,
      progressBar: Colors.brightBlack,
      thinking: Colors.dim
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: Colors.bgBlack + Colors.cyan
    }
  },
  
  /**
   * 亮色主题
   */
  light: {
    name: 'Light',
    description: '亮色主题',
    colors: {
      user: Colors.blue,
      assistant: Colors.green,
      system: Colors.cyan,
      error: Colors.red,
      warning: Colors.yellow,
      success: Colors.brightGreen,
      info: Colors.brightBlue,
      
      command: Colors.magenta,
      commandName: Colors.brightMagenta,
      commandArgs: Colors.blue,
      
      prompt: Colors.brightYellow,
      header: Colors.bold + Colors.black,
      border: Colors.white,
      separator: Colors.white,
      
      code: Colors.brightBlue,
      codeBlock: Colors.brightBlack,
      codeKeyword: Colors.magenta,
      codeString: Colors.green,
      codeComment: Colors.gray,
      codeFunction: Colors.yellow,
      
      link: Colors.blue + Colors.underline,
      highlight: Colors.bold + Colors.yellow,
      muted: Colors.brightBlack
    },
    styles: {
      spinner: Colors.blue,
      progress: Colors.green,
      progressBar: Colors.brightBlack,
      thinking: Colors.brightBlack
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: Colors.bgBlack + Colors.white
    }
  },
  
  /**
   * 高对比度主题
   */
  highContrast: {
    name: 'High Contrast',
    description: '高对比度主题',
    colors: {
      user: Colors.brightCyan,
      assistant: Colors.brightGreen,
      system: Colors.brightYellow,
      error: Colors.brightRed,
      warning: Colors.brightYellow,
      success: Colors.brightGreen,
      info: Colors.brightCyan,
      
      command: Colors.brightMagenta,
      commandName: Colors.brightWhite + Colors.bold,
      commandArgs: Colors.brightCyan,
      
      prompt: Colors.brightYellow + Colors.bold,
      header: Colors.brightWhite + Colors.bold,
      border: Colors.white,
      separator: Colors.white,
      
      code: Colors.brightCyan,
      codeBlock: Colors.black,
      codeKeyword: Colors.brightMagenta,
      codeString: Colors.brightGreen,
      codeComment: Colors.brightWhite,
      codeFunction: Colors.brightYellow,
      
      link: Colors.brightCyan + Colors.underline,
      highlight: Colors.brightYellow + Colors.bold,
      muted: Colors.white
    },
    styles: {
      spinner: Colors.brightCyan,
      progress: Colors.brightGreen,
      progressBar: Colors.white,
      thinking: Colors.brightWhite
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: Colors.bgBlack + Colors.brightWhite
    }
  },
  
  /**
   * 极简主题
   */
  minimal: {
    name: 'Minimal',
    description: '极简主题 - 无颜色',
    colors: {
      user: '',
      assistant: '',
      system: '',
      error: '',
      warning: '',
      success: '',
      info: '',
      
      command: '',
      commandName: '',
      commandArgs: '',
      
      prompt: '',
      header: Colors.bold,
      border: '',
      separator: '',
      
      code: '',
      codeBlock: '',
      codeKeyword: '',
      codeString: '',
      codeComment: '',
      codeFunction: '',
      
      link: '',
      highlight: Colors.bold,
      muted: Colors.dim
    },
    styles: {
      spinner: '',
      progress: '',
      progressBar: '',
      thinking: Colors.dim
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: ''
    }
  },
  
  /**
   * 霓虹主题
   */
  neon: {
    name: 'Neon',
    description: '霓虹主题',
    colors: {
      user: Colors.brightCyan,
      assistant: Colors.brightMagenta,
      system: Colors.brightGreen,
      error: Colors.brightRed,
      warning: Colors.brightYellow,
      success: Colors.brightGreen,
      info: Colors.brightCyan,
      
      command: Colors.brightMagenta,
      commandName: Colors.brightCyan + Colors.bold,
      commandArgs: Colors.brightYellow,
      
      prompt: Colors.brightCyan + Colors.bold,
      header: Colors.brightWhite + Colors.bold,
      border: Colors.brightBlack,
      separator: Colors.brightBlack,
      
      code: Colors.brightMagenta,
      codeBlock: Colors.black,
      codeKeyword: Colors.brightCyan,
      codeString: Colors.brightGreen,
      codeComment: Colors.brightBlack,
      codeFunction: Colors.brightYellow,
      
      link: Colors.brightCyan + Colors.underline,
      highlight: Colors.brightYellow + Colors.bold,
      muted: Colors.brightBlack
    },
    styles: {
      spinner: Colors.brightCyan,
      progress: Colors.brightMagenta,
      progressBar: Colors.brightBlack,
      thinking: Colors.brightMagenta
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: Colors.bgBlack + Colors.brightCyan
    }
  },
  
  /**
   * Dracula 主题
   */
  dracula: {
    name: 'Dracula',
    description: 'Dracula 配色方案',
    colors: {
      user: '\x1b[38;5;75m',   // Cyan
      assistant: '\x1b[38;5;84m', // Green
      system: '\x1b[38;5;141m',   // Purple
      error: '\x1b[38;5;203m',    // Red
      warning: '\x1b[38;5;221m',  // Yellow
      success: '\x1b[38;5;84m',   // Green
      info: '\x1b[38;5;117m',     // Blue
      
      command: '\x1b[38;5;213m',
      commandName: '\x1b[38;5;213m',
      commandArgs: '\x1b[38;5;75m',
      
      prompt: '\x1b[38;5;221m',
      header: '\x1b[38;5;255m',
      border: '\x1b[38;5;61m',
      separator: '\x1b[38;5;61m',
      
      code: '\x1b[38;5;75m',
      codeBlock: '\x1b[48;5;236m',
      codeKeyword: '\x1b[38;5;213m',
      codeString: '\x1b[38;5;84m',
      codeComment: '\x1b[38;5;242m',
      codeFunction: '\x1b[38;5;221m',
      
      link: '\x1b[38;5;117m',
      highlight: '\x1b[38;5;221m',
      muted: '\x1b[38;5;242m'
    },
    styles: {
      spinner: '\x1b[38;5;75m',
      progress: '\x1b[38;5;84m',
      progressBar: '\x1b[38;5;236m',
      thinking: '\x1b[38;5;242m'
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: '\x1b[48;5;236m\x1b[38;5;255m'
    }
  },
  
  /**
   * Nord 主题
   */
  nord: {
    name: 'Nord',
    description: 'Nord 配色方案',
    colors: {
      user: '\x1b[38;5;109m',   // Nordic Blue
      assistant: '\x1b[38;5;150m', // Nordic Green
      system: '\x1b[38;5;139m',   // Nordic Purple
      error: '\x1b[38;5;203m',    // Nordic Red
      warning: '\x1b[38;5;222m',  // Nordic Yellow
      success: '\x1b[38;5;150m',   // Nordic Green
      info: '\x1b[38;5;109m',     // Nordic Blue
      
      command: '\x1b[38;5;139m',
      commandName: '\x1b[38;5;139m',
      commandArgs: '\x1b[38;5;109m',
      
      prompt: '\x1b[38;5;222m',
      header: '\x1b[38;5;231m',
      border: '\x1b[38;5;59m',
      separator: '\x1b[38;5;59m',
      
      code: '\x1b[38;5;109m',
      codeBlock: '\x1b[48;5;59m',
      codeKeyword: '\x1b[38;5;139m',
      codeString: '\x1b[38;5;150m',
      codeComment: '\x1b[38;5;60m',
      codeFunction: '\x1b[38;5;222m',
      
      link: '\x1b[38;5;109m',
      highlight: '\x1b[38;5;222m',
      muted: '\x1b[38;5;60m'
    },
    styles: {
      spinner: '\x1b[38;5;109m',
      progress: '\x1b[38;5;150m',
      progressBar: '\x1b[38;5;59m',
      thinking: '\x1b[38;5;60m'
    },
    formatting: {
      bold: Colors.bold,
      italic: Colors.italic,
      underline: Colors.underline,
      code: '\x1b[48;5;59m\x1b[38;5;231m'
    }
  }
};

/**
 * ThemeManager 类 - 主题管理器
 */
export class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.customThemes = {};
    this.themeCache = new Map();
  }
  
  /**
   * 加载预设主题
   */
  loadPreset(name) {
    const theme = PresetThemes[name];
    if (!theme) {
      throw new Error(`Preset theme "${name}" not found`);
    }
    
    this.currentTheme = JSON.parse(JSON.stringify(theme));
    this.clearCache();
    
    return this.currentTheme;
  }
  
  /**
   * 加载自定义主题
   */
  loadCustom(name, theme) {
    // 验证主题结构
    this.validateTheme(theme);
    
    this.customThemes[name] = JSON.parse(JSON.stringify(theme));
    return this.customThemes[name];
  }
  
  /**
   * 设置当前主题
   */
  setTheme(name) {
    if (PresetThemes[name]) {
      return this.loadPreset(name);
    } else if (this.customThemes[name]) {
      this.currentTheme = JSON.parse(JSON.stringify(this.customThemes[name]));
      this.clearCache();
      return this.currentTheme;
    } else {
      throw new Error(`Theme "${name}" not found`);
    }
  }
  
  /**
   * 获取当前主题
   */
  getTheme() {
    return this.currentTheme;
  }
  
  /**
   * 获取主题列表
   */
  getThemeList() {
    const presetNames = Object.keys(PresetThemes).map(name => ({
      name,
      type: 'preset',
      description: PresetThemes[name].description
    }));
    
    const customNames = Object.keys(this.customThemes).map(name => ({
      name,
      type: 'custom',
      description: this.customThemes[name].description || 'Custom theme'
    }));
    
    return [...presetNames, ...customNames];
  }
  
  /**
   * 应用颜色到文本
   */
  colorize(text, colorName) {
    if (text === null || text === undefined) {
      return text;
    }

    if (text === '') {
      return '';
    }

    if (!this.currentTheme) {
      this.loadPreset('default');
    }

    // 使用缓存
    const cacheKey = `${text}|${colorName}`;
    if (this.themeCache.has(cacheKey)) {
      return this.themeCache.get(cacheKey);
    }

    const color = this.currentTheme.colors[colorName];
    if (!color) return text;

    const result = `${color}${text}${Colors.reset}`;
    this.themeCache.set(cacheKey, result);

    return result;
  }
  
  /**
   * 应用样式到文本
   */
  stylize(text, styleName) {
    if (!this.currentTheme) {
      this.loadPreset('default');
    }
    
    const style = this.currentTheme.formatting[styleName];
    if (!style) return text;
    
    return `${style}${text}${Colors.reset}`;
  }
  
  /**
   * 格式化消息
   */
  formatMessage(text, type = 'info') {
    return this.colorize(text, type);
  }
  
  /**
   * 格式化代码
   */
  formatCode(code, language = '') {
    if (!this.currentTheme) {
      this.loadPreset('default');
    }
    
    const colors = this.currentTheme.colors;
    const prefix = colors.codeBlock;
    const suffix = Colors.reset;
    
    return `${prefix}${code}${suffix}`;
  }
  
  /**
   * 格式化命令
   */
  formatCommand(command, args = []) {
    if (!this.currentTheme) {
      this.loadPreset('default');
    }
    
    const colors = this.currentTheme.colors;
    const cmdColor = colors.commandName || colors.command;
    const argsColor = colors.commandArgs;
    
    let result = this.colorize(command, 'commandName');
    
    if (args.length > 0) {
      const argsText = args.map(arg => this.colorize(arg, 'commandArgs')).join(' ');
      result += ' ' + argsText;
    }
    
    return result;
  }
  
  /**
   * 格式化标题
   */
  formatHeader(text, level = 1) {
    if (!this.currentTheme) {
      this.loadPreset('default');
    }
    
    const style = this.currentTheme.colors.header;
    const prefix = '#'.repeat(level) + ' ';
    
    return `${style}${prefix}${text}${Colors.reset}`;
  }
  
  /**
   * 格式化链接
   */
  formatLink(text, url) {
    if (!this.currentTheme) {
      this.loadPreset('default');
    }
    
    const color = this.currentTheme.colors.link;
    return `${color}${text}${Colors.reset}`;
  }
  
  /**
   * 格式化高亮
   */
  formatHighlight(text) {
    return this.colorize(text, 'highlight');
  }
  
  /**
   * 格式化静音文本
   */
  formatMuted(text) {
    return this.colorize(text, 'muted');
  }
  
  /**
   * 创建边框
   */
  createBorder(char = '─', length = 80) {
    if (length === 0) {
      return '';
    }

    if (!this.currentTheme) {
      this.loadPreset('default');
    }

    const color = this.currentTheme.colors.border;
    const line = char.repeat(length);

    return `${color}${line}${Colors.reset}`;
  }
  
  /**
   * 创建分隔线
   */
  createSeparator(length = 80) {
    return this.createBorder('─', length);
  }
  
  /**
   * 验证主题结构
   */
  validateTheme(theme) {
    const required = ['colors', 'styles', 'formatting'];
    
    for (const key of required) {
      if (!theme[key]) {
        throw new Error(`Invalid theme: missing "${key}"`);
      }
    }
    
    if (!theme.colors) {
      throw new Error('Invalid theme: missing "colors" object');
    }
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.themeCache.clear();
  }
  
  /**
   * 导出当前主题
   */
  exportTheme() {
    return JSON.parse(JSON.stringify(this.currentTheme));
  }
  
  /**
   * 导入主题
   */
  importTheme(themeData) {
    this.validateTheme(themeData);
    this.currentTheme = themeData;
    this.clearCache();
    
    return this.currentTheme;
  }
  
  /**
   * 创建主题变体
   */
  createVariant(baseThemeName, variantName, overrides) {
    const base = this.setTheme(baseThemeName);
    const variant = JSON.parse(JSON.stringify(base));
    
    // 应用覆盖
    this.deepMerge(variant, overrides);
    variant.name = variantName;
    
    this.loadCustom(variantName, variant);
    return variant;
  }
  
  /**
   * 深度合并对象
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
      Object.assign(target || {}, { [key]: source[key] });
    }
    return target;
  }
  
  /**
   * 重置到默认主题
   */
  reset() {
    this.currentTheme = null;
    this.customThemes = {};
    this.clearCache();
  }
}

/**
 * 全局主题管理器实例
 */
export const theme = new ThemeManager();

/**
 * 快捷函数 - 应用颜色
 */
export const color = (text, colorName) => theme.colorize(text, colorName);

/**
 * 快捷函数 - 应用样式
 */
export const style = (text, styleName) => theme.stylize(text, styleName);

/**
 * 快捷函数 - 格式化消息
 */
export const formatMessage = (text, type) => theme.formatMessage(text, type);

/**
 * 快捷函数 - 设置主题
 */
export const setTheme = (name) => theme.setTheme(name);

/**
 * 快捷函数 - 获取主题
 */
export const getTheme = () => theme.getTheme();

/**
 * 快捷函数 - 获取主题列表
 */
export const getThemeList = () => theme.getThemeList();

export default ThemeManager;
