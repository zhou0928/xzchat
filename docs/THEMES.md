# 主题定制系统文档

## 概述

xzChat 内置了完整的主题定制系统,允许用户自定义输出配色方案。系统提供了多个预设主题,支持创建自定义主题,并可通过简单的 API 灵活地格式化各种文本。

## 特性

- ✅ **8个预设主题** - Default, Dark, Light, High Contrast, Minimal, Neon, Dracula, Nord
- ✅ **256色支持** - 支持 ANSI 16色和 256 色模式
- ✅ **自定义主题** - 轻松创建和加载自定义主题
- ✅ **主题变体** - 基于现有主题创建变体
- ✅ **丰富的格式化** - 消息、代码、命令、标题等
- ✅ **类型安全** - 完整的 TypeScript 类型定义
- ✅ **性能优化** - 内置缓存机制

## 快速开始

### 1. 基本使用

```javascript
import { setTheme, color, formatMessage } from './lib/themes/index.js';

// 设置主题
setTheme('default');

// 应用颜色
console.log(color('错误消息', 'error'));
console.log(color('成功消息', 'success'));

// 格式化消息
console.log(formatMessage('这是一条信息', 'info'));
```

### 2. 切换主题

```javascript
setTheme('dark');
console.log(color('用户消息', 'user'));

setTheme('neon');
console.log(color('用户消息', 'user'));
```

### 3. 使用主题管理器

```javascript
import { ThemeManager } from './lib/themes/index.js';

const theme = new ThemeManager();

// 加载预设
theme.loadPreset('default');

// 格式化文本
console.log(theme.formatMessage('Hello', 'info'));
console.log(theme.formatCode('console.log("hello")'));
console.log(theme.formatCommand('/session', ['list']));
```

## 预设主题

### Default (默认)

标准的配色方案,适合大多数场景。

```javascript
setTheme('default');
```

### Dark (暗色)

深色主题,适合暗色终端。

```javascript
setTheme('dark');
```

### Light (亮色)

亮色主题,适合亮色终端。

```javascript
setTheme('light');
```

### High Contrast (高对比度)

高对比度主题,提供最佳的可见性。

```javascript
setTheme('highContrast');
```

### Minimal (极简)

极简主题,只使用基本样式,不使用颜色。

```javascript
setTheme('minimal');
```

### Neon (霓虹)

霓虹风格主题,色彩鲜艳。

```javascript
setTheme('neon');
```

### Dracula

流行的 Dracula 配色方案。

```javascript
setTheme('dracula');
```

### Nord

Nord 配色方案,清新优雅。

```javascript
setTheme('nord');
```

## API 参考

### ThemeManager 类

#### 构造函数

```javascript
new ThemeManager()
```

创建主题管理器实例。

#### loadPreset(name)

加载预设主题。

**参数:**
- `name` (string) - 预设主题名称

**返回:** (Theme) 主题配置

```javascript
const theme = new ThemeManager();
theme.loadPreset('dark');
```

#### loadCustom(name, theme)

加载自定义主题。

**参数:**
- `name` (string) - 主题名称
- `theme` (Object) - 主题配置

**返回:** (Theme) 主题配置

```javascript
const customTheme = {
  name: 'MyTheme',
  colors: { ... },
  styles: { ... },
  formatting: { ... }
};

theme.loadCustom('my-theme', customTheme);
```

#### setTheme(name)

设置当前主题。

**参数:**
- `name` (string) - 主题名称

**返回:** (Theme) 主题配置

```javascript
theme.setTheme('neon');
```

#### getTheme()

获取当前主题。

**返回:** (Theme | null) 当前主题配置

```javascript
const current = theme.getTheme();
console.log(current.name);
```

#### getThemeList()

获取所有可用主题列表。

**返回:** (Array) 主题信息数组

```javascript
const list = theme.getThemeList();
list.forEach(info => {
  console.log(`${info.name} [${info.type}] - ${info.description}`);
});
```

#### colorize(text, colorName)

应用颜色到文本。

**参数:**
- `text` (string) - 文本
- `colorName` (string) - 颜色名称

**返回:** (string) 着色后的文本

```javascript
theme.colorize('Error message', 'error');
// \x1b[31mError message\x1b[0m
```

#### stylize(text, styleName)

应用样式到文本。

**参数:**
- `text` (string) - 文本
- `styleName` (string) - 样式名称

**返回:** (string) 样式化后的文本

```javascript
theme.stylize('Bold text', 'bold');
// \x1b[1mBold text\x1b[0m
```

#### formatMessage(text, type)

格式化消息。

**参数:**
- `text` (string) - 文本
- `type` (string) - 消息类型

**返回:** (string) 格式化后的消息

```javascript
theme.formatMessage('Success', 'success');
```

#### formatCode(code, language)

格式化代码。

**参数:**
- `code` (string) - 代码
- `language` (string) - 语言(可选)

**返回:** (string) 格式化后的代码

```javascript
theme.formatCode('console.log("hello")');
```

#### formatCommand(command, args)

格式化命令。

**参数:**
- `command` (string) - 命令
- `args` (Array) - 参数数组(可选)

**返回:** (string) 格式化后的命令

```javascript
theme.formatCommand('/session', ['list']);
```

#### formatHeader(text, level)

格式化标题。

**参数:**
- `text` (string) - 文本
- `level` (number) - 标题级别(默认1)

**返回:** (string) 格式化后的标题

```javascript
theme.formatHeader('Main Title', 1);
theme.formatHeader('Sub Title', 2);
```

#### formatLink(text, url)

格式化链接。

**参数:**
- `text` (string) - 文本
- `url` (string) - URL

**返回:** (string) 格式化后的链接

```javascript
theme.formatLink('Click here', 'https://example.com');
```

#### formatHighlight(text)

格式化高亮文本。

**参数:**
- `text` (string) - 文本

**返回:** (string) 高亮文本

```javascript
theme.formatHighlight('Important');
```

#### formatMuted(text)

格式化静音文本。

**参数:**
- `text` (string) - 文本

**返回:** (string) 静音文本

```javascript
theme.formatMuted('Less important');
```

#### createBorder(char, length)

创建边框。

**参数:**
- `char` (string) - 边框字符(默认'─')
- `length` (number) - 长度(默认80)

**返回:** (string) 边框字符串

```javascript
theme.createBorder('─', 40);
```

#### createSeparator(length)

创建分隔线。

**参数:**
- `length` (number) - 长度(默认80)

**返回:** (string) 分隔线

```javascript
theme.createSeparator(40);
```

#### createVariant(baseThemeName, variantName, overrides)

创建主题变体。

**参数:**
- `baseThemeName` (string) - 基础主题名称
- `variantName` (string) - 变体名称
- `overrides` (Object) - 覆盖配置

**返回:** (Theme) 变体主题

```javascript
const variant = theme.createVariant('dark', 'dark-orange', {
  colors: {
    user: '\x1b[38;5;208m',
    assistant: '\x1b[38;5;214m'
  }
});
```

#### exportTheme()

导出当前主题。

**返回:** (Theme) 主题配置

```javascript
const exported = theme.exportTheme();
```

#### importTheme(themeData)

导入主题。

**参数:**
- `themeData` (Theme) - 主题数据

**返回:** (Theme) 主题配置

```javascript
theme.importTheme(exportedTheme);
```

#### reset()

重置到默认状态。

```javascript
theme.reset();
```

## 全局函数

### setTheme(name)

设置当前主题。

```javascript
import { setTheme } from './lib/themes/index.js';

setTheme('dark');
```

### getTheme()

获取当前主题。

```javascript
import { getTheme } from './lib/themes/index.js';

const current = getTheme();
```

### getThemeList()

获取主题列表。

```javascript
import { getThemeList } from './lib/themes/index.js';

const list = getThemeList();
```

### color(text, colorName)

应用颜色。

```javascript
import { color } from './lib/themes/index.js';

console.log(color('Error', 'error'));
```

### style(text, styleName)

应用样式。

```javascript
import { style } from './lib/themes/index.js';

console.log(style('Bold', 'bold'));
```

### formatMessage(text, type)

格式化消息。

```javascript
import { formatMessage } from './lib/themes/index.js';

console.log(formatMessage('Success', 'success'));
```

## 颜色名称

### 消息类型

- `user` - 用户消息
- `assistant` - 助手消息
- `system` - 系统消息
- `error` - 错误消息
- `warning` - 警告消息
- `success` - 成功消息
- `info` - 信息消息

### 命令相关

- `command` - 命令
- `commandName` - 命令名称
- `commandArgs` - 命令参数

### UI 元素

- `prompt` - 提示符
- `header` - 标题
- `border` - 边框
- `separator` - 分隔线

### 代码

- `code` - 代码
- `codeBlock` - 代码块
- `codeKeyword` - 代码关键字
- `codeString` - 代码字符串
- `codeComment` - 代码注释
- `codeFunction` - 代码函数

### 其他

- `link` - 链接
- `highlight` - 高亮
- `muted` - 静音文本

## 样式名称

- `bold` - 粗体
- `italic` - 斜体
- `underline` - 下划线
- `code` - 代码样式

## ANSI 颜色代码

### 前景色

```javascript
Colors.black    // \x1b[30m
Colors.red      // \x1b[31m
Colors.green    // \x1b[32m
Colors.yellow   // \x1b[33m
Colors.blue     // \x1b[34m
Colors.magenta  // \x1b[35m
Colors.cyan     // \x1b[36m
Colors.white    // \x1b[37m

Colors.brightBlack    // \x1b[90m
Colors.brightRed      // \x1b[91m
Colors.brightGreen    // \x1b[92m
Colors.brightYellow   // \x1b[93m
Colors.brightBlue     // \x1b[94m
Colors.brightMagenta  // \x1b[95m
Colors.brightCyan     // \x1b[96m
Colors.brightWhite    // \x1b[97m
```

### 背景色

```javascript
Colors.bgBlack    // \x1b[40m
Colors.bgRed      // \x1b[41m
Colors.bgGreen    // \x1b[42m
Colors.bgYellow   // \x1b[43m
Colors.bgBlue     // \x1b[44m
Colors.bgMagenta  // \x1b[45m
Colors.bgCyan     // \x1b[46m
Colors.bgWhite    // \x1b[47m
```

### 样式

```javascript
Colors.bold          // \x1b[1m
Colors.dim           // \x1b[2m
Colors.italic        // \x1b[3m
Colors.underline     // \x1b[4m
Colors.inverse       // \x1b[7m
Colors.hidden        // \x1b[8m
Colors.strikethrough // \x1b[9m
Colors.reset         // \x1b[0m
```

## 256 色支持

使用 256 色模式:

```javascript
// 格式: \x1b[38;5;<code>m
const orange = '\x1b[38;5;208m';
const skyBlue = '\x1b[38;5;117m';

console.log(`${orange}橙色文本${Colors.reset}`);
console.log(`${skyBlue}天蓝文本${Colors.reset}`);
```

### 256 色范围

- 0-7: 标准颜色
- 8-15: 亮色
- 16-231: 216 色 (6x6x6 立方体)
- 232-255: 24 色灰度

## 创建自定义主题

### 基本结构

```javascript
const customTheme = {
  name: 'MyTheme',
  description: '我的自定义主题',
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
```

### 加载自定义主题

```javascript
import { ThemeManager } from './lib/themes/index.js';

const theme = new ThemeManager();
theme.loadCustom('my-theme', customTheme);
theme.setTheme('my-theme');
```

## 在应用中集成

### 1. 初始化主题系统

```javascript
import { setTheme, color, formatMessage } from './lib/themes/index.js';

// 从配置加载主题
const config = loadConfig();
setTheme(config.theme || 'default');
```

### 2. 格式化输出

```javascript
export function logError(message) {
  console.log(formatMessage(message, 'error'));
}

export function logSuccess(message) {
  console.log(formatMessage(message, 'success'));
}

export function logInfo(message) {
  console.log(formatMessage(message, 'info'));
}
```

### 3. 格式化命令

```javascript
export function showCommandHelp(command, description) {
  console.log(color(command, 'commandName'));
  console.log(formatMessage(`  ${description}`, 'muted'));
}
```

### 4. 格式化代码

```javascript
export function showCodeSnippet(code, language) {
  console.log(colorize(code, 'code'));
}
```

## 最佳实践

### 1. 使用语义化颜色名称

```javascript
// 推荐
color('Error: file not found', 'error');

// 不推荐
color('Error: file not found', 'red');
```

### 2. 始终重置颜色

```javascript
// 推荐
`${Colors.red}${text}${Colors.reset}`

// 不推荐
`${Colors.red}${text}`
```

### 3. 考虑可访问性

```javascript
// 高对比度主题
setTheme('highContrast');
```

### 4. 主题持久化

```javascript
// 保存主题偏好
function saveThemePreference(themeName) {
  localStorage.setItem('theme', themeName);
}

// 加载主题偏好
function loadThemePreference() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    setTheme(saved);
  }
}
```

## 故障排除

### 问题: 颜色不显示

**原因:** 终端不支持 ANSI 颜色

**解决:** 使用 Minimal 主题

```javascript
setTheme('minimal');
```

### 问题: 颜色显示异常

**原因:** 不兼容的终端

**解决:** 检查终端设置或使用基本颜色

### 问题: 256色不工作

**原因:** 终端不支持 256 色

**解决:** 使用标准 16 色

## 示例

完整示例请参考: `examples/themes-usage.js`

```bash
node examples/themes-usage.js
```

## 相关文档

- [国际化文档](I18N.md)
- [插件系统文档](PLUGIN_SYSTEM.md)
- [快捷键文档](KEYBINDINGS.md)
