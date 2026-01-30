# xzChat (Original xiaozhou-chat)

<div align="center">

![NPM Version](https://img.shields.io/npm/v/xzChat?style=flat-square&color=blue)
![License](https://img.shields.io/npm/l/xzChat?style=flat-square&color=green)
![Node Version](https://img.shields.io/node/v/xzChat?style=flat-square)
![Downloads](https://img.shields.io/npm/dm/xzChat?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)

**🚀 全能命令行 AI 助手，专为开发者打造。**
**A powerful CLI chatbot based on NewAPI, designed for developers.**

[快速开始](#-快速开始-quick-start) • [核心特性](#-核心特性-features) • [使用指南](#-使用指南-usage) • [命令速查](#-常用命令速查)

</div>

---

## 📖 简介 (Introduction)

**xzChat** 是一个运行在终端的高级 AI 助手。它不仅仅是一个聊天机器人，更是你的**结对编程伙伴**。
通过深度集成 Git 工作流、RAG 知识库、MCP 协议以及语音交互，xzChat 能够理解你的项目上下文，协助你完成代码编写、重构、提交信息生成等复杂任务。

> "你的终端，值得拥有一个更聪明的大脑。"

## ✨ 核心特性 (Features)

*   **🤖 智能体模式 (Agent Mode)**
    *   通过 `/auto` 命令，让 AI 自动拆解复杂任务。
    *   自动编写代码、运行测试、修复错误，实现任务闭环。
    *   支持浏览器预览生成的网页效果。

*   **🧠 RAG 上下文感知 (RAG & Context)**
    *   **语义搜索**: 使用 `/rag` 建立本地代码索引，支持自然语言搜索（如"认证逻辑在哪里？"）。
    *   **项目扫描**: `/scan` 智能生成项目结构树，让 AI 快速理解项目全貌。
    *   **文件加载**: `/load` 支持读取 PDF、文本文件，甚至自动处理大文件摘要。

*   **🛠️ Git 深度集成 (Git Workflow)**
    *   **智能提交**: `/commit` 自动分析 `git diff`，生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的提交信息。
    *   **代码审查**: `/review` 对暂存区代码进行深度 AI Review，提前发现潜在 Bug。
    *   **提交历史**: `/git log` 查看提交历史并让 AI 解释变更。

*   **🔌 无限扩展 (MCP & Tools)**
    *   **MCP 支持**: 兼容 **Model Context Protocol**，可连接本地数据库、Slack、Notion 等外部工具。
    *   **语音交互**: `/voice` (Whisper) 和 `/tts` (OpenAI TTS) 实现完全的语音对话体验。
    *   **多环境管理**: 通过 `/profile` 和 `/session` 轻松切换工作/个人环境及对话历史。

*   **🎯 增强的会话管理 (Session Management)**
    *   **会话搜索**: `/session search` 在所有历史会话中搜索关键词。
    *   **会话克隆**: `/session clone` 复制现有会话创建新的探索分支。
    *   **撤销重做**: `/undo` 撤销最后一条消息，`/retry` 重新生成回复。
    *   **继续生成**: `/continue` 让 AI 继续未完成的输出。
    *   **编辑消息**: `/edit` 修改已发送的消息。

*   **🔒 安全性增强 (Security)**
    *   **敏感信息过滤**: 自动检测和过滤 API Key 等敏感信息。
    *   **路径验证**: 防止路径遍历攻击。
    *   **命令验证**: 检测危险命令（如 `rm -rf /`）。
    *   **文件警告**: 访问敏感文件时给出警告提示。

*   **📊 日志与监控 (Logging & Monitoring)**
    *   **结构化日志**: 可配置的日志级别（DEBUG/INFO/WARN/ERROR）。
    *   **自动归档**: 日志按日期自动归档存储。
    *   **错误追踪**: 详细的错误上下文和堆栈跟踪。
    *   **审计日志**: 完整的操作记录和审计系统。

*   **🧩 企业级插件系统 (Plugin System)**
    *   **模块化架构**: 支持动态加载/卸载插件，热更新。
    *   **完整验证**: 6 大验证模块（元数据/代码/安全/性能/依赖/配置），0-100 分评分。
    *   **智能缓存**: LRU 缓存 + TTL 过期 + 磁盘持久化，性能提升 50-80%。
    *   **统一错误处理**: 14 种错误类型，快速定位问题。
    *   **依赖管理**: 自动解析依赖关系、循环依赖检测、拓扑排序。
    *   **插件市场**: 搜索、安装、更新插件，支持分类和评分。
    *   **版本控制**: 自动备份、版本恢复、SHA256 完整性验证。
    *   **性能监控**: 实时指标、慢操作检测、性能报告、异步监控。
    *   **TypeScript 支持**: 完整类型定义（30+ 接口）。
    *   **高测试覆盖**: 58+ 单元测试用例。

*   **🌳 分支系统 (Branch System)**
    *   **分支创建**: 从任意消息点创建对话分支。
    *   **分支管理**: 列出、切换、删除分支。
    *   **分支比较**: 对比不同分支的差异。
    *   **分支合并**: 将分支合并回主会话。
    *   **分支树**: 可视化查看分支结构。

## 🚀 快速开始 (Quick Start)

### 环境要求 (Prerequisites)
- **Node.js**: >= 18.0.0
- **Git**: (推荐) 用于版本控制功能

### 安装 (Installation)

```bash
# 使用 npm 全局安装
npm install -g xzChat

# 或者直接使用 npx 运行 (免安装)
npx xzChat
```

### 初始化 (Initialization)

在你的项目根目录下运行：

```bash
xzChat init
```
这将生成 `.newapi-chat-config.json` 配置文件。

## ⚙️ 配置 (Configuration)

启动工具后，支持通过命令动态修改配置，即时生效：

```bash
# 1. 设置 API Key (支持 OpenAI, Anthropic, DeepSeek 等)
/config apiKey sk-xxxxxxxxxxxxxxxxxxxx

# 2. 设置 Base URL (如果你使用中转服务)
/config baseUrl https://api.openai.com/v1

# 3. 切换模型
/config model gpt-4o

# 4. (可选) 切换预设环境
/profile use work
```

### 环境变量支持

```bash
# 通过环境变量配置（优先级最高）
export XZCHAT_API_KEY="sk-..."
export XZCHAT_BASE_URL="https://api.example.com/v1"
export XZCHAT_MODEL="gpt-4o"
export XZCHAT_LOG_LEVEL="DEBUG"
```

## 📖 使用指南 (Usage)

启动工具后，你将看到 `小周>` 提示符。输入 `/help` 可查看炫彩帮助菜单。

### 场景 1：日常结对编程
```bash
小周> 这个函数的时间复杂度是多少？能优化吗？
小周> 帮我写一个 React 组件，包含 loading 状态和错误处理
```

### 场景 2：全自动智能体
```bash
小周> /auto 帮我创建一个贪吃蛇游戏
# AI 将自动：
# 1. 规划步骤
# 2. 创建 index.html, style.css, script.js
# 3. 写入代码
# 4. 询问是否预览
```

### 场景 3：Git 提交助手
```bash
# 当你完成了代码修改并 git add 后
小周> /commit

# AI 输出示例：
# feat(auth): 增加 JWT 登录验证逻辑
# fix(ui): 修复移动端导航栏重叠问题
```

### 场景 4：分支探索（新功能）
```bash
# 想探索不同的实现方案？创建分支！
小周> /branch create 尝试使用 TypeScript 重构
✅ 分支已创建: branch_xxx

# 在分支中继续讨论
小周> 帮我把这个函数改用 TypeScript
...

# 查看所有分支
小周> /branch list

# 切换回主分支
小周> /branch switch main-session-id

# 创建另一个分支尝试其他方案
小周> /branch create 使用替代方案

# 比较两个分支的差异
小周> /branch compare branch_1 branch_2

# 选择最佳方案合并回主分支
小周> /branch merge branch_1 main-session-id
```

### 场景 5：知识库问答 (RAG)
```bash
# 1. 为当前项目建立索引
小周> /rag index

# 2. 基于代码库回答问题
小周> /rag search 用户登录后的 Token 是如何存储的？
```

### 场景 6：会话管理
```bash
# 搜索所有历史会话
小周> /session search 用户登录

# 克隆当前会话创建实验分支
小周> /session clone default experiment

# 撤销上一条消息
小周> /undo

# 重新生成 AI 回复
小周> /retry

# 让 AI 继续生成
小周> /continue
```

## 🛠️ 常用命令速查

### 基础命令
| 命令 | 别名 | 说明 |
|------|------|------|
| `/help` | `/?` | 查看帮助菜单 |
| `/config <key> <value>` | `/配置` | 查看或修改配置 |
| `/init` | `/初始化配置` | 初始化项目配置 |
| `/profile` | `/切换模型` | 切换配置环境 |
| `/system <prompt>` | - | 设置系统提示词 |
| `/clear` | - | 清空当前对话历史 |
| `/exit` | `/quit` | 退出程序 (会有随机告别语哦👋) |

### 文件操作
| 命令 | 别名 | 说明 |
|------|------|------|
| `/scan` | `/当前项目结构` | 扫描并发送项目目录结构 |
| `/load <file>` | - | 加载文件内容到上下文 |
| `/optimize <file>` | `/opt` | 深度分析并优化指定文件 |
| `/open <file>` | - | 使用系统默认程序打开文件 |
| `/save [index] <filename>` | - | 保存 AI 代码块 |
| `/paste` | - | 多行粘贴模式 |
| `/editor` | - | 调用系统编辑器输入多行内容 |

### 会话管理
| 命令 | 说明 |
|------|------|
| `/session` | 管理多会话 (list/use/new/delete/clone/search) |
| `/session list` | 查看所有会话 |
| `/session use <name>` | 切换到指定会话 |
| `/session new <name>` | 创建并切换到新会话 |
| `/session clone <src> <tgt>` | 克隆会话 |
| `/session search <keyword>` | 搜索所有会话中的内容 |
| `/session delete <name>` | 删除会话 |

### 对话控制 (新增)
| 命令 | 说明 |
|------|------|
| `/undo` | 撤销最后一条消息 |
| `/retry` | 重新生成 AI 的回复 |
| `/continue` | 让 AI 继续生成（类似 ChatGPT 的继续生成） |
| `/edit <index>` | 编辑指定索引的消息 |
| `/history` | 查看最近的历史记录 |

### Git 集成
| 命令 | 说明 |
|------|------|
| `/commit` | 生成 Git Commit Message |
| `/review` | 对暂存区代码进行 AI Code Review |
| `/git log` | 查看提交历史并让 AI 解释 |

### 高级功能
| 命令 | 说明 |
|------|------|
| `/mcp` | 管理 MCP 服务器 |
| `/auto <task>` | 进入智能体模式 (Agent Mode) |
| `/compress` | 压缩对话历史 |
| `/token` | 估算 Token 消耗 |
| `/copy [code]` | 复制上一次 AI 回复的代码或内容 |
| `/models` | 列出当前接口可用模型 |
| `/role <name>` | 切换或管理角色预设 |
| `/think [on|off]` | 开启/关闭 DeepSeek 思考过程显示 |
| `/tts [text]` | 开启/关闭语音朗读 |
| `/rag` | 知识库操作 (index/search) |
| `/voice` | 开启语音输入 (需安装 sox) |

### 插件系统（全新功能）
| 命令 | 说明 |
|------|------|
| `/plugin` | 插件管理主命令 |
| `/plugin list` | 列出所有插件 |
| `/plugin load <name>` | 加载指定插件 |
| `/plugin unload <name>` | 卸载插件 |
| `/plugin reload <name>` | 重新加载插件 |
| `/plugin enable <name>` | 启用插件 |
| `/plugin disable <name>` | 禁用插件 |
| `/plugin info <name>` | 查看插件详细信息 |
| `/plugin search <query>` | 搜索可用插件（插件市场） |
| `/plugin install <name>` | 从插件市场安装插件 |
| `/plugin validate <name>` | 验证插件质量 |

**插件系统特性**：
- 🏗️ **模块化架构** - 支持动态加载/卸载插件
- ✅ **完整验证体系** - 6 大验证模块，0-100 分评分
- 🚀 **智能缓存** - LRU 缓存 + TTL 过期，性能提升 50-80%
- 🛡️ **统一错误处理** - 14 种错误类型，快速定位问题
- 📊 **性能监控** - 实时指标、慢操作检测、性能报告
- 🔗 **依赖管理** - 自动解析依赖关系、循环依赖检测
- 📦 **插件市场** - 搜索、安装、更新插件
- 🔄 **版本控制** - 自动备份、版本恢复、完整性验证
- 🎯 **TypeScript 支持** - 完整类型定义
- 🧪 **高测试覆盖** - 58+ 单元测试用例

**内置插件示例**：
- 📝 **Notes** - 笔记管理插件（新增导入/导出/标签/统计）
- 🔢 **Calculator** - 计算器插件（支持数学表达式）
- 🌐 **Translator** - 翻译插件（多语言支持）
- 🚀 **Advanced Example** - 高级示例插件（演示各种特性）

详细文档：`docs/PLUGIN_SYSTEM_FINAL_OPTIMIZATION.md`

### 分支管理（新功能）
| 命令 | 说明 |
|------|------|
| `/branch` | 分支管理主命令 |
| `/branch list` | 列出所有分支 |
| `/branch create <desc>` | 创建新分支 |
| `/branch switch <id>` | 切换到指定分支 |
| `/branch delete <id>` | 删除分支 |
| `/branch compare <id1> <id2>` | 比较两个分支 |
| `/branch merge <src> <dst>` | 合并分支 |
| `/branch tree` | 显示分支树结构 |
| `/branch cleanup` | 清理孤立分支 |

## 🔒 安全性说明

xzChat 内置了多层安全保护：

1. **敏感信息过滤**: 自动检测并过滤日志中的 API Key、密码等敏感信息
2. **路径遍历防护**: 严格验证文件路径，防止访问系统敏感目录
3. **命令安全检查**: 检测危险命令（如 `rm -rf /`）并给出警告
4. **敏感文件警告**: 访问 `.env`、`.key` 等文件时会给出警告提示

## 📊 日志系统

xzChat 使用结构化日志系统，支持以下日志级别：

- `DEBUG`: 详细的调试信息（默认关闭）
- `INFO`: 一般信息（默认）
- `WARN`: 警告信息
- `ERROR`: 错误信息

设置日志级别：

```bash
# 通过环境变量
export XZCHAT_LOG_LEVEL=DEBUG

# 日志文件位置: ~/.newapi-chat-logs/xzchat-YYYY-MM-DD.log
```

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/xzChat.git
cd xzChat

# 安装依赖
npm install

# 链接到全局（便于开发测试）
npm link

# 运行
xzChat
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- tests/unit/plugin-errors.test.js

# 查看覆盖率
npm test -- --coverage
```

### 插件开发

详细文档：

- **🇨🇳 插件快速入门（中文）** - `docs/PLUGIN_QUICKSTART_CN.md`
- **🇬🇧 Plugin Quickstart (English)** - `docs/PLUGIN_QUICKSTART.md`
- **插件系统最终优化** - `docs/PLUGIN_SYSTEM_FINAL_OPTIMIZATION.md`
- **插件优化总结** - `docs/PLUGINS_OPTIMIZATION_SUMMARY.md`
- **插件代码审查** - `docs/PLUGIN_CODE_REVIEW.md`
- **插件演进历史** - `docs/PLUGIN_SYSTEM_EVOLUTION.md`
- **优化完成总结** - `docs/OPTIMIZATION_COMPLETE_SUMMARY.md`

**演示脚本**：

```bash
# 运行插件系统功能演示
node examples/demo-optimized-features.js

# 运行插件系统第三阶段演示
node examples/demo-plugin-features.js
```

**TypeScript 类型定义**：

所有插件相关类型定义位于 `types/plugin-system.d.ts`，包含：
- IPlugin, IPluginMetadata, IPluginManager
- IDependencyManager, IMarketplace, IVersionManager
- IPerformanceMonitor, IPluginValidator
- 所有错误类型

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 License

[MIT](LICENSE) © xiaozhou

## 🙏 致谢

- [OpenAI](https://openai.com/) - 提供强大的 AI API
- [Anthropic](https://www.anthropic.com/) - Claude 模型支持
- [Node.js](https://nodejs.org/) - 运行时环境
- 所有贡献者

---

**如果你觉得 xzChat 对你有帮助，请给它一个 ⭐️ Star！**
