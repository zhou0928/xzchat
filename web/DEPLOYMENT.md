# xzChat Web UI 部署指南

## 快速开始

### 1. 本地开发

```bash
# 安装依赖
npm install

# 启动 Web UI
npm run web
```

访问: http://localhost:3000

### 2. 服务器部署

#### 方式一：直接部署（PM2）

```bash
# 安装 PM2
npm install -g pm2

# 创建启动脚本
cat > web-start.js << 'EOF'
import { startWebUI } from './web/server.js';

startWebUI({ port: 3000, host: '0.0.0.0' });
EOF

# 启动服务
pm2 start web-start.js --name xzchat-web

# 保存配置
pm2 save
pm2 startup
```

#### 方式二：Docker 部署

```bash
# 构建镜像
docker build -t xzchat-web .

# 运行容器
docker run -d -p 3000:3000 --name xzchat-web xzchat-web
```

#### 方式三：使用 Nginx 反向代理

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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 配置说明

### API 配置

首次使用需要配置 API 信息：

1. 点击设置按钮 (⚙️)
2. 填写以下信息：
   - Base URL: API 服务地址（如 https://api.openai.com/v1）
   - API Key: 你的 API 密钥
   - Model: 模型名称（如 gpt-3.5-turbo）
3. 点击"测试连接"验证配置
4. 点击"保存"

### 支持的 API

- OpenAI
- Azure OpenAI
- Anthropic Claude
- 任何兼容 OpenAI API 的服务

## 功能特性

### 聊天功能
- ✅ 流式响应
- ✅ Markdown 渲染
- ✅ 代码高亮
- ✅ 多轮对话

### 会话管理
- ✅ 创建/删除/重命名会话
- ✅ 会话搜索
- ✅ 导出/导入会话
- ✅ 本地存储

### 其他功能
- ✅ 深色/浅色主题切换
- ✅ 响应式设计
- ✅ 键盘快捷键
- ✅ 实时连接状态

## 快捷键

- `Ctrl/Cmd + N`: 新建对话
- `Enter`: 发送消息
- `Shift + Enter`: 换行

## 故障排除

### WebSocket 连接失败

检查服务器防火墙设置，确保 WebSocket 端口开放。

### API 请求失败

1. 确认 Base URL 正确
2. 检查 API Key 是否有效
3. 验证模型名称是否正确

### 样式加载失败

清除浏览器缓存并刷新页面。

## 技术栈

- 后端: Node.js + Express + Socket.IO
- 前端: 原生 JavaScript + CSS
- Markdown: marked.js
- 代码高亮: highlight.js

## 版本

当前版本: 2.3.5

## 许可证

MIT
