# xzChat 常见问题解答 (FAQ)

## 目录

- [安装和配置](#安装和配置)
- [使用和命令](#使用和命令)
- [性能和优化](#性能和优化)
- [错误和故障排除](#错误和故障排除)
- [高级功能](#高级功能)
- [安全和隐私](#安全和隐私)

---

## 安装和配置

### Q1: 如何安装 xzChat?

```bash
npm install -g xz-chat
# 或
npx xiaozhou-chat
```

### Q2: 如何配置 API Key?

有两种方式：

**方式 1: 使用交互式配置向导**
```bash
xzchat
> /config init
```

**方式 2: 手动编辑配置文件**
```bash
~/.newapi-chat-config.json
# 或项目级
.newapi-chat-config.json
```

### Q3: 支持哪些 API 提供商?

- OpenAI
- Claude (Anthropic)
- DeepSeek
- Moonshot (Kimi)
- NewAPI (Tribios)
- 任何兼容 OpenAI API 的自定义端点

### Q4: 配置文件在哪里?

全局配置: `~/.newapi-chat-config.json`
项目配置: `<project>/.newapi-chat-config.json`

项目配置会覆盖全局配置。

### Q5: 如何使用环境变量配置?

```bash
export NEWAPI_API_KEY="sk-xxx"
export NEWAPI_BASE_URL="https://api.openai.com/v1"
export NEWAPI_MODEL="gpt-4"
export NEWAPI_PROVIDER="openai"
export NEWAPI_SYSTEM_PROMPT="你是一个助手"
```

---

## 使用和命令

### Q6: 如何开始对话?

```bash
xzchat
```

然后直接输入消息即可。

### Q7: 常用命令有哪些?

- `/help` - 显示帮助
- `/clear` - 清空对话历史
- `/load <file>` - 加载文件上下文
- `/scan` - 扫描当前目录
- `/session` - 会话管理
- `/git` - Git 操作
- `/exit` - 退出

### Q8: 如何加载文件到对话?

```bash
# 加载单个文件
/load lib/chat.js

# 加载并创建备份
/load lib/chat.js --create-backup
```

### Q9: 如何使用 Git 集成?

```bash
# 查看状态
/git status

# 添加文件
/git add .

# 提交（AI 生成提交消息）
/git commit

# 查看历史
/git log

# 查看差异
/git diff
```

### Q10: 如何管理多个会话?

```bash
# 列出所有会话
/session list

# 创建新会话
/session new

# 切换会话
/session use <session-id>

# 删除会话
/session delete <session-id>

# 克隆会话
/session clone <src> <tgt>
```

### Q11: 如何使用分支系统?

```bash
# 列出分支
/branch list

# 创建分支
/branch create <name>

# 切换分支
/branch switch <branch-id>

# 合并分支
/branch merge <branch-id>
```

### Q12: 如何使用 RAG 搜索?

```bash
# 建立索引
/index

# 搜索代码库
/rag "搜索查询"

# 搜索特定数量
/rag "搜索查询" --top-k=10
```

---

## 性能和优化

### Q13: 如何提高响应速度?

1. **使用更快的模型**: GPT-4o-mini 比 GPT-4 更快
2. **减少上下文**: 使用 `/undo` 清理不需要的历史
3. **启用缓存**: RAG 搜索会自动缓存
4. **调整 tokens**: 减少 `maxTokens` 设置

### Q14: 如何降低 API 成本?

1. **使用经济模型**: GPT-3.5-turbo 比 GPT-4 便宜
2. **设置合理的 maxTokens**: 避免生成过长内容
3. **使用缓存**: RAG 缓存减少重复请求
4. **查看成本统计**: `/cost` 查看花费

### Q15: 如何处理大型代码库?

```bash
# 使用 RAG 索引
/index

# 使用并行处理（更快）
/index --concurrency=5

# 增量索引（仅新文件）
/index --force
```

### Q16: Token 使用过多怎么办?

1. 检查对话历史，清理不必要的内容
2. 减少 `maxTokens` 设置
3. 使用更简洁的系统提示词
4. 使用摘要功能压缩历史

---

## 错误和故障排除

### Q17: 提示 "API Key not found"

**解决方法:**
1. 检查配置文件是否存在
2. 确认 API Key 已正确填写
3. 检查环境变量设置

```bash
# 验证配置
/config validate
```

### Q18: 提示 "Connection failed" 或 "Network error"

**可能原因:**
1. 网络连接问题
2. 代理设置问题
3. API 端点不可访问

**解决方法:**
```bash
# 检查网络
ping api.openai.com

# 设置代理
export HTTP_PROXY=http://proxy:port
export HTTPS_PROXY=http://proxy:port

# 或忽略代理
unset HTTP_PROXY HTTPS_PROXY
```

### Q19: 提示 "Model not found" 或 "Invalid model"

**解决方法:**
1. 确认模型名称拼写正确
2. 检查 API 提供商是否支持该模型
3. 尝试切换模型

```bash
# 切换模型
/config --model=gpt-4o-mini
```

### Q20: 提示 "Rate limit exceeded"

**解决方法:**
1. 等待一段时间后重试
2. 检查 API 额度
3. 考虑升级 API 计划
4. 使用多个 API Key 轮询

### Q21: 出现 "400 Bad Request" 错误

**可能原因:**
1. 参数格式错误
2. 模型不支持的功能
3. Token 超过限制

**解决方法:**
1. 检查配置
2. 禁用高级功能（如 Tools）
3. 减少上下文长度

### Q22: 配置文件损坏怎么办?

```bash
# 使用配置向导重新配置
/config init

# 或使用自动修复
/config repair
```

---

## 高级功能

### Q23: 如何使用自定义系统提示词?

```bash
# 设置系统提示词
/config set systemPrompt "你是Python专家"

# 或使用角色切换
/role coder
```

### Q24: 如何批量处理多个文件?

```bash
# 扫描目录后询问 AI
/scan

# 或逐个加载
/load file1.js
/load file2.js
/load file3.js
```

### Q25: 如何导出对话历史?

```bash
# 导出为 JSON
/session export my-conversation --format=json

# 导出为 Markdown
/session export my-conversation --format=markdown
```

### Q26: 如何使用插件?

xzChat 暂未支持插件系统，但可以通过以下方式扩展：

1. **自定义命令**: 创建自己的命令脚本
2. **Shell 集成**: 使用 `/!` 执行 Shell 命令
3. **API 集成**: 使用外部 API 服务

### Q27: 如何调试问题?

```bash
# 启用调试日志
export XZCHAT_LOG_LEVEL=DEBUG

# 查看日志文件
tail -f ~/.newapi-chat-logs/xzchat-$(date +%Y-%m-%d).log
```

---

## 安全和隐私

### Q28: API Key 安全吗?

- 配置文件存储在本地
- 建议将 `.newapi-chat-config.json` 添加到 `.gitignore`
- 可以使用环境变量存储敏感信息

### Q29: 对话历史存储在哪里?

默认位置: `~/.newapi-chat-history.json`

你可以:
1. 定期清理历史
2. 导出重要对话后删除
3. 设置自定义历史文件路径

### Q30: 会使用我的数据训练模型吗?

**不会。**
- 对话仅发送到你配置的 API 提供商
- 不存储在第三方服务器
- 本地记录仅供调试使用

### Q31: 如何安全地共享对话?

```bash
# 导出对话
/session export my-conversation --format=markdown

# 检查并移除敏感信息
# 然后共享导出的文件
```

### Q32: API Key 泄露了怎么办?

1. **立即撤销**: 在 API 提供商控制台撤销
2. **重新生成**: 生成新的 API Key
3. **更新配置**: 更新本地配置
4. **检查日志**: 查看是否有泄露

---

## 其他问题

### Q33: 如何更新 xzChat?

```bash
npm update -g xz-chat
# 或
npx xiaozhou-chat@latest
```

### Q34: 如何卸载 xzChat?

```bash
npm uninstall -g xz-chat

# 清理配置文件
rm ~/.newapi-chat-config.json
rm ~/.newapi-chat-history.json
rm -rf ~/.newapi-chat-logs
```

### Q35: 如何获取帮助?

- 查看文档: `README.md`
- 运行帮助: `/help`
- 查看示例: `/example`
- 提交 Issue: GitHub Issues

### Q36: 支持 Windows 吗?

支持！xzChat 支持 macOS、Linux 和 Windows。

Windows 上可能需要：
- 管理员权限运行
- 配置正确的 Git 路径

### Q37: 离线可以使用吗?

部分功能可以离线使用：
- ✅ 查看历史
- ✅ 导出对话
- ✅ 配置管理
- ❌ AI 对话（需要网络）
- ❌ RAG 搜索（需要网络）

### Q38: 可以在服务器上运行吗?

可以！建议：
1. 使用环境变量配置
2. 配置适当的日志级别
3. 使用 systemd 或 Docker 管理
4. 定期备份配置和历史

---

## 获取更多帮助

如果以上 FAQ 没有解答你的问题：

1. **查看完整文档**: `docs/` 目录
2. **查看示例**: `examples/` 目录
3. **运行测试**: `npm test`
4. **提交 Issue**: GitHub Issues
5. **加入社区**: GitHub Discussions

---

*最后更新: 2026-01-28*
