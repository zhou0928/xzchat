import { SearchEngine } from "../../lib/utils/search.js";

/**
 * 智能搜索优化
 * 语义搜索和代码关联分析
 */

const searchEngine = new SearchEngine();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'search':
        await handleSearch(params[0], params[1]);
        break;

      case 'semantic':
        await handleSemantic(params[0]);
        break;

      case 'references':
        await handleReferences(params[0]);
        break;

      case 'trace':
        await handleTrace(params[0]);
        break;

      case 'index':
        await handleIndex(params[0]);
        break;

      case 'rebuild':
        await handleRebuild();
        break;

      case 'stats':
        await handleStats();
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`搜索操作失败: ${error.message}`);
  }
};

async function handleSearch(query, path) {
  if (!query) {
    console.error('错误: 请提供搜索查询');
    return;
  }

  const results = await searchEngine.search(query, path || '.');

  console.log(`\n🔍 搜索结果: "${query}"\n`);

  if (results.length === 0) {
    console.log('未找到匹配结果\n');
    return;
  }

  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.file}`);
    console.log(`     匹配: ${r.matches} 处`);
    console.log(`     相关度: ${r.relevance}%\n`);
  });
}

async function handleSemantic(query) {
  if (!query) {
    console.error('错误: 请提供语义查询');
    return;
  }

  const results = await searchEngine.semanticSearch(query);

  console.log(`\n🧠 语义搜索: "${query}"\n`);

  if (results.length === 0) {
    console.log('未找到语义匹配\n');
    return;
  }

  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.file}`);
    console.log(`     语义相关: ${r.semantic}%`);
    console.log(`     摘要: ${r.summary}\n`);
  });
}

async function handleReferences(target) {
  if (!target) {
    console.error('错误: 请提供目标文件或函数');
    return;
  }

  const refs = await searchEngine.findReferences(target);

  console.log(`\n🔗 引用查找: ${target}\n`);

  if (refs.length === 0) {
    console.log('未找到引用\n');
    return;
  }

  console.log(`在以下位置找到 ${refs.length} 个引用:\n`);

  refs.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.file}:${r.line}`);
    console.log(`     ${r.context}\n`);
  });
}

async function handleTrace(file) {
  if (!file) {
    console.error('错误: 请提供文件路径');
    return;
  }

  const trace = await searchEngine.traceDependencies(file);

  console.log(`\n📊 依赖追踪: ${file}\n`);

  if (trace.dependencies.length === 0) {
    console.log('未找到依赖\n');
    return;
  }

  console.log('依赖项:\n');
  trace.dependencies.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d}`);
  });

  console.log('\n被依赖:\n');
  trace.dependents.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d}`);
  });
  console.log('');
}

async function handleIndex(path) {
  const targetPath = path || '.';
  const result = await searchEngine.buildIndex(targetPath);

  console.log(`\n📚 构建索引: ${targetPath}\n`);
  console.log(`文件数: ${result.files}`);
  console.log(`耗时: ${result.duration}ms\n`);
}

async function handleRebuild() {
  console.log('\n🔄 重建索引...\n');

  const result = await searchEngine.rebuildIndex();

  console.log(`\n✅ 索引重建完成\n`);
  console.log(`文件数: ${result.files}`);
  console.log(`耗时: ${result.duration}ms\n`);
}

async function handleStats() {
  const stats = searchEngine.getStats();

  console.log(`\n📊 搜索统计\n`);
  console.log(`索引文件: ${stats.indexedFiles}`);
  console.log(`总搜索: ${stats.totalSearches}`);
  console.log(`索引大小: ${stats.indexSize}KB\n`);
}

function showHelp() {
  console.log(`
🔍 智能搜索 - 帮助

语义搜索和代码关联分析。

子命令:
  /find-upgrade search <query> [path]   普通搜索
  /find-upgrade semantic <query>          语义搜索
  /find-upgrade references <target>      查找引用
  /find-upgrade trace <file>             依赖追踪
  /find-upgrade index [path]              构建索引
  /find-upgrade rebuild                  重建索引
  /find-upgrade stats                     统计信息

示例:
  /find-upgrade search "function" ./lib
  /find-upgrade semantic "用户认证"
  /find-upgrade references "src/utils.js"
  /find-upgrade trace "src/app.js"
`);
}
