import keybindManager from '../../lib/utils/keybind.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'keybind';
export const aliases = ['快捷键', 'kb'];
export const description = '快捷键绑定';

export async function handle(args, context) {
  await keybindManager.load();
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list': return await handleList();
      case 'add': return await handleAdd(params);
      case 'remove': case 'rm': return await handleRemove(params);
      case 'update': return await handleUpdate(params);
      case 'help': default: return showHelp();
    }
  } catch (error) {
    context.logger?.error(`错误: ${error.message}`);
    return null;
  }
}

async function handleList() {
  const keybinds = await keybindManager.list();
  console.log(colorize.info('⌨️ 快捷键列表\n'));
  console.log(keybindManager.formatList(keybinds));
}

async function handleAdd(params) {
  if (params.length < 2) { console.log(colorize.error('用法: /keybind add <key> <command> [description]')); return; }
  const [key, command, description = ''] = params;
  await keybindManager.add(key, command, description);
  console.log(colorize.success(`✅ 快捷键已绑定: ${key} → ${command}`));
}

async function handleRemove(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /keybind remove <key>')); return; }
  const removed = await keybindManager.remove(params[0]);
  if (removed) console.log(colorize.success(`✅ 快捷键已删除`));
  else console.log(colorize.error(`❌ 未找到快捷键或无法删除`));
}

async function handleUpdate(params) {
  if (params.length < 3) { console.log(colorize.error('用法: /keybind update <key> <field> <value>')); return; }
  const [key, field, value] = params;
  const updates = {};
  if (field === 'command' || field === 'description') updates[field] = value;
  const keybind = await keybindManager.update(key, updates);
  if (keybind) console.log(colorize.success(`✅ 快捷键已更新`));
  else console.log(colorize.error(`❌ 未找到快捷键`));
}

function showHelp() {
  console.log(`
${colorize.header('⌨️ 快捷键绑定 (Keybind)')}
${colorize.info('用法:')}
  /keybind list                   列出所有快捷键
  /keybind add <key> <cmd>        绑定快捷键
  /keybind remove <key>           删除快捷键
  /keybind update <key> <field>   更新快捷键

${colorize.info('内置快捷键:')}
  Ctrl+C → /copy (复制最后回复)
  Ctrl+L → /clear (清屏)
  Ctrl+P → /history (查看历史)
  Ctrl+N → /session new (新会话)

${colorize.info('示例:')}
  /keybind add Ctrl+H "/help"
  /keybind add Ctrl+T "/todo list" "查看任务"
  /keybind update Ctrl+H description "显示帮助"
`);
}

export default { command, aliases, description, handle };
