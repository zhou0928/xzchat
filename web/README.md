# xzChat Web UI

基于 NewAPI 的智能对话终端 - Web 界面

## 功能特性

### 💬 聊天功能
- ✅ 流式响应支持
- ✅ Markdown 渲染
- ✅ 代码高亮
- ✅ 多轮对话
- ✅ 实时消息同步

### 📁 会话管理
- ✅ 创建/删除/重命名会话
- ✅ 会话搜索
- ✅ 导出/导入会话
- ✅ 本地存储
- ✅ 会话统计

### ⚙️ 设置管理
- ✅ API 配置（Base URL, API Key, Model）
- ✅ Temperature 和 Max Tokens 参数
- ✅ 快捷预设（OpenAI, Azure, Anthropic）
- ✅ API 连接测试
- ✅ 深色/浅色主题切换
- ✅ 导出/导入设置

### 🔌 插件系统
- ✅ 插件管理界面
- ✅ 插件加载/启用/禁用
- ✅ 插件命令执行
- ✅ WebSocket 实时通信
- ✅ 插件详情查看
- ✅ 插件市场

### 🎨 UI 特性
- ✅ 响应式设计
- ✅ 现代化界面
- ✅ 键盘快捷键
- ✅ 深色/浅色主题
- ✅ 流畅动画

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动 Web UI

```bash
npm run web
```

访问: http://localhost:3000

## 使用指南

### 首次配置

1. 打开设置面板（点击 ⚙️ 图标）
2. 填写 API 配置：
   - Base URL: API 服务地址（如 `https://api.openai.com/v1`）
   - API Key: 你的 API 密钥
   - Model: 模型名称（如 `gpt-3.5-turbo`）
3. 点击"测试连接"验证配置
4. 点击"保存"

### 聊天

1. 在输入框输入消息
2. 按 Enter 发送，Shift+Enter 换行
3. AI 将流式返回响应

### 插件管理

1. 点击插件图标（🔌）打开插件管理
2. 点击"扫描插件"加载插件
3. 对插件进行加载、启用、禁用等操作
4. 在聊天中使用插件命令

详见：[插件使用指南](./WEB_PLUGINS_GUIDE.md)

### 会话管理

- 新建会话：点击侧边栏"+ 新建对话"
- 删除会话：悬停在会话上点击 🗑️
- 重命名会话：悬停在会话上点击 ✏️
- 导出会话：在会话菜单选择"导出"

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建对话 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |

## 插件开发

详见：[插件开发指南](./PLUGIN_DEVELOPMENT.md)

### 快速创建插件

1. 在 `plugins/` 目录创建文件夹
2. 创建 `package.json` 和 `index.js`
3. 实现插件类
4. 在 Web UI 中扫描并加载

## 部署

详见：[部署指南](./DEPLOYMENT.md)

### PM2 部署

```bash
npm install -g pm2
pm2 start web-start.js --name xzchat-web
pm2 save
pm2 startup
```

### Docker 部署

```bash
docker build -t xzchat-web .
docker run -d -p 3000:3000 --name xzchat-web xzchat-web
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## API 文档

### 聊天 API

#### 发送消息（流式）

```http
POST /api/chat
Content-Type: application/json

{
  "sessionId": "session-id",
  "message": "你好",
  "settings": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-...",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

#### 测试 API 连接

```http
POST /api/test
Content-Type: application/json

{
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "model": "gpt-3.5-turbo"
}
```

### 插件 API

详见：[插件使用指南](./WEB_PLUGINS_GUIDE.md)

## 技术栈

### 后端
- Node.js
- Express
- Socket.IO
- 原生 ES Modules

### 前端
- 原生 JavaScript
- CSS3
- WebSocket
- marked.js (Markdown)
- highlight.js (代码高亮)

## 项目结构

```
web/
├── dist/
│   ├── css/
│   │   └── style.css          # 样式文件
│   ├── js/
│   │   ├── app.js             # 主应用逻辑
│   │   ├── chat.js            # 聊天功能
│   │   ├── session.js         # 会话管理
│   │   ├── settings.js        # 设置管理
│   │   └── plugins.js        # 插件管理
│   ├── index.html             # 主页面
│   └── plugins.html          # 插件管理页面
├── api/
│   ├── chat.js               # 聊天 API
│   ├── session.js            # 会话 API
│   ├── config.js             # 配置 API
│   └── plugins.js            # 插件 API
├── server.js                 # 服务器
├── DEPLOYMENT.md            # 部署指南
├── WEB_PLUGINS_GUIDE.md    # 插件使用指南
├── PLUGIN_DEVELOPMENT.md   # 插件开发指南
└── README.md               # 本文件
```

## 支持的 API 提供商

- OpenAI
- Azure OpenAI
- Anthropic (Claude)
- 任何兼容 OpenAI API 的服务

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 版本

v2.3.5

## 更新日志

### v2.3.5 (2026-01-29)
- ✅ 完整的 Web UI 实现
- ✅ 聊天功能（流式响应、Markdown、代码高亮）
- ✅ 会话管理
- ✅ 设置面板
- ✅ 插件系统集成
- ✅ 主题切换
- ✅ 响应式设计
- ✅ 部署支持（PM2、Docker、Nginx）

## 联系方式

如有问题或建议，请提交 Issue。
