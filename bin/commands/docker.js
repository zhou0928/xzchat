import { DockerManager } from '../../lib/utils/docker.js';

const dockerManager = new DockerManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list': handleList(); break;
      case 'get': handleGet(params[0]); break;
      case 'add': handleAdd(params); break;
      case 'remove': handleRemove(params[0]); break;
      case 'run': handleRun(params[0], params.slice(1)); break;
      case 'help': default: showHelp(); break;
    }
  } catch (error) {
    logger.error(`Docker操作失败: ${error.message}`);
  }
};

function handleList() {
  const commands = dockerManager.listCommands();
  console.log('\n🐳 Docker命令列表:\n');
  commands.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name}`);
    console.log(`     命令: ${c.template}`);
    console.log('');
  });
}

function handleGet(id) {
  const cmd = dockerManager.getCommand(id);
  if (!cmd) {
    console.error('错误: 命令不存在');
    return;
  }
  console.log(`\n${cmd.name}:\n  ${cmd.template}\n`);
}

function handleAdd(params) {
  if (params.length < 2) {
    console.error('错误: 请提供名称和模板');
    console.log('用法: /docker add <name> <template>');
    return;
  }
  dockerManager.addCommand({ name: params[0], template: params.slice(1).join(' ') });
  console.log('\n✅ 命令添加成功\n');
}

function handleRemove(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    return;
  }
  dockerManager.removeCommand(id);
  console.log('\n✅ 命令已删除\n');
}

function handleRun(id, vars) {
  const cmd = dockerManager.getCommand(id);
  if (!cmd) {
    console.error('错误: 命令不存在');
    return;
  }
  const result = dockerManager.executeCommand(cmd.template, { name: vars[0], image: vars[0] });
  if (result.success) {
    console.log('\n✅ 执行成功:\n');
    console.log(result.output);
  } else {
    console.error(`\n❌ 执行失败: ${result.error}\n`);
  }
}

function showHelp() {
  console.log(`
🐳 Docker管理 - 帮助

管理Docker容器和镜像。

子命令:
  /docker list                    列出所有命令
  /docker get <id>                查看命令详情
  /docker add <name> <template>   添加自定义命令
  /docker remove <id>             删除命令
  /docker run <id> [vars]         执行命令

示例:
  /docker list
  /docker get ps
  /docker add myapp "docker run -d --name {name} {image}"
  /docker run myapp nginx

文档: /docker help
`);
}
