# 配置验证模块文档

## 概述

配置验证模块为 xzChat 提供了强大的配置文件验证功能，包括：

- Schema 验证
- 错误检测和报告
- 自动修复常见问题
- 配置优化建议

## 功能特性

### 1. Schema 验证

定义配置字段的类型、格式和约束规则：

```javascript
import { validateConfig, CONFIG_SCHEMA } from './lib/utils/config-validator.js';

const config = {
  apiKey: 'sk-test123',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  provider: 'openai'
};

const result = validateConfig(config);
// { valid: true, errors: [], warnings: [] }
```

### 2. 错误检测

检测以下类型的错误：

- **类型错误**: 字段类型不匹配
- **格式错误**: API Key、URL 等格式不正确
- **范围错误**: 数值超出允许范围
- **枚举错误**: 值不在允许的选项中
- **必填错误**: 缺少必需字段
- **引用错误**: 引用的 profile 不存在

### 3. 自动修复

自动修复常见的配置问题：

```javascript
import { autoFixConfig } from './lib/utils/config-validator.js';

const brokenConfig = {
  apiKey: 'sk-test',
  baseUrl: 'https://api.openai.com/v1',
  // 缺少 currentProfile
  profiles: {}
};

const { fixed, fixes, validation } = autoFixConfig(brokenConfig);

// fixes: ["设置 currentProfile 为 "default'", "迁移顶层配置到 default profile"]
// fixed: 包含修复后的配置
```

### 4. 配置建议

基于当前配置提供改进建议：

```javascript
import { getConfigSuggestions } from './lib/utils/config-validator.js';

const minimalConfig = {
  baseUrl: 'https://api.openai.com/v1'
};

const suggestions = getConfigSuggestions(minimalConfig);
// [
//   "建议: 添加 API Key 到配置文件",
//   "建议: 设置默认 Model",
//   "建议: 使用 profiles 管理多个配置"
// ]
```

## 配置 Schema

### 主配置 Schema

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `apiKey` | string | 否 | 匹配 `^sk-` 前缀 | API 密钥 |
| `baseUrl` | string | 否 | 有效 HTTP(S) URL | API 端点 |
| `model` | string | 否 | 非空字符串 | 模型名称 |
| `provider` | string | 否 | 枚举值之一 | API 提供商 |
| `currentProfile` | string | 否 | 有效 profile 名称 | 当前激活的 profile |
| `temperature` | number | 否 | 0-2 | 生成温度 |
| `maxTokens` | number | 否 | 1-128000 | 最大 tokens |
| `systemPrompt` | string | 否 | - | 系统提示词 |
| `embeddingModel` | string | 否 | - | 嵌入模型 |
| `profiles` | object | 否 | 有效的 profile 对象 | 多配置管理 |
| `roles` | object | 否 | 有效的 role 对象 | 自定义角色 |
| `showThinking` | boolean | 否 | - | 显示思考过程 |

### Profile 配置 Schema

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `apiKey` | string | 否 | 匹配 `^sk-` 前缀 | API 密钥 |
| `baseUrl` | string | 否 | 有效 HTTP(S) URL | API 端点 |
| `model` | string | 否 | 非空字符串 | 模型名称 |
| `systemPrompt` | string | 否 | - | 系统提示词 |
| `temperature` | number | 否 | 0-2 | 生成温度 |
| `maxTokens` | number | 否 | 1-128000 | 最大 tokens |

## API 参考

### `validateConfig(config, schema?)`

验证配置对象。

**参数:**
- `config` (object): 要验证的配置对象
- `schema` (object, 可选): 自定义 Schema，默认使用 `CONFIG_SCHEMA`

**返回:**
```javascript
{
  valid: boolean,      // 是否通过验证
  errors: string[],    // 错误列表
  warnings: string[]   // 警告列表
}
```

**示例:**
```javascript
const result = validateConfig(config);
if (!result.valid) {
  console.error('配置错误:');
  result.errors.forEach(err => console.error(`  - ${err}`));
}
```

### `formatValidationResult(result)`

格式化验证结果为人类可读的字符串。

**参数:**
- `result` (object): 验证结果对象

**返回:**
- `string`: 格式化的字符串

**示例:**
```javascript
const result = validateConfig(config);
console.log(formatValidationResult(result));

// 输出:
// ✅ 配置验证通过
//
// 错误:
//   1. apiKey: 必填字段缺失
//
// 警告:
//   1. 配置缺少必要的字段
```

### `autoFixConfig(config)`

自动修复配置中的常见问题。

**参数:**
- `config` (object): 要修复的配置对象

**返回:**
```javascript
{
  fixed: object,        // 修复后的配置
  fixes: string[],      // 应用的修复列表
  validation: object    // 修复后的验证结果
}
```

**示例:**
```javascript
const { fixed, fixes, validation } = autoFixConfig(config);
console.log(`应用了 ${fixes.length} 个修复`);
console.log('修复后的配置:', fixed);
```

### `getConfigSuggestions(config)`

获取配置改进建议。

**参数:**
- `config` (object): 配置对象

**返回:**
- `string[]`: 建议列表

**示例:**
```javascript
const suggestions = getConfigSuggestions(config);
suggestions.forEach((s, i) => {
  console.log(`${i + 1}. ${s}`);
});
```

## 使用场景

### 场景 1: 启动时验证

在应用启动时验证配置：

```javascript
import { loadConfig } from './lib/config.js';
import { validateConfig, formatValidationResult } from './lib/utils/config-validator.js';

const config = loadConfig();
const validation = validateConfig(config);

if (!validation.valid) {
  console.error('配置验证失败:');
  console.error(formatValidationResult(validation));
  process.exit(1);
}

console.log('✅ 配置验证通过');
```

### 场景 2: 交互式配置

在用户配置时实时验证：

```javascript
import { validateConfig } from './lib/utils/config-validator.js';

async function interactiveSetup() {
  const config = {};

  while (true) {
    config.apiKey = await prompt('请输入 API Key: ');
    config.baseUrl = await prompt('请输入 Base URL: ');
    config.model = await prompt('请输入 Model: ');

    const validation = validateConfig(config);
    if (validation.valid) {
      break;
    }

    console.log('配置有误:');
    validation.errors.forEach(err => console.log(`  - ${err}`));
  }

  return config;
}
```

### 场景 3: 自动迁移

将旧格式配置迁移到新格式：

```javascript
import { autoFixConfig } from './lib/utils/config-validator.js';

const oldConfig = {
  apiKey: 'sk-test',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
  // 没有 profiles
};

const { fixed, fixes } = autoFixConfig(oldConfig);
console.log('迁移了以下更改:');
fixes.forEach(f => console.log(`  - ${f}`));

// 保存修复后的配置
fs.writeFileSync(configFile, JSON.stringify(fixed, null, 2));
```

### 场景 4: 配置诊断

诊断配置问题并提供解决方案：

```javascript
import { validateConfig, getConfigSuggestions, formatValidationResult } from './lib/utils/config-validator.js';

function diagnoseConfig(config) {
  console.log('配置诊断报告');
  console.log('================\n');

  // 验证配置
  const validation = validateConfig(config);
  console.log('验证结果:');
  console.log(formatValidationResult(validation));

  // 获取建议
  if (validation.warnings.length > 0) {
    console.log('\n改进建议:');
    const suggestions = getConfigSuggestions(config);
    suggestions.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s}`);
    });
  }

  // 自动修复选项
  if (!validation.valid) {
    console.log('\n是否尝试自动修复? (y/n)');
    // ... 用户选择逻辑
  }
}
```

## 最佳实践

### 1. 启动时验证

始终在应用启动时验证配置，避免运行时错误：

```javascript
const config = loadConfig();
const validation = validateConfig(config);

if (!validation.valid) {
  console.error('配置无效，无法启动');
  process.exit(1);
}
```

### 2. 提供清晰的错误消息

使用 `formatValidationResult` 提供用户友好的错误消息：

```javascript
const result = validateConfig(config);
if (!result.valid) {
  console.error(formatValidationResult(result));
}
```

### 3. 谨慎使用自动修复

自动修复可能改变配置的语义，应该在用户确认后使用：

```javascript
const { fixed, fixes } = autoFixConfig(config);

console.log('将应用以下修复:');
fixes.forEach(f => console.log(`  - ${f}`));

const confirmed = await confirm('是否继续?');
if (confirmed) {
  return fixed;
}
```

### 4. 记录验证结果

记录配置验证结果用于调试：

```javascript
const validation = validateConfig(config);
logger.info('配置验证', {
  valid: validation.valid,
  errors: validation.errors.length,
  warnings: validation.warnings.length
});
```

## 扩展和自定义

### 添加自定义验证规则

```javascript
import { validateConfig } from './lib/utils/config-validator.js';

const customSchema = {
  ...CONFIG_SCHEMA,
  customField: {
    type: 'string',
    required: false,
    validate: (value) => {
      return value && value.length > 10;
    },
    message: 'customField 必须至少10个字符'
  }
};

const result = validateConfig(config, customSchema);
```

### 自定义错误消息

```javascript
import { validateConfig, formatValidationResult } from './lib/utils/config-validator.js';

const result = validateConfig(config);
const formatted = formatValidationResult(result)
  .replace('❌', '⛔️')
  .replace('✅', '✨');

console.log(formatted);
```

## 测试

运行配置验证测试：

```bash
npm test -- tests/unit/config-validator.test.js
```

或使用 Vitest UI：

```bash
npm run test:ui
```

## 故障排除

### 问题 1: 验证总是失败

**原因**: Schema 规则可能过于严格。

**解决**: 检查字段是否真的需要验证，考虑调整 `required` 或添加默认值。

### 问题 2: 自动修复改变了不想改的值

**原因**: 自动修复逻辑可能过于激进。

**解决**: 手动应用需要的修复，或修改 `autoFixConfig` 的逻辑。

### 问题 3: 警告太多，影响用户体验

**原因**: 配置不完整但功能正常。

**解决**: 考虑将警告改为可选的，或提供 "静默模式"。

## 相关文档

- [配置文档](./API.md#配置)
- [TypeScript 类型定义](./TYPESCRIPT.md)
- [错误处理](./API.md#错误处理)
