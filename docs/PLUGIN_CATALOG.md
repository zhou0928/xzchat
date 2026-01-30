# xzChat 插件目录

所有可用插件的完整列表和使用说明。

## 内置插件

### 1. Timer Plugin（计时器）

**类别**: utility

**描述**: 创建和管理计时器

**命令**:
```
/timer <seconds> [message]
```

**示例**:
```
/timer 60 倒计时完成
/timer 3005 提醒我休息
```

**功能**:
- 创建倒计时器
- 设置自定义提醒消息
- 列出所有活动计时器

---

### 2. Weather Plugin（天气查询）

**类别**: information

**描述**: 查询实时天气信息

**命令**:
```
/weather <city>
```

**示例**:
```
/weather 北京
/weather Tokyo
/weather London
```

**功能**:
- 全球城市天气查询
- 显示温度、湿度、风速
- 天气状况说明

---

### 3. Translator Plugin（翻译）

**类别**: utility

**描述**: 多语言翻译

**命令**:
```
/translate <from>:<to> <text>
/languages
```

**示例**:
```
/translate en:zh Hello World
/translate zh:en 你好
/languages
```

**功能**:
- 支持12种语言
- 实时翻译
- 列出所有支持的语言

**支持的语言**: 中文、英语、日语、韩语、法语、德语、西班牙语、俄语、葡萄牙语、意大利语、阿拉伯语、印地语

---

### 4. Calculator Plugin（计算器）

**类别**: utility

**描述**: 功能强大的计算器

**命令**:
```
/calc <expression>
/calc-history
/calc-var <name> = <value>
/calc-vars
/calc-clear
```

**示例**:
```
/calc 2 + 2
/calc sqrt(16) + 5
/calc-var pi = 3.14159
/calc pi * 2
/calc-history
```

**功能**:
- 基本运算（+ - * / %）
- 科学计算（sin, cos, tan, sqrt, pow, etc.）
- 变量存储和调用
- 计算历史记录
- 内置常量（pi, e, 等）

---

### 5. Jokes Plugin（笑话）

**类别**: entertainment

**描述**: 获取各种笑话和趣味内容

**命令**:
```
/joke [type]
/joke-types
/fact
/quote
```

**示例**:
```
/joke
/joke programming
/joke dad
/fact
/quote
```

**功能**:
- 多种类型笑话
- 有趣事实
- 励志名言
- 笑话历史

**笑话类型**: general, programming, dad, pun, science

---

### 6. Notes Plugin（笔记）

**类别**: productivity

**描述**: 快速笔记和备忘录管理

**命令**:
```
/note <content>
/notes [limit]
/note-search <keyword>
/note-delete <id>
/note-clear
/note-export [format]
```

**示例**:
```
/note 今天要完成的项目
/note 买牛奶 #生活
/notes 5
/note-search 项目
/note-delete 1234567890
/note-export json
```

**功能**:
- 添加笔记
- 搜索笔记
- 标签支持（使用 #）
- 导出笔记（JSON, TXT, MD）
- 笔记历史
- 本地持久化存储

---

### 7. Search Plugin（搜索）

**类别**: utility

**描述**: 多平台搜索

**命令**:
```
/search <query>
/google <query>
/bing <query>
/duckduckgo <query>
/github <query>
/stack <query>
```

**示例**:
```
/search how to code
/google javascript tutorial
/github vuejs
/stack async await
```

**功能**:
- Google 搜索
- Bing 搜索
- DuckDuckGo 搜索（带摘要）
- GitHub 搜索（带统计）
- Stack Overflow 搜索
- 搜索结果预览

---

## 开发你自己的插件

### 快速开始

1. 复制 `plugins/plugin-template/` 文件夹
2. 重命名文件夹
3. 修改 `package.json` 中的插件信息
4. 在 `index.js` 中实现插件逻辑
5. 在 CLI 中运行 `/plugin scan` 扫描插件
6. 运行 `/plugin load <name>` 加载插件
7. 运行 `/plugin enable <name>` 启用插件

### 插件结构

```
my-plugin/
├── package.json          # 插件元数据
├── index.js             # 插件主文件
└── README.md           # 插件文档（可选）
```

### 基础模板

```javascript
import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.commands = {
      '/mycommand': {
        handler: this.handleCommand.bind(this),
        description: '命令描述',
        usage: '/mycommand <args>',
        category: 'general'
      }
    };
  }

  async onEnable(context) {
    this.context.logger.info('插件已启用');
  }

  async onDisable(context) {
    this.context.logger.info('插件已禁用');
  }

  async handleCommand(args) {
    return {
      success: true,
      message: '命令执行结果'
    };
  }
}
```

### 插件 API

#### 命令处理

```javascript
this.commands = {
  '/command': {
    handler: this.handler.bind(this),
    description: '描述',
    usage: '/command <args>',
    category: 'category'
  }
};
```

#### 生命周期钩子

```javascript
async onEnable(context) {
  // 插件启用时
}

async onDisable(context) {
  // 插件禁用时
}
```

#### 日志记录

```javascript
this.context.logger.info('信息');
this.context.logger.warn('警告');
this.context.logger.error('错误');
```

#### WebSocket 通信

```javascript
// 发送消息
this.context.io.emit('plugin:message', {
  type: 'info',
  content: '消息内容'
});

// 监听事件
this.context.io.on('event', (data) => {
  console.log(data);
});
```

### 插件分类

- **general** - 通用功能
- **utility** - 实用工具
- **information** - 信息查询
- **productivity** - 生产力工具
- **entertainment** - 娱乐功能

### 最佳实践

1. **错误处理**: 总是处理可能的错误
2. **日志记录**: 使用 `this.context.logger` 记录日志
3. **资源清理**: 在 `onDisable` 中清理资源
4. **用户友好**: 提供清晰的错误消息和帮助信息
5. **异步操作**: 使用 async/await 处理异步操作

## 贡献插件

欢迎提交你的插件到插件目录！

### 提交要求

1. 插件必须符合插件规范
2. 必须有清晰的文档
3. 必须有使用示例
4. 代码必须有注释
5. 必须通过基本测试

### 提交方式

1. Fork 项目仓库
2. 在 `plugins/` 目录创建你的插件
3. 添加文档到 `PLUGIN_CATALOG.md`
4. 提交 Pull Request

## 获取帮助

- 查看插件文档: `docs/PLUGIN_GUIDE.md`
- 查看示例插件: `plugins/example-*`
- 查看插件模板: `plugins/plugin-template`

## 更新日志

### 2026-01-29
- 新增翻译插件（translator）
- 新增计算器插件（calculator）
- 新增笑话插件（jokes）
- 新增笔记插件（notes）
- 新增搜索插件（search）

### 2025-xx-xx
- 新增计时器插件（timer）
- 新增天气查询插件（weather）
