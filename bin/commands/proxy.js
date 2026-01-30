import { ProxyManager } from '../../lib/utils/proxy.js';

const proxyManager = new ProxyManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'add':
        handleAdd(params);
        break;
      case 'list':
        handleList();
        break;
      case 'activate':
        handleActivate(params[0]);
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
    logger.error(`代理操作失败: ${error.message}`);
  }
};

function handleAdd(params) {
  if (params.length < 2) {
    console.error('错误: 请提供名称和地址');
    console.log('用法: /proxy add <name> <host:port> [username] [password]');
    return;
  }
  const [host, port] = params[1].split(':');
  proxyManager.addConfig(params[0], host, port, params[2], params[3]);
  console.log('\n✅ 代理配置添加成功\n');
}

function handleList() {
  const configs = proxyManager.listConfigs();
  console.log('\n🔌 代理配置列表:\n');
  configs.forEach((c, i) => {
    const active = c.id === proxyManager.activeConfig ? '✅' : '  ';
    console.log(`  ${active} ${i + 1}. ${c.name}`);
    console.log(`      ${c.host}:${c.port}`);
    console.log('');
  });
}

function handleActivate(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    return;
  }
  const result = proxyManager.setActive(id);
  if (result.success) {
    console.log('\n✅ 代理已激活\n');
  } else {
    console.error('\n❌ 激活失败\n');
  }
}

function handleRemove(id) {
  if (!id) {
    console.error('错误: 请提供ID');
    return;
  }
  proxyManager.removeConfig(id);
  console.log('\n✅ 代理配置已删除\n');
}

function showHelp() {
  console.log(`
🔌 代理管理 - 帮助

管理HTTP/HTTPS代理配置。

子命令:
  /proxy add <name> <host:port> [user] [pass]  添加配置
  /proxy list                                   列出所有配置
  /proxy activate <id>                          激活配置
  /proxy remove <id>                            删除配置

示例:
  /proxy add myproxy 127.0.0.1:7890
  /proxy activate 123
  /proxy list

文档: /proxy help
`);
}
