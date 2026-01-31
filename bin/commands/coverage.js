import { CoverageManager } from '../../lib/utils/coverage.js';

const coverageManager = new CoverageManager();

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'generate':
      return handleGenerate(params);
    case 'get':
      return handleGet(params);
    case 'latest':
      return handleLatest();
    case 'list':
      return handleList(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleGenerate(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /coverage generate <files-json>' };
  }

  const [filesStr] = params;

  let files;
  try {
    files = JSON.parse(filesStr);
  } catch (err) {
    return { success: false, message: 'files必须是有效的JSON数组' };
  }

  const report = coverageManager.generate(files);

  return {
    success: true,
    message: `✅ 覆盖率报告已生成`,
    data: report
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /coverage get <id>' };
  }

  const [id] = params;
  const report = coverageManager.get(id);

  if (!report) {
    return { success: false, message: `❌ 报告 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 覆盖率报告`,
    data: report
  };
}

function handleLatest() {
  const report = coverageManager.getLatest();

  if (!report) {
    return { success: false, message: '📭 暂无覆盖率报告' };
  }

  return {
    success: true,
    message: `✅ 最新覆盖率报告`,
    data: report
  };
}

function handleList(params) {
  const [limitStr] = params;
  const limit = limitStr ? parseInt(limitStr) : 50;
  const reports = coverageManager.getAll(limit);

  if (reports.length === 0) {
    return { success: true, message: '📭 暂无覆盖率报告', data: [] };
  }

  return {
    success: true,
    message: `📋 覆盖率报告列表 (${reports.length}条)`,
    data: reports
  };
}

function handleStats() {
  const stats = coverageManager.getStats();

  return {
    success: true,
    message: '📊 覆盖率统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `📊 /coverage - 代码覆盖率

用法:
  /coverage generate <files-json>    生成覆盖率报告
  /coverage get <id>                获取报告详情
  /coverage latest                  获取最新报告
  /coverage list [limit]            列出所有报告
  /coverage stats                   查看统计

files格式: [{"path":"app.js","statements":100,"coveredStatements":80}]`
  };
}

module.exports = { handle };
