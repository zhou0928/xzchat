# xzChat 最佳实践指南

## 概述

本文档提供了使用 xzChat 的最佳实践建议,包括性能优化、安全考虑、代码组织等方面。

## 目录

- [架构设计](#架构设计)
- [性能优化](#性能优化)
- [安全最佳实践](#安全最佳实践)
- [错误处理](#错误处理)
- [日志管理](#日志管理)
- [配置管理](#配置管理)
- [测试策略](#测试策略)
- [部署建议](#部署建议)
- [常见反模式](#常见反模式)

---

## 架构设计

### 1. 分层架构

推荐使用清晰的分层架构:

```
┌─────────────────────────────────────┐
│         Presentation Layer           │
│    (CLI Interface / Commands)       │
├─────────────────────────────────────┤
│         Application Layer           │
│   (Business Logic / Use Cases)      │
├─────────────────────────────────────┤
│          Domain Layer               │
│    (Core Models / Services)         │
├─────────────────────────────────────┤
│      Infrastructure Layer           │
│  (API Client / Database / Storage)  │
└─────────────────────────────────────┘
```

### 2. 模块化设计

将功能拆分为独立的模块:

```javascript
// ✅ 好的做法 - 模块化
import { ChatService } from './services/chat.js';
import { SessionService } from './services/session.js';
import { RAGService } from './services/rag.js';

const chatService = new ChatService(config);
const sessionService = new SessionService();
const ragService = new RAGService(config);

// ❌ 不好的做法 - 耦合度高
import * as xzChat from './lib/index.js';
// 所有功能耦合在一起
```

### 3. 依赖注入

使用依赖注入提高可测试性:

```javascript
// ✅ 好的做法
class ChatController {
  constructor(chatService, sessionService, logger) {
    this.chatService = chatService;
    this.sessionService = sessionService;
    this.logger = logger;
  }
  
  async handleCommand(command) {
    this.logger.info('处理命令', { command });
    return await this.chatService.execute(command);
  }
}

// ❌ 不好的做法
class ChatController {
  async handleCommand(command) {
    const chatService = new ChatService(); // 硬编码依赖
    return await chatService.execute(command);
  }
}
```

---

## 性能优化

### 1. 使用缓存

合理使用缓存减少 API 调用:

```javascript
import { Cache } from './lib/utils/cache.js';

// 创建分层缓存
const memoryCache = new Cache({ ttl: 300000 }); // 5 分钟
const persistentCache = new Cache({ 
  ttl: 3600000, // 1 小时
  persistent: true,
  storagePath: './cache'
});

async function getCachedResponse(query) {
  // 先查内存缓存
  let response = memoryCache.get(query);
  if (response) {
    return response;
  }
  
  // 再查持久化缓存
  response = persistentCache.get(query);
  if (response) {
    // 更新到内存缓存
    memoryCache.set(query, response);
    return response;
  }
  
  // 调用 API
  response = await generateCompletion(config, [
    { role: 'user', content: query }
  ]);
  
  // 写入两层缓存
  memoryCache.set(query, response);
  persistentCache.set(query, response);
  
  return response;
}
```

### 2. 批量处理

使用批量操作减少请求次数:

```javascript
// ✅ 好的做法 - 批量处理
import { ConcurrencyController } from './lib/utils/connection-pool.js';

const controller = new ConcurrencyController({ maxConcurrent: 5 });

async function processBatch(queries) {
  const tasks = queries.map(query => 
    controller.add(() => generateCompletion(config, [
      { role: 'user', content: query }
    ]))
  );
  
  return await Promise.all(tasks);
}

// ❌ 不好的做法 - 串行处理
async function processBatchSequential(queries) {
  const results = [];
  for (const query of queries) {
    const result = await generateCompletion(config, [
      { role: 'user', content: query }
    ]);
    results.push(result);
  }
  return results;
}
```

### 3. 流式输出

对于长文本,使用流式输出提升用户体验:

```javascript
import { chatStream } from './lib/chat.js';

async function streamChat(messages) {
  const stream = await chatStream(config, messages);
  let fullContent = '';
  
  for await (const chunk of stream) {
    if (chunk.choices?.[0]?.delta?.content) {
      const content = chunk.choices[0].delta.content;
      fullContent += content;
      process.stdout.write(content); // 实时输出
    }
  }
  
  return fullContent;
}
```

### 4. 连接池

使用连接池管理 HTTP 连接:

```javascript
import { ConnectionPool } from './lib/utils/connection-pool.js';

const pool = new ConnectionPool({
  maxConnections: 10,
  minConnections: 2,
  idleTimeout: 30000,
  connectionTimeout: 10000
});

async function makeRequest(url, options) {
  return await pool.use(async (connection) => {
    // 使用连接发送请求
    const response = await fetch(url, {
      ...options,
      agent: connection.agent
    });
    return response;
  });
}
```

### 5. RAG 优化

优化 RAG 索引和搜索:

```javascript
// ✅ 好的做法 - 并行索引
import { indexCodebase } from './lib/rag.js';

const chunkCount = await indexCodebase('./src', config, {
  concurrency: 5,          // 增加并发数
  chunkSize: 800,          // 优化块大小
  chunkOverlap: 100,       // 适当重叠
  showProgress: true
});

// 优化搜索 - 使用过滤
const results = await searchCodebase(
  query,
  config,
  {
    topK: 10,
    filter: {              // 添加过滤条件
      language: 'javascript',
      path: './lib'
    }
  }
);
```

### 6. 成本控制

监控和控制 API 成本:

```javascript
import { CostTracker } from './lib/utils/cost-tracker.js';

const costTracker = new CostTracker();
const COST_LIMITS = {
  hourly: 1.0,
  daily: 10.0,
  monthly: 100.0
};

async function makeCostAwareRequest(config, messages) {
  // 检查成本限额
  const stats = costTracker.getStats();
  
  if (stats.hourlyCost >= COST_LIMITS.hourly) {
    throw new Error('已达到每小时成本限额');
  }
  
  if (stats.dailyCost >= COST_LIMITS.daily) {
    throw new Error('已达到每日成本限额');
  }
  
  // 发起请求
  const response = await generateCompletion(config, messages);
  const usage = response.usage;
  
  // 记录使用情况
  costTracker.trackUsage(
    config.model,
    usage.prompt_tokens,
    usage.completion_tokens
  );
  
  return response;
}
```

---

## 安全最佳实践

### 1. 敏感信息保护

保护 API Key 和其他敏感信息:

```javascript
import { detectSensitiveInfo, sanitizeInput } from './lib/utils/security.js';

// ✅ 好的做法
function sanitizeMessage(message) {
  // 检测敏感信息
  const sensitive = detectSensitiveInfo(message);
  if (sensitive.length > 0) {
    console.warn('检测到敏感信息,已过滤');
  }
  
  // 清理输入
  return sanitizeInput(message);
}

// ❌ 不好的做法 - 直接使用用户输入
function badSanitize(message) {
  return message; // 未清理,存在 XSS 风险
}
```

### 2. API Key 管理

使用环境变量或安全的密钥管理:

```javascript
// ✅ 好的做法 - 环境变量
import { loadConfig } from './lib/config.js';

async function getSecureConfig() {
  const config = await loadConfig();
  
  // 优先使用环境变量
  return {
    apiKey: process.env.API_KEY || config.apiKey,
    baseUrl: process.env.BASE_URL || config.baseUrl,
    model: process.env.MODEL || config.model
  };
}

// ❌ 不好的做法 - 硬编码 API Key
const config = {
  apiKey: 'sk-xxxxxxxxxxxxxxxx', // 危险! 不要这样做
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
};
```

### 3. 输入验证

严格验证所有输入:

```javascript
import { validateConfig, validateMessage, ValidationError } from './lib/utils/validation.js';

function validateAll(config, messages) {
  // 验证配置
  const configResult = validateConfig(config);
  if (!configResult.valid) {
    throw new ValidationError('配置无效', configResult.errors);
  }
  
  // 验证消息
  for (const message of messages) {
    const msgResult = validateMessage(message);
    if (!msgResult.valid) {
      throw new ValidationError('消息无效', msgResult.errors);
    }
  }
}
```

### 4. 路径验证

防止路径遍历攻击:

```javascript
import { validatePath } from './lib/utils/security.js';
import path from 'path';

async function safeReadFile(filePath) {
  // 验证路径
  if (!validatePath(filePath)) {
    throw new Error('不安全的路径');
  }
  
  // 解析为绝对路径
  const absolutePath = path.resolve(filePath);
  
  // 确保在允许的目录内
  const allowedDirs = ['./src', './docs'];
  const isAllowed = allowedDirs.some(dir => 
    absolutePath.startsWith(path.resolve(dir))
  );
  
  if (!isAllowed) {
    throw new Error('不允许的路径');
  }
  
  return await readFile(absolutePath);
}
```

### 5. 命令验证

防止执行危险命令:

```javascript
import { DANGEROUS_COMMANDS } from './lib/utils/security.js';

function validateCommand(command) {
  // 检查危险命令
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (command.includes(dangerous)) {
      throw new Error(`危险命令: ${dangerous}`);
    }
  }
  
  // 限制命令类型
  const allowedCommands = ['npm', 'git', 'ls', 'cat'];
  const commandName = command.split(' ')[0];
  
  if (!allowedCommands.includes(commandName)) {
    throw new Error(`不允许的命令: ${commandName}`);
  }
  
  return true;
}
```

---

## 错误处理

### 1. 统一错误处理

使用自定义错误类:

```javascript
import { 
  XZChatError,
  ConfigError,
  NetworkError,
  ValidationError,
  isRetryableError
} from './lib/utils/errors.js';
import { logger } from './lib/utils/logger.js';

async function safeOperation() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    // 根据错误类型处理
    if (error instanceof ValidationError) {
      logger.warn('验证错误', { error: error.message });
      return { success: false, error: error.message };
    } else if (error instanceof ConfigError) {
      logger.error('配置错误', { error: error.message });
      throw error; // 配置错误需要重新配置
    } else if (error instanceof NetworkError) {
      if (isRetryableError(error)) {
        logger.info('网络错误,重试中...');
        return await retryOperation();
      }
      throw error;
    } else {
      logger.error('未知错误', { error: error.message });
      throw new XZChatError('操作失败', { cause: error });
    }
  }
}
```

### 2. 重试机制

实现智能重试:

```javascript
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    exponential = true
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // 检查是否可重试
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // 计算延迟时间
      let delay;
      if (exponential) {
        delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      } else {
        delay = baseDelay;
      }
      
      // 添加随机抖动
      const jitter = Math.random() * 0.3 * delay;
      delay += jitter;
      
      logger.info(`重试 ${attempt + 1}/${maxRetries}`, { delay });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// 使用示例
const response = await retryWithBackoff(
  () => generateCompletion(config, messages),
  { maxRetries: 5, baseDelay: 2000 }
);
```

### 3. 错误恢复

实现优雅降级:

```javascript
async function resilientOperation(primaryFn, fallbackFn) {
  try {
    // 尝试主要方案
    return await primaryFn();
  } catch (error) {
    logger.warn('主要方案失败,尝试备用方案', { error: error.message });
    
    try {
      // 尝试备用方案
      const result = await fallbackFn();
      logger.info('备用方案成功');
      return result;
    } catch (fallbackError) {
      logger.error('备用方案也失败', { error: fallbackError.message });
      throw new XZChatError('所有方案均失败', {
        primaryError: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
}

// 使用示例
const result = await resilientOperation(
  // 主要方案 - 使用高级模型
  () => generateCompletion({ ...config, model: 'gpt-4' }, messages),
  // 备用方案 - 使用基础模型
  () => generateCompletion({ ...config, model: 'gpt-3.5-turbo' }, messages)
);
```

---

## 日志管理

### 1. 结构化日志

使用结构化日志格式:

```javascript
import { logger } from './lib/utils/logger.js';

// ✅ 好的做法 - 结构化日志
logger.info('用户登录', {
  userId: 123,
  timestamp: Date.now(),
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// ❌ 不好的做法 - 非结构化日志
console.log('用户 123 登录了,IP 是 192.168.1.1');
```

### 2. 日志级别

合理使用日志级别:

```javascript
import { logger } from './lib/utils/logger.js';

// DEBUG - 调试信息
logger.debug('处理请求详情', {
  requestId: 123,
  headers: { 'content-type': 'application/json' }
});

// INFO - 一般信息
logger.info('会话创建', { sessionId: 'abc-123', userId: 456 });

// WARN - 警告信息
logger.warn('API 响应时间较长', {
  endpoint: '/chat',
  responseTime: 5000,
  threshold: 3000
});

// ERROR - 错误信息
logger.error('API 请求失败', {
  error: 'Timeout',
  statusCode: 504,
  url: 'https://api.openai.com/v1/chat/completions'
});
```

### 3. 日志过滤

根据环境配置日志级别:

```javascript
import { logger } from './lib/utils/logger.js';

// 根据环境变量设置日志级别
const env = process.env.NODE_ENV || 'production';

switch (env) {
  case 'development':
    logger.setLevel('debug');
    break;
  case 'test':
    logger.setLevel('warn');
    break;
  case 'production':
  default:
    logger.setLevel('info');
    break;
}

// 生产环境只记录 INFO 及以上
// 开发环境记录所有级别
```

### 4. 日志归档

配置日志归档策略:

```javascript
import { logger } from './lib/utils/logger.js';

// 配置日志文件
logger.configure({
  file: {
    enabled: true,
    path: './logs/app.log',
    maxSize: '10M',
    maxFiles: 10,
    datePattern: 'YYYY-MM-DD'
  },
  console: {
    enabled: env !== 'production',
    format: 'pretty'
  }
});
```

---

## 配置管理

### 1. 配置分层

使用多层级配置:

```javascript
import { loadConfig } from './lib/config.js';

// 配置优先级: 环境变量 > 命令行参数 > 配置文件 > 默认值
async function getConfig(options = {}) {
  // 1. 默认值
  const defaults = {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  };
  
  // 2. 配置文件
  const fileConfig = await loadConfig();
  
  // 3. 命令行参数
  const cliConfig = {
    model: options.model,
    temperature: options.temperature,
    maxTokens: options.maxTokens
  };
  
  // 4. 环境变量
  const envConfig = {
    apiKey: process.env.API_KEY,
    baseUrl: process.env.BASE_URL,
    model: process.env.MODEL
  };
  
  // 合并配置 (优先级从低到高)
  return {
    ...defaults,
    ...fileConfig,
    ...envConfig,
    ...cliConfig
  };
}
```

### 2. Profile 管理

使用 Profile 管理不同环境:

```javascript
import { loadConfig, updateConfig } from './lib/config.js';

// 工作环境配置
await updateConfig('model', 'gpt-4', 'work');
await updateConfig('temperature', 0.5, 'work');
await updateConfig('maxTokens', 4000, 'work');

// 个人环境配置
await updateConfig('model', 'gpt-3.5-turbo', 'personal');
await updateConfig('temperature', 0.9, 'personal');
await updateConfig('maxTokens', 1000, 'personal');

// 使用指定 Profile
const workConfig = await loadConfig('work');
const personalConfig = await loadConfig('personal');
```

### 3. 配置验证

验证配置的有效性:

```javascript
import { validateConfig } from './lib/utils/validation.js';

async function safeLoadConfig() {
  const config = await loadConfig();
  
  // 验证配置
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(
      `配置无效:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
  
  return config;
}
```

---

## 测试策略

### 1. 单元测试

编写单元测试覆盖核心功能:

```javascript
import { describe, it, expect } from 'vitest';
import { generateCompletion } from './lib/chat.js';

describe('generateCompletion', () => {
  it('应该生成有效的响应', async () => {
    const config = {
      apiKey: 'test-key',
      baseUrl: 'https://test.api/v1',
      model: 'gpt-4'
    };
    
    const messages = [
      { role: 'user', content: 'Hello' }
    ];
    
    const response = await generateCompletion(config, messages);
    
    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices[0].message).toBeDefined();
  });
  
  it('应该处理错误', async () => {
    const config = {
      apiKey: 'invalid-key',
      baseUrl: 'https://test.api/v1',
      model: 'gpt-4'
    };
    
    const messages = [{ role: 'user', content: 'Hello' }];
    
    await expect(
      generateCompletion(config, messages)
    ).rejects.toThrow();
  });
});
```

### 2. 集成测试

测试组件之间的集成:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from './lib/utils/session-manager.js';
import { ChatService } from './lib/services/chat.js';

describe('Chat Integration', () => {
  let sessionManager;
  let chatService;
  
  beforeEach(() => {
    sessionManager = new SessionManager();
    chatService = new ChatService(config);
  });
  
  it('应该完整处理聊天会话', async () => {
    // 创建会话
    const session = await sessionManager.createSession('test');
    
    // 发送消息
    const messages = [
      { role: 'user', content: 'Hello' }
    ];
    
    const response = await chatService.chat(messages);
    
    // 保存历史
    await sessionManager.saveHistory(messages, session.id);
    
    // 验证
    const history = await sessionManager.loadHistory(session.id);
    expect(history.length).toBe(1);
    expect(history[0].content).toBe('Hello');
  });
});
```

### 3. Mock 测试

使用 Mock 隔离外部依赖:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { chatStream } from './lib/chat.js';

describe('chatStream with Mock', () => {
  it('应该使用 Mock API', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({
              done: true,
              value: new TextEncoder().encode('{"choices":[{"delta":{"content":"Hello"}}]}')
            })
          })
        }
      })
    );
    
    const config = {
      apiKey: 'test-key',
      baseUrl: 'https://test.api/v1',
      model: 'gpt-4'
    };
    
    const messages = [{ role: 'user', content: 'Hi' }];
    const stream = await chatStream(config, messages);
    
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    expect(chunks.length).toBeGreaterThan(0);
    
    // 恢复 fetch
    global.fetch.mockRestore();
  });
});
```

---

## 部署建议

### 1. 环境变量配置

使用 `.env` 文件:

```bash
# .env.example
API_KEY=your-api-key
BASE_URL=https://api.openai.com/v1
MODEL=gpt-4
TEMPERATURE=0.7
MAX_TOKENS=2000
LOG_LEVEL=info
CACHE_TTL=3600000
```

```javascript
// 加载环境变量
import dotenv from 'dotenv';

dotenv.config();

const config = {
  apiKey: process.env.API_KEY,
  baseUrl: process.env.BASE_URL,
  model: process.env.MODEL,
  temperature: parseFloat(process.env.TEMPERATURE),
  maxTokens: parseInt(process.env.MAX_TOKENS)
};
```

### 2. Docker 部署

使用 Docker 容器化:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production

CMD ["node", "bin/cli.js"]
```

```bash
# docker-compose.yml
version: '3.8'

services:
  xzchat:
    build: .
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
```

### 3. PM2 进程管理

使用 PM2 管理进程:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'xzchat',
    script: './bin/cli.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看日志
pm2 logs

# 监控
pm2 monit
```

---

## 常见反模式

### 1. 硬编码配置

❌ **不要这样做**:
```javascript
const config = {
  apiKey: 'sk-xxxxxxxx',  // 硬编码
  baseUrl: 'https://api.openai.com/v1'
};
```

✅ **应该这样做**:
```javascript
const config = {
  apiKey: process.env.API_KEY,
  baseUrl: process.env.BASE_URL || 'https://api.openai.com/v1'
};
```

### 2. 忽略错误处理

❌ **不要这样做**:
```javascript
const response = await generateCompletion(config, messages);
console.log(response); // 如果失败会崩溃
```

✅ **应该这样做**:
```javascript
try {
  const response = await generateCompletion(config, messages);
  console.log(response);
} catch (error) {
  logger.error('请求失败', { error: error.message });
  throw error;
}
```

### 3. 过度使用同步操作

❌ **不要这样做**:
```javascript
// 同步操作阻塞
const data = fs.readFileSync('./large-file.json');
```

✅ **应该这样做**:
```javascript
// 异步操作非阻塞
const data = await fs.readFile('./large-file.json', 'utf-8');
```

### 4. 重复造轮子

❌ **不要这样做**:
```javascript
// 自己实现日期格式化
function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  // ...
}
```

✅ **应该这样做**:
```javascript
// 使用成熟的库
import { format } from 'date-fns';
const formatted = format(new Date(), 'yyyy-MM-dd');
```

### 5. 缺乏测试

❌ **不要这样做**:
```javascript
// 没有测试,直接上线
function complexLogic(input) {
  // 复杂的逻辑...
}
```

✅ **应该这样做**:
```javascript
// 编写测试
import { describe, it, expect } from 'vitest';

describe('complexLogic', () => {
  it('应该处理有效输入', () => {
    const result = complexLogic('valid');
    expect(result).toBeDefined();
  });
  
  it('应该拒绝无效输入', () => {
    expect(() => complexLogic(null)).toThrow();
  });
});
```

---

## 总结

遵循这些最佳实践可以帮助你:

- ✅ 提高代码质量和可维护性
- ✅ 优化性能和用户体验
- ✅ 增强安全性和可靠性
- ✅ 简化测试和部署流程
- ✅ 减少常见错误和问题

记住: **代码被阅读的次数远多于被编写的次数**。花时间编写清晰、可维护的代码是值得的!

---

**更新日期**: 2026-01-28

**版本**: 1.0.0
