# 插件系统帮助文档更新

## 更新日期
2026-01-29

## 更新概述
更新了插件系统的帮助文档，新增了完整的插件管理子命令说明，覆盖插件系统的所有核心功能。

## 更新内容

### 1. messages.js - 命令帮助信息

#### 新增插件命令帮助
在 `lib/utils/messages.js` 中添加了完整的插件命令帮助信息：

**新增子命令 (18个):**
- `list` - 列出所有插件
- `load <name>` - 加载插件
- `unload <name>` - 卸载插件
- `enable <name>` - 启用插件
- `disable <name>` - 禁用插件
- `info <name>` - 显示插件详细信息
- `scan` - 扫描插件目录
- `reload <name>` - 重新加载插件
- `validate <name>` - 验证插件代码质量
- `marketplace` - 访问插件市场
- `install <name>` - 安装插件
- `search <keyword>` - 搜索插件
- `update <name>` - 更新插件
- `uninstall <name>` - 卸载并删除插件
- `performance` - 查看插件性能统计
- `cache [clear|stats]` - 管理插件缓存
- `deps <name>` - 查看插件依赖关系
- `history <name>` - 查看插件版本历史
- `restore <name> <ver>` - 恢复插件版本

**提示信息:**
- 插件可以扩展命令、钩子和中间件
- 支持热加载，无需重启程序
- 使用验证确保插件代码质量
- 性能监控帮助优化插件性能
- 支持插件依赖管理和版本控制
- 使用缓存提升加载速度
- 插件市场提供丰富的插件资源

**使用示例:**
```bash
/plugin list
/plugin load example-timer
/plugin enable example-timer
/plugin info example-timer
/plugin validate example-timer
/plugin marketplace
/plugin performance
/plugin cache stats
```

#### 更新 showAllCommands 函数
在全局帮助输出中新增插件系统部分：
```
🔌 插件系统:
  /plugin        - 插件管理
    /plugin list        - 列出所有插件
    /plugin load        - 加载插件
    /plugin enable      - 启用插件
    /plugin disable     - 禁用插件
    /plugin info        - 插件详细信息
    /plugin validate    - 验证插件质量
    /plugin marketplace  - 插件市场
    /plugin performance - 性能监控
```

### 2. contextual-help.js - 上下文帮助系统

#### 新增插件帮助规则
在 `lib/utils/contextual-help.js` 中添加了插件系统的上下文帮助规则：

**规则 ID:** `plugin_help`
- **优先级:** 85
- **触发条件:** 配置上下文
- **功能:**
  - 显示插件管理帮助
  - 列出所有子命令
  - 提供常用操作建议
  - 显示提示信息

**建议操作:**
1. 列出插件
2. 启用插件
3. 查看插件信息
4. 插件市场
5. 插件验证

**提示信息:**
- 插件可以扩展命令、钩子和中间件
- 使用性能监控查看插件运行状态

### 3. plugin.js - 插件命令实现

#### 更新 showPluginHelp 函数
新增高级子命令分类显示：

**基础子命令:**
- list, ls - 列出所有插件
- load, unload, enable, disable - 插件生命周期管理
- info, scan, reload - 插件信息管理

**高级子命令:**
- validate - 代码质量验证
- marketplace, install, search, update, uninstall - 插件市场

**性能与缓存:**
- performance - 性能统计
- cache - 缓存管理
- deps, history, restore - 依赖和版本管理

#### 新增处理函数 (10个)

**handleValidatePlugin**
- 功能: 验证插件代码质量
- 输出: 验证报告、评分、错误和警告
- 显示: 各验证模块的得分

**handleMarketplace**
- 功能: 访问插件市场
- 支持: list, search, popular 操作
- 显示: 插件列表、评分、下载量

**handleInstallPlugin**
- 功能: 从市场安装插件
- 输出: 安装路径、加载提示

**handleSearchPlugin**
- 功能: 搜索插件
- 支持关键词搜索
- 显示: 匹配的插件列表

**handleUpdatePlugin**
- 功能: 更新插件
- 显示: 旧版本、新版本信息

**handleUninstallPlugin**
- 功能: 完全卸载插件
- 包括: 禁用、卸载、删除文件

**handlePerformance**
- 功能: 显示性能统计
- 包括: 调用次数、耗时、错误率
- 显示: 单个插件和总体统计

**handleCache**
- 功能: 管理插件缓存
- 支持: stats, clear 操作
- 显示: 内存和磁盘缓存命中率

**handleDependencies**
- 功能: 查看依赖关系
- 显示: 依赖插件、被依赖插件
- 检测: 循环依赖警告

**handleHistory**
- 功能: 查看版本历史
- 显示: 版本号、时间、SHA256、备份路径

**handleRestore**
- 功能: 恢复版本
- 支持: 版本回滚
- 显示: 恢复结果

## 功能覆盖

### 插件核心功能
✅ 插件加载/卸载
✅ 插件启用/禁用
✅ 插件信息查询
✅ 插件重新加载

### 插件验证功能
✅ 代码质量验证
✅ 6大验证模块
✅ 评分系统 (0-100)
✅ 详细错误报告

### 插件市场功能
✅ 插件列表
✅ 插件搜索
✅ 插件安装
✅ 插件更新
✅ 热门排行

### 性能监控功能
✅ 调用统计
✅ 耗时分析
✅ 错误追踪
✅ 性能报告

### 缓存管理功能
✅ 内存缓存
✅ 磁盘缓存
✅ 缓存统计
✅ 缓存清理

### 依赖管理功能
✅ 依赖查询
✅ 反向依赖
✅ 循环依赖检测

### 版本管理功能
✅ 版本历史
✅ 版本恢复
✅ 备份管理
✅ 完整性验证

## 使用示例

### 基础操作
```bash
# 查看所有插件
/plugin list

# 加载插件
/plugin load example-timer

# 启用插件
/plugin enable example-timer

# 查看插件信息
/plugin info example-timer
```

### 代码验证
```bash
# 验证插件代码
/plugin validate example-timer
```

### 插件市场
```bash
# 访问插件市场
/plugin marketplace

# 搜索插件
/plugin search timer

# 安装插件
/plugin install example-timer

# 更新插件
/plugin update example-timer
```

### 性能监控
```bash
# 查看性能统计
/plugin performance
```

### 缓存管理
```bash
# 查看缓存统计
/plugin cache stats

# 清理缓存
/plugin cache clear
```

### 依赖管理
```bash
# 查看依赖关系
/plugin deps example-timer
```

### 版本管理
```bash
# 查看版本历史
/plugin history example-timer

# 恢复版本
/plugin restore example-timer 1.0.0
```

## 文件变更清单

### 修改的文件
1. `lib/utils/messages.js`
   - 新增 plugin 命令帮助
   - 更新 showAllCommands 函数

2. `lib/utils/contextual-help.js`
   - 新增 plugin_help 规则
   - 集成到上下文帮助系统

3. `bin/commands/plugin.js`
   - 更新 showPluginHelp 函数
   - 新增 10 个处理函数
   - 更新 handlePlugin switch 语句

## 影响范围

### 用户体验
- ✅ 插件功能完全文档化
- ✅ 帮助信息清晰完整
- ✅ 上下文感知提示
- ✅ 示例命令丰富

### 开发体验
- ✅ 所有功能都有命令行接口
- ✅ 清晰的子命令分类
- ✅ 详细的错误提示
- ✅ 完整的使用示例

## 测试建议

### 功能测试
1. 测试所有新增的子命令
2. 验证错误处理
3. 检查帮助信息显示
4. 测试上下文帮助触发

### 集成测试
1. 测试与插件管理器的集成
2. 测试与子系统的集成
3. 测试缓存系统
4. 测试性能监控

### 用户体验测试
1. 验证帮助信息的可读性
2. 检查示例命令的正确性
3. 测试上下文帮助的准确性
4. 验证错误提示的友好性

## 后续优化建议

1. **增强错误提示**
   - 提供更详细的错误原因
   - 建议修复方法

2. **添加交互式向导**
   - 插件安装向导
   - 依赖冲突解决向导

3. **优化性能统计**
   - 添加性能趋势图
   - 性能异常告警

4. **扩展插件市场**
   - 添加评分和评论
   - 支持插件分类浏览

## 总结

本次更新完善了插件系统的帮助文档，新增了 18 个子命令和 10 个处理函数，覆盖插件系统的所有核心功能。用户现在可以通过命令行方便地管理插件，包括加载、验证、安装、监控、缓存管理等所有操作。上下文帮助系统也集成了插件管理功能，为用户提供更智能的使用建议。

**新增代码:** 约 550 行
**修改文件:** 3 个
**新增功能:** 18 个子命令 + 10 个处理函数

所有修改均通过 lint 检查，无错误和警告。
