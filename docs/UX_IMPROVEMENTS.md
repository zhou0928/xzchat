# 用户体验改进说明

## 概述

本次优化专注于改进命令提示和错误消息，提供更友好、更一致的用户体验。

## 改进内容

### 1. 统一的消息系统

#### 新增模块

**lib/utils/messages.js** (500+ 行)

提供统一的消息管理：
- ✅ 命令帮助信息
- ✅ 错误消息
- ✅ 成功消息
- ✅ 警告消息
- ✅ 信息消息
- ✅ 格式化工具

### 2. 命令帮助改进

#### 详细帮助信息

每个命令现在包含：
- **摘要**: 简短描述命令功能
- **子命令**: 所有可用的子命令
- **示例**: 实际使用示例
- **提示**: 有用的使用建议

#### 示例输出

```bash
📖 session - 管理会话
──────────────────────────────────────────────────

用法:
  /session

子命令:
  /session list              查看会话列表
  /session use <name|index>  切换到指定会话
  /session new <name>        创建并切换到新会话
  /session delete <name>      删除会话
  /session clone <src> <tgt> 克隆会话
  /session search <keyword>  搜索所有会话中的内容
  /session export <name> [format] 导出会话 (md/json/txt)

示例:
  /session list
  /session use 1
  /session new feature-x
  /session search API

💡 提示:
  • 使用数字索引快速切换会话
  • 默认会话不可删除，但可以用 /clear 清空
  • 支持搜索所有会话的历史内容
```

### 3. 错误消息改进

#### 更友好的错误提示

**优化前**:
```
Error: File not found
```

**优化后**:
```
❌ 文件不存在: /path/to/file.js
💡 提示: 使用 /load 查看可用文件
```

#### 错误分类

| 错误类型 | 示例消息 | 改进点 |
|---------|---------|--------|
| 文件不存在 | ❌ 文件不存在: test.js | 具体文件名 |
| 会话不存在 | ❌ 会话不存在: session-1 | 清晰的标识 |
| 权限拒绝 | ❌ 权限不足: 访问被拒绝 | 详细原因 |
| API 错误 | ❌ API 调用失败: 404 | 错误码 |
| 速率限制 | ⚠️ API 速率限制，请稍后重试 | 明确的等待提示 |

#### 上下文感知

错误消息支持变量替换：

```javascript
ERROR_MESSAGES.format('FILE_NOT_FOUND', { file: 'test.js' });
// 输出: ❌ 文件不存在: test.js

ERROR_MESSAGES.format('SESSION_INVALID_INDEX', { max: 10 });
// 输出: ❌ 会话索引超出范围 (有效: 1-10)
```

### 4. 成功消息改进

#### 更明确的成功反馈

**优化前**:
```
Session created
```

**优化后**:
```
✅ 会话已创建: feature-x
💾 记录数: 0
```

#### 成功消息类型

- `SESSION_CREATED` - 会话创建成功
- `SESSION_SWITCHED` - 会话切换成功
- `BRANCH_CREATED` - 分支创建成功
- `BRANCH_MERGED` - 分支合并成功
- `FILE_LOADED` - 文件加载成功
- `GIT_COMMITTED` - Git 提交成功
- `INDEX_CREATED` - 索引创建成功

### 5. 警告消息改进

#### 预警提示

大型文件警告：
```
⚠️  文件较大 (~500 KB)，可能影响性能
💡 提示: 考虑拆分文件或使用 /scan
```

API 配置警告：
```
⚠️  未配置 API Key，请先设置
💡 提示: 使用 /config set apiKey sk-xxxxx
```

缓存过期警告：
```
⚠️  缓存已过期
💡 提示: 数据可能不是最新的，建议重新索引
```

### 6. 信息消息改进

#### 状态指示

使用表情符号和清晰的状态描述：

- `📥 正在加载...`
- `💾 正在保存...`
- `⏳ 正在处理...`
- `🔍 正在搜索...`
- `🤔 正在思考...`
- `🤖 正在生成...`
- `📚 正在建立索引...`

### 7. 命令输出格式化

#### 列表格式化

```bash
📂 可用会话:

* [1] session-main
  [2] feature-x
  [3] bug-fix

💡 提示:
  • 使用数字索引快速切换会话
  • 默认会话不可删除
```

#### 表格格式化

```bash
🌳 分支列表:

┌───────────────────┬────────────┬────────┬────────────────────────┬──────────┐
│ ID               │ 描述       │ 消息数 │ 创建时间             │ 状态     │
├───────────────────┼────────────┼────────┼────────────────────────┼──────────┤
│ branch_xxx123... │ 尝试新方案│ 15     │ 2026-01-28 10:30:45 │          │
│ branch_abc456... │ Bug 修复  │ 8      │ 2026-01-28 11:00:22 │ ✅ 当前 │
└───────────────────┴────────────┴────────┴────────────────────────┴──────────┘

💡 提示:
  • 使用 /branch switch <id> 切换分支
  • 使用 /branch compare <id1> <id2> 比较分支
```

### 8. 命令帮助系统

#### 快速帮助

```bash
/help          # 显示所有命令
/help session  # 显示 session 命令详细帮助
/branch help   # 显示 branch 命令详细帮助
```

#### 结构化输出

```
📖 可用命令:

📂 会话管理:
  /session       - 管理会话
  /clear         - 清空当前会话
  /undo          - 撤销最后一条消息
  /retry         - 重试最后一条回复
  /continue      - 继续生成回复

🌳 分支管理:
  /branch        - 管理对话分支

📄 文件操作:
  /load          - 加载文件到上下文
  /open          - 打开文件
  /scan          - 扫描项目结构
  /editor        - 打开外部编辑器

...

💡 使用 /help <command> 查看命令详细帮助
```

### 9. 交互式提示改进

#### 确认提示

```bash
⚠️  确认删除会话 "old-session"? (y/n)
```

#### 多选项提示

```bash
🤖 正在生成提交信息...
--------------------------------------------------
feat(auth): add JWT authentication

添加了 JWT token 生成和验证功能
--------------------------------------------------

以此信息提交? (y: 提交 / e: 编辑 / n: 取消)
```

#### 分页提示

```bash
📄 文件列表 (第 1/5 页):
[1] README.md
[2] package.json
...

(n: 下一页, p: 上一页, q: 取消)
```

### 10. 上下文相关提示

根据用户操作提供相关提示：

```bash
# 当用户尝试删除当前会话时
❌ 不能删除当前正在使用的会话
💡 提示: 请先切换到其他会话

# 当会话索引超出范围时
❌ 会话索引超出范围
💡 有效范围: 1 - 5

# 当文件较大时
⚠️  文件较大 (~1000 KB)，可能影响性能
💡 提示: 考虑使用 /scan 加载项目结构
```

## 使用示例

### 集成到命令处理器

```javascript
import { 
  showCommandHelp, 
  showError, 
  showSuccess, 
  showWarning 
} from './utils/messages.js';

export async function handleSomeCommand(args) {
  // 显示帮助
  if (args[0] === 'help') {
    showCommandHelp('command-name');
    return;
  }

  // 显示错误
  if (!args[0]) {
    showError('MISSING_ARGUMENT', { arg: 'name' });
    return;
  }

  try {
    // 执行操作
    await doSomething(args[0]);
    
    // 显示成功
    showSuccess('OPERATION_COMPLETED', { name: args[0] });
    
  } catch (error) {
    // 显示错误
    showError('OPERATION_FAILED', { reason: error.message });
  }
}
```

### 自定义消息

```javascript
import { ERROR_MESSAGES } from './utils/messages.js';

// 扩展错误消息
ERROR_MESSAGES.CUSTOM_ERROR = '自定义错误: {detail}';

// 使用
ERROR_MESSAGES.format('CUSTOM_ERROR', { detail: '详细描述' });
```

## 改进效果

### 用户体验提升

| 方面 | 优化前 | 优化后 |
|------|--------|--------|
| 错误信息 | 简单、模糊 | 详细、有上下文 |
| 帮助信息 | 基本列表 | 结构化、有示例 |
| 成功反馈 | 简单文本 | 图标 + 详细信息 |
| 警告提示 | 无 | 明确的警告和建议 |
| 命令提示 | 无 | 智能提示 |

### 学习曲线

- **新手**: 通过示例和提示快速上手
- **进阶用户**: 通过详细帮助掌握高级功能
- **专家用户**: 通过简洁的输出提高效率

### 一致性

- 所有命令使用统一的格式
- 错误消息遵循相同的模式
- 成功消息提供一致的反馈

## API 参考

### 导出函数

```javascript
// 显示命令帮助
showCommandHelp(command)

// 显示所有命令
showAllCommands()

// 显示错误
showError(errorCode, context)

// 显示成功
showSuccess(messageCode, context)

// 显示警告
showWarning(messageCode, context)

// 显示信息
showInfo(messageCode, context)

// 格式化列表
formatList(items, options)

// 格式化表格
formatTable(headers, rows, options)
```

### 消息对象

```javascript
// 命令帮助
COMMAND_HELP[command]

// 错误消息
ERROR_MESSAGES[errorCode]

// 成功消息
SUCCESS_MESSAGES[messageCode]

// 警告消息
WARNING_MESSAGES[messageCode]

// 信息消息
INFO_MESSAGES[messageCode]
```

## 最佳实践

### 1. 始终提供上下文

```javascript
// 好的
showError('FILE_NOT_FOUND', { file: 'test.js' });

// 不好的
console.log('File not found');
```

### 2. 提供可操作的建议

```javascript
// 好的
showError('SESSION_NOT_FOUND', { name: 'test' });
console.log('💡 使用 /session list 查看可用会话');

// 不好的
console.log('Session not found');
```

### 3. 使用一致的格式

```javascript
// 所有错误都以 ❌ 开头
// 所有成功都以 ✅ 开头
// 所有警告都以 ⚠️ 开头
// 所有信息都有相关图标
```

### 4. 提供多个示例

```javascript
// 好的
examples: [
  '/session list',
  '/session use 1',
  '/session new feature-x',
  '/session search API'
]
```

## 测试

```bash
npm test -- messages
```

测试覆盖：
- ✅ 命令帮助结构
- ✅ 错误消息格式化
- ✅ 成功消息格式化
- ✅ 列表格式化
- ✅ 表格格式化
- ✅ 表情符号支持

## 未来改进

### 计划中的功能

- [ ] 多语言支持（英文/中文切换）
- [ ] 主题定制（颜色/图标）
- [ ] 命令自动补全
- [ ] 交互式教程
- [ ] 常见问题解答

### 用户反馈

欢迎提出改进建议！请在 GitHub Issues 中反馈。

## 总结

本次改进大幅提升了用户体验：

1. ✅ 统一的消息系统
2. ✅ 详细的命令帮助
3. ✅ 友好的错误提示
4. ✅ 明确的成功反馈
5. ✅ 结构化的输出格式
6. ✅ 智能的上下文提示

所有改进都遵循一致的设计原则，确保用户体验的连贯性。
