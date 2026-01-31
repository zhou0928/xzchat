# npm test 测试问题总结

## 执行时间

运行命令: `npm test` 或 `npx vitest run`

## 发现的问题

### 1. tests/unit/errors.test.js 测试失败

**错误类型:**

1. **AuthenticationError is not a constructor**
   - 问题: `tests/unit/errors.test.js` 中测试了 `AuthenticationError` 类
   - 原因: `lib/utils/errors.js` 中没有导出 `AuthenticationError` 类
   - 现状: 该类可能在其他地方定义或不存在

2. **formatError is not a function**
   - 问题: 测试期望 `formatError` 函数
   - 原因: `lib/utils/errors.js` 导出的是 `getErrorMessage`，而不是 `formatError`
   - 现状: `formatError` 函数在 `lib/utils/themes.js` 中定义

3. **isErrorRetryable is not a function**
   - 问题: 测试期望 `isErrorRetryable` 函数
   - 原因: `lib/utils/errors.js` 导出的是 `isRetryableError`
   - 现状: 函数名称不一致

4. **API Error 状态码测试失败**
   - 问题: 测试期望 APIError 有 statusCode
   - 可能原因: APIError 的实现可能与测试期望不一致

### 2. 测试文件与实现不匹配

**tests/unit/errors.test.js 的导入:**
```javascript
import {
  XZChatError,
  ConfigError,
  APIError,
  ValidationError,        // ❌ 未导出
  AuthenticationError,     // ❌ 未导出
  NetworkError,
  formatError,             // ❌ 应该是 getErrorMessage
  isErrorRetryable         // ❌ 应该是 isRetryableError
} from '../../lib/utils/errors.js';
```

**lib/utils/errors.js 的实际导出:**
```javascript
export class XZChatError { ... }
export class ConfigError extends XZChatError { ... }
export class APIError extends XZChatError { ... }
export class FileSystemError extends XZChatError { ... }
export class NetworkError extends XZChatError { ... }
export function getErrorMessage(error) { ... }   // 不是 formatError
export function isRetryableError(error) { ... }   // 不是 isErrorRetryable
export function handleError(error, context) { ... }
```

## 建议的修复方案

### 方案 1: 修复 errors.js 添加缺失的类和函数

在 `lib/utils/errors.js` 中添加:

```javascript
export class ValidationError extends XZChatError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends XZChatError {
  constructor(message, details = {}) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export function formatError(error) {
  if (error instanceof XZChatError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    };
  }
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

export function isErrorRetryable(error) {
  return isRetryableError(error);
}
```

### 方案 2: 更新测试文件以匹配实际导出

修改 `tests/unit/errors.test.js`:

```javascript
import {
  XZChatError,
  ConfigError,
  APIError,
  FileSystemError,      // 替换 ValidationError
  NetworkError,
  getErrorMessage,      // 替换 formatError
  isRetryableError      // 替换 isErrorRetryable
} from '../../lib/utils/errors.js';

// 或者从 themes.js 导入 formatError
import { formatError } from '../../lib/utils/themes.js';
```

## 其他测试文件

目前只检查了 `tests/unit/errors.test.js`，还有其他29个单元测试文件和4个端到端测试文件需要检查。

建议的检查顺序：
1. 运行所有单元测试: `npm test -- tests/unit/`
2. 运行端到端测试: `npm test -- tests/e2e/`
3. 运行命令导入测试: `npm test -- tests/commands/`

## V3.1.1 新命令测试

新创建的 `tests/commands/v3.1.1-import.test.js` 测试所有21个新命令的导入，这个测试应该能通过。

## 快速验证

运行预提交检查脚本（已验证通过）:
```bash
npm run check:commands
```

所有42个文件（21个命令 + 21个工具库）语法检查通过 ✅

## 下一步行动

1. 修复 `errors.test.js` 中的测试问题
2. 运行所有单元测试确认其他测试文件
3. 运行端到端测试
4. 确保 V3.1.1 新命令的集成测试正常
5. 更新测试文档

## 总结

主要问题是测试文件与实际代码导出不匹配。这是因为：
- 测试可能是在不同版本的代码基础上编写的
- 代码重构后没有更新相应的测试
- 函数/类名变更后没有同步测试

建议在代码变更时同步更新测试，确保持续集成的可靠性。
