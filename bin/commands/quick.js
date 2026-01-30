import { QuickManager } from "../../lib/utils/quick.js";

/**
 * 快捷命令管理器
 * 创建和管理常用AI提示词的快捷命令
 */

const quickManager = new QuickManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list':
        await handleList();
        break;

      case 'get':
        await handleGet(params[0]);
        break;

      case 'add':
        await handleAdd(params);
        break;

      case 'update':
        await handleUpdate(params);
        break;

      case 'remove':
      case 'rm':
        await handleRemove(params[0]);
        break;

      case 'run':
        await handleRun(params[0], params.slice(1));
        break;

      case 'search':
        await handleSearch(params[0]);
        break;

      case 'import':
        await handleImport(params[0]);
        break;

      case 'export':
        await handleExport(params[0]);
        break;

      case 'validate':
        await handleValidate(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`快捷命令操作失败: ${error.message}`);
  }
};

/**
 * 列出所有快捷命令
 */
async function handleList() {
  const commands = quickManager.listCommands();

  if (commands.length === 0) {
    console.log('\n暂无快捷命令。使用 /quick add 创建新命令。\n');
    return;
  }

  console.log('\n📋 快捷命令列表:\n');
  commands.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.name}`);
    console.log(`     别名: ${cmd.aliases.join(', ')}`);
    console.log(`     描述: ${cmd.description}`);
    console.log(`     参数: ${cmd.variables.join(', ') || '无'}`);
    console.log('');
  });
}

/**
 * 查看快捷命令详情
 */
async function handleGet(name) {
  if (!name) {
    console.error('错误: 请提供命令名称');
    console.log('用法: /quick get <name>');
    return;
  }

  const command = quickManager.getCommand(name);

  if (!command) {
    console.error(`错误: 命令 "${name}" 不存在`);
    return;
  }

  console.log('\n📝 命令详情:\n');
  console.log(`  名称: ${command.name}`);
  console.log(`  别名: ${command.aliases.join(', ')}`);
  console.log(`  描述: ${command.description}`);
  console.log(`  提示词:`);
  console.log(`    ${command.template}`);
  console.log(`  参数: ${command.variables.join(', ') || '无'}`);
  console.log(`  使用次数: ${command.usageCount}`);
  console.log(`  最后使用: ${command.lastUsed ? new Date(command.lastUsed).toLocaleString('zh-CN') : '从未使用'}`);
  console.log('');
}

/**
 * 创建新快捷命令
 */
async function handleAdd(params) {
  const name = params[0];
  const description = params[1];

  if (!name || !description) {
    console.error('错误: 请提供命令名称和描述');
    console.log('用法: /quick add <name> <description>');
    console.log('提示: 添加后，使用 /quick update <name> 来设置模板');
    return;
  }

  const result = quickManager.createCommand(name, description);
  if (result.success) {
    console.log(`\n✅ 命令 "${name}" 创建成功！\n`);
    console.log('下一步: 使用 /quick update <name> 来设置模板和别名');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 更新快捷命令
 */
async function handleUpdate(params) {
  const name = params[0];
  const field = params[1];
  const value = params.slice(2).join(' ');

  if (!name || !field || !value) {
    console.error('错误: 参数不足');
    console.log('用法: /quick update <name> <field> <value>');
    console.log('字段: template | aliases | description | variables');
    console.log('示例: /quick update review template "请审查这段代码: {code}"');
    console.log('示例: /quick update review aliases "review,rev"');
    console.log('示例: /quick update review variables "code"');
    return;
  }

  const result = quickManager.updateCommand(name, field, value);

  if (result.success) {
    console.log(`\n✅ 命令 "${name}" 更新成功！\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 删除快捷命令
 */
async function handleRemove(name) {
  if (!name) {
    console.error('错误: 请提供命令名称');
    console.log('用法: /quick remove <name>');
    return;
  }

  const result = quickManager.removeCommand(name);

  if (result.success) {
    console.log(`\n✅ 命令 "${name}" 已删除\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 执行快捷命令
 */
async function handleRun(name, variables) {
  if (!name) {
    console.error('错误: 请提供命令名称');
    console.log('用法: /quick run <name> [var1] [var2] ...');
    return;
  }

  const result = quickManager.executeCommand(name, variables);

  if (result.success) {
    console.log(`\n🚀 执行命令 "${name}":\n`);
    console.log(result.prompt);
    console.log('\n提示: 将上述内容发送给AI\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 搜索快捷命令
 */
async function handleSearch(keyword) {
  if (!keyword) {
    console.error('错误: 请提供搜索关键词');
    console.log('用法: /quick search <keyword>');
    return;
  }

  const results = quickManager.searchCommands(keyword);

  if (results.length === 0) {
    console.log(`\n未找到包含 "${keyword}" 的命令\n`);
    return;
  }

  console.log(`\n🔍 搜索结果 (${results.length}):\n`);
  results.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.name}`);
    console.log(`     ${cmd.description}`);
    console.log('');
  });
}

/**
 * 导入快捷命令
 */
async function handleImport(filePath) {
  if (!filePath) {
    console.error('错误: 请提供文件路径');
    console.log('用法: /quick import <filepath>');
    return;
  }

  const result = await quickManager.importCommands(filePath);

  if (result.success) {
    console.log(`\n✅ 成功导入 ${result.count} 个命令\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 导出快捷命令
 */
async function handleExport(filePath) {
  const path = filePath || 'quick-commands-export.json';
  const result = await quickManager.exportCommands(path);

  if (result.success) {
    console.log(`\n✅ 命令已导出到: ${path}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 验证命令
 */
async function handleValidate(name) {
  if (!name) {
    console.error('错误: 请提供命令名称');
    console.log('用法: /quick validate <name>');
    return;
  }

  const result = quickManager.validateCommand(name);

  if (result.valid) {
    console.log(`\n✅ 命令 "${name}" 验证通过\n`);
    if (result.warnings.length > 0) {
      console.log('⚠️  警告:');
      result.warnings.forEach(w => console.log(`  - ${w}`));
      console.log('');
    }
  } else {
    console.log(`\n❌ 命令 "${name}" 验证失败\n`);
    console.log('错误:');
    result.errors.forEach(e => console.log(`  - ${e}`));
    console.log('');
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
🚀 快捷命令管理器 - 帮助

管理常用AI提示词的快捷命令，提高工作效率。

子命令:
  /quick list                    列出所有快捷命令
  /quick get <name>              查看命令详情
  /quick add <name> <desc>       创建新命令
  /quick update <name> <f> <v>   更新命令字段
                                 字段: template/aliases/description/variables
  /quick remove <name>           删除命令
  /quick run <name> [vars...]    执行命令（替换变量）
  /quick search <keyword>        搜索命令
  /quick import <file>           从文件导入
  /quick export [file]           导出到文件
  /quick validate <name>         验证命令配置

示例:
  /quick add review "代码审查"
  /quick update review template "请审查这段代码: {code}"
  /quick update review aliases "review,rev"
  /quick update review variables "code"
  /quick run review "function example() { return 1; }"
  /quick search "代码"

提示:
  - 使用 {var} 语法定义变量占位符
  - 变量按顺序传递给 /quick run 命令
  - 支持JSON格式的导入/导出
  - 命令名称支持自动补全

文档: /quick help
`);
}
