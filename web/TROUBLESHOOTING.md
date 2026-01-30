# Web UI 故障排除指南

## 发送消息失败

### 问题：点击发送按钮没有反应

**可能原因和解决方案：**

1. **未配置 API 设置**
   - 点击设置按钮（⚙️）
   - 填写以下信息：
     - Base URL: 如 `https://api.openai.com/v1`
     - API Key: 你的 API 密钥
     - Model: 如 `gpt-3.5-turbo`
   - 点击"测试连接"验证
   - 点击"保存"

2. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 标签页
   - 查看错误信息

3. **使用调试工具**
   - 在控制台输入：`debug.showSettings()`
   - 检查设置是否正确
   - 在控制台输入：`debug.testChat('测试')`
   - 查看详细错误

### 问题：显示"请先配置 API 设置"

**解决方案：**
1. 点击设置按钮（⚙️）
2. 填写 Base URL 和 API Key
3. 点击"保存"

## 常见错误信息

### 1. "发送失败: HTTP 401"

**原因**: API Key 无效

**解决**:
- 检查 API Key 是否正确
- 确认 API Key 没有过期
- 重新获取 API Key

### 2. "发送失败: HTTP 404"

**原因**: Base URL 错误

**解决**:
- 检查 Base URL 是否正确
- 确保包含 `/v1` 后缀
- 示例: `https://api.openai.com/v1`

### 3. "发送失败: HTTP 429"

**原因**: API 请求超限

**解决**:
- 等待一段时间后重试
- 检查 API 使用配额
- 升级 API 计划

### 4. "发送失败: HTTP 500"

**原因**: 服务器错误

**解决**:
- 检查服务器日志
- 重启 Web UI 服务器
- 查看网络连接

## 调试工具

### 快速测试

```javascript
// 测试所有端点
debug.testAllEndpoints()

// 查看当前设置
debug.showSettings()

// 查看会话列表
debug.showSessions()

// 测试聊天
debug.testChat('你好')

// 清除所有数据
debug.clearAllData()
```

### 检查网络请求

1. 打开开发者工具（F12）
2. 切换到 Network 标签页
3. 发送消息
4. 查找 `/api/chat` 请求
5. 检查请求和响应详情

## WebSocket 连接问题

### 状态指示器显示红色

**检查步骤**:
1. 查看控制台错误信息
2. 确认服务器正在运行
3. 检查防火墙设置
4. 确认端口号正确

### 无法实时同步消息

**解决方案**:
1. 刷新页面
2. 检查 WebSocket 连接状态
3. 查看控制台 WebSocket 事件

## 插件功能问题

### 插件列表为空

**解决方案**:
1. 点击"扫描插件"按钮
2. 检查插件目录是否存在
3. 查看服务器日志

### 插件命令不工作

**解决方案**:
1. 确认插件已启用
2. 检查命令拼写
3. 查看插件详情确认命令格式
4. 查看控制台错误

## 性能问题

### 页面加载慢

**优化建议**:
1. 清除浏览器缓存
2. 使用现代浏览器
3. 检查网络连接
4. 关闭不必要的浏览器扩展

### 消息响应慢

**优化建议**:
1. 减少 maxTokens 值
2. 调整 temperature 参数
3. 使用更快的模型
4. 检查 API 响应时间

## 浏览器兼容性

### 支持的浏览器

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 不支持的浏览器

- ❌ IE 11
- ❌ 旧版浏览器

## 获取帮助

如果问题仍未解决：

1. 查看浏览器控制台日志
2. 查看服务器端日志
3. 运行调试工具
4. 提交 Issue 并附上：
   - 浏览器版本
   - 错误信息
   - 复现步骤
   - 控制台日志

## 常用配置示例

### OpenAI 配置

```
Base URL: https://api.openai.com/v1
API Key: sk-xxxxxxxx
Model: gpt-3.5-turbo
Temperature: 0.7
Max Tokens: 2000
```

### Azure OpenAI 配置

```
Base URL: https://YOUR_RESOURCE.openai.azure.com
API Key: YOUR_API_KEY
Model: gpt-35-turbo
Temperature: 0.7
Max Tokens: 2000
```

### Anthropic 配置

```
Base URL: https://api.anthropic.com/v1
API Key: sk-ant-xxxxxxxx
Model: claude-3-sonnet-20240229
Temperature: 0.7
Max Tokens: 2000
```

## 重置所有数据

如果遇到无法解决的问题，可以重置所有数据：

```javascript
debug.clearAllData()
```

或者手动清除：
1. 打开浏览器开发者工具
2. 切换到 Application 标签页
3. 展开 Local Storage
4. 删除 `xzchat_sessions` 和 `xzchat_settings`
5. 刷新页面
