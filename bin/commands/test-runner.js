import testRunner from '../../lib/utils/test-runner.js';

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add-suite':
      return handleAddSuite(params);
    case 'run':
      return handleRun(params);
    case 'get-suite':
      return handleGetSuite(params);
    case 'list-suites':
      return handleListSuites();
    case 'get-run':
      return handleGetRun(params);
    case 'history':
      return handleHistory(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAddSuite(params) {
  if (params.length < 1) {
    return { success: false, message: '用法: /test-runner add-suite <name> <tests-json>' };
  }

  const [name, testsStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let tests;
  try {
    tests = JSON.parse(testsStr);
  } catch (err) {
    return { success: false, message: 'tests必须是有效的JSON数组' };
  }

  const suite = testRunner.addSuite(name, tests, description);

  return {
    success: true,
    message: `✅ 测试套件 "${name}" 已创建`,
    data: suite
  };
}

async function handleRun(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /test-runner run <suite-id>' };
  }

  const [id] = params;
  const result = await testRunner.run(id);

  return {
    success: result.success,
    message: result.message,
    data: result.data
  };
}

function handleGetSuite(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /test-runner get-suite <id>' };
  }

  const [id] = params;
  const suite = testRunner.getSuite(id);

  if (!suite) {
    return { success: false, message: `❌ 测试套件 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 测试套件 "${suite.name}"`,
    data: suite
  };
}

function handleListSuites() {
  const suites = testRunner.getSuites();

  if (suites.length === 0) {
    return { success: true, message: '📭 暂无测试套件', data: [] };
  }

  return {
    success: true,
    message: `📋 测试套件列表 (${suites.length}个)`,
    data: suites
  };
}

function handleGetRun(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /test-runner get-run <id>' };
  }

  const [id] = params;
  const run = testRunner.getRun(id);

  if (!run) {
    return { success: false, message: `❌ 运行记录 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 运行记录`,
    data: run
  };
}

function handleHistory(params) {
  const [limitStr] = params;
  const limit = limitStr ? parseInt(limitStr) : 50;
  const history = testRunner.getHistory(limit);

  if (history.length === 0) {
    return { success: true, message: '📭 暂无运行历史', data: [] };
  }

  return {
    success: true,
    message: `📋 运行历史 (${history.length}条)`,
    data: history
  };
}

function handleStats() {
  const stats = testRunner.getStats();

  return {
    success: true,
    message: '📊 测试统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🧪 /test-runner - 测试运行器

用法:
  /test-runner add-suite <name> <tests> [desc]    创建测试套件
  /test-runner run <suite-id>                     运行测试
  /test-runner get-suite <id>                     获取套件详情
  /test-runner list-suites                        列出所有套件
  /test-runner get-run <id>                       获取运行记录
  /test-runner history [limit]                    查看运行历史
  /test-runner stats                              查看统计

tests格式: [{"name":"test1","fn":"function(){...}"}]`
  };
}

module.exports = { handle };
