# 插件系统使用指南

## 概述

xzChat 支持强大的插件系统，允许您扩展 CLI 的功能。插件可以提供自定义命令、钩子函数和中间件。

## 可用命令

### `/plugin` - 插件管理

```bash
/plugin <subcommand> [options]
```

#### 子命令

- `list, ls` - 列出所有插件
- `load <name>` - 加载插件
- `unload <name>` - 卸载插件
- `enable <name>` - 启用插件
- `disable <name>` - 禁用插件
- `info <name>` - 显示插件详细信息
- `scan` - 扫描插件目录
- `reload <name>` - 重新加载插件

## 使用示例

### 1. 查看所有插件

```bash
/plugin list
```

输出示例：

```
📦 插件列表:

  ✅ example-timer
     版本: 1.0.0
     描述: 示例计时器插件
     状态: enabled
     作者: xzChat Team

  ✅ example-weather
     版本: 1.0.0
     描述: 示例天气查询插件
     状态: enabled
     作者: xzChat Team

总计: 2 个插件
```

### 2. 加载插件

```bash
/plugin load example-timer
```

### 3. 启用插件

```bash
/plugin enable example-timer
```

启用后会显示插件提供的命令：

```
🟢 正在启用插件: example-timer...
✅ 插件 example-timer 启用成功

📋 可用命令:
   /timer - 创建一个计时器
   /timers - 列出所有活动计时器
```

### 4. 使用插件功能

启用插件后，可以直接使用插件提供的命令：

```bash
# 创建一个 60 秒的计时器
/timer 60 "计时完成！"

# 查看所有活动计时器
/timers
```

```bash
# 查询北京天气
/weather 北京
```

### 5. 查看插件详情

```bash
/plugin info example-timer
```

输出示例：

```
📦 插件详情: example-timer

  名称: example-timer
  版本: 1.0.0
  描述: 示例计时器插件
  作者: xzChat Team
  许可证: MIT
  分类: utility
  状态: enabled
  路径: /path/to/plugins/example-timer

  📋 提供的命令:
     /timer
        描述: 创建一个计时器
        用法: /timer <seconds> [message]
        分类: utility
     /timers
        描述: 列出所有活动计时器
        用法: /timers
        分类: utility

  启用时间: 2024-01-29 10:30:45
```

### 6. 禁用插件

```bash
/plugin disable example-timer
```

### 7. 卸载插件

```bash
/plugin unload example-timer
```

### 8. 扫描插件目录

```bash
/plugin scan
```

### 9. 重新加载插件

```bash
/plugin reload example-timer
```

## 插件状态说明

- ⚪ **unloaded** - 插件未加载
- ✅ **loaded** - 插件已加载但未启用
- 🟢 **enabled** - 插件已启用并正常运行
- ⏸️ **disabled** - 插件已禁用
- ❌ **error** - 插件加载或运行出错

## 插件目录结构

```
plugins/
├── example-timer/
│   ├── index.js          # 插件主文件
│   └── package.json      # 插件元数据
└── example-weather/
    ├── index.js
    └── package.json
```

## 创建自定义插件

### 插件模板

```javascript
import { BasePlugin, PluginHooks } from '../../lib/plugins/plugin-system.js';

export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);
    
    // 定义插件命令
    this.commands = {
      '/mycommand': {
        handler: this.handleCommand.bind(this),
        description: '我的自定义命令',
        usage: '/mycommand <arg>',
        category: 'utility',
      },
    };
  }

  async onEnable(context) {
    context.logger.info('MyPlugin enabled');
  }

  async onDisable(context) {
    context.logger.info('MyPlugin disabled');
  }

  async handleCommand(args) {
    // 命令处理逻辑
    return {
      success: true,
      message: '命令执行成功',
    };
  }
}
```

### 插件元数据 (package.json)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "我的插件描述",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT",
  "keywords": ["xzchat", "plugin", "utility"],
  "category": "utility",
  "dependencies": {},
  "peerDependencies": {}
}
```

## 插件生命周期

1. **发现** - 扫描插件目录，读取元数据
2. **加载** - 加载插件代码，创建实例
3. **启用** - 调用 `onEnable`，注册命令和钩子
4. **运行** - 插件命令和钩子被触发
5. **禁用** - 调用 `onDisable`，清理资源
6. **卸载** - 完全移除插件实例

## 注意事项

1. 插件必须提供 `package.json` 文件
2. 插件主文件必须导出默认的插件类
3. 插件名称不能与系统命令冲突
4. 禁用插件不会卸载，只是停止功能
5. 建议在 `onDisable` 中清理所有资源（如计时器、事件监听器等）

## 示例插件

### example-timer

提供计时器功能：

```bash
/timer 60 "时间到！"
/timers
```

### example-weather

提供天气查询功能：

```bash
/weather 北京
/weather 上海
```

## 故障排除

### 插件加载失败

1. 检查 `package.json` 格式是否正确
2. 检查 `index.js` 是否导出了默认类
3. 查看错误日志获取详细信息

### 命令无法使用

1. 确认插件已启用 (`/plugin list`)
2. 检查命令名称是否正确
3. 查看插件状态是否为 `enabled`

### 插件性能问题

1. 使用 `/plugin reload <name>` 重新加载
2. 检查插件是否有资源泄漏
3. 暂时禁用插件排查问题

## 更多资源

- 插件系统源码: `lib/plugins/plugin-system.js`
- 插件管理器源码: `lib/plugins/plugin-manager.js`
- 示例插件: `plugins/example-timer/`, `plugins/example-weather/`
