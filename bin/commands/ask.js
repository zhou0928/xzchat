import { AskManager } from '../../lib/utils/ask.js';

/**
 * AI问答命令
 * 快速AI问答，支持历史记录和收藏
 */

const askManager = new AskManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'ask':
        await handleAsk(params.join(' '));
        break;

      case 'history':
        await handleHistory();
        break;

      case 'search':
        await handleSearch(params[0]);
        break;

      case 'favorite':
        await handleFavorite(params[0]);
        break;

      case 'unfavorite':
      case 'unfav':
        await handleUnfavorite(params[0]);
        break;

      case 'favorites':
      case 'favs':
        await handleListFavorites();
        break;

      case 'popular':
        await handlePopular();
        break;

      case 'suggest':
        await handleSuggest(params[0]);
        break;

      case 'stats':
        await handleStats();
        break;

      case 'clear':
        await handleClear();
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`AI问答操作失败: ${error.message}`);
  }
};

/**
 * 提问
 */
async function handleAsk(question) {
  if (!question) {
    console.error('错误: 请提供问题');
    console.log('用法: /ask ask <question>');
    return;
  }

  console.log(`\n🤖 问题: ${question}\n`);
  console.log('提示: 将上述问题发送给AI获取答案\n');

  // 记录问题（答案将在获取后更新）
  await askManager.addQuestion(question, null);
}

/**
 * 查看历史
 */
async function handleHistory() {
  const history = askManager.history;

  if (history.length === 0) {
    console.log('\n暂无问答历史。\n');
    return;
  }

  console.log('\n📜 问答历史 (最近20条):\n');
  history.slice(0, 20).forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.question}`);
    console.log(`     时间: ${new Date(entry.timestamp).toLocaleString('zh-CN')}`);
    console.log(`     标签: ${entry.tags?.join(', ') || '无'}`);
    console.log('');
  });
}

/**
 * 搜索历史
 */
async function handleSearch(keyword) {
  if (!keyword) {
    console.error('错误: 请提供搜索关键词');
    console.log('用法: /ask search <keyword>');
    return;
  }

  const results = askManager.searchHistory(keyword);

  if (results.length === 0) {
    console.log(`\n未找到包含 "${keyword}" 的问答记录\n`);
    return;
  }

  console.log(`\n🔍 搜索结果 (${results.length}):\n`);
  results.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.question}`);
    console.log(`     时间: ${new Date(entry.timestamp).toLocaleString('zh-CN')}`);
    console.log('');
  });
}

/**
 * 添加收藏
 */
async function handleFavorite(id) {
  if (!id) {
    console.error('错误: 请提供记录ID');
    console.log('用法: /ask favorite <id>');
    return;
  }

  const result = await askManager.addFavorite(id);
  if (result.success) {
    console.log('\n✅ 已添加到收藏\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 取消收藏
 */
async function handleUnfavorite(id) {
  if (!id) {
    console.error('错误: 请提供记录ID');
    console.log('用法: /ask unfavorite <id>');
    return;
  }

  const result = await askManager.removeFavorite(id);
  if (result.success) {
    console.log('\n✅ 已取消收藏\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

/**
 * 列出收藏
 */
async function handleListFavorites() {
  const favorites = askManager.favorites;

  if (favorites.length === 0) {
    console.log('\n暂无收藏。\n');
    return;
  }

  console.log('\n⭐ 收藏列表:\n');
  favorites.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.question}`);
    console.log(`     ID: ${entry.id}`);
    console.log(`     时间: ${new Date(entry.timestamp).toLocaleString('zh-CN')}`);
    console.log('');
  });
}

/**
 * 热门问题
 */
async function handlePopular() {
  const popular = askManager.getPopularQuestions(10);

  if (popular.length === 0) {
    console.log('\n暂无热门问题。\n');
    return;
  }

  console.log('\n🔥 热门问题:\n');
  popular.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.question}`);
    console.log(`     询问次数: ${item.count}`);
    console.log('');
  });
}

/**
 * 获取建议
 */
async function handleSuggest(prefix) {
  if (!prefix) {
    console.error('错误: 请提供前缀');
    console.log('用法: /ask suggest <prefix>');
    return;
  }

  const suggestions = askManager.getSuggestions(prefix);

  if (suggestions.length === 0) {
    console.log(`\n没有以 "${prefix}" 开头的历史问题\n`);
    return;
  }

  console.log(`\n💡 建议问题 (${suggestions.length}):\n`);
  suggestions.forEach((s, index) => {
    console.log(`  ${index + 1}. ${s}`);
  });
  console.log('');
}

/**
 * 统计信息
 */
async function handleStats() {
  const stats = askManager.getStats();

  console.log('\n📊 AI问答统计:\n');
  console.log(`  总问题数: ${stats.totalQuestions}`);
  console.log(`  收藏数: ${stats.totalFavorites}`);
  console.log(`  唯一问题数: ${stats.uniqueQuestions}`);
  console.log(`  平均问题长度: ${stats.averageLength} 字`);
  console.log('');
}

/**
 * 清除历史
 */
async function handleClear() {
  const result = await askManager.clearHistory();
  if (result.success) {
    console.log('\n✅ 历史记录已清除\n');
  }
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
🤖 AI问答 - 帮助

快速AI问答，支持历史记录和收藏功能。

子命令:
  /ask ask <question>           提出问题
  /ask history                  查看问答历史
  /ask search <keyword>         搜索历史记录
  /ask favorite <id>            添加收藏
  /ask unfavorite <id>          取消收藏
  /ask favorites                列出所有收藏
  /ask popular                  查看热门问题
  /ask suggest <prefix>         获取问题建议
  /ask stats                    查看统计信息
  /ask clear                    清除历史记录

示例:
  /ask ask 如何优化React组件性能？
  /ask search React
  /ask popular
  /ask suggest 如何

提示:
  - 问题会自动保存到历史记录
  - 可以收藏常用问题以便快速访问
  - 热门问题基于历史频率统计
  - 建议功能根据输入前缀自动补全

文档: /ask help
`);
}
