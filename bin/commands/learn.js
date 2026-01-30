import learnManager from '../../lib/utils/learn.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'record':
        return await handleRecord(rest);
      case 'get':
        return await handleGet(rest[0], rest[1]);
      case 'suggest':
        return await handleSuggest();
      case 'stats':
        return await handleStats();
      case 'export':
        return await handleExport();
      case 'import':
        return await handleImport(rest[0]);
      case 'reset':
        return await handleReset(rest[0]);
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleRecord(args) {
  const category = args[0];
  const key = args[1];
  const value = args.slice(2).join(' ');
  
  if (!category || !key) {
    return '❌ 用法: /learn record <分类> <键> <值>';
  }

  await learnManager.recordPreference(category, key, value);
  
  return `✅ 偏好已记录\n` +
         `分类: ${category}\n` +
         `键: ${key}\n` +
         `值: ${value}`;
}

async function handleGet(category, key) {
  if (!category || !key) {
    return '❌ 用法: /learn get <分类> <键>';
  }

  const value = await learnManager.getPreference(category, key);
  
  if (value === null) {
    return `❌ 未找到偏好: ${category} - ${key}`;
  }

  return `📝 偏好值\n\n分类: ${category}\n键: ${key}\n值: ${JSON.stringify(value, null, 2)}`;
}

async function handleSuggest() {
  const suggestions = await learnManager.getAdaptiveSuggestions({});
  return suggestions;
}

async function handleStats() {
  const stats = await learnManager.getStats();
  
  let output = '📊 学习统计\n\n';
  output += `偏好类别: ${stats.preferences}\n`;
  output += `学习模式: ${stats.patterns}\n`;
  output += `高置信度模式: ${stats.highConfidencePatterns}\n\n`;
  
  if (stats.categories.length > 0) {
    output += '偏好类别:\n';
    stats.categories.forEach(cat => {
      output += `  • ${cat}\n`;
    });
    output += '\n';
  }

  if (stats.topPatterns.length > 0) {
    output += '常用模式:\n';
    stats.topPatterns.forEach((p, i) => {
      output += `  ${i + 1}. ${p.pattern} (使用 ${p.occurrences} 次, 置信度 ${(p.confidence * 100).toFixed(0)}%)\n`;
    });
  }

  return output.trim();
}

async function handleExport() {
  const content = await learnManager.export();
  return `📤 学习数据导出\n\n\`\`\`json\n${content}\n\`\`\``;
}

async function handleImport(filePath) {
  if (!filePath) {
    return '❌ 请指定文件路径\n用法: /learn import <file.json>';
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  await learnManager.import(content);

  return `✅ 学习数据已导入`;
}

async function handleReset(category) {
  if (category) {
    await learnManager.reset(category);
    return `✅ 类别 "${category}" 已重置`;
  } else {
    await learnManager.reset();
    return `✅ 所有学习数据已重置`;
  }
}

function showHelp() {
  return `🧠 AI 学习模式

用法:
  /learn record <分类> <键> <值>    记录偏好
  /learn get <分类> <键>            获取偏好
  /learn suggest                    获取智能建议
  /learn stats                      学习统计
  /learn export                     导出学习数据
  /learn import <file>              导入学习数据
  /learn reset [分类]               重置学习数据

自动学习:
  • 命令使用习惯
  • 回复风格偏好
  • 常用模式识别
  • 时间相关模式

建议类型:
  • 基于偏好的建议
  • 基于模式的建议
  • 上下文相关建议

示例:
  /learn record codeStyle language "TypeScript"
  /learn get codeStyle language
  /learn suggest
  /learn stats`;
}
