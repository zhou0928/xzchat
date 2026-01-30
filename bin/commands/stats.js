import statsManager from '../../lib/utils/stats.js';
import { colorize } from '../../lib/utils/themes.js';

export const command = 'stats';
export const aliases = ['统计'];
export const description = 'AI 性能统计';

export async function handle(args, context) {
  await statsManager.load();
  const [action] = args;

  try {
    switch (action) {
      case 'show': default: return await handleShow();
      case 'reset': return await handleReset();
      case 'help': return showHelp();
    }
  } catch (error) {
    context.logger?.error(`错误: ${error.message}`);
    return null;
  }
}

async function handleShow() {
  const stats = await statsManager.getStats();
  console.log(statsManager.formatStats(stats));
}

async function handleReset() {
  console.log(colorize.warning('⚠️ 这将重置所有统计数据，确认吗？(y/N)'));
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  for await (const line of rl) {
    if (line.toLowerCase() === 'y') { await statsManager.reset(); console.log(colorize.success('✅ 统计已重置')); }
    else { console.log(colorize.info('已取消')); }
    rl.close();
    break;
  }
}

function showHelp() {
  console.log(`
${colorize.header('📊 AI 性能统计 (Stats)')}
${colorize.info('用法:')}
  /stats show                    显示统计信息
  /stats reset                   重置统计
${colorize.info('统计内容:')}
   • 总请求数和 Token 使用量
   • 总成本和平均成本
   • 运行时间
   • 各模型使用详情
`);
}

export default { command, aliases, description, handle };
