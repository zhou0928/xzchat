import todoManager from '../../lib/utils/todo.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'todo';
export const aliases = ['任务', 'task'];
export const description = '任务管理';

/**
 * 任务命令处理器
 */
export async function handle(args, context) {
  const { config, logger, messages } = context;
  const [action, ...params] = args;

  // 等待任务管理器加载
  await todoManager.load();

  try {
    switch (action) {
      case 'list':
        return await handleList(params);
      case 'add':
        return await handleAdd(params);
      case 'remove':
      case 'delete':
      case 'rm':
        return await handleRemove(params);
      case 'done':
      case 'complete':
        return await handleComplete(params);
      case 'start':
        return await handleStart(params);
      case 'undo':
        return await handleUndo(params);
      case 'update':
        return await handleUpdate(params);
      case 'tag':
        return await handleTag(params);
      case 'stats':
        return await handleStats();
      case 'extract':
        return await handleExtract(context);
      case 'clear':
        return await handleClear(params);
      case 'help':
      default:
        return showHelp();
    }
  } catch (error) {
    logger.error(`错误: ${error.message}`);
    return null;
  }
}

/**
 * 列出任务
 */
async function handleList(params) {
  const options = {};

  // 解析选项
  for (let i = 0; i < params.length; i++) {
    if (params[i] === '--status' && params[i + 1]) {
      options.status = params[i + 1];
      i++;
    } else if (params[i] === '--priority' && params[i + 1]) {
      options.priority = params[i + 1];
      i++;
    } else if (params[i] === '--tag' && params[i + 1]) {
      options.tag = params[i + 1];
      i++;
    } else if (params[i] === '--search' && params[i + 1]) {
      options.search = params[i + 1];
      i++;
    } else if (params[i] === '--sort') {
      options.sortBy = params[i + 1];
      options.sortOrder = params[i + 2] || 'desc';
      i += 2;
    }
  }

  const todos = await todoManager.list(options);
  console.log(colorize.info(`📋 任务列表 (${todos.length} 个)\n`));
  console.log(todoManager.formatList(todos));
}

/**
 * 添加任务
 */
async function handleAdd(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /todo add <text> [--priority <high|medium|low>] [--tag <tag>]'));
    return;
  }

  const text = params[0];
  const options = { priority: 'medium', tags: [] };

  // 解析选项
  for (let i = 1; i < params.length; i++) {
    if (params[i] === '--priority' && params[i + 1]) {
      options.priority = params[i + 1];
      i++;
    } else if (params[i] === '--tag' && params[i + 1]) {
      options.tags.push(params[i + 1]);
      i++;
    }
  }

  const todo = await todoManager.add(text, options.priority);
  if (options.tags.length > 0) {
    for (const tag of options.tags) {
      await todoManager.addTag(todo.id, tag);
    }
  }

  console.log(colorize.success(`✅ 任务已添加: ${text}`));
  console.log(colorize.info(`ID: ${todo.id} | 优先级: ${todo.priority}`));
}

/**
 * 删除任务
 */
async function handleRemove(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /todo remove <id>'));
    return;
  }

  const [id] = params;
  const removed = await todoManager.remove(id);

  if (removed) {
    console.log(colorize.success(`✅ 任务已删除: ${removed.text}`));
  } else {
    console.log(colorize.error(`❌ 未找到任务: ${id}`));
  }
}

/**
 * 完成任务
 */
async function handleComplete(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /todo done <id>'));
    return;
  }

  const [id] = params;
  const todo = await todoManager.updateStatus(id, 'completed');

  if (todo) {
    console.log(colorize.success(`✅ 任务已完成: ${todo.text}`));
  } else {
    console.log(colorize.error(`❌ 未找到任务: ${id}`));
  }
}

/**
 * 开始任务
 */
async function handleStart(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /todo start <id>'));
    return;
  }

  const [id] = params;
  const todo = await todoManager.updateStatus(id, 'in-progress');

  if (todo) {
    console.log(colorize.success(`🔄 任务进行中: ${todo.text}`));
  } else {
    console.log(colorize.error(`❌ 未找到任务: ${id}`));
  }
}

/**
 * 撤销任务状态
 */
async function handleUndo(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /todo undo <id>'));
    return;
  }

  const [id] = params;
  const todo = await todoManager.updateStatus(id, 'pending');

  if (todo) {
    console.log(colorize.success(`⬜ 任务已重置: ${todo.text}`));
  } else {
    console.log(colorize.error(`❌ 未找到任务: ${id}`));
  }
}

/**
 * 更新任务
 */
async function handleUpdate(params) {
  if (params.length < 2) {
    console.log(colorize.error('用法: /todo update <id> <new-text>'));
    return;
  }

  const [id, newText] = params;
  const todo = await todoManager.update(id, { text: newText });

  if (todo) {
    console.log(colorize.success(`✅ 任务已更新: ${newText}`));
  } else {
    console.log(colorize.error(`❌ 未找到任务: ${id}`));
  }
}

/**
 * 标签管理
 */
async function handleTag(params) {
  if (params.length < 2) {
    console.log(colorize.error('用法: /todo tag <add|remove|list> [id] [tag]'));
    return;
  }

  const [action, id, tag] = params;

  if (action === 'list') {
    const tags = await todoManager.getTags();
    console.log(colorize.info('🏷️ 所有标签:\n'));
    tags.forEach(t => console.log(`  • ${t}`));
  } else if (action === 'add') {
    const todo = await todoManager.addTag(id, tag);
    if (todo) {
      console.log(colorize.success(`✅ 标签已添加: ${tag}`));
    } else {
      console.log(colorize.error(`❌ 未找到任务: ${id}`));
    }
  } else if (action === 'remove') {
    const todo = await todoManager.removeTag(id, tag);
    if (todo) {
      console.log(colorize.success(`✅ 标签已移除: ${tag}`));
    } else {
      console.log(colorize.error(`❌ 未找到任务: ${id}`));
    }
  }
}

/**
 * 显示统计
 */
async function handleStats() {
  const stats = await todoManager.getStats();
  console.log(todoManager.formatStats(stats));
}

/**
 * 从 AI 对话提取任务
 */
async function handleExtract(context) {
  const { messages } = context;

  if (!messages || messages.length === 0) {
    console.log(colorize.warning('⚠️ 没有对话历史可提取'));
    return;
  }

  // 获取最近10条消息
  const recentMessages = messages.slice(-10);
  const text = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');

  const extracted = await todoManager.extractFromText(text);

  if (extracted.length > 0) {
    console.log(colorize.success(`✅ 已提取 ${extracted.length} 个任务:\n`));
    extracted.forEach(t => console.log(`  • ${t.text}`));
  } else {
    console.log(colorize.warning('⚠️ 未检测到任务'));
  }
}

/**
 * 清除任务
 */
async function handleClear(params) {
  if (params.length > 0 && params[0] === 'completed') {
    const count = await todoManager.clearCompleted();
    console.log(colorize.success(`✅ 已清除 ${count} 个已完成的任务`));
  } else {
    console.log(colorize.warning('⚠️ 这将清空所有任务'));
    console.log(colorize.info('确认吗？(y/N)'));

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    for await (const line of rl) {
      if (line.toLowerCase() === 'y') {
        await todoManager.clear();
        console.log(colorize.success('✅ 已清空所有任务'));
      } else {
        console.log(colorize.info('已取消'));
      }
      rl.close();
      break;
    }
  }
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
${colorize.header('📋 任务管理 (Todo)')}

${colorize.info('用法:')}
  /todo list                       列出所有任务
  /todo add <text> [options]       添加新任务
  /todo done <id>                  完成任务
  /todo start <id>                 开始任务
  /todo undo <id>                  撤销任务状态
  /todo remove <id>                删除任务
  /todo update <id> <new-text>     更新任务
  /todo tag <action> [id] [tag]    标签管理
  /todo stats                      显示统计信息
  /todo extract                    从对话提取任务
  /todo clear [completed]          清除任务

${colorize.info('选项:')}
  --priority <high|medium|low>    设置优先级
  --tag <tag>                      添加标签
  --status <status>                按状态过滤
  --search <keyword>               搜索任务
  --sort <field> [order]           排序 (asc/desc)

${colorize.info('示例:')}
  /todo add 完成项目文档 --priority high --tag work
  /todo list --status pending
  /todo done 1234567890
  /todo tag add 1234567890 bugfix
  /todo extract
  /todo clear completed

${colorize.warning('提示:')}
  • 任务会自动保存到 ~/.xzchat-todos.json
  • 优先级: high(🔴), medium(🟡), low(🟢)
  • 状态: pending(⬜), in-progress(🔄), completed(✅)
`);
}

export default {
  command,
  aliases,
  description,
  handle
};
