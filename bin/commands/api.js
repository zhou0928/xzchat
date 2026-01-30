import { APITester } from "../../lib/utils/api.js";

/**
 * API测试工具
 * HTTP请求测试和API文档生成
 */

const apiTester = new APITester();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'test':
        await handleTest(params[0], params[1]);
        break;

      case 'save':
        await handleSave(params[0], params[1]);
        break;

      case 'list':
        await handleList();
        break;

      case 'run':
        await handleRun(params[0]);
        break;

      case 'docs':
        await handleDocs(params[0]);
        break;

      case 'mock':
        await handleMock(params[0]);
        break;

      case 'history':
        await handleHistory(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`API测试操作失败: ${error.message}`);
  }
};

async function handleTest(url, method) {
  if (!url) {
    console.error('错误: 请提供URL');
    console.log('用法: /api test <url> [method]');
    return;
  }

  const result = await apiTester.testRequest(url, method || 'GET');

  console.log(`\n🔍 API测试\n`);
  console.log(`URL: ${result.url}`);
  console.log(`方法: ${result.method}`);
  console.log(`状态: ${result.status}`);
  console.log(`耗时: ${result.duration}ms`);
  console.log(`\n响应:\n${JSON.stringify(result.data, null, 2)}\n`);
}

async function handleSave(name, config) {
  if (!name || !config) {
    console.error('错误: 请提供名称和配置');
    console.log('用法: /api save <name> <config>');
    return;
  }

  const result = apiTester.saveRequest(name, config);

  if (result.success) {
    console.log(`\n✅ 请求已保存: ${name}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleList() {
  const requests = apiTester.listRequests();

  console.log(`\n📋 已保存的请求\n`);

  if (requests.length === 0) {
    console.log('暂无保存的请求\n');
    return;
  }

  requests.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name}`);
    console.log(`     ${r.method} ${r.url}\n`);
  });
}

async function handleRun(name) {
  if (!name) {
    console.error('错误: 请提供请求名称');
    return;
  }

  const result = await apiTester.runRequest(name);

  if (!result.success) {
    console.error(`\n❌ ${result.error}\n`);
    return;
  }

  console.log(`\n🚀 执行请求: ${name}\n`);
  console.log(`状态: ${result.response.status}`);
  console.log(`耗时: ${result.response.duration}ms`);
  console.log(`\n响应:\n${JSON.stringify(result.response.data, null, 2)}\n`);
}

async function handleDocs(file) {
  const docs = apiTester.generateDocs();

  if (file) {
    const result = await apiTester.saveDocs(file, docs);

    if (result.success) {
      console.log(`\n✅ API文档已保存到: ${file}\n`);
    }
  } else {
    console.log(`\n📚 API文档\n${docs}\n`);
  }
}

async function handleMock(name) {
  const mock = apiTester.generateMock(name);

  console.log(`\n🎭 Mock服务器\n`);
  console.log(`名称: ${mock.name}`);
  console.log(`端口: ${mock.port}`);
  console.log(`路由:\n`);

  mock.routes.forEach(r => {
    console.log(`  ${r.method} ${r.path} -> ${r.response}`);
  });
  console.log('');
}

async function handleHistory(limit) {
  const history = apiTester.getHistory(parseInt(limit) || 10);

  console.log(`\n📜 测试历史\n`);

  if (history.length === 0) {
    console.log('暂无历史记录\n');
    return;
  }

  history.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.timestamp}`);
    console.log(`     ${h.method} ${h.url} - ${h.status}\n`);
  });
}

function showHelp() {
  console.log(`
🌐 API测试工具 - 帮助

HTTP请求测试和API文档生成。

子命令:
  /api test <url> [method]      测试API请求
  /api save <name> <config>     保存请求配置
  /api list                      列出保存的请求
  /api run <name>                执行保存的请求
  /api docs [file]               生成API文档
  /api mock <name>               生成Mock服务
  /api history [limit]           查看测试历史

示例:
  /api test https://api.example.com/users
  /api test https://api.example.com/users POST
  /api save getUsers '{"url":"https://api.example.com/users","method":"GET"}'
  /api run getUsers
  /api docs api-docs.md
`);
}
