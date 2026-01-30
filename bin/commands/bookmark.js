import bookmarkManager from '../../lib/utils/bookmark.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'bookmark';
export const aliases = ['书签', 'bm'];
export const description = '书签管理';

export async function handle(args, context) {
  await bookmarkManager.load();
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list': return await handleList(params);
      case 'add': return await handleAdd(params, context);
      case 'remove': return await handleRemove(params);
      case 'get': return await handleGet(params);
      case 'tag': return await handleTag(params);
      case 'clear': return await handleClear();
      case 'help': default: return showHelp();
    }
  } catch (error) {
    context.logger?.error(`错误: ${error.message}`);
    return null;
  }
}

async function handleList(params) {
  const options = {};
  for (let i = 0; i < params.length; i++) {
    if (params[i] === '--category' && params[i + 1]) { options.category = params[i + 1]; i++; }
    if (params[i] === '--tag' && params[i + 1]) { options.tag = params[i + 1]; i++; }
    if (params[i] === '--search' && params[i + 1]) { options.search = params[i + 1]; i++; }
  }
  const bookmarks = await bookmarkManager.list(options);
  console.log(colorize.info(`🔖 书签列表 (${bookmarks.length} 个)\n`));
  console.log(bookmarkManager.formatList(bookmarks));
}

async function handleAdd(params, context) {
  if (params.length < 1) { console.log(colorize.error('用法: /bookmark add <content> [--category <cat>] [--tag <tag>]')); return; }
  const content = params[0];
  const options = { category: 'general', tags: [] };
  for (let i = 1; i < params.length; i++) {
    if (params[i] === '--category' && params[i + 1]) { options.category = params[i + 1]; i++; }
    if (params[i] === '--tag' && params[i + 1]) { options.tags.push(params[i + 1]); i++; }
  }
  const bookmark = await bookmarkManager.add(content, options.category, options.tags);
  console.log(colorize.success(`✅ 书签已添加`));
}

async function handleRemove(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /bookmark remove <id>')); return; }
  const removed = await bookmarkManager.remove(params[0]);
  if (removed) console.log(colorize.success(`✅ 书签已删除`));
  else console.log(colorize.error(`❌ 未找到书签`));
}

async function handleGet(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /bookmark get <id>')); return; }
  const bookmark = await bookmarkManager.get(params[0]);
  if (bookmark) { console.log(bookmark.content); }
  else { console.log(colorize.error(`❌ 未找到书签`)); }
}

async function handleTag(params) {
  if (params.length < 2) { console.log(colorize.error('用法: /bookmark tag <add|list|remove> [id] [tag]')); return; }
  const [action, id, tag] = params;
  if (action === 'list') {
    const tags = await bookmarkManager.getTags();
    console.log(colorize.info('🏷️ 所有标签:\n') + tags.map(t => `  • ${t}`).join('\n'));
  } else if (action === 'add') {
    const bookmark = await bookmarkManager.addTag(id, tag);
    if (bookmark) console.log(colorize.success(`✅ 标签已添加`));
    else console.log(colorize.error(`❌ 未找到书签`));
  }
}

async function handleClear() {
  console.log(colorize.warning('⚠️ 这将清空所有书签，确认吗？(y/N)'));
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  for await (const line of rl) {
    if (line.toLowerCase() === 'y') { await bookmarkManager.clear(); console.log(colorize.success('✅ 已清空')); }
    else { console.log(colorize.info('已取消')); }
    rl.close();
    break;
  }
}

function showHelp() {
  console.log(`
${colorize.header('🔖 书签管理 (Bookmark)')}
${colorize.info('用法:')}
  /bookmark list                    列出所有书签
  /bookmark add <content>           添加书签
  /bookmark remove <id>             删除书签
  /bookmark get <id>               查看书签内容
  /bookmark tag <action> [id]       标签管理
  /bookmark clear                   清空所有书签
${colorize.info('示例:')}
  /bookmark add 这个API很重要 --category api --tag important
  /bookmark list --category api
  /bookmark get 1234567890
`);
}

export default { command, aliases, description, handle };
