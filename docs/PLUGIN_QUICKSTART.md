# 插件系统快速入门指南

## 🚀 5 分钟上手

### 1. 查看已安装的插件

```bash
# 启动 xzChat
npm start

# 扫描插件
/plugin scan

# 列出所有插件
/plugin list
```

### 2. 启用插件

```bash
# 加载插件
/plugin load translator

# 启用插件
/plugin enable translator
```

### 3. 使用插件命令

```bash
# 翻译文本
/translate en:zh Hello World

# 计算
/calc sqrt(16) + 5

# 笔记
/note 今天要做什么 #工作

# 笑话
/joke
```

---

## 📚 插件列表

### 1. 计时器插件 (`example-timer`)

```bash
/timer 60 计时完成          # 创建 60 秒倒计时
/timers                     # 列出所有计时器
```

### 2. 天气插件 (`example-weather`)

```bash
/weather 北京               # 查询北京天气
/weather Tokyo              # 查询东京天气
```

### 3. 翻译插件 (`translator`)

```bash
/translate en:zh Hello World    # 英译中
/translate zh:en 你好           # 中译英
/languages                     # 查看支持的语言
```

### 4. 计算器插件 (`calculator`)

```bash
/calc 2+2                         # 基本运算
/calc sqrt(16) + 5                # 科学计算
/calc-var pi = 3.14159            # 设置变量
/calc-vars                        # 列出变量
/calc pi * 2                      # 使用变量
/calc-history                     # 查看历史
```

### 5. 笑话插件 (`jokes`)

```bash
/joke                    # 随机笑话
/joke programming        # 程序员笑话
/fact                    # 有趣事实
/quote                   # 励志名言
```

### 6. 笔记插件 (`notes`)

```bash
/note 今天要做什么 #工作                   # 添加笔记
/notes                                      # 列出笔记
/note-search 工作                           # 搜索笔记
/note-tags                                  # 列出标签
/note-stats                                 # 统计信息
/note-export json                           # 导出笔记
/note-import /path/to/notes.json           # 导入笔记
```

### 7. 搜索插件 (`search`)

```bash
/search nodejs           # Google 搜索
/github express          # GitHub 搜索
/stack express async    # Stack Overflow 搜索
```

### 8. 高级示例插件 (`advanced-example`)

```bash
/demo-dep               # 演示依赖管理
/demo-version           # 演示版本控制
/demo-perf              # 演示性能监控
/demo-all               # 演示所有功能
```

---

## 🔧 插件管理命令

### 基础操作

```bash
/plugin scan            # 扫描插件目录
/plugin list            # 列出所有插件
/plugin info <id>       # 查看插件详情
```

### 加载/卸载

```bash
/plugin load <id>       # 加载插件
/plugin unload <id>     # 卸载插件
/plugin reload <id>     # 重新加载插件
```

### 启用/禁用

```bash
/plugin enable <id>     # 启用插件
/plugin disable <id>    # 禁用插件
```

### 命令管理

```bash
/commands               # 列出所有命令
/commands <keyword>     # 搜索命令
```

---

## 💡 高级功能

### 1. 依赖管理

```javascript
// 检查插件依赖
const check = dependencyManager.checkDependencies('translator');
console.log(check);
// { satisfied: true, missing: [], unsatisfied: [] }

// 检查循环依赖
const cycle = dependencyManager.checkCircularDependencies();
console.log(cycle);
// { hasCycle: false }

// 获取加载顺序
const order = dependencyManager.resolveLoadOrder();
console.log(order);
// ['dep1', 'dep2', 'plugin']
```

### 2. 版本控制

```javascript
// 记录版本
const backup = await versionManager.recordVersion('notes', '2.0.0');

// 恢复版本
await versionManager.restoreVersion('notes', backup.id);

// 检查兼容性
const compat = versionManager.checkCompatibility(
  pluginMetadata,
  '2.3.5'
);
// { compatible: true, minVersion: '1.0.0', maxVersion: '3.0.0' }
```

### 3. 性能监控

```javascript
// 获取性能报告
const report = performanceMonitor.getPerformanceReport();
console.log(`总操作数: ${report.totalOperations}`);
console.log(`慢操作: ${report.slowOperations.length}`);

// 导出报告
const text = await performanceMonitor.exportReport('text');
console.log(text);
```

### 4. 插件市场

```javascript
// 搜索插件
const results = marketplace.searchPlugins('翻译');

// 获取热门插件
const popular = marketplace.getPopularPlugins(10);

// 检查更新
const updates = await marketplace.checkUpdates();
```

---

## 🎯 创建你的第一个插件

### 1. 创建插件目录

```bash
mkdir -p plugins/my-plugin
cd plugins/my-plugin
```

### 2. 创建 package.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "我的第一个插件",
  "author": "Your Name",
  "license": "MIT",
  "main": "index.js",
  "keywords": ["示例"],
  "category": "general"
}
```

### 3. 创建 index.js

```javascript
import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class MyPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.commands = {
      '/hello': {
        handler: this.handleHello.bind(this),
        description: '打个招呼',
        usage: '/hello [name]',
        category: 'general'
      }
    };
  }

  async onEnable(context) {
    context.logger.info('我的插件已启用');
  }

  async onDisable(context) {
    context.logger.info('我的插件已禁用');
  }

  async handleHello(args) {
    const name = args.trim() || '世界';
    return {
      success: true,
      message: `你好，${name}！`
    };
  }
}
```

### 4. 测试插件

```bash
# 扫描插件
/plugin scan

# 加载插件
/plugin load my-plugin

# 启用插件
/plugin enable my-plugin

# 使用插件
/hello
/hello 张三
```

---

## 📊 使用示例

### 示例 1: 计算器使用

```bash
# 设置变量
/calc-var a = 10
/calc-var b = 20

# 使用变量计算
/calc a + b
/calc sqrt(a * b)

# 查看历史
/calc-history
```

### 示例 2: 笔记管理

```bash
# 添加笔记
/note 今天的会议 #工作 #重要
/note 购物清单: 牛奶, 鸡蛋 #生活

# 搜索笔记
/note-search 工作

# 查看统计
/note-stats

# 导出笔记
/note-export json
```

### 示例 3: 翻译功能

```bash
# 查看支持的语言
/languages

# 翻译文本
/translate en:zh Hello World
/translate zh:en 你好，世界

# 批量翻译
/translate en:zh Hello
/translate en:zh Good morning
```

---

## 🔍 故障排除

### 问题: 插件加载失败

```bash
# 检查依赖
/plugin info my-plugin

# 查看错误日志
# 检查 package.json 格式是否正确
```

### 问题: 命令不工作

```bash
# 确认插件已启用
/plugin list

# 查看可用命令
/commands

# 检查命令格式
/plugin info my-plugin
```

### 问题: 性能问题

```bash
# 查看性能报告
/demo-perf

# 检查慢操作
# 优化插件代码
```

---

## 📚 更多资源

- `docs/PLUGINS_OPTIMIZATION_SUMMARY.md` - 完整优化总结
- `docs/PLUGIN_SYSTEM_EVOLUTION.md` - 系统演进历史
- `docs/PLUGIN_CATALOG.md` - 插件目录
- `docs/PLUGIN_GUIDE.md` - 开发指南
- `examples/demo-plugin-features.js` - 功能演示
- `plugins/plugin-template/` - 插件模板

---

## 🎉 下一步

1. ✅ 尝试所有内置插件
2. ✅ 创建你自己的插件
3. ✅ 查看高级功能演示
4. ✅ 阅读开发文档

祝你使用愉快！🚀
