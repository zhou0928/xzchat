# 交互式配置向导文档

## 概述

xzChat 提供了交互式配置向导 `/config init`，帮助用户通过简单的问答方式完成配置。

## 功能特性

- ✅ 友好的命令行界面
- ✅ 预设的 API 提供商
- ✅ 智能模型推荐
- ✅ 配置验证和自动修复
- ✅ 多 Profile 管理
- ✅ 自定义 Roles 配置

## 使用方法

### 启动配置向导

在 xzChat 中运行：

```bash
/config init
```

或者直接运行配置向导模块：

```bash
node lib/commands/config-init.js
```

## 配置流程

### 步骤 1: 选择 API 提供商

```
请选择 API 提供商:

  [1] OpenAI
      https://api.openai.com/v1
  [2] Claude (Anthropic)
      https://api.anthropic.com/v1
  [3] DeepSeek
      https://api.deepseek.com/v1
  [4] Moonshot (Kimi)
      https://api.moonshot.cn/v1
  [5] NewAPI (Tribios)
      https://paid.tribiosapi.top/v1
  [6] 自定义

选择 (1-6) [1]:
```

### 步骤 2: 输入 API Key

```
配置 OpenAI
API Endpoint: https://api.openai.com/v1
请输入 API Key: sk-xxxxxxxxxxxxxxxx
```

### 步骤 3: 选择模型

```
请选择默认模型:

  [1] GPT-4o (最新)
      最强大的模型，支持多模态
  [2] GPT-4o Mini
      快速且经济
  [3] GPT-4 Turbo
      平衡性能和速度
  [4] GPT-3.5 Turbo
      经济实惠

选择 [1]:
```

### 步骤 4: 添加额外 Profile (可选)

配置多个 Profile 用于不同场景：

```
添加额外的 Profile (可选)
Profile 名称: work
...
Profile 名称: personal
...
继续添加 Profile? (y/n) [n]:
```

### 步骤 5: 配置 Roles (可选)

预定义的系统提示词：

```
配置自定义 Roles (可选)
Role 名称: coder
coder 的系统提示词: 你是一个资深的全栈工程师...
继续添加 Role? (y/n) [n]:
```

### 步骤 6: 高级配置 (可选)

```
高级配置 (可选)
Temperature (0-2, 默认 0.7) [0.7]:
Max Tokens (默认 2000) [2000]:
系统提示词 (留空跳过):
显示思考过程? (y/n) [n]:
```

### 步骤 7: 验证和保存

```
验证配置...

✅ 配置验证通过

════════════════════════════════════════════════════
配置摘要
════════════════════════════════════════════════════

API 提供商: openai
Base URL: https://api.openai.com/v1
Model: gpt-4o
API Key: sk-xxxx...xxxx

════════════════════════════════════════════════════
保存此配置? (y/n) [y]:

✅ 配置已保存！

你现在可以开始使用 xzChat 了。
```

## API 参考

### `runConfigWizard(options?)`

启动交互式配置向导。

**参数:**
- `options` (object, 可选): 配置选项
  - `skipWelcome` (boolean): 跳过欢迎信息
  - `defaultProvider` (string): 默认提供商

**返回:**
- `Promise<void>`: 异步函数，无返回值

**示例:**
```javascript
import { runConfigWizard } from './lib/commands/config-init.js';

await runConfigWizard();
```

## 支持的 API 提供商

| 提供商 | ID | Endpoint | 推荐模型 |
|--------|-----|----------|----------|
| OpenAI | `openai` | https://api.openai.com/v1 | gpt-4o |
| Claude | `claude` | https://api.anthropic.com/v1 | claude-3-sonnet |
| DeepSeek | `deepseek` | https://api.deepseek.com/v1 | deepseek-chat |
| Moonshot | `moonshot` | https://api.moonshot.cn/v1 | moonshot-v1-8k |
| NewAPI | `newapi` | https://paid.tribiosapi.top/v1 | claude-sonnet-4-5-20250929 |
| 自定义 | `custom` | 用户指定 | 用户指定 |

## 最佳实践

### 1. 使用 Profile 管理多配置

为不同环境创建不同的 Profile：

```javascript
profiles: {
  work: {
    apiKey: 'sk-work-xxx',
    baseUrl: 'https://company-api.com/v1',
    model: 'gpt-4'
  },
  personal: {
    apiKey: 'sk-personal-xxx',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini'
  }
}
```

### 2. 使用 Roles 快速切换角色

预定义常用的系统提示词：

```javascript
roles: {
  coder: '你是一个资深的全栈工程师...',
  writer: '你是一个专业的文案创作者...',
  translator: '你是一个精通中英文的翻译专家...'
}
```

### 3. 合理设置 Temperature

- `0.0-0.3`: 适合需要精确输出的场景（代码生成、文档写作）
- `0.4-0.7`: 适合一般对话场景（默认值）
- `0.8-1.2`: 适合创意场景（创意写作、头脑风暴）
- `1.3-2.0`: 适合需要更多随机性的场景（实验性）

### 4. 配置验证后保存

配置向导会自动验证配置并尝试修复问题，确保保存有效配置。

## 故障排除

### 问题 1: API Key 验证失败

**症状**: 配置后提示 API Key 无效

**解决:**
1. 检查 API Key 是否正确
2. 确认 API Key 是否有足够的额度
3. 检查网络连接

### 问题 2: Base URL 无法访问

**症状**: 连接 API 时出现网络错误

**解决:**
1. 检查 Base URL 是否正确
2. 检查网络代理设置
3. 尝试使用不同的端点

### 问题 3: 模型不存在

**症状**: 使用时提示模型不存在

**解决:**
1. 确认模型名称拼写正确
2. 检查 API 提供商是否支持该模型
3. 尝试切换到其他推荐模型

## 相关文档

- [配置文档](./CONFIG_VALIDATION.md)
- [API 文档](./API.md)
- [配置验证](./CONFIG_VALIDATION.md)
