import envManager from '../../lib/utils/env.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'env';
export const aliases = ['环境变量', 'environ'];
export const description = '环境变量管理';

export async function handle(args, context) {
  await envManager.load();
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list': return await handleList(params);
      case 'set': return await handleSet(params);
      case 'get': return await handleGet(params);
      case 'remove': case 'rm': return await handleRemove(params);
      case 'create': return await handleCreate(params);
      case 'delete': return await handleDelete(params);
      case 'use': return await handleUse(params);
      case 'export': return await handleExport(params);
      case 'import': return await handleImport(params);
      case 'help': default: return showHelp();
    }
  } catch (error) {
    context.logger?.error(`错误: ${error.message}`);
    return null;
  }
}

async function handleList(params) {
  const envName = params[0] || envManager.activeEnv;
  const vars = await envManager.list(envName);
  console.log(colorize.info(`📦 环境变量: ${envName} ${envName === envManager.activeEnv ? '(当前)' : ''}\n`));
  console.log(envManager.formatList(vars));
}

async function handleSet(params) {
  if (params.length < 2) { console.log(colorize.error('用法: /env set <key> <value> [--env <name>] [--encrypt]')); return; }
  const [key, ...valueParts] = params;
  const value = valueParts.filter(p => p !== '--env' && p !== '--encrypt').join(' ');
  let envName = envManager.activeEnv;
  let encrypted = false;
  for (let i = 0; i < valueParts.length; i++) {
    if (valueParts[i] === '--env' && valueParts[i + 1]) { envName = valueParts[i + 1]; i++; }
    if (valueParts[i] === '--encrypt') encrypted = true;
  }
  await envManager.set(envName, key, value, encrypted);
  console.log(colorize.success(`✅ 变量已设置${encrypted ? ' (加密)' : ''}`));
}

async function handleGet(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /env get <key> [--env <name>]')); return; }
  const [key] = params;
  const envName = params.includes('--env') ? params[params.indexOf('--env') + 1] : envManager.activeEnv;
  const value = await envManager.get(envName, key);
  if (value !== null) console.log(`${key} = ${value}`);
  else console.log(colorize.error(`❌ 未找到变量: ${key}`));
}

async function handleRemove(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /env remove <key> [--env <name>]')); return; }
  const [key] = params;
  const envName = params.includes('--env') ? params[params.indexOf('--env') + 1] : envManager.activeEnv;
  const removed = await envManager.remove(envName, key);
  if (removed) console.log(colorize.success(`✅ 变量已删除`));
  else console.log(colorize.error(`❌ 未找到变量: ${key}`));
}

async function handleCreate(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /env create <name>')); return; }
  await envManager.createEnv(params[0]);
  console.log(colorize.success(`✅ 环境已创建: ${params[0]}`));
}

async function handleDelete(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /env delete <name>')); return; }
  const deleted = await envManager.deleteEnv(params[0]);
  if (deleted) console.log(colorize.success(`✅ 环境已删除`));
  else console.log(colorize.error(`❌ 删除失败`));
}

async function handleUse(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /env use <name>')); return; }
  await envManager.setActive(params[0]);
  console.log(colorize.success(`✅ 已切换环境: ${params[0]}`));
}

async function handleExport(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /env export <filepath> [--env <name>]')); return; }
  const filepath = params[0];
  const envName = params.includes('--env') ? params[params.indexOf('--env') + 1] : envManager.activeEnv;
  await envManager.exportToFile(envName, filepath);
  console.log(colorize.success(`✅ 已导出到: ${filepath}`));
}

async function handleImport(params) {
  if (params.length < 1) { console.log(colorize.error('用法: /env import <filepath> [--env <name>] [--encrypt]')); return; }
  const filepath = params[0];
  let envName = envManager.activeEnv;
  let encrypted = false;
  for (let i = 1; i < params.length; i++) {
    if (params[i] === '--env' && params[i + 1]) { envName = params[i + 1]; i++; }
    if (params[i] === '--encrypt') encrypted = true;
  }
  await envManager.importFromFile(envName, filepath, encrypted);
  console.log(colorize.success(`✅ 已导入到环境: ${envName}`));
}

function showHelp() {
  console.log(`
${colorize.header('📦 环境变量管理 (Env)')}
${colorize.info('用法:')}
  /env list [name]               列出变量
  /env set <key> <value>         设置变量
  /env get <key>                 获取变量
  /env remove <key>              删除变量
  /env create <name>             创建环境
  /env delete <name>             删除环境
  /env use <name>                切换环境
  /env export <file>             导出变量
  /env import <file>             导入变量

${colorize.info('选项:')}
  --env <name>      指定环境
  --encrypt         加密存储

${colorize.info('示例:')}
  /env set API_KEY sk-xxx --encrypt
  /env list production
  /env use production
  /env export .env.production
`);
}

export default { command, aliases, description, handle };
