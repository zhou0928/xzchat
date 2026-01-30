# 插件系统文档

## 概述

xzChat 插件系统提供了一个灵活、强大的扩展机制,允许开发者通过插件来扩展应用功能。插件可以:

- 注册自定义命令
- 监听和处理应用事件
- 修改消息和配置
- 集成外部服务
- 扩展 UI 功能

## 架构

### 核心组件

1. **PluginManager** - 插件管理器
   - 负责插件的加载、卸载、启用、禁用
   - 管理插件生命周期
   - 处理插件依赖关系

2. **BasePlugin** - 插件基类
   - 所有插件的基类
   - 提供生命周期钩子
   - 提供配置管理工具

3. **PluginContext** - 插件上下文
   - 提供应用状态和服务访问
   - 提供事件系统
   - 提供日志功能

4. **PluginHooks** - 钩子系统
   - 定义应用生命周期事件
   - 支持插件注册和处理事件

## 快速开始

### 创建一个简单的插件

#### 1. 创建插件目录结构

```
my-plugin/
├── package.json
└── index.js
```

#### 2. 定义插件元数据

```json
// package.json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My awesome xzChat plugin",
  "author": "Your Name",
  "license": "MIT",
  "main": "index.js",
  "keywords": ["xzchat", "plugin"],
  "category": "general"
}
```

#### 3. 实现插件类

```javascript
// index.js
import { BasePlugin, PluginHooks } from 'xzchat-plugin-system';

export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);
  }

  async onEnable(context) {
    context.logger.info('My plugin enabled');
  }

  async onDisable(context) {
    context.logger.info('My plugin disabled');
  }
}
```

### 注册自定义命令

```javascript
export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);
    
    this.commands = {
      '/mycommand': {
        handler: this.handleMyCommand.bind(this),
        description: '我的自定义命令',
        usage: '/mycommand <args>',
        category: 'custom',
      },
    };
  }

  async handleMyCommand(args) {
    return {
      success: true,
      message: `执行命令,参数: ${args}`,
    };
  }
}
```

### 监听应用事件

```javascript
export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);
    
    this.hooks = {
      [PluginHooks.MESSAGE_SEND]: this.onMessageSend.bind(this),
      [PluginHooks.MESSAGE_RECEIVED]: this.onMessageReceived.bind(this),
    };
  }

  async onMessageSend(data) {
    // 在消息发送前处理
    console.log('Sending message:', data);
    return data;
  }

  async onMessageReceived(data) {
    // 处理接收到的消息
    console.log('Received message:', data);
    return data;
  }
}
```

## API 参考

### PluginManager

#### 构造函数

```typescript
new PluginManager(options: {
  pluginPaths?: string[];
  context?: PluginContext;
  autoLoad?: boolean;
})
```

#### 方法

##### `loadPlugin(name, path, metadata)`

加载单个插件。

```javascript
await manager.loadPlugin('my-plugin', '/path/to/plugin', metadata);
```

##### `enablePlugin(name)`

启用插件。

```javascript
await manager.enablePlugin('my-plugin');
```

##### `disablePlugin(name)`

禁用插件。

```javascript
await manager.disablePlugin('my-plugin');
```

##### `unloadPlugin(name)`

卸载插件。

```javascript
await manager.unloadPlugin('my-plugin');
```

##### `getPlugin(name)`

获取插件实例。

```javascript
const plugin = manager.getPlugin('my-plugin');
```

##### `listPlugins()`

列出所有插件。

```javascript
const plugins = manager.listPlugins();
```

##### `emit(event, data)`

触发钩子事件。

```javascript
await manager.emit('message:send', { content: 'hello' });
```

### BasePlugin

#### 生命周期方法

##### `onInitialize(context)`

初始化插件,在加载时调用。

```javascript
async onInitialize(context) {
  this.context.logger.info('Plugin initialized');
}
```

##### `onEnable(context)`

启用插件时调用。

```javascript
async onEnable(context) {
  this.context.logger.info('Plugin enabled');
}
```

##### `onDisable(context)`

禁用插件时调用。

```javascript
async onDisable(context) {
  this.context.logger.info('Plugin disabled');
}
```

##### `onUnload(context)`

卸载插件时调用。

```javascript
async onUnload(context) {
  this.context.logger.info('Plugin unloaded');
}
```

#### 配置管理

##### `getConfig()`

获取插件配置。

```javascript
const config = this.getConfig();
```

##### `updateConfig(newConfig)`

更新插件配置。

```javascript
this.updateConfig({ setting: 'value' });
```

##### `saveConfig()`

保存配置。

```javascript
await this.saveConfig();
```

### PluginHooks

可用的事件钩子:

```javascript
const PluginHooks = {
  // 插件生命周期
  INIT: 'plugin:init',
  ENABLE: 'plugin:enable',
  DISABLE: 'plugin:disable',
  UNLOAD: 'plugin:unload',

  // 应用生命周期
  START: 'app:start',
  STOP: 'app:stop',
  RESTART: 'app:restart',

  // 命令相关
  COMMAND_REGISTER: 'command:register',
  COMMAND_EXECUTE: 'command:execute',
  COMMAND_SUCCESS: 'command:success',
  COMMAND_ERROR: 'command:error',

  // 消息相关
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_PROCESSED: 'message:processed',

  // 配置相关
  CONFIG_LOAD: 'config:load',
  CONFIG_SAVE: 'config:save',
  CONFIG_CHANGE: 'config:change',

  // 其他
  ERROR: 'error',
  LOG: 'log',
};
```

## 最佳实践

### 1. 错误处理

始终处理可能出现的错误:

```javascript
async handleCommand(args) {
  try {
    const result = await doSomething(args);
    return { success: true, data: result };
  } catch (error) {
    this.context.logger.error('Command error:', error);
    return { error: error.message };
  }
}
```

### 2. 资源清理

在 `onDisable` 或 `onUnload` 中清理资源:

```javascript
async onDisable(context) {
  // 清理定时器
  this.timers.forEach(timer => clearTimeout(timer));
  
  // 清理事件监听
  this.eventListeners.forEach(listener => listener.remove());
  
  // 关闭连接
  if (this.connection) {
    await this.connection.close();
  }
}
```

### 3. 配置验证

验证插件配置:

```javascript
async onEnable(context) {
  const config = this.getConfig();
  
  if (!config.apiKey) {
    throw new Error('API key is required in plugin config');
  }
}
```

### 4. 使用日志

使用上下文提供的日志器:

```javascript
this.context.logger.info('Information message');
this.context.logger.warn('Warning message');
this.context.logger.error('Error message');
this.context.logger.debug('Debug message');
```

### 5. 插件通信

使用事件系统进行插件间通信:

```javascript
// 发送事件
await this.context.emit('custom:event', { data: 'value' });

// 监听事件
this.context.on('custom:event', (data) => {
  console.log('Received:', data);
});
```

## 示例插件

### Timer Plugin

见 `plugins/example-timer/` 目录。

演示如何:
- 注册命令
- 管理状态
- 使用定时器

### Weather Plugin

见 `plugins/example-weather/` 目录。

演示如何:
- 调用外部 API
- 处理网络请求
- 监听消息事件

## 故障排除

### 插件无法加载

1. 检查 `package.json` 是否正确
2. 验证元数据格式
3. 查看错误日志

### 插件无法启用

1. 检查依赖是否满足
2. 验证插件接口
3. 查看 `onEnable` 中的错误

### 插件命令不工作

1. 确认命令已正确注册
2. 检查命令处理器是否正确
3. 验证返回值格式

## 贡献

如果你想为插件系统做贡献:

1. 创建功能分支
2. 实现功能并添加测试
3. 更新文档
4. 提交 Pull Request

## 许可证

MIT License
