# 分支系统文档

## 概述

分支系统是 xzChat 的一个强大功能，允许你在不同的对话路径中探索问题，创建实验性的对话分支，并在需要时合并分支。

## 核心概念

### 分支（Branch）
分支是一个独立的对话副本，从主会话或另一个分支的某个点开始。每个分支都有自己的消息历史，可以独立发展。

### 分支点（Branch Point）
创建分支时，你会指定一个消息索引，这称为分支点。分支包含从起点到分支点的所有消息。

### 分支树（Branch Tree）
分支可以形成树状结构，一个分支可以有多个子分支。这允许你并行探索多个解决方案。

## 使用场景

1. **探索不同实现方案**
   - 想尝试用不同的技术栈实现同一个功能
   - 创建多个分支，每个分支探索一种方案

2. **实验性对话**
   - 想测试不同的提示词效果
   - 在分支中尝试，不影响主对话

3. **多路径问题解决**
   - 复杂问题可能有多种解决路径
   - 每个分支尝试一条路径

4. **回溯和对比**
   - 发现之前的对话方向有问题
   - 回到之前的点创建新分支

## 命令参考

### 创建分支
```bash
/branch create <描述>
```

示例：
```bash
/branch create 尝试使用 TypeScript 重构
/branch create 探索 GraphQL 方案
```

### 列出分支
```bash
/branch list
```

显示所有分支及其信息。

### 切换分支
```bash
/branch switch <分支ID>
```

切换到指定分支，加载该分支的消息历史。

### 删除分支
```bash
/branch delete <分支ID>
```

删除指定分支及其所有子分支。

### 比较分支
```bash
/branch compare <分支1> <分支2>
```

比较两个分支的差异，显示从哪条消息开始不同。

### 合并分支
```bash
/branch merge <源分支> <目标分支> [模式]
```

合并模式：
- `replace` - 用源分支完全替换目标分支
- `append` - 将源分支的新消息追加到目标分支
- `interactive` - 交互式合并（需要主程序支持）

### 显示分支树
```bash
/branch tree
```

以树状结构显示所有分支及其关系。

### 清理孤立分支
```bash
/branch cleanup
```

清理没有父分支引用的孤立分支。

## 工作流示例

### 场景 1: 探索不同方案

```
1. 主对话中讨论实现一个功能
   用户: 帮我实现用户认证功能
   AI: 好的，我建议使用 JWT token...

2. 创建分支探索 OAuth 方案
   /branch create 尝试 OAuth 2.0 认证

3. 在分支中继续讨论
   用户: 实现 OAuth 2.0 流程
   AI: OAuth 2.0 包括授权码模式...

4. 切换回主分支
   /branch list  # 查看主分支 ID
   /branch switch main-session-id

5. 创建另一个分支探索 Session 方案
   /branch create 尝试 Session Cookie 认证

6. 比较两个方案分支
   /branch compare branch_oauth branch_session

7. 选择最佳方案合并到主分支
   /branch merge branch_oauth main-session-id
```

### 场景 2: 回溯和修正

```
1. 进行了多轮对话，发现方向不对
   用户: 实现功能 A
   AI: ...
   用户: 再加上功能 B
   AI: ...
   用户: 等等，这个方向有问题

2. 回到之前的点创建新分支
   /branch create 重新设计方案

3. 在新分支中正确地重新讨论
   用户: 让我重新描述需求...
```

### 场景 3: 多路径并行探索

```
1. 主对话讨论一个复杂问题
   用户: 如何优化这个查询性能？

2. 创建多个分支尝试不同方案
   /branch create 方案1: 添加索引
   /branch switch branch_xxx  # 切换到新分支
   
   # 在分支1中讨论
   用户: 添加数据库索引
   
   # 切换回主分支，创建分支2
   /branch switch main
   /branch create 方案2: 使用缓存
   
   # 在分支2中讨论
   用户: 实现 Redis 缓存
   
   # 创建分支3
   /branch create 方案3: 优化查询语句

3. 比较各方案的效果
   /branch compare branch_1 branch_2
   /branch compare branch_2 branch_3

4. 选择最优方案
   /branch merge branch_2 main
```

## API 参考

### createBranchPoint(sessionId, messageIndex, description)
创建一个新的分支点。

- `sessionId`: 源会话 ID
- `messageIndex`: 分支点的消息索引
- `description`: 分支描述

返回分支 ID。

### saveBranchMessages(branchId, messages)
保存消息到分支。

- `branchId`: 分支 ID
- `messages`: 消息数组

### loadBranchMessages(branchId)
加载分支的消息。

- `branchId`: 分支 ID

返回消息数组。

### getBranchInfo(branchId)
获取分支信息。

- `branchId`: 分支 ID

返回分支信息对象。

### listBranches(sessionId)
列出所有分支或指定会话的分支。

- `sessionId`: 可选，会话 ID

返回分支信息数组。

### deleteBranch(branchId)
删除分支及其子分支。

- `branchId`: 分支 ID

### compareBranches(branchId1, branchId2)
比较两个分支的差异。

- `branchId1`: 第一个分支 ID
- `branchId2`: 第二个分支 ID

返回比较结果对象。

### mergeBranches(sourceBranchId, targetBranchId, mode)
合并两个分支。

- `sourceBranchId`: 源分支 ID
- `targetBranchId`: 目标分支 ID
- `mode`: 合并模式（'replace'/'append'/'interactive'）

返回合并结果。

### exportBranchTree(sessionId)
导出分支树结构。

- `sessionId`: 可选，会话 ID

返回分支树数组。

### formatBranchTree(roots, maxDepth)
格式化分支树为可读文本。

- `roots`: 分支树数组
- `maxDepth`: 最大深度

返回格式化的字符串。

### cleanupOrphanedBranches()
清理孤立分支。

返回清理结果。

## 最佳实践

1. **清晰的命名**
   - 为每个分支提供清晰的描述
   - 例如："尝试 React 而非 Vue"、"添加错误处理"

2. **及时清理**
   - 不需要的分支及时删除
   - 使用 `/branch cleanup` 清理孤立分支

3. **合理使用合并**
   - 确认分支内容后再合并
   - 合并前使用 `/branch compare` 对比差异

4. **分支树管理**
   - 避免创建过深的分支树
   - 定期使用 `/branch tree` 查看结构

5. **备份重要分支**
   - 重要的实验分支考虑导出保存
   - 可以手动复制 `.branches/` 目录中的文件

## 注意事项

1. **分支与主会话的独立性**
   - 分支创建时是主会话的副本
   - 创建后分支独立发展，不会自动同步

2. **合并不可逆**
   - 合并操作会覆盖目标分支
   - 建议合并前先备份

3. **删除的影响**
   - 删除父分支会同时删除所有子分支
   - 确认子分支不需要后再删除

4. **存储空间**
   - 分支数据存储在 `.branches/` 目录
   - 长期使用会占用一定空间，定期清理

## 集成到 CLI

分支系统提供了完整的命令处理模块，可以通过 `/branch` 命令使用。要在 CLI 中完全集成，需要在 `bin/cli.js` 中添加以下内容：

```javascript
import { handleBranchCommand } from '../lib/commands/branch.js';
import { loadBranchMessages, saveBranchMessages } from '../lib/utils/branch-manager.js';

// 在 handleSlashCommand 中添加
case '/branch':
  const result = await handleBranchCommand(args.slice(1), currentSessionId, messages);
  console.log(result);
  break;
```

详细集成示例请参考 `examples/branch-usage.js`。

## 故障排查

### 分支创建失败
- 确保当前会话有消息
- 检查 `.branches/` 目录是否可写

### 分支加载失败
- 确认分支 ID 正确
- 检查分支文件是否损坏

### 合并失败
- 确认两个分支都存在
- 检查合并模式是否正确

### 孤立分支
- 使用 `/branch cleanup` 清理
- 检查是否有父分支被删除

## 未来改进

- [ ] 交互式合并界面
- [ ] 分支标签和分类
- [ ] 分支导出为独立会话
- [ ] 分支冲突检测和解决
- [ ] 分支可视化图表
- [ ] 分支模板和预设
