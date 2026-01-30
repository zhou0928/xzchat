# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-01-30

### Added
- ✨ 完整的企业级插件系统
  - 模块化架构，支持动态加载/卸载插件
  - 6 大验证模块（元数据/代码/安全/性能/依赖/配置）
  - 智能缓存系统（LRU 缓存 + TTL 过期，性能提升 50-80%）
  - 统一错误处理（14 种错误类型）
  - 依赖管理（循环依赖检测、拓扑排序）
  - 插件市场（搜索、安装、更新）
  - 版本控制（自动备份、SHA256 验证）
  - 性能监控（实时指标、慢操作检测）
  - TypeScript 支持（30+ 接口定义）
- 🌳 分支系统（对话分支管理）
  - 从任意消息点创建对话分支
  - 分支切换、删除、比较、合并
  - 分支树可视化
- 📊 审计日志系统
  - 27 种操作类型记录
  - 4 种日志级别
  - 敏感信息自动清理
  - 强大的查询和统计功能
- 🎯 增强的会话管理
  - 会话搜索、克隆
  - 撤销/重做/继续生成
  - 消息编辑
- 🔒 安全性增强
  - 敏感信息过滤
  - 路径遍历防护
  - 命令安全检查
- 📝 完整的文档体系
  - 插件开发指南（中英文）
  - API 文档
  - 最佳实践指南

### Changed
- 🔧 优化 auto-fix 测试（修复边界情况）
- 📦 统一包名为 `xzchat`
- 🎨 改进用户体验和错误提示
- 🚀 性能优化（缓存、连接池、懒加载）

### Fixed
- 🐛 修复 auto-fix.test.js 测试失败
- 🐛 修复 ErrorDetector 和 FixSuggestionGenerator 导出问题
- 🐛 修复 maxSuggestions 为 0 时的边界情况

### Documentation
- 📖 添加 PUBLISH_GUIDE.md 发布指南
- 📖 添加完整的插件系统文档
- 📖 添加分支系统文档
- 📖 添加审计日志文档

## [2.3.5] - 2026-01-29

### Added
- ✨ 智能体模式（Agent Mode）
- ✨ RAG 知识库支持
- ✨ MCP 协议支持
- ✨ Git 深度集成
- ✨ 会话管理系统
- ✨ 多语言支持（中文/英文/日文）
- ✨ 主题系统
- ✨ 代码自动补全

## [2.0.0] - 2025-12-01

### Added
- 🎉 项目初始化
- 🤖 AI 聊天基础功能
- 🛠️ 命令系统
- 📁 文件操作
- 🔧 配置管理
- 📊 日志系统

###PATH:CHANGELOG.md
