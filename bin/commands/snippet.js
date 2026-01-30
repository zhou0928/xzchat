import snippetManager from '../../lib/utils/snippets.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'snippet';
export const aliases = ['代码片段', 'snip'];
export const description = '代码片段管理';

/**
 * 代码片段命令处理器
 */
export async function handle(args, context) {
  const { config, logger } = context;
  const [action, ...params] = args;

  // 等待片段管理器加载
  await snippetManager.load();

  try {
    switch (action) {
      case 'list':
        return await handleList();
      case 'add':
        return await handleAdd(params);
      case 'remove':
      case 'delete':
        return await handleRemove(params);
      case 'get':
        return await handleGet(params);
      case 'search':
        return await handleSearch(params);
      case 'category':
        return await handleCategory(params);
      case 'update':
        return await handleUpdate(params);
      case 'export':
        return await handleExport(params);
      case 'import':
        return await handleImport(params);
      case 'clear':
        return await handleClear();
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
 * 列出所有代码片段
 */
async function handleList() {
  const snippets = await snippetManager.list();
  const output = snippetManager.formatList(snippets);
  console.log(colorize.info(`📚 代码片段列表 (${snippets.length} 个)\n`));
  console.log(output);
}

/**
 * 添加代码片段
 */
async function handleAdd(params) {
  if (params.length < 2) {
    console.log(colorize.error('用法: /snippet add <key> <name> [language]'));
    return;
  }

  const [key, name, language = 'javascript'] = params;
  console.log(colorize.warning('请输入代码内容（输入 END 结束）:'));

  const code = [];
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  for await (const line of rl) {
    if (line === 'END') break;
    code.push(line);
  }
  rl.close();

  if (code.length === 0) {
    console.log(colorize.error('代码内容不能为空'));
    return;
  }

  const snippet = await snippetManager.add(
    key,
    name,
    code.join('\n'),
    language,
    [],
    'Custom'
  );

  console.log(colorize.success(`✅ 代码片段已添加: ${key}`));
  console.log(colorize.info(`📝 ${snippet.name}`));
}

/**
 * 删除代码片段
 */
async function handleRemove(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /snippet remove <key>'));
    return;
  }

  const [key] = params;
  const removed = await snippetManager.remove(key);

  if (removed) {
    console.log(colorize.success(`✅ 代码片段已删除: ${key}`));
  } else {
    console.log(colorize.error(`❌ 未找到代码片段: ${key}`));
  }
}

/**
 * 获取代码片段
 */
async function handleGet(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /snippet get <key>'));
    return;
  }

  const [key] = params;
  const snippet = await snippetManager.get(key);

  if (snippet) {
    console.log(snippetManager.formatDetail(snippet));
  } else {
    console.log(colorize.error(`❌ 未找到代码片段: ${key}`));
  }
}

/**
 * 搜索代码片段
 */
async function handleSearch(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /snippet search <query> [--category <cat>] [--language <lang>]'));
    return;
  }

  let query = params[0];
  const options = {};

  // 解析选项
  for (let i = 1; i < params.length; i++) {
    if (params[i] === '--category' && params[i + 1]) {
      options.category = params[i + 1];
      i++;
    } else if (params[i] === '--language' && params[i + 1]) {
      options.language = params[i + 1];
      i++;
    }
  }

  const results = await snippetManager.search(query, options);

  if (results.length > 0) {
    console.log(colorize.info(`🔍 找到 ${results.length} 个匹配的片段:\n`));
    results.forEach(snippet => {
      console.log(`  • ${snippet.name} (${snippet.key})`);
      console.log(`    ${snippet.category} | ${snippet.language}`);
      console.log(`    ${snippet.code.substring(0, 100)}...`);
      console.log();
    });
  } else {
    console.log(colorize.warning('⚠️ 未找到匹配的代码片段'));
  }
}

/**
 * 按分类列出
 */
async function handleCategory(params) {
  if (params.length > 0) {
    const [category] = params;
    const snippets = await snippetManager.getByCategory(category);
    const output = snippetManager.formatList(snippets);
    console.log(colorize.info(`📂 分类: ${category} (${snippets.length} 个片段)\n`));
    console.log(output);
  } else {
    const categories = await snippetManager.getCategories();
    console.log(colorize.info('📂 所有分类:\n'));
    categories.forEach(cat => {
      console.log(`  • ${cat}`);
    });
  }
}

/**
 * 更新代码片段
 */
async function handleUpdate(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /snippet update <key> [field] [value]'));
    return;
  }

  const [key, field, value] = params;
  const snippet = await snippetManager.get(key);

  if (!snippet) {
    console.log(colorize.error(`❌ 未找到代码片段: ${key}`));
    return;
  }

  // 如果指定了字段
  if (field && value) {
    const updates = {};
    if (field === 'name' || field === 'language' || field === 'category') {
      updates[field] = value;
    } else if (field === 'tags') {
      updates.tags = value.split(',').map(t => t.trim());
    }

    const updated = await snippetManager.update(key, updates);
    console.log(colorize.success(`✅ 已更新: ${key}`));
    console.log(colorize.info(`📝 ${updated.name}`));
  } else {
    // 交互式更新
    console.log(colorize.warning('请输入新的代码内容（输入 END 结束，留空保持原样）:'));
    console.log(colorize.info('当前代码:\n' + snippet.code));
    console.log(colorize.info('━━━━━━━━━━━━━━━━━━━━'));

    const code = [];
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    for await (const line of rl) {
      if (line === 'END') break;
      code.push(line);
    }
    rl.close();

    if (code.length > 0) {
      await snippetManager.update(key, { code: code.join('\n') });
      console.log(colorize.success(`✅ 代码已更新: ${key}`));
    } else {
      console.log(colorize.info('代码未改变'));
    }
  }
}

/**
 * 导出代码片段
 */
async function handleExport(params) {
  const [filename] = params || ['snippets-export.json'];
  const exportPath = require('path').join(require('os').homedir(), 'Downloads', filename);

  try {
    await snippetManager.export(exportPath);
    console.log(colorize.success(`✅ 代码片段已导出到: ${exportPath}`));
  } catch (error) {
    console.log(colorize.error(`❌ 导出失败: ${error.message}`));
  }
}

/**
 * 导入代码片段
 */
async function handleImport(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /snippet import <filepath>'));
    return;
  }

  try {
    await snippetManager.import(params[0]);
    console.log(colorize.success('✅ 代码片段已导入'));
  } catch (error) {
    console.log(colorize.error(`❌ 导入失败: ${error.message}`));
  }
}

/**
 * 清空自定义片段
 */
async function handleClear() {
  console.log(colorize.warning('⚠️ 这将清空所有自定义代码片段（保留默认）'));
  console.log(colorize.info('确认吗？(y/N)'));

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  for await (const line of rl) {
    if (line.toLowerCase() === 'y') {
      await snippetManager.clear();
      console.log(colorize.success('✅ 已清空所有自定义片段'));
    } else {
      console.log(colorize.info('已取消'));
    }
    rl.close();
    break;
  }
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
${colorize.header('📚 代码片段管理 (Snippet)')}

${colorize.info('用法:')}
  /snippet list                          列出所有代码片段
  /snippet add <key> <name> [language]   添加新片段
  /snippet get <key>                     查看片段详情
  /snippet remove <key>                  删除片段
  /snippet search <query>                搜索片段
  /snippet category [name]                列出分类或按分类查看
  /snippet update <key>                  更新片段
  /snippet export [filename]             导出片段
  /snippet import <filepath>             导入片段
  /snippet clear                         清空自定义片段

${colorize.info('搜索选项:')}
  --category <cat>    按分类过滤
  --language <lang>   按语言过滤

${colorize.info('示例:')}
  /snippet list
  /snippet add my-hook React UseEffect Hook javascript
  /snippet get react-hook
  /snippet search express --category Backend
  /snippet category React

${colorize.warning('提示:')}
  • 片段会自动保存到 ~/.xzchat-snippets.json
  • 添加片段时代码输入 END 结束
  • 支持 JavaScript, Python, SQL, Dockerfile 等多种语言
`);
}

export default {
  command,
  aliases,
  description,
  handle
};
