# xzChat 测试指南

## 概述

本项目使用 Vitest 作为测试框架，提供了完整的单元测试覆盖。

## 快速开始

### 安装依赖

```bash
npm install
```

这会安装以下开发依赖：
- `vitest` - 测试框架
- `@vitest/coverage-v8` - 代码覆盖率工具

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式（文件变化时自动重新运行）
npm test -- --watch

# 运行特定测试文件
npm test -- tests/unit/utils/cache.test.js

# 运行匹配模式的测试
npm test -- cache

# 显示测试 UI（需要安装 @vitest/ui）
npm run test:ui
```

### 生成覆盖率报告

```bash
npm run test:coverage
```

这会生成以下输出：
- 终端：文本格式的覆盖率报告
- `coverage/` 目录：详细的 HTML 报告和 JSON 数据

## 测试结构

```
tests/
├── unit/
│   ├── utils/
│   │   ├── cache.test.js           # 缓存系统测试
│   │   ├── cost-tracker.test.js    # 成本追踪测试
│   │   ├── validation.test.js      # 输入验证测试
│   │   └── logger.test.js         # 日志系统测试
│   ├── security.test.js            # 安全模块测试
│   ├── session-manager.test.js     # 会话管理测试
│   └── utils.test.js              # 工具函数测试
├── integration/                    # 集成测试（待添加）
├── e2e/                           # 端到端测试（待添加）
└── fixtures/                      # 测试数据（待添加）
```

## 测试文件说明

### 1. 缓存系统测试 (`tests/unit/utils/cache.test.js`)

测试 `SimpleCache` 类的功能：
- ✅ set/get 操作
- ✅ TTL 过期
- ✅ has/delete 操作
- ✅ clear/cleanup
- ✅ 统计信息
- ✅ withCache 和 withCacheAsync 装饰器

**测试用例数:** ~20

### 2. 成本追踪测试 (`tests/unit/utils/cost-tracker.test.js`)

测试 `CostTracker` 类的功能：
- ✅ 使用量记录
- ✅ 成本计算
- ✅ 会话统计
- ✅ 每日/模型分组统计
- ✅ CSV 导出
- ✅ Token 估算

**测试用例数:** ~30

### 3. 输入验证测试 (`tests/unit/utils/validation.test.js`)

测试所有验证函数：
- ✅ 文件路径验证
- ✅ 模型名称验证
- ✅ API Key 验证
- ✅ URL 验证
- ✅ 分支 ID 验证
- ✅ 会话 ID 验证
- ✅ 用户输入验证
- ✅ 命令参数验证
- ✅ JSON 验证
- ✅ 整数和端口验证
- ✅ 邮箱验证

**测试用例数:** ~40

### 4. 日志系统测试 (`tests/unit/utils/logger.test.js`)

测试 `logger` 模块：
- ✅ 不同级别的日志输出
- ✅ 日志格式
- ✅ 环境变量支持
- ✅ 数据输出

**测试用例数:** ~15

### 5. 安全模块测试 (`tests/unit/security.test.js`)

测试安全相关功能：
- ✅ 路径验证
- ✅ 命令验证
- ✅ 敏感文件检测
- ✅ 路径清理
- ✅ 敏感信息过滤

**测试用例数:** ~25

### 6. 会话管理测试 (`tests/unit/session-manager.test.js`)

测试 `SessionManager` 类：
- ✅ 保存/加载会话
- ✅ 列出/删除会话
- ✅ 导出会话
- ✅ 搜索会话
- ✅ 克隆会话

**测试用例数:** ~20

### 7. 工具函数测试 (`tests/unit/utils.test.js`)

测试通用工具函数：
- ✅ Token 估算
- ✅ 成本计算
- ✅ sleep 函数
- ✅ 文本分块

**测试用例数:** ~15

## 编写测试

### 基本测试结构

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Module Name', () => {
  beforeEach(() => {
    // 在每个测试前执行
  });

  afterEach(() => {
    // 在每个测试后执行
  });

  it('should do something', () => {
    // 测试代码
    expect(result).toBe(expected);
  });
});
```

### 异步测试

```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

### Mock 函数

```javascript
import { vi } from 'vitest';

it('should call a function', () => {
  const mockFn = vi.fn();
  mockFn('arg');
  expect(mockFn).toHaveBeenCalledWith('arg');
});
```

### 跳过测试

```javascript
it.skip('should be skipped', () => {
  // 这个测试会被跳过
});

describe.skip('Skipped Suite', () => {
  // 这个测试套件会被跳过
});
```

### 只运行特定测试

```javascript
it.only('should run only this test', () => {
  // 只运行这个测试
});
```

## 测试最佳实践

1. **测试命名**
   - 使用描述性的测试名称
   - 格式：`should do something when condition`

2. **测试隔离**
   - 每个测试应该独立运行
   - 使用 `beforeEach` 和 `afterEach` 清理状态

3. **覆盖率**
   - 目标：80%+ 的代码覆盖率
   - 重点测试核心逻辑和边界情况

4. **断言清晰**
   - 使用具体的断言
   - 提供有意义的错误消息

5. **Mock 外部依赖**
   - 避免实际的网络请求
   - 使用虚拟文件系统进行文件操作测试

## 持续集成

### GitHub Actions 配置示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## 故障排查

### 测试失败

1. 查看详细的错误信息
2. 检查测试环境是否正确设置
3. 确认依赖已安装

### 覆盖率不足

1. 查看覆盖率报告中的未覆盖代码
2. 为未覆盖的路径添加测试
3. 特别关注边界情况和错误处理

### 异步测试超时

```javascript
// 增加超时时间
it('should handle long operations', async () => {
  // ...
}, 10000); // 10秒超时
```

## 下一步

### 待添加的测试

1. **集成测试**
   - RAG 功能集成测试
   - 聊天流程集成测试

2. **端到端测试**
   - CLI 命令测试
   - 完整工作流测试

3. **性能测试**
   - 缓存性能测试
   - 大数据处理测试

## 参考资源

- [Vitest 文档](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**最后更新:** 2026-01-28
