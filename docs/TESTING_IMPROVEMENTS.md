# 测试流程改进

## 问题回顾

在 V3.1.1 开发过程中，我们遇到了多次导入和导出问题，这些问题本应在部署前被自动化测试捕获：

1. **第一次问题**: `search.js` 使用了默认导入，但工具库导出的是命名类
2. **第二次问题**: 21个命令文件使用了 `require()` 而不是 ES6 的 `import`
3. **第三次问题**: 19个工具库使用了 CommonJS 的 `module.exports` 而不是 ES6 的 `export default`
4. **第四次问题**: 21个命令文件使用了 `module.exports = { handle }` 而不是 `export { handle }`

## 根本原因

虽然项目配置了 vitest 测试框架，但缺乏对新命令的导入验证测试。在添加新命令时，没有进行充分的预部署测试。

## 改进措施

### 1. 添加了预提交检查脚本

**文件**: `scripts/pre-commit-check.mjs`

功能：
- 验证所有 V3.1.1 命令文件的语法正确性
- 验证所有工具库文件的语法正确性
- 快速失败，避免部署有问题的代码

使用方式：
```bash
npm run check:commands
```

### 2. 更新了 npm scripts

在 `package.json` 中添加了新的检查脚本：
```json
{
  "scripts": {
    "pre-commit": "node scripts/pre-commit-check.mjs",
    "check:commands": "node scripts/pre-commit-check.mjs"
  }
}
```

### 3. 添加了导入测试

**文件**: `tests/commands/v3.1.1-import.test.js`

这个测试文件验证：
- 所有21个新命令都能正确导入
- 所有21个工具库都能正确导入
- 导出符合 ES6 标准
- 命令分类完整性

运行方式：
```bash
npm test -- tests/commands/v3.1.1-import.test.js
```

### 4. 创建了快速验证脚本

**文件**: `scripts/check-imports.js`

更详细的导入检查脚本，可以显示具体的导入错误。

## 测试最佳实践

### 在添加新命令前

1. **语法检查**
   ```bash
   node --check bin/commands/your-command.js
   ```

2. **导入检查**
   ```bash
   npm run check:commands
   ```

3. **单元测试**
   ```bash
   npm test -- tests/commands/your-command.test.js
   ```

4. **集成测试**
   ```bash
   npx xzchat
   # 然后测试新命令
   ```

### 提交前检查清单

- [ ] 所有命令文件通过 `node --check`
- [ ] 所有工具库文件通过 `node --check`
- [ ] 运行 `npm run check:commands` 通过
- [ ] 运行相关单元测试通过
- [ ] 手动测试命令功能正常
- [ ] 检查没有 `console.log` 或 `debugger` 语句
- [ ] 检查代码符合项目规范

### Git Hook 建议

可以添加 git pre-commit hook 自动运行检查：

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run check:commands || exit 1
```

设置权限：
```bash
chmod +x .git/hooks/pre-commit
```

## ES6 模块规范

### 正确的命令文件结构

```javascript
// 导入工具库（使用默认导入）
import manager from '../../lib/utils/your-util.js';

// 定义处理函数
async function handle(args, context) {
  // 实现
}

// 导出（使用命名导出）
export { handle };
```

### 正确的工具库结构

```javascript
// 导入 Node.js 模块
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 添加 __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义类
class YourManager {
  // 实现
}

// 导出（使用默认导出）
export default YourManager;
```

## 测试覆盖目标

- **单元测试**: 覆盖所有工具库的核心功能
- **集成测试**: 测试命令与工具库的交互
- **导入测试**: 确保所有模块正确导入导出
- **语法测试**: 确保所有文件语法正确

## 总结

通过这些改进，我们建立了一个多层级的测试流程：

1. **语法检查**: `node --check` - 捕获语法错误
2. **导入检查**: `npm run check:commands` - 验证模块正确性
3. **单元测试**: `npm test` - 验证功能正确性
4. **手动测试**: 实际运行命令验证

这样可以确保在代码部署到生产环境前，所有潜在问题都被捕获和修复。
