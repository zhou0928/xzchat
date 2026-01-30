# 测试覆盖率提升指南

## 目录

- [概述](#概述)
- [当前覆盖率状态](#当前覆盖率状态)
- [覆盖率目标](#覆盖率目标)
- [测试策略](#测试策略)
- [提升覆盖率](#提升覆盖率)
- [覆盖率报告](#覆盖率报告)
- [最佳实践](#最佳实践)

---

## 概述

本文档指导如何提升 xzChat 项目的测试覆盖率至 90%+。

### 覆盖率类型

- **行覆盖率** (Line Coverage) - 执行的代码行比例
- **分支覆盖率** (Branch Coverage) - 执行的条件分支比例
- **函数覆盖率** (Function Coverage) - 调用的函数比例
- **语句覆盖率** (Statement Coverage) - 执行的语句比例

### 目标

- **总体目标**: 90%+
- **核心模块**: 95%+
- **工具模块**: 85%+
- **UI模块**: 80%+

---

## 当前覆盖率状态

### 模块覆盖率分析

| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 | 状态 |
|------|---------|-----------|-----------|------|
| `lib/utils/logger.js` | 95%+ | 90%+ | 100% | ✅ |
| `lib/utils/cache.js` | 90%+ | 85%+ | 100% | ✅ |
| `lib/themes/index.js` | 90%+ | 85%+ | 95%+ | ✅ |
| `lib/i18n/index.js` | 90%+ | 85%+ | 95%+ | ✅ |
| `lib/utils/progress.js` | 90%+ | 85%+ | 95%+ | ✅ |
| `lib/utils/connection-pool.js` | 90%+ | 85%+ | 95%+ | ✅ |
| `lib/utils/errors.js` | 85%+ | 80%+ | 90%+ | 🟡 |
| `lib/utils/file-loader.js` | 85%+ | 80%+ | 90%+ | 🟡 |
| `lib/audio.js` | 70%+ | 60%+ | 80%+ | 🔴 |
| `lib/mcp-lite.js` | 70%+ | 60%+ | 80%+ | 🔴 |
| `lib/chat.js` | 75%+ | 65%+ | 85%+ | 🔴 |
| `lib/tools.js` | 80%+ | 70%+ | 85%+ | 🟡 |
| `lib/config.js` | 85%+ | 75%+ | 90%+ | 🟡 |
| `lib/history.js` | 85%+ | 75%+ | 90%+ | 🟡 |
| `lib/rag.js` | 80%+ | 70%+ | 85%+ | 🟡 |

**图例**:
- ✅ 达到目标 (90%+)
- 🟡 需要改进 (75-89%)
- 🔴 需要重点提升 (<75%)

---

## 覆盖率目标

### 短期目标 (1-2周)

- [x] `lib/utils/logger.js` - 95%+
- [x] `lib/utils/cache.js` - 90%+
- [x] `lib/themes/index.js` - 90%+
- [x] `lib/i18n/index.js` - 90%+
- [x] `lib/utils/progress.js` - 90%+
- [x] `lib/utils/connection-pool.js` - 90%+

### 中期目标 (2-4周)

- [ ] `lib/utils/errors.js` - 90%+
- [ ] `lib/utils/file-loader.js` - 90%+
- [ ] `lib/tools.js` - 90%+
- [ ] `lib/config.js` - 90%+
- [ ] `lib/history.js` - 90%+
- [ ] `lib/rag.js` - 90%+

### 长期目标 (1-2个月)

- [ ] `lib/audio.js` - 85%+
- [ ] `lib/mcp-lite.js` - 85%+
- [ ] `lib/chat.js` - 85%+
- [ ] **总体覆盖率** - **90%+**

---

## 测试策略

### 1. 单元测试补充

针对覆盖率不足的模块补充单元测试:

```javascript
// 示例: 为未覆盖的分支添加测试
describe('函数边界测试', () => {
  it('应该测试边界条件', () => {
    expect(func(0)).toBe('zero');
    expect(func(1)).toBe('one');
    expect(func(-1)).toBe('negative');
  });

  it('应该测试null/undefined', () => {
    expect(func(null)).toBe('null');
    expect(func(undefined)).toBe('undefined');
  });
});
```

### 2. 集成测试增强

增强模块间的集成测试:

```javascript
describe('模块集成测试', () => {
  it('应该测试模块A和模块B的交互', async () => {
    const moduleA = new ModuleA();
    const moduleB = new ModuleB();

    const result = await moduleA.process(moduleB.data);
    expect(result).toBeDefined();
  });
});
```

### 3. E2E测试扩展

扩展端到端测试覆盖更多场景:

```javascript
describe('完整用户流程', () => {
  it('应该测试从配置到聊天的完整流程', async () => {
    // 1. 初始化配置
    await executeCLI('config init');

    // 2. 设置API密钥
    await executeCLI('config --api-key=test-key');

    // 3. 发送消息
    const result = await executeCLI('chat "Hello"');

    // 4. 验证结果
    expect(result.success).toBe(true);
  });
});
```

### 4. 边界和异常测试

重点测试边界条件和异常情况:

```javascript
describe('边界和异常测试', () => {
  it('应该处理空输入', () => {
    expect(func('')).toBe('empty');
  });

  it('应该处理超长输入', () => {
    const longInput = 'A'.repeat(10000);
    expect(func(longInput)).toBeDefined();
  });

  it('应该处理特殊字符', () => {
    expect(func('\0\n\t\r')).toBeDefined();
  });

  it('应该抛出预期的错误', () => {
    expect(() => func(invalidInput)).toThrow();
  });
});
```

### 5. 分支覆盖优化

确保所有条件分支都被测试:

```javascript
describe('分支覆盖', () => {
  it('应该覆盖所有if分支', () => {
    // 条件为true
    expect(func(true)).toBe('true');

    // 条件为false
    expect(func(false)).toBe('false');
  });

  it('应该覆盖所有switch case', () => {
    expect(switchFunc('case1')).toBe('result1');
    expect(switchFunc('case2')).toBe('result2');
    expect(switchFunc('default')).toBe('default');
  });

  it('应该覆盖所有try/catch分支', async () => {
    // 正常流程
    await func(true);

    // 异常流程
    await expect(func(false)).rejects.toThrow();
  });
});
```

---

## 提升覆盖率

### 步骤1: 生成覆盖率报告

```bash
npm run test:coverage
```

### 步骤2: 分析未覆盖代码

```bash
# 查看HTML覆盖率报告
open coverage/index.html

# 查看未覆盖的文件
cat coverage/lcov-report/index.html | grep "coverage-summary"
```

### 步骤3: 识别未覆盖区域

在覆盖率报告中,查找:
- 🔴 红色标记的未覆盖行
- 🟡 黄色标记的部分覆盖行
- 未覆盖的函数
- 未覆盖的分支

### 步骤4: 编写补充测试

为未覆盖的代码编写测试:

```javascript
// 未覆盖代码示例
if (condition) {
  return doSomething();
} else {
  return doSomethingElse();
}

// 补充测试
it('应该测试if分支', () => {
  expect(func(true)).toBe(doSomethingResult);
});

it('应该测试else分支', () => {
  expect(func(false)).toBe(doSomethingElseResult);
});
```

### 步骤5: 验证覆盖率提升

```bash
npm run test:coverage

# 比较前后覆盖率
git diff coverage/coverage-summary.json
```

---

## 覆盖率报告

### 生成报告

```bash
# 文本报告
npm run test:coverage -- --reporter=text

# HTML报告
npm run test:coverage -- --reporter=html

# JSON报告
npm run test:coverage -- --reporter=json

# LCOV报告
npm run test:coverage -- --reporter=lcov
```

### 查看报告

```bash
# 查看HTML报告
open coverage/index.html

# 查看文本报告
cat coverage/coverage-final.txt
```

### 覆盖率阈值配置

在 `vitest.config.js` 中设置阈值:

```javascript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      lines: 90,      // 行覆盖率阈值
      functions: 90,  // 函数覆盖率阈值
      branches: 85,    // 分支覆盖率阈值
      statements: 90   // 语句覆盖率阈值
    }
  }
});
```

---

## 最佳实践

### 1. 测试优先级

按优先级编写测试:

1. **P0 - 核心功能** - 基本聊天、配置管理
2. **P1 - 重要功能** - 会话管理、工具系统
3. **P2 - 辅助功能** - 日志、缓存
4. **P3 - 边缘功能** - UI美化、主题

### 2. 测试独立性

每个测试应该独立运行:

```javascript
describe('独立测试', () => {
  beforeEach(async () => {
    // 每个测试前创建独立环境
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    // 每个测试后清理环境
    await cleanupTempDir(tempDir);
  });

  it('测试用例1', async () => {
    // 不依赖其他测试
  });

  it('测试用例2', async () => {
    // 不依赖其他测试
  });
});
```

### 3. 使用测试辅助工具

利用辅助工具简化测试:

```javascript
import {
  createTempDir,
  mockFetch,
  waitForCondition
} from './helpers.js';

describe('使用辅助工具', () => {
  it('应该简化测试代码', async () => {
    const tempDir = await createTempDir();
    mockFetch({ data: 'test' });

    await waitForCondition(async () => {
      return await condition();
    });
  });
});
```

### 4. 持续集成

在CI/CD中运行覆盖率测试:

```yaml
# .github/workflows/coverage.yml
name: Coverage

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### 5. 定期审查

定期审查覆盖率报告:

- 每周检查一次覆盖率变化
- 识别覆盖率下降的模块
- 及时补充测试用例
- 保持覆盖率持续提升

---

## 覆盖率提升技巧

### 1. 覆盖所有代码路径

```javascript
// 原代码
function processData(data) {
  if (data) {
    return data.trim();
  }
  return '';
}

// 测试
it('应该处理有效数据', () => {
  expect(processData('  test  ')).toBe('test');
});

it('应该处理null/undefined', () => {
  expect(processData(null)).toBe('');
  expect(processData(undefined)).toBe('');
});
```

### 2. 覆盖所有错误场景

```javascript
// 原代码
try {
  await riskyOperation();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    return 'connection refused';
  }
  return 'unknown error';
}

// 测试
it('应该处理连接拒绝', async () => {
  mockError({ code: 'ECONNREFUSED' });
  expect(await func()).toBe('connection refused');
});

it('应该处理其他错误', async () => {
  mockError({ code: 'ENOTFOUND' });
  expect(await func()).toBe('unknown error');
});
```

### 3. 覆盖异步代码

```javascript
// 原代码
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}

// 测试
it('应该成功获取数据', async () => {
  mockFetch({ data: 'success' });
  expect(await fetchWithRetry('url')).toBeDefined();
});

it('应该在重试后失败', async () => {
  let attempts = 0;
  mockFetch(() => {
    attempts++;
    if (attempts < 3) throw new Error('Error');
    return { data: 'success' };
  });

  expect(await fetchWithRetry('url')).toBeDefined();
});
```

### 4. 覆盖所有状态

```javascript
// 原代码
function handleStatus(status) {
  switch (status) {
    case 'active':
      return 'running';
    case 'paused':
      return 'stopped';
    case 'completed':
      return 'done';
    default:
      return 'unknown';
  }
}

// 测试
it('应该处理所有状态', () => {
  expect(handleStatus('active')).toBe('running');
  expect(handleStatus('paused')).toBe('stopped');
  expect(handleStatus('completed')).toBe('done');
  expect(handleStatus('invalid')).toBe('unknown');
});
```

---

## 故障排除

### 问题: 覆盖率不上升

**原因**: 测试没有覆盖新的代码路径

**解决方案**:
- 检查测试是否真的执行了目标代码
- 使用调试工具验证执行路径
- 添加更多边界和异常测试

### 问题: 覆盖率下降

**原因**: 新代码没有对应的测试

**解决方案**:
- 为新代码编写测试
- 确保测试通过后再合并
- 设置覆盖率阈值防止下降

### 问题: 分支覆盖率低

**原因**: 条件分支未被全部测试

**解决方案**:
- 确保每个if/else都被测试
- 测试所有switch case
- 测试所有try/catch分支

---

## 总结

提升测试覆盖率是一个持续的过程,需要:

1. **定期分析**覆盖率报告
2. **持续补充**缺失的测试
3. **保持质量**而非仅仅追求数字
4. **关注核心**功能的覆盖率
5. **利用工具**自动化覆盖率跟踪

通过系统化的测试策略和持续的努力,可以将 xzChat 的测试覆盖率提升至 90%+!

---

## 相关文档

- [E2E测试指南](./E2E_TESTING.md)
- [测试配置](../vitest.config.js)
- [最佳实践](./BEST_PRACTICES.md)
