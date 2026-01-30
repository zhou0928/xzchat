# xzChat API 参考文档

## 概述

本文档提供了 xzChat 所有公开 API 的详细参考。所有 API 都使用 ES Module 导出。

## 目录

- [聊天模块](#聊天模块-libchatjs)
- [配置模块](#配置模块-libconfigjs)
- [工具模块](#工具模块-libtoolsjs)
- [RAG 模块](#rag-模块-libragjs)
- [会话管理](#会话管理-libutilssession-managerjs)
- [分支管理](#分支管理-libutilsbranch-managerjs)
- [缓存系统](#缓存系统-libutilscachejs)
- [成本追踪](#成本追踪-libutilscost-trackerjs)
- [日志系统](#日志系统-libutilsloggerjs)
- [安全模块](#安全模块-libutilssecurityjs)
- [错误处理](#错误处理-libutilserrorsjs)
- [输入验证](#输入验证-libutilsvalidationjs)

---

## 聊天模块 (`lib/chat.js`)

### `chatStream(config, messages, options)`

发送聊天请求并流式返回响应。

**参数:**
- `config` (Object): 配置对象
  - `apiKey` (string): API Key
  - `baseUrl` (string): API 基础 URL
  - `model` (string): 模型名称
- `messages` (Array): 消息数组
- `options` (Object, 可选): 额外选项

**返回:** Promise<AsyncGenerator>

### `generateCompletion(config, messages, options)`

生成完整的聊天回复。

### `fetchModels(config)`

获取可用模型列表。

---

## 配置模块 (`lib/config.js`)

### `loadConfig()`

加载配置文件。

### `updateConfig(key, value)`

更新配置值。

### `getActiveConfig()`

获取当前激活的配置。

---

## 工具模块 (`lib/tools.js`)

### `builtInTools`

内置工具函数对象，包含:
- `read_file(args)` - 读取文件
- `write_file(args)` - 写入文件
- `edit_file(args)` - 编辑文件
- `run_command(args, context)` - 执行命令
- `search_files(args)` - 搜索文件

---

## RAG 模块 (`lib/rag.js`)

### `indexCodebase(dir, config, options)`

为代码库建立索引（支持并行处理）。

**参数:**
- `dir` (string): 目标目录
- `config` (Object): 配置对象
  - `apiKey` (string): API Key
  - `baseUrl` (string): API 基础 URL
  - `embeddingModel` (string): 嵌入模型
- `options` (Object, 可选): 索引选项
  - `concurrency` (number): 并发数，默认 3
  - `showProgress` (boolean): 是否显示进度，默认 true

**返回:** Promise<number> - 索引的块数量

**特性:**
- 并发文件处理
- 嵌入向量缓存
- 智能重试机制
- 速率限制处理

### `searchCodebase(query, dir, config, options)`

在代码库中搜索。

**参数:**
- `query` (string): 查询文本
- `dir` (string): 索引目录
- `config` (Object): 配置对象
- `options` (Object, 可选): 搜索选项
  - `topK` (number): 返回结果数，默认 5
  - `useCache` (boolean): 是否使用缓存，默认 true

**返回:** Promise<Array> - 搜索结果数组

### `loadIndex(dir)`

加载索引文件。

### `clearRAGCache()`

清除 RAG 相关缓存。

### `getRAGStats()`

获取 RAG 统计信息。

---

## 会话管理 (`lib/utils/session-manager.js`)

### `SessionManager`

会话管理器类。

**方法:**
- `saveSession(messages, sessionId)` - 保存会话
- `loadSession(sessionId)` - 加载会话
- `listSessions()` - 列出所有会话
- `deleteSession(sessionId)` - 删除会话
- `exportSession(sessionId, format)` - 导出会话
- `searchSessions(keyword)` - 搜索会话

---

## 分支管理 (`lib/utils/branch-manager.js`)

**函数:**
- `createBranchPoint(sessionId, messageIndex, description)` - 创建分支
- `saveBranchMessages(branchId, messages)` - 保存分支消息
- `loadBranchMessages(branchId)` - 加载分支消息
- `listBranches(sessionId)` - 列出分支
- `compareBranches(branchId1, branchId2)` - 比较分支
- `mergeBranches(sourceBranchId, targetBranchId, mode)` - 合并分支
- `deleteBranch(branchId)` - 删除分支
- `exportBranchTree(sessionId)` - 导出分支树

---

## 缓存系统 (`lib/utils/cache.js`)

### `SimpleCache`

简单缓存类。

**方法:**
- `get(key)` - 获取缓存
- `set(key, value, customTtl)` - 设置缓存
- `has(key)` - 检查缓存是否存在
- `delete(key)` - 删除缓存
- `clear()` - 清空所有缓存
- `getStats()` - 获取统计信息

**预定义实例:**
- `modelsCache` - 模型列表缓存 (5分钟)
- `embeddingCache` - 嵌入缓存 (1小时)
- `tokenCache` - Token 缓存 (10分钟)
- `ragIndexCache` - RAG 索引缓存 (30分钟)

---

## 成本追踪 (`lib/utils/cost-tracker.js`)

### `CostTracker`

成本追踪器类。

**方法:**
- `addUsage(inputTokens, outputTokens, model)` - 添加使用量
- `getCurrentCost(model)` - 获取当前成本
- `getAllSessions()` - 获取所有会话统计
- `getDailyStats()` - 获取每日统计
- `getModelStats()` - 获取按模型分组统计
- `exportToCSV(filename)` - 导出为 CSV
- `clearAll()` - 清空所有统计

**工具函数:**
- `getCostTracker(sessionId)` - 获取追踪器实例
- `estimateTokens(text)` - 估算 token 数
- `estimateMessagesTokens(messages)` - 估算消息 token 数

---

## 日志系统 (`lib/utils/logger.js`)

**日志级别:**
- `DEBUG` - 调试信息
- `INFO` - 一般信息
- `WARN` - 警告信息
- `ERROR` - 错误信息

**方法:**
- `logger.debug(message, data)` - 调试日志
- `logger.info(message, data)` - 信息日志
- `logger.warn(message, data)` - 警告日志
- `logger.error(message, error)` - 错误日志

---

## 安全模块 (`lib/utils/security.js`)

**函数:**
- `validatePath(filepath)` - 验证文件路径
- `validateCommand(cmd)` - 验证命令
- `isSensitiveFile(filepath)` - 检查是否为敏感文件
- `sanitizePath(filepath)` - 清理文件路径
- `filterSensitiveInfo(text)` - 过滤敏感信息

---

## 错误处理 (`lib/utils/errors.js`)

**错误类:**
- `ValidationError` - 验证错误
- `NetworkError` - 网络错误
- `ConfigError` - 配置错误
- `TimeoutError` - 超时错误

---

## 输入验证 (`lib/utils/validation.js`)

**函数:**
- `validateFilePath(filePath, options)` - 验证文件路径
- `validateModelName(modelName)` - 验证模型名称
- `validateApiKey(apiKey)` - 验证 API Key
- `validateUrl(url, options)` - 验证 URL
- `validateBranchId(branchId)` - 验证分支 ID
- `validateSessionId(sessionId)` - 验证会话 ID
- `validateUserInput(text, options)` - 验证用户输入
- `validateCommandArgs(args, schema)` - 验证命令参数
- `sanitizeInput(text, options)` - 清理输入
- `validateJson(jsonString)` - 验证 JSON

---

## 使用示例

### 基本聊天

```javascript
import { generateCompletion } from './lib/chat.js';
import { getActiveConfig } from './lib/config.js';

const config = getActiveConfig();
const messages = [
  { role: 'user', content: '你好！' }
];

const response = await generateCompletion(config, messages);
console.log(response);
```

### 使用缓存

```javascript
import { modelsCache, withCacheAsync } from './lib/utils/cache.js';
import { fetchModels } from './lib/chat.js';
import { getActiveConfig } from './lib/config.js';

const config = getActiveConfig();
const models = await withCacheAsync(
  modelsCache,
  'models',
  () => fetchModels(config),
  300000 // 5分钟
);
console.log(models);
```

### 成本追踪

```javascript
import { getCostTracker, estimateTokens } from './lib/utils/cost-tracker.js';

const tracker = getCostTracker('session-123');

// 添加使用量
tracker.addUsage(1000, 500, 'gpt-4');

// 查看当前成本
const cost = tracker.getCurrentCost('gpt-4');
console.log(`当前成本: $${cost}`);

// 查看统计
tracker.printAllStats();

// 导出 CSV
tracker.exportToCSV('my-stats.csv');
```

### 输入验证

```javascript
import { validateApiKey, validateModelName } from './lib/utils/validation.js';

try {
  const apiKey = validateApiKey('sk-xxxxxxxxxxxxxxxx');
  const model = validateModelName('gpt-4');
  console.log('验证通过');
} catch (error) {
  console.error('验证失败:', error.message);
}
```

---

## 类型定义

### Message

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}
```

### Config

```typescript
interface Config {
  apiKey: string;
  baseUrl?: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}
```

### Usage

```typescript
interface Usage {
  input: number;
  output: number;
}
```

---

## 注意事项

1. 所有函数都是异步的（除 SimpleCache 的部分方法）
2. 错误处理使用 try-catch
3. 日志记录由 logger 模块统一管理
4. 敏感信息会自动过滤
5. 所有文件路径都会进行安全验证

---

## 更新日志

### v2.0.0 (当前版本)

- 新增缓存系统
- 新增成本追踪
- 新增输入验证
- 新增分支管理
- 优化错误处理
- 统一日志系统

---

## 许可证

MIT License
