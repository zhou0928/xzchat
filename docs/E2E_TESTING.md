# E2E 测试文档

## 目录

- [概述](#概述)
- [测试架构](#测试架构)
- [运行测试](#运行测试)
- [编写E2E测试](#编写e2e测试)
- [测试工具](#测试工具)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

---

## 概述

E2E (End-to-End) 测试用于验证整个应用程序的完整功能流程,确保各个组件正确集成。

### 测试覆盖范围

- ✅ 聊天功能完整流程
- ✅ 配置管理完整流程
- ✅ 会话管理完整流程
- ✅ 命令系统完整流程
- ✅ 错误处理和恢复
- ✅ 性能和稳定性

---

## 测试架构

### 目录结构

```
tests/
├── e2e/                        # E2E测试目录
│   ├── helpers.js             # 测试辅助工具
│   ├── chat.e2e.test.js       # 聊天功能E2E测试
│   ├── config.e2e.test.js     # 配置管理E2E测试
│   ├── session.e2e.test.js    # 会话管理E2E测试
│   └── commands.e2e.test.js   # 命令系统E2E测试
└── unit/                       # 单元测试目录
```

### 测试分层

1. **单元测试** - 测试单个函数/类
2. **集成测试** - 测试模块间集成
3. **E2E测试** - 测试完整用户流程

---

## 运行测试

### 运行所有E2E测试

```bash
npm test -- tests/e2e
```

### 运行特定E2E测试文件

```bash
npm test -- tests/e2e/chat.e2e.test.js
```

### 运行特定测试用例

```bash
npm test -- tests/e2e/chat.e2e.test.js -t "应该能够发送简单消息"
```

### 运行测试并生成覆盖率报告

```bash
npm run test:coverage
```

### 运行测试UI界面

```bash
npm run test:ui
```

---

## 编写E2E测试

### 基本测试结构

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('E2E: 功能名称', () => {
  let testDataDir;

  beforeEach(async () => {
    // 测试前准备
    testDataDir = await createTempDir();
  });

  afterEach(async () => {
    // 测试后清理
    await cleanupTempDir(testDataDir);
  });

  it('应该执行某个功能', async () => {
    // 测试逻辑
    const result = await executeSomeOperation();
    expect(result).toBeDefined();
  });
});
```

### 使用测试辅助工具

```javascript
import {
  createTempDir,
  cleanupTempDir,
  createTestConfig,
  executeCLI,
  mockFetch
} from '../e2e/helpers.js';

describe('E2E: 示例测试', () => {
  let testDataDir;

  beforeEach(async () => {
    testDataDir = await createTempDir();
    await createTestConfig(testDataDir);
    mockFetch({ choices: [{ message: { content: 'Test response' } }] });
  });

  afterEach(async () => {
    await cleanupTempDir(testDataDir);
  });

  it('应该执行CLI命令', async () => {
    const { stdout, exitCode } = await executeCLI('config show', {
      cwd: testDataDir
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain('apiKey');
  });
});
```

---

## 测试工具

### 目录和环境管理

#### `createTempDir()`

创建临时测试目录。

```javascript
const tempDir = await createTempDir();
```

#### `cleanupTempDir(tempDir)`

清理临时测试目录。

```javascript
await cleanupTempDir(tempDir);
```

#### `setupTestEnv()`

设置测试环境,返回清理函数。

```javascript
const cleanup = await setupTestEnv();
try {
  // 运行测试
} finally {
  await cleanup();
}
```

### 配置和历史管理

#### `createTestConfig(dir, config)`

创建测试配置文件。

```javascript
await createTestConfig(tempDir, {
  apiKey: 'test-key',
  model: 'gpt-4'
});
```

#### `createTestHistory(dir, history)`

创建测试历史文件。

```javascript
await createTestHistory(tempDir, [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi!' }
]);
```

### CLI执行

#### `executeCLI(command, options)`

执行CLI命令。

```javascript
const { stdout, stderr, exitCode } = await executeCLI(
  'config show',
  {
    cwd: tempDir,
    timeout: 5000
  }
);

expect(exitCode).toBe(0);
```

### Mock工具

#### `mockFetch(responseData)`

Mock fetch API返回数据。

```javascript
mockFetch({
  choices: [
    { message: { content: 'Test response' } }
  ]
});
```

#### `mockFetchError(error)`

Mock fetch API返回错误。

```javascript
mockFetchError(new Error('Network error'));
```

#### `mockFetchStatus(status, text)`

Mock fetch API返回特定状态码。

```javascript
mockFetchStatus(500, 'Internal Server Error');
```

#### `restoreFetch()`

恢复原始fetch。

```javascript
restoreFetch();
```

### 条件等待

#### `waitForCondition(condition, options)`

等待条件满足。

```javascript
await waitForCondition(
  async () => {
    const exists = await fileExists(filePath);
    return exists;
  },
  {
    timeout: 5000,
    interval: 100,
    errorMessage: 'File not created'
  }
);
```

#### `waitForFile(filePath, options)`

等待文件出现。

```javascript
await waitForFile(filePath, { timeout: 5000 });
```

### 文件操作

#### `readJSON(filePath)`

读取JSON文件。

```javascript
const data = await readJSON(configPath);
```

#### `writeJSON(filePath, data)`

写入JSON文件。

```javascript
await writeJSON(configPath, { apiKey: 'test' });
```

#### `fileExists(filePath)`

检查文件是否存在。

```javascript
const exists = await fileExists(filePath);
```

### 辅助函数

#### `randomString(length)`

生成随机字符串。

```javascript
const str = randomString(10);
```

#### `randomPort()`

生成随机端口号。

```javascript
const port = randomPort();
```

#### `createTestResponse(options)`

创建测试服务器响应。

```javascript
const response = createTestResponse({
  content: 'Test',
  promptTokens: 100,
  completionTokens: 200
});
```

#### `createTestMessage(role, content, metadata)`

创建测试消息。

```javascript
const message = createTestMessage(
  'user',
  'Hello',
  { sessionId: 'test-session' }
);
```

---

## 最佳实践

### 1. 测试隔离

每个测试应该独立运行,不依赖其他测试的状态。

```javascript
describe('E2E: 功能测试', () => {
  beforeEach(async () => {
    // 每个测试前创建独立环境
    tempDir = await createTempDir();
    await createTestConfig(tempDir);
  });

  afterEach(async () => {
    // 每个测试后清理
    await cleanupTempDir(tempDir);
  });
});
```

### 2. 清理资源

始终清理创建的临时文件和目录。

```javascript
afterEach(async () => {
  await cleanupTempDir(tempDir);
  restoreFetch();
});
```

### 3. 使用辅助工具

使用提供的测试辅助工具简化测试代码。

```javascript
// 好
await createTestConfig(tempDir, config);

// 不太好
await fs.writeFile(
  path.join(tempDir, '.newapi-chat-config.json'),
  JSON.stringify(config, null, 2)
);
```

### 4. 合理的超时

设置合理的超时时间,避免测试挂起。

```javascript
await executeCLI('config show', {
  timeout: 5000 // 5秒超时
});
```

### 5. 错误处理

正确处理和验证错误情况。

```javascript
it('应该处理错误', async () => {
  mockFetchError(new Error('Network error'));

  await expect(
    generateCompletion(config, messages)
  ).rejects.toThrow('Network error');
});
```

### 6. 异步测试

正确处理异步操作。

```javascript
it('应该异步执行', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});
```

### 7. 测试覆盖

确保测试覆盖正常流程和异常流程。

```javascript
describe('E2E: 功能', () => {
  it('应该正常工作', async () => {
    // 正常流程测试
  });

  it('应该处理错误', async () => {
    // 异常流程测试
  });
});
```

---

## 故障排除

### 问题: 测试超时

**原因**: 操作耗时过长或无限等待

**解决方案**:
- 增加超时时间
- 检查是否有异步操作未正确处理
- 确保清理函数正确执行

```javascript
it('测试用例', async () => {
  // 增加测试超时时间
}, 10000); // 10秒
```

### 问题: Mock不生效

**原因**: Mock未正确设置或未恢复

**解决方案**:
- 确保在beforeEach中设置Mock
- 在afterEach中恢复Mock
- 检查Mock函数签名是否正确

```javascript
beforeEach(() => {
  mockFetch({ data: 'test' });
});

afterEach(() => {
  restoreFetch();
});
```

### 问题: 文件权限错误

**原因**: 临时文件未正确清理

**解决方案**:
- 确保清理函数正确执行
- 使用recursive选项删除目录
- 捕获并忽略清理错误

```javascript
afterEach(async () => {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (e) {
    // 忽略清理错误
  }
});
```

### 问题: 环境变量冲突

**原因**: 测试间环境变量相互影响

**解决方案**:
- 使用辅助工具清理环境变量
- 在beforeEach中设置测试环境变量
- 在afterEach中恢复环境变量

```javascript
const restoreEnv = cleanupEnvVars(['API_KEY', 'BASE_URL']);

afterEach(() => {
  restoreEnv();
});
```

---

## 示例

### 完整的E2E测试示例

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempDir,
  cleanupTempDir,
  createTestConfig,
  executeCLI,
  mockFetch,
  restoreFetch,
  fileExists
} from '../e2e/helpers.js';

describe('E2E: 完整聊天流程', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await createTempDir();
    await createTestConfig(tempDir);
    mockFetch({
      choices: [
        { message: { content: 'Test response' } }
      ]
    });
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
    restoreFetch();
  });

  it('应该完成完整的聊天流程', async () => {
    // 1. 初始化配置
    await executeCLI('config init', { cwd: tempDir });
    const configExists = await fileExists(
      path.join(tempDir, '.newapi-chat-config.json')
    );
    expect(configExists).toBe(true);

    // 2. 发送消息
    const { stdout } = await executeCLI('chat "Hello"', {
      cwd: tempDir
    });
    expect(stdout).toContain('Test response');

    // 3. 检查历史
    const historyExists = await fileExists(
      path.join(tempDir, 'history.json')
    );
    expect(historyExists).toBe(true);
  });
});
```

---

## 相关文档

- [API文档](./API.md)
- [测试配置](../vitest.config.js)
- [单元测试](../tests/unit)
