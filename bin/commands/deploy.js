import { DeploymentManager } from "../../lib/utils/deploy.js";

/**
 * 自动化部署
 * 多平台部署和CI/CD集成
 */

const deployManager = new DeploymentManager();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'list':
        await handleList();
        break;

      case 'add':
        await handleAdd(params[0], params[1], params[2]);
        break;

      case 'remove':
        await handleRemove(params[0]);
        break;

      case 'deploy':
        await handleDeploy(params[0]);
        break;

      case 'rollback':
        await handleRollback(params[0]);
        break;

      case 'logs':
        await handleLogs(params[0]);
        break;

      case 'history':
        await handleHistory(params[0]);
        break;

      case 'status':
        await handleStatus();
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`部署操作失败: ${error.message}`);
  }
};

async function handleList() {
  const deployments = deployManager.listDeployments();

  console.log(`\n🚀 部署环境\n`);

  if (deployments.length === 0) {
    console.log('暂无部署配置\n');
    return;
  }

  deployments.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.name}`);
    console.log(`     平台: ${d.platform}`);
    console.log(`     地址: ${d.url}`);
    console.log(`     状态: ${d.status}\n`);
  });
}

async function handleAdd(name, platform, url) {
  if (!name || !platform) {
    console.error('错误: 请提供名称和平台');
    console.log('用法: /deploy add <name> <platform> [url]');
    return;
  }

  const result = deployManager.addDeployment(name, platform, url);

  if (result.success) {
    console.log(`\n✅ 部署环境已添加: ${name}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleRemove(name) {
  if (!name) {
    console.error('错误: 请提供部署名称');
    return;
  }

  const result = deployManager.removeDeployment(name);

  if (result.success) {
    console.log(`\n✅ 部署环境已删除\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleDeploy(name) {
  if (!name) {
    console.error('错误: 请提供部署名称');
    return;
  }

  console.log(`\n🚀 开始部署: ${name}...\n`);

  const result = await deployManager.deploy(name);

  if (result.success) {
    console.log(`\n✅ 部署成功！\n`);
    console.log(`时间: ${result.duration}s`);
    console.log(`版本: ${result.version}\n`);
  } else {
    console.error(`\n❌ 部署失败: ${result.error}\n`);
  }
}

async function handleRollback(name) {
  if (!name) {
    console.error('错误: 请提供部署名称');
    return;
  }

  const result = await deployManager.rollback(name);

  if (result.success) {
    console.log(`\n✅ 回滚成功！\n`);
    console.log(`回滚到: ${result.version}\n`);
  } else {
    console.error(`\n❌ 回滚失败: ${result.error}\n`);
  }
}

async function handleLogs(name) {
  if (!name) {
    console.error('错误: 请提供部署名称');
    return;
  }

  const logs = deployManager.getLogs(name);

  console.log(`\n📋 部署日志: ${name}\n`);

  if (logs.length === 0) {
    console.log('暂无日志\n');
    return;
  }

  logs.forEach(log => {
    console.log(`  [${log.timestamp}] ${log.level}: ${log.message}`);
  });
  console.log('');
}

async function handleHistory(limit) {
  const history = deployManager.getHistory(parseInt(limit) || 10);

  console.log(`\n📜 部署历史\n`);

  if (history.length === 0) {
    console.log('暂无历史记录\n');
    return;
  }

  history.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.timestamp}`);
    console.log(`     ${h.name} - ${h.status}\n`);
  });
}

async function handleStatus() {
  const status = deployManager.getStatus();

  console.log(`\n📊 部署状态\n`);
  console.log(`总部署: ${status.total}`);
  console.log(`运行中: ${status.running}`);
  console.log(`失败: ${status.failed}\n`);
}

function showHelp() {
  console.log(`
🚀 自动化部署 - 帮助

多平台部署和CI/CD集成。

子命令:
  /deploy list                   列出部署环境
  /deploy add <name> <plat> [url] 添加部署环境
  /deploy remove <name>           删除部署环境
  /deploy deploy <name>            执行部署
  /deploy rollback <name>          回滚部署
  /deploy logs <name>              查看日志
  /deploy history [limit]          部署历史
  /deploy status                  当前状态

平台: vercel, netlify, heroku, docker, ssh

示例:
  /deploy add prod vercel https://my-app.vercel.app
  /deploy deploy prod
  /deploy rollback prod
  /deploy logs prod
`);
}
