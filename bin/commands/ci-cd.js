import { CiCdManager } from '../../lib/utils/ci-cd.js';

const ciCdManager = new CiCdManager();

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
      case 'delete':
        handleDelete(params[0]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`CI/CD操作失败: ${error.message}`);
  }
};

function handleCreate(name, stages) {
  if (!name) {
    console.error('错误: 请提供管道名称');
    console.log('用法: /ci-cd create <name> <stages>');
    return;
  }
  const stageList = stages ? stages.split(',').map(s => s.trim()) : ['build', 'test', 'deploy'];
  ciCdManager.createPipeline(name, stageList);
  console.log('\n✅ CI/CD管道创建成功\n');
}

function handleList() {
  const pipelines = ciCdManager.listPipelines();
  console.log('\n🔄 CI/CD管道列表:\n');
  pipelines.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     ID: ${p.id}`);
    console.log(`     状态: ${p.status}`);
    console.log(`     阶段: ${p.stages.join(', ')}`);
    console.log('');
  });
}

function handleDelete(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    return;
  }
  ciCdManager.deletePipeline(id);
  console.log('\n✅ 管道已删除\n');
}

function showHelp() {
  console.log(`
🔄 CI/CD管理 - 帮助

管理CI/CD流程和配置。

子命令:
  /ci-cd create <name> [stages]    创建管道
  /ci-cd list                      列出所有管道
  /ci-cd delete <id>               删除管道

示例:
  /ci-cd create my-pipeline build,test,deploy
  /ci-cd list

文档: /ci-cd help
`);
}
