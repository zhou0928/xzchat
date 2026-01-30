import { AnalyzeManager } from '../../lib/utils/analyze.js';

const analyzeManager = new AnalyzeManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'create':
        handleCreate(params[0], params[1]);
        break;
      case 'list':
        handleList();
        break;
      case 'get':
        handleGet(params[0]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`分析操作失败: ${error.message}`);
  }
};

function handleCreate(name, type) {
  if (!name || !type) {
    console.error('错误: 请提供名称和类型');
    console.log('用法: /analyze create <name> <type>');
    return;
  }
  analyzeManager.createAnalyze(name, type, {});
  console.log('\n✅ 分析任务创建成功\n');
}

function handleList() {
  const analyzes = analyzeManager.listAnalyzes();
  console.log('\n🔍 分析列表:\n');
  analyzes.forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.name} (${a.type})`);
    console.log(`     时间: ${new Date(a.timestamp).toLocaleString('zh-CN')}`);
    console.log('');
  });
}

function handleGet(id) {
  const analyze = analyzeManager.getAnalyze(id);
  if (!analyze) {
    console.error('\n❌ 分析不存在\n');
    return;
  }
  console.log(`\n📋 ${analyze.name}:\n`);
  console.log(JSON.stringify(analyze.results, null, 2));
  console.log('');
}

function showHelp() {
  console.log(`
🔍 项目分析 - 帮助

分析代码和项目结构。

子命令:
  /analyze create <name> <type>   创建分析
  /analyze list                   列出分析
  /analyze get <id>               查看详情

示例:
  /analyze create code-dep analysis
  /analyze list

文档: /analyze help
`);
}
