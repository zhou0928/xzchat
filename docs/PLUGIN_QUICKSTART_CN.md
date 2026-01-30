# 插件系统快速入门

> xzChat 企业级插件系统 - 快速上手指南

---

## 📖 什么是插件系统？

xzChat 的插件系统是一个**企业级、模块化、高性能**的扩展架构，允许开发者轻松地扩展功能。

### 核心特性

- 🏗️ **模块化架构** - 动态加载/卸载，热更新
- ✅ **完整验证** - 6 大验证模块，0-100 分评分
- 🚀 **智能缓存** - LRU 缓存 + TTL 过期，性能提升 50-80%
- 🛡️ **统一错误处理** - 14 种错误类型
- 🔗 **依赖管理** - 自动解析依赖，循环依赖检测
- 📦 **插件市场** - 搜索、安装、更新插件
- 🔄 **版本控制** - 自动备份、版本恢复
- 📊 **性能监控** - 实时指标、慢操作检测
- 🎯 **TypeScript 支持** - 完整类型定义

---

## 🚀 快速开始

### 1. 查看可用插件

```bash
# 在 xzChat 中
/plugin list

# 输出示例：
📦 已加载插件 (3):
  1. notes - 笔记管理插件
  2. calculator - 计算器插件
  3. translator - 翻译器插件
```

### 2. 使用插件命令

插件会自动注册命令，直接使用即可：

```bash
# 笔记插件命令
/note add 这是我的第一条笔记
/note list
/note search 笔记
/note export json

# 计算器插件命令
/calc 1 + 2 * 3
/calc sin(pi/2)

# 翻译器插件命令
/translate Hello World en zh
/translate 你好 zh en
```

### 3. 管理插件

```bash
# 加载插件
/plugin load notes

# 卸载插件
/plugin unload notes

# 启用插件
/plugin enable notes

# 禁用插件
/plugin disable notes

# 重新加载插件
/plugin reload notes

# 查看插件信息
/plugin info notes

# 验证插件质量
/plugin validate notes
```

---

## 🛠️ 开发你的插件

### 插件目录结构

```
plugins/
└── my-plugin/
    ├── package.json          # 插件元数据
    ├── index.js             # 插件主文件
    └── (其他资源文件)
```

### 1. 创建 package.json

```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "我的第一个插件",
  "author": "Your Name",
  "license": "MIT",
  "main": "index.js",
  "dependencies": {},
  "keywords": ["awesome", "utility"],
  "category": "productivity"
}
```

### 2. 创建 index.js

```javascript
// 导出插件类
export default class MyAwesomePlugin {
  constructor(metadata, context) {
    this.metadata = metadata;
    this.context = context;
  }

  // 插件初始化
  async activate() {
    console.log(`${this.metadata.name} 已激活！`);
    return true;
  }

  // 插件命令定义
  get commands() {
    return {
      '/my-command': {
        handler: this.handleCommand.bind(this),
        description: '我的第一个命令',
        usage: '/my-command <参数>',
        category: 'demo'
      }
    };
  }

  // 命令处理函数
  async handleCommand(args) {
    return {
      success: true,
      message: `你输入了: ${args}`
    };
  }

  // 插件停用
  async deactivate() {
    console.log(`${this.metadata.name} 已停用`);
    return true;
  }
}
```

### 3. 测试插件

```bash
# 将插件放入 plugins 目录
cp -r my-plugin ~/.newapi-chat/plugins/

# 在 xzChat 中加载
/plugin load my-awesome-plugin

# 测试命令
/my-command 你好世界
```

---

## 📊 插件验证

插件系统会自动验证插件质量：

### 验证模块

1. **元数据验证 (20%)** - 名称、版本、格式
2. **代码质量验证 (20%)** - 代码规范
3. **安全验证 (20%)** - 不安全操作检测
4. **性能验证 (20%)** - 性能问题检测
5. **依赖验证 (10%)** - 依赖关系检查
6. **配置验证 (10%)** - 配置完整性

### 查看验证结果

```bash
/plugin validate my-plugin

# 输出示例：
✅ 插件验证完成
📊 评分: 95/100 (优秀)

验证详情:
  ✅ 元数据验证 (20/20)
  ✅ 代码质量验证 (20/20)
  ✅ 安全验证 (18/20)
  ✅ 性能验证 (20/20)
  ✅ 依赖验证 (10/10)
  ⚠️  配置验证 (7/10)

警告:
  - 建议添加许可证信息
```

---

## 🚦 使用缓存

插件系统内置智能缓存，自动提升性能：

### 缓存统计

```bash
# 查看缓存统计
/plugin cache stats

# 输出示例：
📊 缓存统计:
  - 命中次数: 156
  - 未命中次数: 23
  - 缓存大小: 45
  - 命中率: 87.15%
  - 驱逐次数: 8
```

### 缓存管理

```bash
# 清理过期缓存
/plugin cache cleanup

# 清空所有缓存
/plugin cache clear

# 保存缓存到磁盘
/plugin cache save

# 从磁盘加载缓存
/plugin cache load
```

---

## 🎯 性能监控

实时监控插件性能：

```bash
# 查看性能报告
/plugin performance report

# 输出示例：
📊 性能报告:
  - 总插件数: 5
  - 总操作数: 1234
  - 总错误数: 3
  - 总耗时: 45.2s

  操作最多的插件:
    1. notes: 456 次操作
    2. calculator: 234 次操作

  最慢的操作:
    1. translator::translate_long_text (avg: 1523ms)
```

---

## 🔗 依赖管理

### 定义依赖

在 `package.json` 中添加：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "dependencies": {
    "notes": "^1.0.0",
    "calculator": "^2.0.0"
  }
}
```

### 检查依赖

```bash
# 检查插件依赖
/plugin dependency check my-plugin

# 输出示例：
✅ 依赖检查完成
  - 缺少依赖: 无
  - 版本不满足: 无
  - 循环依赖: 无
```

---

## 📦 插件市场

### 搜索插件

```bash
# 搜索可用插件
/plugin search 翻译

# 输出示例：
🔍 搜索结果 (3):
  1. translator - 翻译器插件 ⭐ 4.8 (下载: 1234)
  2. google-translate - Google 翻译 ⭐ 4.5 (下载: 892)
  3. deepl-translate - DeepL 翻译 ⭐ 4.7 (下载: 567)
```

### 安装插件

```bash
# 安装插件
/plugin install translator

# 输出示例：
✅ 插件 translator 安装成功
📂 路径: ~/.newapi-chat/plugins/translator
```

### 更新检查

```bash
# 检查插件更新
/plugin update check

# 输出示例：
🔔 有 2 个插件可更新:
  1. notes: 1.0.0 → 1.1.0
     - 新增: 导入/导出功能
  2. calculator: 1.0.0 → 1.2.0
     - 新增: 更多数学函数
```

---

## 🛡️ 错误处理

插件系统提供统一的错误类型：

### 常见错误

```javascript
import {
  PluginLoadError,
  PluginValidationError,
  DependencyError,
  PluginTimeoutError
} from '../lib/errors/plugin-errors.js';

// 捕获和处理错误
try {
  await manager.loadPlugin('my-plugin', path, metadata);
} catch (error) {
  if (error instanceof PluginLoadError) {
    console.error('加载失败:', error.pluginId, error.details);
  } else if (error instanceof PluginValidationError) {
    console.error('验证失败:', error.validationErrors);
  } else if (error instanceof DependencyError) {
    console.error('依赖问题:', error.missing, error.unsatisfied);
  }
}
```

### 错误代码

| 错误类型 | 代码 | 说明 |
|---------|------|------|
| PluginNotFoundError | 1001 | 插件未找到 |
| PluginLoadError | 1002 | 插件加载失败 |
| DependencyError | 2000 | 依赖问题 |
| PluginTimeoutError | 3000 | 插件超时 |
| PluginSecurityError | 4000 | 安全违规 |

---

## 🎯 TypeScript 支持

完整类型定义位于 `types/plugin-system.d.ts`：

```typescript
import {
  IPlugin,
  IPluginMetadata,
  IPluginManager,
  ICommand
} from '../types/plugin-system.d.ts';

class MyPlugin implements IPlugin {
  metadata: IPluginMetadata;
  path: string;
  status: PluginStatus;

  async load(context: any): Promise<boolean> {
    // 实现
    return true;
  }

  async enable(): Promise<boolean> {
    // 实现
    return true;
  }

  // ... 其他方法
}
```

---

## 📚 更多资源

### 官方文档

- **插件系统最终优化** - `docs/PLUGIN_SYSTEM_FINAL_OPTIMIZATION.md`
- **插件优化总结** - `docs/PLUGINS_OPTIMIZATION_SUMMARY.md`
- **插件代码审查** - `docs/PLUGIN_CODE_REVIEW.md`
- **插件演进历史** - `docs/PLUGIN_SYSTEM_EVOLUTION.md`

### 演示脚本

```bash
# 运行功能演示
node examples/demo-optimized-features.js

# 运行插件特性演示
node examples/demo-plugin-features.js
```

### 示例插件

查看 `plugins/` 目录下的示例：
- `notes/` - 笔记管理插件
- `calculator/` - 计算器插件
- `translator/` - 翻译器插件
- `advanced-example/` - 高级示例插件

---

## 💡 最佳实践

### 1. 命令设计

- 使用清晰的命令名称（如 `/note-add` 而非 `/na`）
- 提供详细的 `description` 和 `usage`
- 合理分类（`productivity`, `dev`, `fun` 等）

### 2. 错误处理

- 使用统一的错误类型
- 提供有意义的错误消息
- 捕获并记录所有异常

### 3. 性能优化

- 避免同步 I/O 操作
- 使用缓存
- 批量处理操作

### 4. 安全考虑

- 验证用户输入
- 避免使用 `eval()` 等危险函数
- 限制文件系统访问

---

## 🎊 总结

xzChat 插件系统现已达到**生产就绪状态**，具备：

✅ 企业级架构
✅ 完整验证体系
✅ 高性能缓存
✅ 统一错误处理
✅ TypeScript 支持
✅ 丰富的文档和示例

立即开始开发你的插件吧！🚀

---

**如有问题，请提交 Issue 或查看详细文档。**
