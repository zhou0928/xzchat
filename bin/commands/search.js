import searchManager from '../../lib/utils/search.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'query':
        return await handleQuery(rest);
      case 'history':
        return await handleHistory(rest[0]);
      case 'popular':
        return await handlePopular(rest[0]);
      case 'suggest':
        return await handleSuggest(rest[0]);
      case 'index':
        return await handleIndex();
      case 'clear':
        return await handleClear();
      case 'stats':
        return await handleStats();
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleQuery(args) {
  if (args.length === 0) {
    return '❌ 请指定搜索关键词\n用法: /search query <关键词> [选项]';
  }

  const query = args.join(' ');
  const options = {
    limit: 20,
    fuzzyThreshold: 0.6,
    previewLength: 100
  };

  // 解析选项
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--fuzzy' && args[i + 1]) {
      options.fuzzyThreshold = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--preview' && args[i + 1]) {
      options.previewLength = parseInt(args[i + 1]);
      i++;
    }
  }

  // 注意：实际需要从会话管理器获取会话数据
  // 这里返回示例
  await searchManager.recordSearch(query, 0);

  let output = `🔍 搜索: "${query}"\n\n`;
  output += `提示: 实际搜索需要从会话管理器获取数据\n\n`;
  output += `搜索类型:\n`;
  output += `• 精确匹配: "关键词"\n`;
  output += `• 模糊匹配: 关键词\n`;
  output += `• 正则匹配: /pattern/flags\n\n`;
  output += `选项:\n`;
  output += `• --limit N: 限制结果数量\n`;
  output += `• --fuzzy N: 模糊匹配阈值 (0-1)\n`;
  output += `• --preview N: 预览长度\n`;

  return output.trim();
}

async function handleHistory(limit) {
  limit = parseInt(limit) || 20;
  const history = await searchManager.getHistory(limit);
  
  let output = '📋 搜索历史\n\n';
  
  if (history.length === 0) {
    output += '暂无搜索记录。\n';
    return output;
  }

  history.forEach(h => {
    output += `• ${h.query}\n`;
    output += `  结果: ${h.resultCount} 条\n`;
    output += `  时间: ${new Date(h.timestamp).toLocaleString('zh-CN')}\n\n`;
  });

  return output.trim();
}

async function handlePopular(limit) {
  limit = parseInt(limit) || 10;
  const popular = await searchManager.getPopularSearches(limit);
  
  let output = '🔥 热门搜索\n\n';
  
  if (popular.length === 0) {
    output += '暂无热门搜索。\n';
    return output;
  }

  popular.forEach((p, i) => {
    output += `${i + 1}. ${p.query} (${p.count} 次)\n`;
  });

  return output.trim();
}

async function handleSuggest(prefix) {
  if (!prefix) {
    return '❌ 请指定前缀\n用法: /search suggest <前缀>';
  }

  const suggestions = await searchManager.getSuggestions(prefix);
  
  let output = `💡 搜索建议: "${prefix}"\n\n`;
  
  if (suggestions.length === 0) {
    output += '无建议。\n';
    return output;
  }

  suggestions.forEach(s => {
    output += `• ${s}\n`;
  });

  return output.trim();
}

async function handleIndex() {
  // 注意：实际需要从会话管理器获取会话数据
  await searchManager.buildIndex([]);
  
  return `✅ 搜索索引已重建`;
}

async function handleClear() {
  await searchManager.clearHistory();
  return `✅ 搜索历史已清除`;
}

async function handleStats() {
  const stats = await searchManager.getStats();
  
  let output = '📊 搜索统计\n\n';
  output += `总搜索次数: ${stats.totalSearches}\n`;
  output += `已索引会话数: ${stats.indexedSessions}\n\n`;
  
  if (stats.recentQueries.length > 0) {
    output += '最近搜索:\n';
    stats.recentQueries.forEach(q => {
      output += `• ${q}\n`;
    });
  }

  return output.trim();
}

function showHelp() {
  return `🔍 搜索增强

用法:
  /search query <关键词> [选项]     执行搜索
  /search history [limit]            搜索历史
  /search popular [limit]            热门搜索
  /search suggest <前缀>             搜索建议
  /search index                      重建索引
  /search clear                      清除历史
  /search stats                      统计信息

搜索类型:
  • 精确匹配: "关键词"          - 完全匹配
  • 模糊匹配: 关键词            - 相似度匹配
  • 正则匹配: /pattern/flags     - 正则表达式

选项:
  • --limit N      限制结果数量 (默认: 20)
  • --fuzzy N      模糊匹配阈值 0-1 (默认: 0.6)
  • --preview N    预览长度 (默认: 100)

高级搜索示例:
  /search query "React Hook" --limit 10
  /search query /error.*test/gi
  /search query 函数 --fuzzy 0.8
  /search suggest "react"
  /search popular 5
  /search history`;
}
