# xzChat API 完整指南

## 概述

本指南提供了 xzChat 的完整 API 参考、实用示例和最佳实践。所有 API 都使用 ES Module 导出,支持 TypeScript 类型定义。

## 目录

- [快速开始](#快速开始)
- [核心模块](#核心模块)
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
  - [连接池管理](#连接池管理-libutilsconnection-pooljs)
  - [进度条](#进度条-libutilsprogressjs)
  - [文件加载器](#文件加载器-libutilsfile-loaderjs)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)
- [完整示例](#完整示例)

---

## 快速开始

### 基础设置

```javascript
// 导入核心模块
import { chatStream, generateCompletion } from './lib/chat.js';
import { loadConfig, updateConfig } from './lib/config.js';
import { logger } from './lib/utils/logger.js';

// 加载配置
const config = await loadConfig();
```

### 第一个聊天请求

```javascript
import { generateCompletion } from './lib/chat.js';

const config = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
};

const messages = [
  { role: 'user', content: 'Hello, xzChat!' }
];

const response = await generateCompletion(config, messages);
console.log(response.choices[0].message.content);
```

---

## 核心模块

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
  - `temperature` (number): 温度参数, 0-2
  - `maxTokens` (number): 最大 token 数
  - `topP` (number): Top P 采样
  - `frequencyPenalty` (number): 频率惩罚
  - `presencePenalty` (number): 存在惩罚
  - `timeout` (number): 请求超时时间(毫秒)

**返回:** Promise<AsyncGenerator>

**示例:**

```javascript
import { chatStream } from './lib/chat.js';

const config = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
};

const messages = [
  { role: 'system', content: '你是一个有帮助的助手。' },
  { role: 'user', content: '请介绍一下你自己。' }
];

const options = {
  temperature: 0.7,
  maxTokens: 1000,
  timeout: 30000
};

try {
  const stream = await chatStream(config, messages, options);
  let fullResponse = '';

  for await (const chunk of stream) {
    if (chunk.choices && chunk.choices[0]?.delta?.content) {
      const content = chunk.choices[0].delta.content;
      fullResponse += content;
      process.stdout.write(content);
    }
  }

  console.log('\n完整响应:', fullResponse);
} catch (error) {
  console.error('聊天失败:', error.message);
}
```

### `generateCompletion(config, messages, options)`

生成完整的聊天回复。

**参数:** 同 `chatStream`

**返回:** Promise<Object> - OpenAI API 响应对象

**示例:**

```javascript
import { generateCompletion } from './lib/chat.js';

const config = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
};

const messages = [
  { role: 'user', content: '解释什么是递归?' }
];

try {
  const response = await generateCompletion(config, messages, {
    temperature: 0.5
  });

  console.log(response.choices[0].message.content);
  console.log('使用的 tokens:', response.usage.total_tokens);
} catch (error) {
  console.error('生成失败:', error.message);
}
```

### `fetchModels(config)`

获取可用模型列表。

**参数:**
- `config` (Object): 配置对象

**返回:** Promise<Array<Object>> - 模型列表

**示例:**

```javascript
import { fetchModels } from './lib/chat.js';

try {
  const models = await fetchModels(config);
  console.log('可用模型:');
  models.forEach(model => {
    console.log(`- ${model.id}`);
  });
} catch (error) {
  console.error('获取模型失败:', error.message);
}
```

---

## 配置模块 (`lib/config.js`)

### `loadConfig(profile)`

加载配置文件。

**参数:**
- `profile` (string, 可选): Profile 名称

**返回:** Promise<Object> - 配置对象

**示例:**

```javascript
import { loadConfig } from './lib/config.js';

// 加载默认配置
const config = await loadConfig();
console.log('API Base URL:', config.baseUrl);

// 加载指定 Profile
const workConfig = await loadConfig('work');
console.log('工作环境模型:', workConfig.model);
```

### `updateConfig(key, value, profile)`

更新配置值。

**参数:**
- `key` (string): 配置键
- `value` (any): 配置值
- `profile` (string, 可选): Profile 名称

**返回:** Promise<void>

**示例:**

```javascript
import { updateConfig } from './lib/config.js';

// 更新单个配置
await updateConfig('model', 'gpt-4-turbo');

// 更新嵌套配置
await updateConfig('temperature', 0.8);

// 更新指定 Profile
await updateConfig('apiKey', 'new-key', 'work');

// 批量更新
const updates = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
};

for (const [key, value] of Object.entries(updates)) {
  await updateConfig(key, value);
}
```

### `getActiveConfig(profile)`

获取当前激活的配置。

**参数:**
- `profile` (string, 可选): Profile 名称

**返回:** Object - 配置对象

**示例:**

```javascript
import { getActiveConfig } from './lib/config.js';

// 获取当前配置
const config = getActiveConfig();

// 获取指定 Profile 的配置
const workConfig = getActiveConfig('work');

// 检查配置是否有效
if (!config.apiKey) {
  throw new Error('API Key 未配置');
}
```

---

## 工具模块 (`lib/tools.js`)

### `builtInTools`

内置工具函数对象,包含完整的工具定义和实现。

**可用工具:**
- `read_file` - 读取文件内容
- `write_file` - 写入文件内容
- `edit_file` - 编辑文件(使用 old_string/new_string)
- `run_command` - 执行 shell 命令
- `search_files` - 搜索文件内容
- `list_files` - 列出目录文件

**示例:**

```javascript
import { builtInTools } from './lib/tools.js';

// 读取文件
const result = await builtInTools.read_file({
  filePath: './package.json'
});
console.log(result.content);

// 写入文件
await builtInTools.write_file({
  filePath: './test.txt',
  content: 'Hello, xzChat!'
});

// 执行命令
const cmdResult = await builtInTools.run_command(
  { command: 'npm test' },
  { cwd: process.cwd() }
);
console.log(cmdResult.stdout);
```

### `createTool(definition, handler)`

创建自定义工具。

**参数:**
- `definition` (Object): 工具定义
  - `name` (string): 工具名称
  - `description` (string): 工具描述
  - `inputSchema` (Object): 输入参数 Schema
- `handler` (Function): 工具处理函数

**返回:** Object - 工具对象

**示例:**

```javascript
import { createTool } from './lib/tools.js';

const weatherTool = createTool({
  name: 'get_weather',
  description: '获取指定城市的天气信息',
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '城市名称'
      }
    },
    required: ['city']
  }
}, async (args) => {
  // 实现天气查询逻辑
  const response = await fetch(
    `https://api.weather.com/v1/weather?q=${args.city}`
  );
  const data = await response.json();
  
  return {
    city: args.city,
    temperature: data.temp,
    condition: data.condition
  };
});

// 使用工具
const result = await weatherTool.handler({ city: 'Beijing' });
console.log(result);
```

---

## RAG 模块 (`lib/rag.js`)

### `indexCodebase(dir, config, options)`

为代码库建立索引(支持并行处理)。

**参数:**
- `dir` (string): 目标目录
- `config` (Object): 配置对象
  - `apiKey` (string): API Key
  - `baseUrl` (string): API 基础 URL
  - `embeddingModel` (string): 嵌入模型
- `options` (Object, 可选): 索引选项
  - `concurrency` (number): 并发数,默认 3
  - `showProgress` (boolean): 是否显示进度,默认 true
  - `chunkSize` (number): 块大小,默认 500
  - `chunkOverlap` (number): 块重叠,默认 50

**返回:** Promise<number> - 索引的块数量

**示例:**

```javascript
import { indexCodebase } from './lib/rag.js';

const config = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1',
  embeddingModel: 'text-embedding-ada-002'
};

try {
  const chunkCount = await indexCodebase('./src', config, {
    concurrency: 5,
    showProgress: true,
    chunkSize: 800,
    chunkOverlap: 100
  });

  console.log(`索引完成,共 ${chunkCount} 个块`);
} catch (error) {
  console.error('索引失败:', error.message);
}
```

### `searchCodebase(query, config, options)`

在代码库中搜索相关代码。

**参数:**
- `query` (string): 搜索查询
- `config` (Object): 配置对象
- `options` (Object, 可选): 搜索选项
  - `topK` (number): 返回结果数,默认 5
  - `filter` (Object): 过滤条件

**返回:** Promise<Array<Object>> - 搜索结果

**示例:**

```javascript
import { searchCodebase } from './lib/rag.js';

try {
  const results = await searchCodebase(
    '用户认证逻辑',
    config,
    { topK: 10 }
  );

  results.forEach((result, index) => {
    console.log(`\n结果 ${index + 1}:`);
    console.log(`文件: ${result.filepath}`);
    console.log(`内容: ${result.content}`);
    console.log(`相似度: ${result.score}`);
  });
} catch (error) {
  console.error('搜索失败:', error.message);
}
```

---

## 会话管理 (`lib/utils/session-manager.js`)

### `SessionManager`

会话管理器类,负责会话的创建、加载、保存和切换。

**构造函数:**
```javascript
const sessionManager = new SessionManager(options);
```

**参数:**
- `options` (Object):
  - `historyDir` (string): 历史记录目录
  - `autoSave` (boolean): 是否自动保存,默认 true

**方法:**

#### `createSession(name, metadata)`

创建新会话。

**参数:**
- `name` (string): 会话名称
- `metadata` (Object, 可选): 元数据

**返回:** Session - 会话对象

**示例:**

```javascript
import { SessionManager } from './lib/utils/session-manager.js';

const manager = new SessionManager({ historyDir: './.newapi-chat' });

// 创建新会话
const session = await manager.createSession('my-session', {
  description: '项目开发会话',
  tags: ['development', 'backend']
});

console.log('会话 ID:', session.id);
```

#### `switchSession(sessionId)`

切换到指定会话。

**参数:**
- `sessionId` (string): 会话 ID

**返回:** Session - 当前会话对象

**示例:**

```javascript
// 切换会话
const currentSession = await manager.switchSession('session-123');
console.log('当前会话:', currentSession.name);
```

#### `listSessions(options)`

列出所有会话。

**参数:**
- `options` (Object, 可选):
  - `filter` (Function): 过滤函数
  - `sort` (string): 排序字段

**返回:** Array<Session> - 会话列表

**示例:**

```javascript
// 列出所有会话
const sessions = await manager.listSessions();
sessions.forEach(session => {
  console.log(`${session.name} (${session.id})`);
});

// 列出包含特定标签的会话
const devSessions = await manager.listSessions({
  filter: s => s.tags?.includes('development')
});

// 按创建时间排序
const recentSessions = await manager.listSessions({
  sort: 'createdAt'
});
```

#### `saveHistory(messages, sessionId)`

保存消息历史。

**参数:**
- `messages` (Array): 消息数组
- `sessionId` (string, 可选): 会话 ID

**返回:** Promise<void>

**示例:**

```javascript
const messages = [
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好! 有什么可以帮你的吗?' }
];

await manager.saveHistory(messages);
console.log('历史记录已保存');
```

#### `loadHistory(sessionId)`

加载消息历史。

**参数:**
- `sessionId` (string, 可选): 会话 ID

**返回:** Promise<Array<Object>> - 消息数组

**示例:**

```javascript
const history = await manager.loadHistory();
console.log(`加载了 ${history.length} 条消息`);

history.forEach((msg, index) => {
  console.log(`\n[消息 ${index + 1}] ${msg.role}:`);
  console.log(msg.content);
});
```

---

## 分支管理 (`lib/utils/branch-manager.js`)

### `BranchManager`

分支管理器,支持从任意消息点创建对话分支。

**构造函数:**
```javascript
const branchManager = new BranchManager(sessionManager);
```

**方法:**

#### `createBranch(messageIndex, name)`

创建分支。

**参数:**
- `messageIndex` (number): 消息索引
- `name` (string, 可选): 分支名称

**返回:** Branch - 分支对象

**示例:**

```javascript
import { BranchManager } from './lib/utils/branch-manager.js';
import { SessionManager } from './lib/utils/session-manager.js';

const sessionManager = new SessionManager();
const branchManager = new BranchManager(sessionManager);

// 在第 3 条消息处创建分支
const branch = await branchManager.createBranch(2, 'alternative-solution');
console.log('分支 ID:', branch.id);
```

#### `listBranches()`

列出所有分支。

**返回:** Array<Branch> - 分支列表

**示例:**

```javascript
const branches = await branchManager.listBranches();
branches.forEach(branch => {
  console.log(`${branch.name} - ${branch.createdAt}`);
});
```

#### `switchBranch(branchId)`

切换分支。

**参数:**
- `branchId` (string): 分支 ID

**返回:** Branch - 当前分支对象

**示例:**

```javascript
const branch = await branchManager.switchBranch('branch-123');
console.log('切换到分支:', branch.name);
```

#### `mergeBranch(sourceBranchId)`

合并分支。

**参数:**
- `sourceBranchId` (string): 源分支 ID

**返回:** Promise<void>

**示例:**

```javascript
await branchManager.mergeBranch('branch-123');
console.log('分支已合并');
```

---

## 缓存系统 (`lib/utils/cache.js`)

### `Cache`

缓存类,支持内存缓存和持久化缓存。

**构造函数:**
```javascript
const cache = new Cache(options);
```

**参数:**
- `options` (Object, 可选):
  - `ttl` (number): 生存时间(毫秒)
  - `persistent` (boolean): 是否持久化
  - `storagePath` (string): 存储路径

**方法:**

#### `set(key, value, ttl)`

设置缓存。

**参数:**
- `key` (string): 键
- `value` (any): 值
- `ttl` (number, 可选): 生存时间

**返回:** void

**示例:**

```javascript
import { Cache } from './lib/utils/cache.js';

// 创建缓存实例
const cache = new Cache({
  ttl: 3600000, // 1 小时
  persistent: true,
  storagePath: './.cache'
});

// 设置缓存
cache.set('user:123', { name: 'Alice', age: 30 });

// 设置带过期时间的缓存
cache.set('temp:123', { data: 'temporary' }, 60000); // 1 分钟
```

#### `get(key)`

获取缓存。

**参数:**
- `key` (string): 键

**返回:** any | undefined - 缓存值或 undefined

**示例:**

```javascript
const user = cache.get('user:123');
if (user) {
  console.log('缓存命中:', user);
} else {
  console.log('缓存未命中');
}
```

#### `delete(key)`

删除缓存。

**参数:**
- `key` (string): 键

**返回:** void

**示例:**

```javascript
cache.delete('user:123');
console.log('缓存已删除');
```

#### `clear()`

清空所有缓存。

**返回:** void

**示例:**

```javascript
cache.clear();
console.log('所有缓存已清空');
```

#### `has(key)`

检查缓存是否存在。

**参数:**
- `key` (string): 键

**返回:** boolean

**示例:**

```javascript
if (cache.has('user:123')) {
  console.log('缓存存在');
}
```

---

## 成本追踪 (`lib/utils/cost-tracker.js`)

### `CostTracker`

成本追踪器,记录 API 使用的 token 和成本。

**方法:**

#### `trackUsage(model, inputTokens, outputTokens)`

记录使用情况。

**参数:**
- `model` (string): 模型名称
- `inputTokens` (number): 输入 token 数
- `outputTokens` (number): 输出 token 数

**返回:** number - 累计成本

**示例:**

```javascript
import { CostTracker } from './lib/utils/cost-tracker.js';

const tracker = new CostTracker();

// 记录使用情况
const cost = tracker.trackUsage('gpt-4', 1000, 500);
console.log('累计成本:', cost);
```

#### `getStats()`

获取统计信息。

**返回:** Object - 统计对象

**示例:**

```javascript
const stats = tracker.getStats();
console.log('总请求数:', stats.totalRequests);
console.log('总 token 数:', stats.totalTokens);
console.log('总成本:', stats.totalCost);
console.log('按模型统计:', stats.byModel);
```

#### `reset()`

重置统计。

**返回:** void

**示例:**

```javascript
tracker.reset();
console.log('统计已重置');
```

---

## 日志系统 (`lib/utils/logger.js`)

### `logger`

全局日志实例。

**方法:**

#### `debug(message, meta)`

输出 DEBUG 级别日志。

**参数:**
- `message` (string): 日志消息
- `meta` (Object, 可选): 元数据

**示例:**

```javascript
import { logger } from './lib/utils/logger.js';

logger.debug('调试信息', { userId: 123, action: 'login' });
```

#### `info(message, meta)`

输出 INFO 级别日志。

**示例:**

```javascript
logger.info('用户登录', { userId: 123 });
```

#### `warn(message, meta)`

输出 WARN 级别日志。

**示例:**

```javascript
logger.warn('API 响应缓慢', { responseTime: 5000 });
```

#### `error(message, meta)`

输出 ERROR 级别日志。

**示例:**

```javascript
logger.error('API 请求失败', { error: 'Timeout', statusCode: 504 });
```

#### `setLevel(level)`

设置日志级别。

**参数:**
- `level` (string): 日志级别 (debug, info, warn, error)

**示例:**

```javascript
logger.setLevel('debug'); // 输出所有级别日志
logger.setLevel('error'); // 只输出错误日志
```

---

## 安全模块 (`lib/utils/security.js`)

### `sanitizeInput(input)`

清理输入,防止注入攻击。

**参数:**
- `input` (string): 输入字符串

**返回:** string - 清理后的字符串

**示例:**

```javascript
import { sanitizeInput } from './lib/utils/security.js';

const userInput = '<script>alert("XSS")</script>';
const cleanInput = sanitizeInput(userInput);
console.log(cleanInput); // &lt;script&gt;alert("XSS")&lt;/script&gt;
```

### `validatePath(path)`

验证路径,防止路径遍历攻击。

**参数:**
- `path` (string): 路径字符串

**返回:** boolean - 是否安全

**示例:**

```javascript
import { validatePath } from './lib/utils/security.js';

const safePath = validatePath('./src/file.js'); // true
const unsafePath = validatePath('../../../etc/passwd'); // false

console.log(safePath, unsafePath);
```

### `detectSensitiveInfo(text)`

检测敏感信息。

**参数:**
- `text` (string): 待检测文本

**返回:** Array<Object> - 敏感信息列表

**示例:**

```javascript
import { detectSensitiveInfo } from './lib/utils/security.js';

const text = '我的 API Key 是 sk-1234567890abcdef';
const sensitive = detectSensitiveInfo(text);

sensitive.forEach(item => {
  console.log(`检测到敏感信息: ${item.type}`);
  console.log(`位置: ${item.start} - ${item.end}`);
});
```

---

## 错误处理 (`lib/utils/errors.js`)

### 自定义错误类

#### `XZChatError`

基础错误类。

```javascript
import { XZChatError } from './lib/utils/errors.js';

throw new XZChatError('操作失败');
```

#### `ConfigError`

配置错误。

```javascript
import { ConfigError } from './lib/utils/errors.js';

throw new ConfigError('API Key 未配置', { field: 'apiKey' });
```

#### `NetworkError`

网络错误。

```javascript
import { NetworkError } from './lib/utils/errors.js';

throw new NetworkError('连接超时', { timeout: 5000 });
```

#### `ValidationError`

验证错误。

```javascript
import { ValidationError } from './lib/utils/errors.js';

throw new ValidationError('无效的模型名称', { field: 'model' });
```

### `isRetryableError(error)`

判断错误是否可重试。

**参数:**
- `error` (Error): 错误对象

**返回:** boolean

**示例:**

```javascript
import { isRetryableError } from './lib/utils/errors.js';

try {
  await makeRequest();
} catch (error) {
  if (isRetryableError(error)) {
    console.log('可重试错误,正在重试...');
    await retryRequest();
  } else {
    console.error('不可重试错误:', error.message);
  }
}
```

---

## 输入验证 (`lib/utils/validation.js`)

### `validateConfig(config)`

验证配置对象。

**参数:**
- `config` (Object): 配置对象

**返回:** Object - 验证结果
- `valid` (boolean): 是否有效
- `errors` (Array): 错误列表

**示例:**

```javascript
import { validateConfig } from './lib/utils/validation.js';

const result = validateConfig({
  apiKey: 'sk-123',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
});

if (!result.valid) {
  console.error('配置无效:', result.errors);
} else {
  console.log('配置有效');
}
```

### `validateMessage(message)`

验证消息对象。

**参数:**
- `message` (Object): 消息对象

**返回:** Object - 验证结果

**示例:**

```javascript
import { validateMessage } from './lib/utils/validation.js';

const result = validateMessage({
  role: 'user',
  content: '你好'
});

console.log(result.valid); // true
```

---

## 连接池管理 (`lib/utils/connection-pool.js`)

### `ConnectionPool`

连接池管理器,用于管理 API 连接。

**构造函数:**
```javascript
const pool = new ConnectionPool(options);
```

**参数:**
- `options` (Object):
  - `maxConnections` (number): 最大连接数,默认 10
  - `minConnections` (number): 最小连接数,默认 2
  - `idleTimeout` (number): 空闲超时(毫秒),默认 30000
  - `connectionTimeout` (number): 连接超时,默认 10000

**方法:**

#### `use(callback)`

使用连接执行操作。

**参数:**
- `callback` (Function): 回调函数

**返回:** Promise<any> - 回调结果

**示例:**

```javascript
import { ConnectionPool } from './lib/utils/connection-pool.js';

const pool = new ConnectionPool({
  maxConnections: 10,
  minConnections: 2
});

const result = await pool.use(async (connection) => {
  console.log('使用连接:', connection.id);
  // 执行操作
  return '操作结果';
});

console.log(result);
```

#### `getStats()`

获取连接池统计信息。

**返回:** Object - 统计对象

**示例:**

```javascript
const stats = pool.getStats();
console.log('活跃连接:', stats.activeConnections);
console.log('空闲连接:', stats.idleConnections);
console.log('总请求数:', stats.totalRequests);
```

### `ConcurrencyController`

并发控制器,用于控制任务并发数。

**构造函数:**
```javascript
const controller = new ConcurrencyController(options);
```

**参数:**
- `options` (Object):
  - `maxConcurrent` (number): 最大并发数,默认 5

**方法:**

#### `add(task)`

添加任务到队列。

**参数:**
- `task` (Function): 任务函数

**返回:** Promise<any> - 任务结果

**示例:**

```javascript
import { ConcurrencyController } from './lib/utils/connection-pool.js';

const controller = new ConcurrencyController({
  maxConcurrent: 3
});

// 添加任务
const results = await Promise.all([
  controller.add(async () => {
    console.log('任务 1');
    return 'result 1';
  }),
  controller.add(async () => {
    console.log('任务 2');
    return 'result 2';
  }),
  controller.add(async () => {
    console.log('任务 3');
    return 'result 3';
  })
]);

console.log('所有任务完成:', results);
```

---

## 进度条 (`lib/utils/progress.js`)

### `ProgressBar`

进度条类。

**构造函数:**
```javascript
const progress = new ProgressBar(options);
```

**参数:**
- `options` (Object):
  - `total` (number): 总进度
  - `width` (number): 进度条宽度,默认 40
  - `showPercent` (boolean): 显示百分比,默认 true
  - `showETA` (boolean): 显示预计剩余时间,默认 true

**方法:**

#### `update(current)`

更新进度。

**参数:**
- `current` (number): 当前进度

**示例:**

```javascript
import { ProgressBar } from './lib/utils/progress.js';

const progress = new ProgressBar({
  total: 100,
  showPercent: true,
  showETA: true
});

// 模拟任务
for (let i = 0; i <= 100; i++) {
  progress.update(i);
  await new Promise(resolve => setTimeout(resolve, 50));
}

console.log('\n任务完成!');
```

#### `complete(message)`

完成进度。

**参数:**
- `message` (string, 可选): 完成消息

**示例:**

```javascript
progress.complete('所有任务已完成!');
```

---

## 文件加载器 (`lib/utils/file-loader.js`)

### `loadFile(filePath, options)`

加载文件内容。

**参数:**
- `filePath` (string): 文件路径
- `options` (Object, 可选):
  - `encoding` (string): 编码,默认 'utf-8'

**返回:** Promise<string> - 文件内容

**示例:**

```javascript
import { loadFile } from './lib/utils/file-loader.js';

const content = await loadFile('./README.md');
console.log(content);
```

### `loadJSON(filePath)`

加载 JSON 文件。

**参数:**
- `filePath` (string): 文件路径

**返回:** Promise<Object> - JSON 对象

**示例:**

```javascript
import { loadJSON } from './lib/utils/file-loader.js';

const packageJson = await loadJSON('./package.json');
console.log('项目名称:', packageJson.name);
```

### `fileExists(filePath)`

检查文件是否存在。

**参数:**
- `filePath` (string): 文件路径

**返回:** Promise<boolean>

**示例:**

```javascript
import { fileExists } from './lib/utils/file-loader.js';

const exists = await fileExists('./config.json');
console.log('文件存在:', exists);
```

---

## 最佳实践

### 1. 错误处理

始终使用 try-catch 处理异步操作:

```javascript
import { generateCompletion, XZChatError } from './lib/chat.js';
import { logger } from './lib/utils/logger.js';

try {
  const response = await generateCompletion(config, messages);
  console.log(response.choices[0].message.content);
} catch (error) {
  if (error instanceof XZChatError) {
    logger.error('xzChat 错误:', { error: error.message });
  } else {
    logger.error('未知错误:', { error: error.message });
  }
}
```

### 2. 重试机制

对于可重试错误,实现自动重试:

```javascript
import { isRetryableError } from './lib/utils/errors.js';

async function makeRequestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1 || !isRetryableError(error)) {
        throw error;
      }
      
      // 指数退避
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      logger.info(`重试 ${i + 1}/${maxRetries}`);
    }
  }
}
```

### 3. 缓存策略

合理使用缓存减少 API 调用:

```javascript
import { Cache } from './lib/utils/cache.js';

const cache = new Cache({ ttl: 3600000 });

async function getCachedResponse(query) {
  const cacheKey = `response:${query}`;
  let response = cache.get(cacheKey);
  
  if (!response) {
    response = await generateCompletion(config, [
      { role: 'user', content: query }
    ]);
    cache.set(cacheKey, response);
  }
  
  return response;
}
```

### 4. 日志记录

使用适当的日志级别:

```javascript
import { logger } from './lib/utils/logger.js';

// 调试信息 - 仅开发环境
logger.debug('处理请求', { requestId: 123 });

// 一般信息 - 生产环境记录
logger.info('用户登录', { userId: 123 });

// 警告 - 需要注意但不影响运行
logger.warn('API 响应缓慢', { responseTime: 5000 });

// 错误 - 需要立即处理
logger.error('API 请求失败', { error: 'Timeout' });
```

### 5. 配置管理

使用环境变量和配置文件:

```javascript
import { loadConfig } from './lib/config.js';

// 优先级: 环境变量 > 配置文件 > 默认值
async function getConfig() {
  const fileConfig = await loadConfig();
  
  return {
    apiKey: process.env.API_KEY || fileConfig.apiKey,
    baseUrl: process.env.BASE_URL || fileConfig.baseUrl,
    model: process.env.MODEL || fileConfig.model || 'gpt-4'
  };
}
```

### 6. 输入验证

始终验证用户输入:

```javascript
import { validateConfig, validateMessage } from './lib/utils/validation.js';
import { sanitizeInput } from './lib/utils/security.js';

function handleUserInput(input) {
  // 清理输入
  const cleanInput = sanitizeInput(input);
  
  // 验证消息
  const validation = validateMessage({
    role: 'user',
    content: cleanInput
  });
  
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  return cleanInput;
}
```

### 7. 成本控制

监控和控制 API 成本:

```javascript
import { CostTracker } from './lib/utils/cost-tracker.js';

const costTracker = new CostTracker();
const MAX_DAILY_COST = 10.0;

async function makeCostAwareRequest(config, messages) {
  // 检查当前成本
  const stats = costTracker.getStats();
  if (stats.totalCost >= MAX_DAILY_COST) {
    throw new Error('已达到每日成本限额');
  }
  
  // 发起请求
  const response = await generateCompletion(config, messages);
  
  // 记录使用情况
  const usage = response.usage;
  costTracker.trackUsage(
    config.model,
    usage.prompt_tokens,
    usage.completion_tokens
  );
  
  return response;
}
```

### 8. 并发控制

使用连接池和并发控制器:

```javascript
import { ConnectionPool, ConcurrencyController } from './lib/utils/connection-pool.js';

const pool = new ConnectionPool({ maxConnections: 10 });
const controller = new ConcurrencyController({ maxConcurrent: 5 });

async function processBatch(queries) {
  const results = [];
  
  for (const query of queries) {
    controller.add(async () => {
      return await pool.use(async (connection) => {
        // 执行请求
        return await generateCompletion(config, [{ role: 'user', content: query }]);
      });
    }).then(result => results.push(result));
  }
  
  return results;
}
```

---

## 常见问题

### Q1: 如何设置不同的 API Provider?

使用 `baseUrl` 配置:

```javascript
// OpenAI
const config = {
  apiKey: 'sk-xxx',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
};

// Azure OpenAI
const azureConfig = {
  apiKey: 'azure-key',
  baseUrl: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
  model: 'gpt-4'
};

// 其他兼容接口
const customConfig = {
  apiKey: 'custom-key',
  baseUrl: 'https://your-api.com/v1',
  model: 'custom-model'
};
```

### Q2: 如何处理流式输出?

使用 `chatStream` API:

```javascript
import { chatStream } from './lib/chat.js';

const stream = await chatStream(config, messages);

for await (const chunk of stream) {
  if (chunk.choices && chunk.choices[0]?.delta?.content) {
    const content = chunk.choices[0].delta.content;
    process.stdout.write(content); // 实时输出
  }
}
```

### Q3: 如何切换会话?

使用 SessionManager:

```javascript
import { SessionManager } from './lib/utils/session-manager.js';

const manager = new SessionManager();

// 列出所有会话
const sessions = await manager.listSessions();

// 切换到指定会话
const current = await manager.switchSession(sessions[0].id);
console.log('当前会话:', current.name);
```

### Q4: 如何使用分支功能?

使用 BranchManager:

```javascript
import { BranchManager } from './lib/utils/branch-manager.js';

const branchManager = new BranchManager(sessionManager);

// 创建分支
const branch = await branchManager.createBranch(2, 'alternative');
console.log('新分支:', branch.name);

// 列出分支
const branches = await branchManager.listBranches();

// 切换分支
await branchManager.switchBranch(branch.id);
```

---

## 完整示例

### 示例 1: 完整的聊天应用

```javascript
import { chatStream } from './lib/chat.js';
import { loadConfig } from './lib/config.js';
import { SessionManager } from './lib/utils/session-manager.js';
import { logger } from './lib/utils/logger.js';

async function main() {
  try {
    // 加载配置
    const config = await loadConfig();
    
    // 创建会话管理器
    const sessionManager = new SessionManager();
    
    // 创建新会话
    const session = await sessionManager.createSession('chat-session');
    
    // 消息历史
    const messages = [
      { role: 'system', content: '你是一个有帮助的助手。' }
    ];
    
    // 聊天循环
    while (true) {
      // 获取用户输入
      const userInput = await prompt('你: ');
      
      if (userInput.toLowerCase() === 'exit') {
        break;
      }
      
      // 添加用户消息
      messages.push({ role: 'user', content: userInput });
      
      // 流式输出
      process.stdout.write('助手: ');
      let assistantMessage = '';
      
      const stream = await chatStream(config, messages);
      
      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content;
          assistantMessage += content;
          process.stdout.write(content);
        }
      }
      
      console.log('\n');
      
      // 添加助手消息
      messages.push({ role: 'assistant', content: assistantMessage });
      
      // 保存历史
      await sessionManager.saveHistory(messages);
    }
    
    logger.info('聊天结束');
  } catch (error) {
    logger.error('发生错误:', { error: error.message });
  }
}

main();
```

### 示例 2: 代码审查工具

```javascript
import { generateCompletion } from './lib/chat.js';
import { runGitDiff } from './lib/utils/git-helper.js';

async function reviewCode() {
  // 获取 git diff
  const diff = await runGitDiff();
  
  if (!diff) {
    console.log('没有变更需要审查');
    return;
  }
  
  // 创建审查提示
  const prompt = `
请审查以下代码变更,重点关注:
1. 潜在的 bug
2. 代码风格问题
3. 性能优化建议
4. 安全性问题

代码变更:
${diff}
  `;
  
  // 生成审查结果
  const response = await generateCompletion(config, [
    { role: 'user', content: prompt }
  ]);
  
  console.log(response.choices[0].message.content);
}

reviewCode();
```

### 示例 3: RAG 搜索应用

```javascript
import { indexCodebase, searchCodebase } from './lib/rag.js';
import { generateCompletion } from './lib/chat.js';
import { ProgressBar } from './lib/utils/progress.js';

async function main() {
  // 索引代码库
  console.log('索引代码库...');
  const progress = new ProgressBar({ total: 100 });
  
  const chunkCount = await indexCodebase('./src', config, {
    showProgress: true
  });
  
  progress.complete(`索引完成,共 ${chunkCount} 个块`);
  
  // 搜索循环
  while (true) {
    const query = await prompt('搜索: ');
    
    if (query.toLowerCase() === 'exit') {
      break;
    }
    
    // 搜索代码
    const results = await searchCodebase(query, config);
    
    if (results.length === 0) {
      console.log('未找到相关代码');
      continue;
    }
    
    // 显示搜索结果
    console.log('\n搜索结果:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.filepath}`);
      console.log(`相似度: ${result.score.toFixed(2)}`);
      console.log(result.content);
    });
    
    // 选择结果
    const selectedIndex = await prompt('\n选择结果编号: ');
    const selected = results[selectedIndex - 1];
    
    // 使用 AI 解释
    const explanation = await generateCompletion(config, [
      { 
        role: 'user',
        content: `请解释以下代码:\n${selected.content}`
      }
    ]);
    
    console.log('\n解释:', explanation.choices[0].message.content);
  }
}

main();
```

---

## 更多资源

- [README](../README.md) - 项目主文档
- [示例代码](../examples/) - 完整示例
- [测试用例](../tests/) - 单元测试和集成测试
- [优化文档](./OPTIMIZATION_SUMMARY.md) - 项目优化历程

---

**更新日期**: 2026-01-28

**版本**: 1.0.0
