# Web 插件开发指南

## 概述

xzChat Web UI 支持插件系统，允许开发者扩展聊天功能。插件可以：
- 提供自定义命令
- 监听和处理消息事件
- 集成外部 API
- 扩展 UI 功能

## 插件结构

一个基本的插件包含以下文件：

```
my-plugin/
├── package.json          # 插件元数据
├── index.js             # 插件主文件
└── README.md            # 插件文档（可选）
```

## package.json 示例

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "我的插件描述",
  "author": "Your Name",
  "main": "index.js",
  "category": "utility",
  "keywords": ["xzchat", "plugin"],
  "license": "MIT"
}
```

## 插件类示例

```javascript
import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    // 定义命令
    this.commands = {
      '/mycommand': {
        handler: this.handleCommand.bind(this),
        description: '命令描述',
        usage: '/mycommand <args>',
        category: 'utility'
      }
    };
  }

  // 插件启用时调用
  async onEnable(context) {
    this.context.logger.info('插件已启用');
  }

  // 插件禁用时调用
  async onDisable(context) {
    this.context.logger.info('插件已禁用');
  }

  // 命令处理
  async handleCommand(args) {
    return {
      success: true,
      message: '命令执行结果'
    };
  }
}
```

## Web UI 中的插件使用

### 通过 API 调用

```javascript
// 执行插件命令
fetch('/api/commands/timer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ args: '60 倒计时' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### 在聊天界面中

用户可以直接在聊天输入框中输入插件命令：

```
/timer 60 倒计时完成
/weather 北京
```

## 插件钩子

可用的钩子：

- `plugin:init` - 插件初始化
- `plugin:enable` - 插件启用
- `plugin:disable` - 插件禁用
- `plugin:unload` - 插件卸载
- `message:send` - 消息发送前
- `message:received` - 消息接收后

## 示例插件

### 1. 计时器插件

```javascript
export default class TimerPlugin extends BasePlugin {
  timers = new Map();

  constructor(metadata, context) {
    super(metadata, context);

    this.commands = {
      '/timer': {
        handler: this.handleTimer.bind(this),
        description: '创建计时器',
        usage: '/timer <seconds> [message]',
        category: 'utility'
      }
    };
  }

  async handleTimer(args) {
    const [secondsStr, ...messageParts] = args.split(/\s+/);
    const seconds = parseInt(secondsStr);
    const message = messageParts.join(' ') || '计时器完成!';

    if (isNaN(seconds) || seconds <= 0) {
      return { error: '请输入有效的秒数' };
    }

    const timerId = Date.now();
    const timer = setTimeout(() => {
      this.timers.delete(timerId);
      // 通过 WebSocket 通知前端
      this.context.io.emit('plugin:message', {
        type: 'system',
        content: `⏰ ${message}`
      });
    }, seconds * 1000);

    this.timers.set(timerId, timer);

    return {
      success: true,
      message: `计时器已设置: ${seconds}秒后提示 "${message}"`
    };
  }
}
```

### 2. 天气查询插件

```javascript
import fetch from 'node-fetch';

export default class WeatherPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.commands = {
      '/weather': {
        handler: this.handleWeather.bind(this),
        description: '查询天气',
        usage: '/weather <city>',
        category: 'information'
      }
    };
  }

  async handleWeather(args) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args)}&count=1&language=zh`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return { error: `未找到城市: ${args}` };
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const message = `🌤️ ${name}, ${country}\n温度: ${weatherData.current.temperature_2m}°C`;

    return { success: true, message };
  }
}
```

## 部署插件

1. 将插件文件夹放入 `plugins/` 目录
2. 在 Web UI 中点击"扫描插件"
3. 在插件列表中找到你的插件
4. 点击"加载"然后"启用"

## 插件 API

### 获取插件列表

```javascript
GET /api/plugins
```

### 加载插件

```javascript
POST /api/plugins/:id/load
```

### 启用插件

```javascript
POST /api/plugins/:id/enable
```

### 执行命令

```javascript
POST /api/commands/:command-name
{
  "args": "命令参数"
}
```

## WebSocket 事件

插件可以监听和发送 WebSocket 事件：

```javascript
// 发送消息到前端
this.context.io.emit('plugin:message', {
  type: 'info',
  content: '消息内容'
});

// 监听前端事件
this.context.io.on('client:action', (data) => {
  console.log('客户端操作:', data);
});
```

## 最佳实践

1. **错误处理**: 总是处理可能的错误
2. **日志记录**: 使用 `this.context.logger` 记录日志
3. **资源清理**: 在 `onDisable` 中清理定时器、事件监听器等
4. **用户友好**: 提供清晰的错误消息和使用说明
5. **性能考虑**: 避免阻塞操作，使用异步

## 调试

1. 查看浏览器控制台日志
2. 查看服务器端日志
3. 使用插件详情页面查看状态
4. 使用 WebSocket 监听器查看事件

## 更多资源

- [CLI 插件开发指南](../docs/PLUGIN_GUIDE.md)
- [插件系统源码](../lib/plugins/plugin-system.js)
- [示例插件](../plugins/)
