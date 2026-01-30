import { WikiManager } from "../../lib/utils/wiki.js";

/**
 * 团队知识库
 * 文档管理和全文搜索
 */

const wikiManager = new WikiManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list':
        await handleList();
        break;

      case 'get':
        await handleGet(params[0]);
        break;

      case 'add':
        await handleAdd(params[0], params[1]);
        break;

      case 'update':
        await handleUpdate(params[0], params[1]);
        break;

      case 'remove':
        await handleRemove(params[0]);
        break;

      case 'search':
        await handleSearch(params[0]);
        break;

      case 'history':
        await handleHistory(params[0]);
        break;

      case 'export':
        await handleExport(params[0]);
        break;

      case 'import':
        await handleImport(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`知识库操作失败: ${error.message}`);
  }
};

async function handleList() {
  const pages = wikiManager.listPages();

  console.log(`\n📚 知识库文档\n`);

  if (pages.length === 0) {
    console.log('暂无文档\n');
    return;
  }

  pages.forEach((page, i) => {
    console.log(`  ${i + 1}. ${page.title}`);
    console.log(`     作者: ${page.author}`);
    console.log(`     更新: ${new Date(page.updatedAt).toLocaleString('zh-CN')}\n`);
  });
}

async function handleGet(id) {
  if (!id) {
    console.error('错误: 请提供文档ID或标题');
    return;
  }

  const page = wikiManager.getPage(id);

  if (!page) {
    console.error(`\n❌ 文档不存在\n`);
    return;
  }

  console.log(`\n📄 ${page.title}\n`);
  console.log(`作者: ${page.author}`);
  console.log(`标签: ${page.tags.join(', ')}`);
  console.log(`创建: ${new Date(page.createdAt).toLocaleString('zh-CN')}`);
  console.log(`更新: ${new Date(page.updatedAt).toLocaleString('zh-CN')}`);
  console.log(`\n${page.content}\n`);
}

async function handleAdd(title, content) {
  if (!title || !content) {
    console.error('错误: 请提供标题和内容');
    console.log('用法: /wiki add <title> <content>');
    return;
  }

  const result = wikiManager.createPage(title, content);

  if (result.success) {
    console.log(`\n✅ 文档创建成功: ${result.id}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleUpdate(id, content) {
  if (!id || !content) {
    console.error('错误: 请提供ID和内容');
    console.log('用法: /wiki update <id> <content>');
    return;
  }

  const result = wikiManager.updatePage(id, content);

  if (result.success) {
    console.log(`\n✅ 文档更新成功\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleRemove(id) {
  if (!id) {
    console.error('错误: 请提供文档ID');
    return;
  }

  const result = wikiManager.deletePage(id);

  if (result.success) {
    console.log(`\n✅ 文档已删除\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleSearch(keyword) {
  if (!keyword) {
    console.error('错误: 请提供搜索关键词');
    return;
  }

  const results = wikiManager.search(keyword);

  console.log(`\n🔍 搜索结果: "${keyword}"\n`);

  if (results.length === 0) {
    console.log('未找到匹配的文档\n');
    return;
  }

  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.title}`);
    console.log(`     相关度: ${r.relevance}%`);
    console.log(`     ${r.preview}\n`);
  });
}

async function handleHistory(limit) {
  const history = wikiManager.getHistory(parseInt(limit) || 10);

  console.log(`\n📜 编辑历史\n`);

  if (history.length === 0) {
    console.log('暂无历史记录\n');
    return;
  }

  history.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.timestamp}`);
    console.log(`     ${h.action}: ${h.title}\n`);
  });
}

async function handleExport(file) {
  const path = file || 'wiki-export.json';
  const result = await wikiManager.export(path);

  if (result.success) {
    console.log(`\n✅ 知识库已导出到: ${path}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleImport(file) {
  if (!file) {
    console.error('错误: 请提供文件路径');
    return;
  }

  const result = await wikiManager.import(file);

  if (result.success) {
    console.log(`\n✅ 成功导入 ${result.count} 个文档\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function showHelp() {
  console.log(`
📚 团队知识库 - 帮助

文档管理和全文搜索。

子命令:
  /wiki list                    列出所有文档
  /wiki get <id>                查看文档
  /wiki add <title> <content>   创建文档
  /wiki update <id> <content>   更新文档
  /wiki remove <id>             删除文档
  /wiki search <keyword>        搜索文档
  /wiki history [limit]         编辑历史
  /wiki export [file]           导出知识库
  /wiki import <file>           导入文档

示例:
  /wiki add "API文档" "这是API文档内容"
  /wiki get "API文档"
  /wiki search "API"
  /wiki export wiki-backup.json
`);
}
