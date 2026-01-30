/**
 * 主题定制系统使用示例
 */

import {
  ThemeManager,
  theme,
  color,
  style,
  formatMessage,
  setTheme,
  getTheme,
  getThemeList,
  Colors
} from '../lib/themes/index.js';

// 示例1: 基本使用
console.log('=== 示例1: 基本使用 ===\n');

// 设置主题
setTheme('default');

// 应用颜色
console.log(color('错误消息', 'error'));
console.log(color('成功消息', 'success'));
console.log(color('警告消息', 'warning'));
console.log(color('信息消息', 'info'));

// 示例2: 切换主题
console.log('\n=== 示例2: 切换主题 ===\n');

console.log('默认主题:');
console.log(color('用户消息', 'user'));
console.log(color('助手消息', 'assistant'));

console.log('\n暗色主题:');
setTheme('dark');
console.log(color('用户消息', 'user'));
console.log(color('助手消息', 'assistant'));

console.log('\n亮色主题:');
setTheme('light');
console.log(color('用户消息', 'user'));
console.log(color('助手消息', 'assistant'));

console.log('\n霓虹主题:');
setTheme('neon');
console.log(color('用户消息', 'user'));
console.log(color('助手消息', 'assistant'));

// 示例3: 格式化功能
console.log('\n=== 示例3: 格式化功能 ===\n');

setTheme('default');

// 格式化消息
console.log(formatMessage('这是一条错误消息', 'error'));
console.log(formatMessage('这是一条成功消息', 'success'));

// 格式化代码
console.log('\n代码块:');
console.log(theme.formatCode('console.log("Hello, World!");'));

// 格式化命令
console.log('\n命令:');
console.log(theme.formatCommand('/session', ['list']));

// 格式化标题
console.log('\n标题:');
console.log(theme.formatHeader('主标题', 1));
console.log(theme.formatHeader('副标题', 2));

// 示例4: UI 元素
console.log('\n=== 示例4: UI 元素 ===\n');

// 边框
console.log(theme.createBorder('─', 40));

// 分隔线
console.log(theme.createSeparator(40));

// 链接
console.log('\n链接:');
console.log(theme.formatLink('访问网站', 'https://example.com'));

// 高亮
console.log('\n高亮:');
console.log(theme.formatHighlight('重要信息'));

// 静音
console.log('\n静音文本:');
console.log(theme.formatMuted('次要信息'));

// 示例5: 样式应用
console.log('\n=== 示例5: 样式应用 ===\n');

console.log(style('粗体文本', 'bold'));
console.log(style('斜体文本', 'italic'));
console.log(style('下划线文本', 'underline'));

// 组合使用
console.log('\n组合样式:');
console.log(color(style('粗体红色', 'bold'), 'error'));

// 示例6: 查看可用主题
console.log('\n=== 示例6: 查看可用主题 ===\n');

const themeList = getThemeList();
themeList.forEach(themeInfo => {
  console.log(`${themeInfo.name.padEnd(15)} [${themeInfo.type}] - ${themeInfo.description}`);
});

// 示例7: 自定义主题
console.log('\n=== 示例7: 自定义主题 ===\n');

const customTheme = {
  name: 'MyCustom',
  description: '我的自定义主题',
  colors: {
    user: '\x1b[38;5;208m',      // Orange
    assistant: '\x1b[38;5;117m',  // Sky Blue
    system: '\x1b[38;5;219m',    // Pink
    error: '\x1b[38;5;203m',     // Red
    warning: '\x1b[38;5;226m',    // Yellow
    success: '\x1b[38;5;120m',   // Green
    info: '\x1b[38;5;75m',       // Cyan
    command: '\x1b[38;5;213m',   // Magenta
    commandName: '\x1b[38;5;213m',
    commandArgs: '\x1b[38;5;208m',
    prompt: '\x1b[38;5;226m',
    header: '\x1b[38;5;255m',
    border: '\x1b[38;5;245m',
    separator: '\x1b[38;5;245m',
    code: '\x1b[38;5;117m',
    codeBlock: '\x1b[48;5;236m',
    codeKeyword: '\x1b[38;5;213m',
    codeString: '\x1b[38;5;120m',
    codeComment: '\x1b[38;5;242m',
    codeFunction: '\x1b[38;5;226m',
    link: '\x1b[38;5;117m',
    highlight: '\x1b[38;5;226m',
    muted: '\x1b[38;5;245m'
  },
  styles: {
    spinner: '\x1b[38;5;117m',
    progress: '\x1b[38;5;120m',
    progressBar: '\x1b[38;5;236m',
    thinking: '\x1b[38;5;245m'
  },
  formatting: {
    bold: '\x1b[1m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    code: '\x1b[48;5;236m\x1b[38;5;255m'
  }
};

const themeManager = new ThemeManager();
themeManager.loadCustom('my-custom', customTheme);
themeManager.setTheme('my-custom');

console.log('自定义主题:');
console.log(color('用户消息', 'user'));
console.log(color('助手消息', 'assistant'));

// 示例8: 主题变体
console.log('\n=== 示例8: 主题变体 ===\n');

const variant = themeManager.createVariant('dark', 'dark-orange', {
  description: '暗色橙色主题',
  colors: {
    user: '\x1b[38;5;208m',
    assistant: '\x1b[38;5;214m',
    highlight: '\x1b[38;5;226m'
  }
});

console.log('主题变体:');
console.log(color('用户消息', 'user'));
console.log(color('助手消息', 'assistant'));

// 示例9: 颜色代码使用
console.log('\n=== 示例9: 颜色代码使用 ===\n');

setTheme('default');

console.log('基本颜色:');
console.log(`${Colors.red}红色${Colors.reset}`);
console.log(`${Colors.green}绿色${Colors.reset}`);
console.log(`${Colors.yellow}黄色${Colors.reset}`);
console.log(`${Colors.blue}蓝色${Colors.reset}`);
console.log(`${Colors.magenta}品红${Colors.reset}`);
console.log(`${Colors.cyan}青色${Colors.reset}`);

console.log('\n亮色:');
console.log(`${Colors.brightRed}亮红${Colors.reset}`);
console.log(`${Colors.brightGreen}亮绿${Colors.reset}`);
console.log(`${Colors.brightYellow}亮黄${Colors.reset}`);
console.log(`${Colors.brightBlue}亮蓝${Colors.reset}`);

console.log('\n样式:');
console.log(`${Colors.bold}粗体${Colors.reset}`);
console.log(`${Colors.dim}暗淡${Colors.reset}`);
console.log(`${Colors.italic}斜体${Colors.reset}`);
console.log(`${Colors.underline}下划线${Colors.reset}`);

// 示例10: 256色演示
console.log('\n=== 示例10: 256色演示 ===\n');

// 256色标准色
for (let i = 0; i < 16; i++) {
  const colorCode = `\x1b[38;5;${i}m`;
  process.stdout.write(`${colorCode}■${Colors.reset}`);
}
console.log('\n0-15 (标准色)');

for (let i = 16; i < 232; i++) {
  const colorCode = `\x1b[38;5;${i}m`;
  process.stdout.write(`${colorCode}■${Colors.reset}`);
  if ((i - 16) % 36 === 35) console.log();
}
console.log('16-231 (256色立方体)');

for (let i = 232; i < 256; i++) {
  const colorCode = `\x1b[38;5;${i}m`;
  process.stdout.write(`${colorCode}■${Colors.reset}`);
}
console.log('\n232-255 (灰度)');

// 示例11: 在命令行应用中使用
console.log('\n=== 示例11: 在命令行应用中使用 ===\n');

class CLIApp {
  constructor() {
    this.theme = new ThemeManager();
    this.theme.loadPreset('default');
  }

  setTheme(themeName) {
    this.theme.setTheme(themeName);
    console.log(`主题已切换到: ${this.theme.getTheme().name}`);
  }

  showError(message) {
    console.log(this.theme.formatMessage(`错误: ${message}`, 'error'));
  }

  showSuccess(message) {
    console.log(this.theme.formatMessage(`成功: ${message}`, 'success'));
  }

  showCommandHelp(command, description) {
    console.log(this.theme.formatCommand(command));
    console.log(`  ${this.theme.formatMuted(description)}`);
  }

  showCode(code) {
    console.log(this.theme.formatCode(code));
  }

  showHeader(text) {
    console.log('\n' + this.theme.createSeparator(40));
    console.log(this.theme.formatHeader(text, 1));
    console.log(this.theme.createSeparator(40));
  }

  showProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 20;
    const filled = Math.round((barLength * current) / total);
    const empty = barLength - filled;
    const bar = this.theme.formatMessage('█'.repeat(filled), 'success') +
                this.theme.formatMessage('█'.repeat(empty), 'progressBar');
    console.log(`\r进度: [${bar}] ${percentage}%`);
  }
}

const app = new CLIApp();
app.showHeader('欢迎使用 xzChat');
app.showError('连接失败');
app.showSuccess('操作完成');
app.showCommandHelp('/session list', '列出所有会话');
app.showCode('console.log("Hello, World!");');
app.showProgress(15, 20);

// 示例12: 主题对比
console.log('\n\n=== 示例12: 主题对比 ===\n');

const themesToCompare = ['default', 'dark', 'light', 'highContrast', 'neon', 'dracula', 'nord'];

themesToCompare.forEach(themeName => {
  console.log(`\n${themeName.toUpperCase()}:`);
  setTheme(themeName);
  console.log(`  ${color('用户', 'user')} ${color('助手', 'assistant')} ${color('系统', 'system')}`);
  console.log(`  ${color('错误', 'error')} ${color('警告', 'warning')} ${color('成功', 'success')}`);
  console.log(`  ${formatMessage('这是一条普通消息', 'info')}`);
  console.log(`  ${theme.formatCode('console.log("code");')}`);
  console.log(`  ${theme.formatCommand('/help')}`);
});

// 示例13: 导出和导入主题
console.log('\n=== 示例13: 导出和导入主题 ===\n');

setTheme('default');
const exportedTheme = theme.exportTheme();
console.log('导出的主题名称:', exportedTheme.name);
console.log('导出的主题颜色数量:', Object.keys(exportedTheme.colors).length);

// 创建新实例并导入
const newThemeManager = new ThemeManager();
newThemeManager.importTheme(exportedTheme);
console.log('导入的主题名称:', newThemeManager.getTheme().name);

// 示例14: RGB 颜色演示
console.log('\n=== 示例14: RGB 颜色演示 ===\n');

// 使用 256 色创建彩虹效果
const rainbowColors = [196, 202, 208, 214, 220, 226];
const rainbowText = rainbowColors
  .map(code => `\x1b[38;5;${code}m●`)
  .join('') + Colors.reset;
console.log('彩虹:', rainbowText);

// 渐变效果
console.log('\n渐变:');
const gradientColors = [];
for (let i = 0; i < 20; i++) {
  const code = Math.floor(i * (232 - 16) / 20 + 16);
  gradientColors.push(`\x1b[38;5;${code}m█`);
}
console.log(gradientColors.join('') + Colors.reset);

// 示例15: 组合使用多个主题
console.log('\n=== 示例15: 组合使用多个主题 ===\n');

const theme1 = new ThemeManager();
const theme2 = new ThemeManager();

theme1.loadPreset('dark');
theme2.loadPreset('light');

console.log('主题1 (暗色):');
console.log(`  ${theme1.colorize('消息', 'user')}`);

console.log('\n主题2 (亮色):');
console.log(`  ${theme2.colorize('消息', 'user')}`);

console.log('\n=== 所有示例完成 ===');
