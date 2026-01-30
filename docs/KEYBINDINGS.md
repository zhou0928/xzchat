# 快捷键系统文档

## 概述

xzChat 提供了完整的键盘快捷键支持,旨在提升命令行交互效率和用户体验。

## 内置快捷键

### 编辑快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+L` | 清屏 | 清除整个屏幕内容 |
| `Ctrl+R` | 清除当前行 | 清除当前输入行 |
| `Ctrl+U` | 删除到行首 | 删除光标到行首的所有内容 |
| `Ctrl+K` | 删除到行尾 | 删除光标到行尾的所有内容 |
| `Ctrl+A` | 跳到行首 | 将光标移动到行首 |
| `Ctrl+E` | 跳到行尾 | 将光标移动到行尾 |
| `Ctrl+W` | 删除上一个词 | 删除光标前的一个词 |
| `Alt+Left` | 上一个词 | 跳转到上一个词 |
| `Alt+Right` | 下一个词 | 跳转到下一个词 |

### 导航快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `↑` | 历史上一条 | 浏览之前的输入历史 |
| `↓` | 历史下一条 | 浏览之后的输入历史 |

### 系统快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+C` | 中断/退出 | 如果有请求在处理则中断,否则确认退出 |
| `Ctrl+D` | 退出 | 直接退出程序 |
| `Esc` | 中断/清除行 | 如果有请求在处理则中断,有内容则清除行,否则退出 |

## 使用方法

### 基本使用

所有快捷键都是开箱即用的,无需额外配置。只需在 CLI 中直接按下对应的按键组合即可。

```bash
# 启动 xzChat
npx xiaozhou-chat

# 使用快捷键
Ctrl+L    # 清屏
Ctrl+R    # 清除当前行
Ctrl+C    # 中断或退出
```

### 查看快捷键帮助

在 CLI 中可以通过 `/help` 命令查看包含快捷键的帮助信息:

```
/help
```

或在代码中调用:

```javascript
manager.showKeyBindings();
```

## 开发者指南

### 基本集成

```javascript
import readline from 'node:readline';
import { createKeyBindingManager } from './lib/utils/keybindings.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

let abortController = null;

const manager = createKeyBindingManager({
  rl,
  abortController: () => abortController,
  onClear: () => console.log('屏幕已清空'),
  onExit: () => process.exit(0),
  onInterrupt: () => console.log('操作已中断'),
});

process.stdin.on('keypress', (str, key) => {
  manager.handleKey(str, key);
});
```

### 自定义快捷键

```javascript
// 注册自定义快捷键处理
manager.register('customAction', (key) => {
  console.log('执行自定义操作');
  // 你的逻辑...
});
```

### 处理异步操作

```javascript
rl.on('line', async (input) => {
  abortController = new AbortController();
  
  try {
    await longRunningOperation(abortController.signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('操作被用户中断');
    }
  } finally {
    abortController = null;
  }
});
```

## API 参考

### KeyBindingManager

#### 构造函数

```typescript
new KeyBindingManager(options: {
  rl: readline.Interface;
  abortController: () => AbortController | null;
  isProcessing?: () => boolean;
  onClear?: () => void;
  onExit?: () => void;
  onInterrupt?: () => void;
})
```

#### 方法

##### `register(action: string, handler: Function): void`

注册自定义快捷键处理程序。

**参数:**
- `action`: 操作标识符
- `handler`: 处理函数

**示例:**
```javascript
manager.register('save', () => {
  saveData();
});
```

##### `handleKey(str: string, key: Key): boolean`

处理按键事件。

**参数:**
- `str`: 按键字符
- `key`: 按键对象

**返回:**
- `boolean`: 是否处理了该按键

##### `showKeyBindings(): void`

显示所有快捷键帮助。

##### `getHelpText(): string`

获取快捷键帮助文本。

### 工具函数

#### `createKeyBindingManager(options): KeyBindingManager`

创建快捷键管理器实例。

#### `setupRawMode(): void`

设置 stdin 原始模式。

#### `restoreRawMode(): void`

恢复 stdin 正常模式。

#### `detectKeyBinding(str: string, key: Key): string`

检测按键组合名称。

## 常见问题

### Q: 快捷键不起作用?

A: 确保你的终端支持 raw mode,并且没有被其他程序拦截按键。

### Q: 如何禁用某个快捷键?

A: 通过注册空处理程序覆盖默认行为:

```javascript
manager.register('clear', () => {
  // 不做任何操作,禁用该快捷键
});
```

### Q: 在 Windows 上使用有问题?

A: 某些终端模拟器可能不完全支持所有快捷键,建议使用 Windows Terminal 或 Git Bash。

### Q: 如何添加新的快捷键?

A: 在 `lib/utils/keybindings.js` 中的 `KeyBindings` 对象中添加新的定义,并在 `handleKey` 方法中实现对应的处理逻辑。

## 最佳实践

1. **保持一致性**: 遵循终端应用的通用快捷键约定
2. **提供反馈**: 快捷键操作后应给予用户清晰的反馈
3. **文档完善**: 确保所有自定义快捷键都有文档说明
4. **优雅处理**: 正确处理中断和退出,保证资源清理
5. **测试覆盖**: 为自定义快捷键编写测试用例

## 故障排除

### 快捷键被 shell 拦截

某些快捷键可能被 shell 解释器拦截,可以使用 `stty` 命令查看和修改终端设置:

```bash
# 查看当前终端设置
stty -a

# 禁用特定快捷键的 shell 处理
stty -ixon  # 禁用 Ctrl+S/Ctrl+Q 流控制
```

### Raw mode 问题

如果遇到输入问题,可以尝试手动设置/取消 raw mode:

```javascript
import { setupRawMode, restoreRawMode } from './lib/utils/keybindings.js';

// 启用
setupRawMode();

// 禁用
restoreRawMode();
```

## 贡献

如果你想为快捷键系统贡献代码,请遵循以下步骤:

1. Fork 项目
2. 创建特性分支
3. 实现功能并添加测试
4. 确保所有测试通过
5. 提交 Pull Request

## 许可证

MIT License
