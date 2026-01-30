import { SummarizeManager } from '../../lib/utils/summarize.js';

/**
 * 文档摘要命令
 * 生成文档/代码摘要，支持多种模板
 */

const summarizeManager = new SummarizeManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'create':
        await handleCreate(params[0], params.slice(1, -1).join(' '), params[params.length - 1]);
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

      case 'templates':
        await handleTemplates();
        break;

      case 'add-template':
        await handleAddTemplate(params);
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

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`摘要操作失败: ${error.message}`);
  }
};

async function handleCreate(source, content, templateId) {
  if (!source || !content) {
    console.error('错误: 请提供来源和内容');
    console.log('用法: /summarize create <source> <content> [templateId]');
    return;
  }

  const summary = await summarizeManager.createSummary(source, content, templateId);
  console.log(`\n✅ 摘要创建成功 (ID: ${summary.id})\n`);
  console.log(`  来源: ${summary.source}`);
  console.log(`  模板: ${summary.templateName}`);
  console.log(`  字数: ${summary.metadata.wordCount}`);
  console.log('  下一步: 使用 /summarize update 添加摘要内容\n');
}

async function handleUpdate(id, summaryText) {
  if (!id || !summaryText) {
    console.error('错误: 请提供ID和摘要内容');
    console.log('用法: /summarize update <id> <summary>');
    return;
  }

  const result = await summarizeManager.updateSummary(id, summaryText);
  if (result.success) {
    console.log('\n✅ 摘要更新成功\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleGet(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    console.log('用法: /summarize get <id>');
    return;
  }

  const summary = summarizeManager.getSummary(id);
  if (!summary) {
    console.error('\n❌ 摘要不存在\n');
    return;
  }

  console.log('\n📝 摘要详情:\n');
  console.log(`  ID: ${summary.id}`);
  console.log(`  来源: ${summary.source}`);
  console.log(`  模板: ${summary.templateName}`);
  console.log(`  时间: ${new Date(summary.timestamp).toLocaleString('zh-CN')}`);
  console.log(`  内容长度: ${summary.metadata.length} 字符`);
  if (summary.summary) {
    console.log(`\n  摘要:\n    ${summary.summary}`);
  }
  console.log('');
}

async function handleList() {
  const summaries = summarizeManager.listSummaries();
  if (summaries.length === 0) {
    console.log('\n暂无摘要记录。\n');
    return;
  }

  console.log('\n📚 摘要列表:\n');
  summaries.forEach((s, index) => {
    console.log(`  ${index + 1}. ${s.source}`);
    console.log(`     ID: ${s.id}`);
    console.log(`     模板: ${s.templateName}`);
    console.log(`     时间: ${new Date(s.timestamp).toLocaleString('zh-CN')}`);
    console.log(`     状态: ${s.hasSummary ? '✅ 已完成' : '⏳ 待生成'}`);
    console.log('');
  });
}

async function handleSearch(keyword) {
  if (!keyword) {
    console.error('错误: 请提供搜索关键词');
    console.log('用法: /summarize search <keyword>');
    return;
  }

  const results = summarizeManager.searchSummaries(keyword);
  if (results.length === 0) {
    console.log(`\n未找到包含 "${keyword}" 的摘要\n`);
    return;
  }

  console.log(`\n🔍 搜索结果 (${results.length}):\n`);
  results.forEach((s, index) => {
    console.log(`  ${index + 1}. ${s.source}`);
    console.log(`     ID: ${s.id}`);
    console.log('');
  });
}

async function handleTemplates() {
  const templates = summarizeManager.getTemplates();
  console.log('\n📋 摘要模板:\n');
  templates.forEach((t, index) => {
    console.log(`  ${index + 1}. ${t.name} (${t.id})`);
    console.log(`     描述: ${t.description}`);
    if (t.maxLength) console.log(`     最大长度: ${t.maxLength} 字`);
    if (t.format) console.log(`     格式: ${t.format}`);
    if (t.type) console.log(`     类型: ${t.type}`);
    console.log('');
  });
}

async function handleAddTemplate(params) {
  const name = params[0];
  const description = params[1];
  const maxLength = params[2] ? parseInt(params[2]) : null;

  if (!name || !description) {
    console.error('错误: 请提供模板名称和描述');
    console.log('用法: /summarize add-template <name> <description> [maxLength]');
    return;
  }

  const template = { name, description, maxLength };
  const result = await summarizeManager.addTemplate(template);
  if (result.success) {
    console.log(`\n✅ 模板 "${name}" 创建成功\n`);
  }
}

async function handleStats() {
  const stats = summarizeManager.getStats();
  console.log('\n📊 摘要统计:\n');
  console.log(`  总摘要数: ${stats.totalSummaries}`);
  console.log(`  模板数: ${stats.templatesCount}`);
  console.log(`  已完成: ${stats.summarizedCount}`);
  console.log(`  待生成: ${stats.pendingCount}`);
  console.log(`  平均长度: ${stats.avgLength} 字符`);
  console.log('');
}

async function handleDelete(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    console.log('用法: /summarize delete <id>');
    return;
  }

  const result = await summarizeManager.deleteSummary(id);
  if (result.success) {
    console.log('\n✅ 摘要已删除\n');
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleExport(filePath) {
  const path = filePath || 'summaries-export.json';
  const result = await summarizeManager.exportSummaries(path);
  if (result.success) {
    console.log(`\n✅ 摘要已导出到: ${path}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function showHelp() {
  console.log(`
📝 文档摘要 - 帮助

生成文档/代码摘要，支持多种模板。

子命令:
  /summarize create <source> <content> [templateId]  创建摘要
  /summarize update <id> <summary>                  更新摘要内容
  /summarize get <id>                               查看摘要详情
  /summarize list                                   列出所有摘要
  /summarize search <keyword>                       搜索摘要
  /summarize templates                              查看可用模板
  /summarize add-template <name> <desc> [max]       添加自定义模板
  /summarize stats                                  查看统计信息
  /summarize delete <id>                            删除摘要
  /summarize export [file]                          导出摘要

示例:
  /summarize create README.md "项目说明内容..." standard
  /summarize update 123 "这是摘要内容"
  /summarize templates
  /summarize list

提示:
  - 支持多种摘要模板
  - 可以导出为JSON格式
  - 自动统计字数和长度

文档: /summarize help
`);
}
