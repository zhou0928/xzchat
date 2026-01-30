# TypeScript 类型定义文档

## 概述

xzChat 现在提供完整的 TypeScript 类型定义，为 IDE 提供智能提示和类型检查支持。

## 安装

xzChat 的类型定义已包含在项目中，无需额外安装 TypeScript。

如果你想在项目中使用 TypeScript，可以安装 TypeScript 编译器：

```bash
npm install --save-dev typescript @types/node
```

## 使用类型定义

### 在 JavaScript 中使用 JSDoc 注释

即使你的项目是纯 JavaScript，你也可以使用 JSDoc 注释来获得类型提示：

```javascript
/**
 * @param {import('./types/chat').ChatMessage[]} messages - 聊天消息数组
 * @param {import('./types/config').Config} config - 配置对象
 * @param {import('./types/chat').ChatOptions} [options] - 可选参数
 */
async function chat(messages, config, options) {
  // IDE 会提供类型提示
}
```

### 在 TypeScript 文件中导入

```typescript
import { ChatMessage, Config, ChatOptions } from 'xz-chat';
import { chat } from './lib/chat';

const messages: ChatMessage[] = [
  { role: 'user', content: '你好' }
];

const config: Config = {
  apiKey: 'sk-xxx',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  provider: 'openai',
  profiles: { ... },
  currentProfile: 'default'
};

const options: ChatOptions = {
  stream: true,
  temperature: 0.7
};

const response = await chat(messages, config, options);
```

## 类型定义模块

### 核心模块

#### `types/config.d.ts` - 配置类型
- `Config`: 主配置接口
- `ProfileConfig`: Profile 配置接口
- `ProviderPreset`: API 提供商预设
- `CcSwitchProvider`: cc-switch 提供商配置

#### `types/chat.d.ts` - 聊天类型
- `ChatMessage`: 聊天消息
- `ChatOptions`: 聊天选项
- `ChatResponse`: 聊天响应
- `ToolCall`: 工具调用
- `UsageInfo`: Token 使用信息

#### `types/rag.d.ts` - RAG 类型
- `Chunk`: 文本块
- `RAGSearchOptions`: 搜索选项
- `RAGSearchResult`: 搜索结果
- `BatchEmbeddingOptions`: 批量嵌入选项

#### `types/tools.d.ts` - 工具类型
- `Tool`: 工具定义
- `ToolResult`: 工具执行结果

### 工具模块

#### `types/logger.d.ts` - 日志类型
- `Logger`: 日志类
- `LogLevel`: 日志级别
- `LoggerContext`: 日志上下文

#### `types/errors.d.ts` - 错误类型
- `XZChatError`: 基础错误类
- `ConfigError`: 配置错误
- `APIError`: API 错误
- `FileSystemError`: 文件系统错误
- `NetworkError`: 网络错误
- `ValidationError`: 验证错误

#### `types/cache.d.ts` - 缓存类型
- `LRUCache`: LRU 缓存类
- `CacheEntry`: 缓存条目
- `CacheStats`: 缓存统计

#### `types/branch.d.ts` - 分支系统类型
- `Branch`: 分支
- `Session`: 会话

## TypeScript 编译配置

项目包含 `tsconfig.json` 配置文件，支持：

- 类型检查 JavaScript 文件 (`checkJs: true`)
- 生成声明文件 (`declaration: true`)
- 严格的模块解析

### 类型检查命令

```bash
# 检查类型但不生成文件
npx tsc --noEmit

# 生成类型定义文件
npx tsc --declaration

# 使用 JSDoc 类型检查（无需安装 TypeScript）
npx tsc --noEmit --allowJs --checkJs
```

## 常见使用场景

### 1. 定义配置对象

```javascript
/**
 * @type {import('./types/config').Config}
 */
const config = {
  apiKey: 'sk-xxx',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  provider: 'openai',
  profiles: {
    default: {
      apiKey: 'sk-xxx',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4'
    }
  },
  currentProfile: 'default'
};
```

### 2. 处理聊天响应

```javascript
/**
 * @param {import('./types/chat').ChatResponse} response
 */
function handleResponse(response) {
  const message = response.message;
  const usage = response.usage;

  console.log(`Tokens: ${usage?.total_tokens}`);
  console.log(`Cost: $${response.cost?.total}`);
}
```

### 3. 使用 RAG 搜索

```javascript
/**
 * @type {import('./types/rag').RAGSearchOptions}
 */
const searchOptions = {
  topK: 10,
  useCache: true
};

const results = await searchCodebase(query, dir, config, searchOptions);

/** @type {import('./types/rag').RAGSearchResult[]} */
const topResults = results;
```

### 4. 错误处理

```javascript
try {
  await someOperation();
} catch (/** @type {any} */ error) {
  if (error instanceof XZChatError) {
    console.error(`[${error.code}] ${error.message}`);
    console.error('Details:', error.details);
  }
}
```

## IDE 配置

### VS Code

确保你的 `.vscode/settings.json` 包含：

```json
{
  "javascript.suggest.autoImports": true,
  "javascript.suggest.completeFunctionCalls": true,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### WebStorm/IntelliJ IDEA

1. 打开 Settings → Languages & Frameworks → JavaScript → Libraries
2. 点击 "Add..." 并选择项目根目录
3. 确保类型定义文件被识别

## 类型检查最佳实践

### 1. 使用 JSDoc 注释

```javascript
/**
 * 处理用户输入
 * @param {string} input - 用户输入
 * @param {import('./types/chat').ChatMessage[]} context - 对话上下文
 * @returns {Promise<string>} 处理后的响应
 */
async function processInput(input, context) {
  // ...
}
```

### 2. 定义函数签名

```javascript
/**
 * @callback ChatCallback
 * @param {string} chunk - 接收的文本块
 * @returns {void}
 */

/**
 * @param {import('./types/chat').ChatMessage[]} messages
 * @param {import('./types/config').Config} config
 * @param {import('./types/chat').ChatOptions} options
 * @param {ChatCallback} onChunk
 * @returns {Promise<import('./types/chat').ChatResponse>}
 */
async function streamChat(messages, config, options, onChunk) {
  // ...
}
```

### 3. 使用泛型

```javascript
/**
 * @template T
 * @param {import('./types/cache').CacheOptions} options
 * @returns {import('./types/cache').LRUCache<T>}
 */
function createCache(options) {
  return new LRUCache(options);
}
```

## 迁移指南

### 从纯 JavaScript 到 JSDoc 类型

如果你有一个现有的 JavaScript 项目，可以逐步添加类型：

```javascript
// 之前
function processConfig(config) {
  return config.apiKey;
}

// 之后
/**
 * @param {import('./types/config').Config} config
 * @returns {string}
 */
function processConfig(config) {
  return config.apiKey;
}
```

### 从 JSDoc 到 TypeScript

当准备迁移到完整的 TypeScript 时：

```typescript
// 之前 (JSDoc)
/**
 * @param {Config} config
 */
function loadConfig(config: Config) {
  // ...
}

// 之后 (TypeScript)
function loadConfig(config: Config): void {
  // ...
}
```

## 限制和注意事项

1. **运行时类型检查**: 类型定义仅在编译/编辑时有效，不会在运行时进行类型检查
2. **动态类型**: JavaScript 的动态特性意味着某些类型可能不准确
3. **可选字段**: 许多字段是可选的，需要在使用时检查是否存在

## 故障排除

### 类型提示不工作

1. 确保 IDE 已加载类型定义
2. 尝试重启 IDE
3. 检查 `jsconfig.json` 或 `tsconfig.json` 配置
4. 确保导入路径正确

### 类型错误

1. 检查是否使用了正确的导入路径
2. 确认类型定义文件存在
3. 查看是否有类型冲突
4. 考虑使用 `// @ts-ignore` 注释（谨慎使用）

## 扩展类型定义

如果你想为自定义模块添加类型定义：

```typescript
// types/my-module.d.ts
export interface MyCustomType {
  id: string;
  name: string;
  metadata?: Record<string, any>;
}

export function myFunction(input: MyCustomType): Promise<void>;
```

然后在代码中使用：

```javascript
/**
 * @param {import('./types/my-module').MyCustomType} data
 */
function processData(data) {
  // IDE 提供类型提示
}
```

## 相关文档

- [API 文档](./API.md)
- [RAG 优化](./RAG_OPTIMIZATION.md)
- [测试文档](./TESTING.md)

## 贡献

如果你发现类型定义有问题或有改进建议，欢迎提交 Issue 或 Pull Request。
