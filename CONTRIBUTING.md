# Contributing to xzChat

感谢你对 xzChat 项目的关注！我们欢迎任何形式的贡献。

## 🤝 如何贡献

### 报告 Bug

如果你发现了 bug，请：

1. 检查 [Issues](https://github.com/zhou0928/xzchat/issues) 确保该 bug 尚未被报告
2. 创建一个 Issue 并提供以下信息：
   - 详细的 bug 描述
   - 重现步骤
   - 预期行为
   - 实际行为
   - 环境信息（Node.js 版本、操作系统、xzChat 版本）
   - 相关的日志或截图

### 提出新功能

如果你有新功能的想法：

1. 先在 [Issues](https://github.com/zhou0928/xzchat/issues) 中讨论
2. 说明功能的价值和使用场景
3. 等待维护者反馈

### 提交代码

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   # 然后克隆你的 fork
   git clone https://github.com/yourusername/xzchat.git
   cd xzchat
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **开发**
   - 遵循现有代码风格
   - 添加必要的测试
   - 更新相关文档

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # 或
   git commit -m "fix: resolve bug description"
   ```

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   # 然后在 GitHub 上创建 Pull Request
   ```

## 📝 代码规范

### Commit Message 遵循 [Conventional Commits](https://www.conventionalcommits.org/)

格式：
```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(plugin): add dependency manager for plugins

Implement a dependency management system that can:
- Build dependency graphs
- Detect circular dependencies
- Topological sort
- Validate dependencies

Closes #123
```

### 代码风格

- 使用 ES Modules (import/export)
- 使用 async/await 而非回调
- 函数和变量使用 camelCase
- 类名使用 PascalCase
- 常量使用 UPPER_SNAKE_CASE
- 适当添加注释
- 保持函数简洁（单个函数不超过 50 行）

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- tests/unit/plugin-manager.test.js

# 运行测试并查看覆盖率
npm run test:coverage

# 运行测试 UI
npm run test:ui
```

### 编写测试

- 为新功能编写测试
- 目标测试覆盖率：> 80%
- 测试文件命名：`*.test.js`
- 使用 Vitest 测试框架

## 📚 文档

### 文档类型

1. **代码注释** - 复杂逻辑的说明
2. **API 文档** - 函数和类的详细说明（JSDoc）
3. **用户文档** - 使用指南和教程
4. **开发者文档** - 贡献指南、架构说明

### 文档位置

- 用户指南：`README.md`
- API 文档：`docs/API.md`
- 插件开发：`docs/PLUGIN_QUICKSTART.md`
- 贡献指南：`CONTRIBUTING.md`（本文件）

## 🔌 插件开发

### 插件指南

详细的插件开发指南请参考：
- [中文插件开发指南](docs/PLUGIN_QUICKSTART_CN.md)
- [英文插件开发指南](docs/PLUGIN_QUICKSTART.md)

### 插件示例

查看 `plugins/` 目录中的示例插件。

## 🎨 分支策略

- `main` - 稳定版本
- `develop` - 开发分支（如需）
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `hotfix/*` - 紧急修复分支

## 📋 Pull Request 流程

### PR 标题格式

遵循 Commit Message 格式：
- `feat: description` - 新功能
- `fix: description` - Bug 修复

### PR 描述模板

```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性变更
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构

## 描述
简要描述这个 PR 的目的和变更内容

## 相关 Issue
Closes #(issue number)

## 变更内容
- 变更 1
- 变更 2

## 测试
- [ ] 添加了新测试
- [ ] 所有测试通过
- [ ] 更新了文档

## 截图（如适用）
添加相关截图
```

### PR 检查清单

提交 PR 前请确保：

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] Commit message 符合规范
- [ ] PR 描述清晰完整
- [ ] 没有引入不必要的依赖

## 🚀 发布流程

1. 更新 `CHANGELOG.md`
2. 更新版本号（遵循语义化版本）
3. 创建发布标签
4. 发布到 npm
5. 推送标签到 GitHub

## 📞 联系方式

- GitHub Issues: [https://github.com/zhou0928/xzchat/issues](https://github.com/zhou0928/xzchat/issues)
- Discussions: [https://github.com/zhou0928/xzchat/discussions](https://github.com/zhou0928/xzchat/discussions)

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

## 💙 致谢

感谢所有贡献者！你的贡献让 xzChat 变得更好。
