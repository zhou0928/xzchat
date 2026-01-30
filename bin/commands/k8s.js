import { K8sManager } from '../../lib/utils/k8s.js';

const k8sManager = new K8sManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list':
        handleList();
        break;
      case 'add':
        handleAdd(params);
        break;
      case 'remove':
        handleRemove(params[0]);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`K8s操作失败: ${error.message}`);
  }
};

function handleList() {
  const configs = k8sManager.listConfigs();
  console.log('\n☸️  K8s配置列表:\n');
  configs.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} (${c.type})`);
    console.log(`     ID: ${c.id}`);
    console.log('');
  });
}

function handleAdd(params) {
  if (params.length < 2) {
    console.error('错误: 参数不足');
    console.log('用法: /k8s add <name> <type> [content]');
    return;
  }
  k8sManager.addConfig({ name: params[0], type: params[1], content: params[2] || '' });
  console.log('\n✅ 配置添加成功\n');
}

function handleRemove(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    return;
  }
  k8sManager.removeConfig(id);
  console.log('\n✅ 配置已删除\n');
}

function showHelp() {
  console.log(`
☸️  Kubernetes管理 - 帮助

管理Kubernetes配置和部署。

子命令:
  /k8s list                       列出所有配置
  /k8s add <name> <type> [content]  添加配置
  /k8s remove <id>                删除配置

示例:
  /k8s add myapp deployment
  /k8s list

文档: /k8s help
`);
}
