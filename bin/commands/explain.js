import { ExplainManager } from '../../lib/utils/explain.js';

/**
 * 代码解释命令
 * 解释代码功能，支持多种解释级别
 */

const explainManager = new ExplainManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'explain':
        await handleExplain(params[0], params.slice(1).join(' '));
        break;

      case 'update':
        await handleUpdate(params[0], params.slice(1).join(' '));
        break;

      case 'get':
        await handleGet(params[0]);
        break;

      case 'list':
        await handleList();
        break;

      case 'search':
        await handleSearch(params[0]);
        break;

      case 'stats':
        await handleStats();
        break;

      case 'delete':
        await handleDelete(params[0]);
        break;

      case 'export':
        await handleExport(params[0]);
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
    logger.error(`代码解释操作失败: ${error.message}`);
  }
};

async function handleExplain(code, options) {
  if (!code) {
    console.error('错误: 请提供代码');
    console.log('用法: /explain explain <code> [options]');
    console.log('选项: --level=beginner|intermediate|advanced');
    return;
  }

  const opts = {
    level: options.includes('--level=advanced') ? 'advanced' :
            options.includes('--level=beginner') ? 'beginner' : 'intermediate'
  };

  const explanation = await explainManager.createExplanation(code, opts);
  console.log(`\n✅ 解释创建成功 (ID: ${explanation.id})\n`);
  console.log(`  语言: ${explanation.language}`);
  console.log(`  级别: ${explanation.level}`);
  console.log(`  行数: ${explanation.metadata.lineCount}`);
  console.log('  下一步: 使用 /explain update 添加解释内容\n');
}

async function handleUpdate(id, explanationText) {
  if (!id || !explanationText) {
    console.error('错误: 请提供ID和解释内容');
    console.log('用法: /explain update <id> <explanation>');
    return;
  }

  const result = await explainManager.updateExplanation(id, { explanation: explanationText });
  if (result.success) {
    console.log('\n✅ 解释更新成功\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleGet(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    console.log('用法: /explain get <id>');
    return;
  }

  const explanation = explainManager.getExplanation(id);
  if (!explanation) {
    console.error('\n❌ 解释不存在\n');
    return;
  }

  console.log('\n💡 代码解释详情:\n');
  console.log(`  ID: ${explanation.id}`);
  console.log(`  语言: ${explanation.language}`);
  console.log(`  级别: ${explanation.level}`);
  console.log(`  时间: ${new Date(explanation.timestamp).toLocaleString('zh-CN')}`);
  console.log(`  行数: ${explanation.metadata.lineCount}`);
  console.log('\n  代码:');
  console.log(`    ${explanation.code.substring(0, 200)}${explanation.code.length > 200 ? '...' : ''}`);
  if (explanation.explanation) {
    console.log('\n  解释:');
    console.log(`    ${explanation.explanation.substring(0, 300)}${explanation.explanation.length > 300 ? '...' : ''}`);
  }
  console.log('');
}

async function handleList() {
  const explanations = explainManager.listExplanations();
  if (explanations.length === 0) {
    console.log('\n暂无解释记录。\n');
    return;
  }

  console.log('\n📚 解释列表:\n');
  explanations.forEach((e, index) => {
    console.log(`  ${index + 1}. ${e.language} (${e.level})`);
    console.log(`     ID: ${e.id}`);
    console.log(`     行数: ${e.lineCount}`);
    console.log(`     时间: ${new Date(e.timestamp).toLocaleString('zh-CN')}`);
    console.log(`     状态: ${e.hasExplanation ? '✅ 已完成' : '⏳ 待生成'}`);
    console.log('');
  });
}

async function handleSearch(keyword) {
  if (!keyword) {
    console.error('错误: 请提供搜索关键词');
    console.log('用法: /explain search <keyword>');
    return;
  }

  const results = explainManager.searchExplanations(keyword);
  if (results.length === 0) {
    console.log(`\n未找到包含 "${keyword}" 的解释\n`);
    return;
  }

  console.log(`\n🔍 搜索结果 (${results.length}):\n`);
  results.forEach((e, index) => {
    console.log(`  ${index + 1}. ${e.language}`);
    console.log(`     ID: ${e.id}`);
    console.log('');
  });
}

async function handleStats() {
  const stats = explainManager.getStats();
  console.log('\n📊 代码解释统计:\n');
  console.log(`  总解释数: ${stats.totalExplanations}`);
  console.log(`  已解释: ${stats.explainedCount}`);
  console.log(`  平均行数: ${stats.avgLineCount}`);

  console.log('\n  按语言分类:');
  Object.entries(stats.languages).forEach(([lang, count]) => {
    console.log(`    ${lang}: ${count}`);
  });

  console.log('\n  按级别分类:');
  Object.entries(stats.levels).forEach(([level, count]) => {
    console.log(`    ${level}: ${count}`);
  });

  console.log('');
}

async function handleDelete(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    console.log('用法: /explain delete <id>');
    return;
  }

  const result = await explainManager.deleteExplanation(id);
  if (result.success) {
    console.log('\n✅ 解释已删除\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleExport(filePath) {
  const path = filePath || 'explanations-export.json';
  const result = await explainManager.exportExplanations(path);
  if (result.success) {
    console.log(`\n✅ 解释已导出到: ${path}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleClear() {
  const result = await explainManager.clearAll();
  if (result.success) {
    console.log('\n✅ 所有解释记录已清除\n');
  }
}

function showHelp() {
  console.log(`
💡 代码解释 - 帮助

解释代码功能，支持多种解释级别。

子命令:
  /explain explain <code> [options]     创建解释
  /explain update <id> <explanation>    更新解释
  /explain get <id>                     查看解释详情
  /explain list                         列出所有解释
  /explain search <keyword>             搜索解释
  /explain stats                        查看统计信息
  /explain delete <id>                  删除解释
  /explain export [file]                导出解释
  /explain clear                        清除所有记录

选项:
  --level=beginner     初学者级别
  --level=intermediate 中级（默认）
  --level=advanced     高级

示例:
  /explain explain "function test() { return 1; }"
  /explain update 123 "这是一个测试函数"
  /explain get 123
  /explain list

提示:
  - 自动检测编程语言
  - 支持三种解释级别
  - 可导出为JSON格式

文档: /explain help
`);
}
