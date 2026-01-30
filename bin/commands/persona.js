import personaManager from '../../lib/utils/persona.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'persona';
export const aliases = ['人格', 'personality'];
export const description = 'AI 人格训练';

export async function handle(args, context) {
  await personaManager.load();
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list': return await handleList();
      case 'use': case 'set': return await handleUse(params);
      case 'add': return await handleAdd(params);
      case 'remove': case 'delete': return await handleRemove(params);
      case 'update': return await handleUpdate(params);
      case 'get': return await handleGet(params);
      case 'help': default: return showHelp();
    }
  } catch (error) {
    context.logger?.error(`错误: ${error.message}`);
    return null;
  }
}

async function handleList() {
  const personas = await personaManager.list();
  console.log(colorize.info('🎭 AI 人格列表\n'));
  console.log(personaManager.formatList(personas));
}

async function handleUse(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /persona use <id>')); return; }
  const persona = await personaManager.setActive(params[0]);
  console.log(colorize.success(`✅ 已切换人格: ${persona.name}`));
  console.log(colorize.info(`📝 ${persona.prompt.substring(0, 100)}...`));
}

async function handleAdd(params) {
  if (params.length < 3) { console.log(colorize.error('用法: /persona add <id> <name> <prompt> [--tone <tone>]')); return; }
  const [id, name, prompt] = params;
  const options = { tone: 'professional' };
  for (let i = 3; i < params.length; i++) {
    if (params[i] === '--tone' && params[i + 1]) { options.tone = params[i + 1]; i++; }
  }
  const persona = await personaManager.add(id, name, prompt, options.tone);
  console.log(colorize.success(`✅ 人格已添加: ${persona.name}`));
}

async function handleRemove(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /persona remove <id>')); return; }
  const removed = await personaManager.remove(params[0]);
  if (removed) console.log(colorize.success(`✅ 人格已删除`));
  else console.log(colorize.error(`❌ 未找到人格或无法删除`));
}

async function handleUpdate(params) {
  if (params.length < 3) { console.log(colorize.error('用法: /persona update <id> <field> <value>')); return; }
  const [id, field, value] = params;
  const updates = {};
  if (field === 'name' || field === 'prompt' || field === 'tone') updates[field] = value;
  const persona = await personaManager.update(id, updates);
  if (persona) console.log(colorize.success(`✅ 人格已更新`));
  else console.log(colorize.error(`❌ 未找到人格`));
}

async function handleGet(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /persona get <id>')); return; }
  const persona = await personaManager.get(params[0]);
  if (persona) {
    console.log(`🎭 ${persona.name} (${params[0]})\n语调: ${persona.tone}\n\n提示词:\n${persona.prompt}`);
  }
  else { console.log(colorize.error(`❌ 未找到人格`)); }
}

function showHelp() {
  console.log(`
${colorize.header('🎭 AI 人格训练 (Persona)')}
${colorize.info('用法:')}
  /persona list                    列出所有人格
  /persona use <id>                切换人格
  /persona add <id> <name> <prompt> 添加新人格
  /persona remove <id>             删除人格
  /persona update <id> <field>      更新人格
  /persona get <id>                查看人格详情
${colorize.info('内置人格:')}
  • default - 默认助手
  • creative - 创意专家
  • tech - 技术专家
  • teacher - 老师
  • concise - 简洁助手
${colorize.info('示例:')}
  /persona use creative
  /persona add my-ai "我的AI" "你是一个..." --tone friendly
`);
}

export default { command, aliases, description, handle };
