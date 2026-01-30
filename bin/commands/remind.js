import remindManager from '../../lib/utils/remind.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'remind';
export const aliases = ['提醒', 'timer'];
export const description = '定时提醒';

/**
 * 定时提醒命令处理器
 */
export async function handle(args, context) {
  const { config, logger } = context;
  const [action, ...params] = args;

  // 等待提醒管理器加载
  await remindManager.load();

  try {
    switch (action) {
      case 'list':
        return await handleList();
      case 'add':
        return await handleAdd(params);
      case 'remove':
      case 'delete':
      case 'rm':
        return await handleRemove(params);
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
 * 列出所有提醒
 */
async function handleList() {
  const reminders = await remindManager.list();
  console.log(colorize.info(`⏰ 提醒列表 (${reminders.length} 个)\n`));
  console.log(remindManager.formatList(reminders));
}

/**
 * 添加提醒
 */
async function handleAdd(params) {
  if (params.length < 2) {
    console.log(colorize.error('用法: /remind add <message> <time> [options]'));
    console.log(colorize.info('时间格式: 30m (30分钟), 2h (2小时), 14:30 (今天14:30), 2026-01-30T14:30:00'));
    return;
  }

  const message = params[0];
  const timeExpr = params[1];
  const options = { type: 'once' };

  // 解析选项
  for (let i = 2; i < params.length; i++) {
    if (params[i] === '--interval' && params[i + 1]) {
      const intervalExpr = params[i + 1];
      options.interval = parseInterval(intervalExpr);
      options.type = 'interval';
      i++;
    } else if (params[i] === '--command' && params[i + 1]) {
      options.command = params[i + 1];
      i++;
    }
  }

  const time = remindManager.parseTimeExpression(timeExpr);

  if (!time) {
    console.log(colorize.error('❌ 无效的时间格式'));
    return;
  }

  const reminder = await remindManager.add(message, time, options);

  const targetTime = new Date(time);
  const now = new Date();
  const diff = Math.floor((targetTime - now) / 60000); // 分钟

  console.log(colorize.success(`✅ 提醒已设置: ${message}`));
  console.log(colorize.info(`⏰ 时间: ${targetTime.toLocaleString('zh-CN')}`));
  if (diff > 0) {
    console.log(colorize.info(`📌 ${diff} 分钟后触发`));
  }
  if (options.interval) {
    console.log(colorize.info(`🔄 间隔提醒: ${remindManager.formatInterval(options.interval)}`));
  }
}

/**
 * 解析间隔时间
 */
function parseInterval(expr) {
  const match = expr.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * 删除提醒
 */
async function handleRemove(params) {
  if (params.length < 1) {
    console.log(colorize.error('用法: /remind remove <id>'));
    return;
  }

  const [id] = params;
  const removed = await remindManager.remove(id);

  if (removed) {
    console.log(colorize.success(`✅ 提醒已删除: ${removed.message}`));
  } else {
    console.log(colorize.error(`❌ 未找到提醒: ${id}`));
  }
}

/**
 * 清除提醒
 */
async function handleClear(params) {
  if (params.length > 0 && params[0] === 'triggered') {
    const count = await remindManager.clearTriggered();
    console.log(colorize.success(`✅ 已清除 ${count} 个已触发的提醒`));
  } else {
    console.log(colorize.warning('⚠️ 这将清空所有提醒'));
    console.log(colorize.info('确认吗？(y/N)'));

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    for await (const line of rl) {
      if (line.toLowerCase() === 'y') {
        await remindManager.clear();
        console.log(colorize.success('✅ 已清空所有提醒'));
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
${colorize.header('⏰ 定时提醒 (Remind)')}

${colorize.info('用法:')}
  /remind list                      列出所有提醒
  /remind add <msg> <time>          添加提醒
  /remind remove <id>               删除提醒
  /remind clear [triggered]         清除提醒

${colorize.info('时间格式:')}
  相对时间: 30m (30分钟), 2h (2小时), 1d (1天), 1w (1周)
  具体时间: 14:30 (今天14:30)
  ISO 格式: 2026-01-30T14:30:00

${colorize.info('选项:')}
  --interval <expr>     间隔提醒 (如: --interval 1h 每小时提醒)
  --command <cmd>       提醒时执行命令

${colorize.info('示例:')}
  /remind add 喝水 30m
  /remind add 开会 14:30
  /remind add 休息 1h --interval 30m
  /remind add 更新代码 2026-01-30T18:00:00 --command /commit

${colorize.warning('提示:')}
  • 提醒会自动保存到 ~/.xzchat-reminders.json
  • 支持一次性提醒和间隔提醒
  • 可在提醒时自动执行命令
`);
}

export default {
  command,
  aliases,
  description,
  handle
};
