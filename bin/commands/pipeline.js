import { PipelineManager } from '../../lib/utils/pipeline.js';

const pipelineManager = new PipelineManager();

async function handle(args, context) {
  const [action, ...params] = args;

  switch (action) {
    case 'add':
      return handleAdd(params);
    case 'get':
      return handleGet(params);
    case 'list':
      return handleList(params);
    case 'update':
      return handleUpdate(params);
    case 'remove':
      return handleRemove(params);
    case 'run':
      return handleRun(params);
    case 'runs':
      return handleRuns(params);
    case 'cancel':
      return handleCancel(params);
    case 'stats':
      return handleStats();
    default:
      return showHelp();
  }
}

function handleAdd(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /pipeline add <name> <stages-json> [description]' };
  }

  const [name, stagesStr, ...descParts] = params;
  const description = descParts.join(' ') || '';

  let stages;
  try {
    stages = JSON.parse(stagesStr);
  } catch (err) {
    return { success: false, message: 'stages必须是有效的JSON数组' };
  }

  const pipeline = pipelineManager.add(name, stages, description);

  return {
    success: true,
    message: `✅ 流水线 "${name}" 已创建`,
    data: pipeline
  };
}

function handleGet(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /pipeline get <id>' };
  }

  const [id] = params;
  const pipeline = pipelineManager.get(id);

  if (!pipeline) {
    return { success: false, message: `❌ 流水线 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 流水线 "${pipeline.name}"`,
    data: pipeline
  };
}

function handleList(params) {
  const [status] = params;
  const pipelines = status
    ? pipelineManager.getByStatus(status)
    : pipelineManager.getAll();

  if (pipelines.length === 0) {
    return { success: true, message: '📭 暂无流水线', data: [] };
  }

  return {
    success: true,
    message: `📋 流水线列表 (${pipelines.length}个)`,
    data: pipelines
  };
}

function handleUpdate(params) {
  if (params.length < 2) {
    return { success: false, message: '用法: /pipeline update <id> <key> <value>' };
  }

  const [id, key, ...valueParts] = params;
  const value = valueParts.join(' ');
  const pipeline = pipelineManager.update(id, { [key]: value });

  if (!pipeline) {
    return { success: false, message: `❌ 流水线 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 流水线 "${pipeline.name}" 已更新`,
    data: pipeline
  };
}

function handleRemove(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /pipeline remove <id>' };
  }

  const [id] = params;
  const removed = pipelineManager.remove(id);

  if (!removed) {
    return { success: false, message: `❌ 流水线 "${id}" 不存在` };
  }

  return {
    success: true,
    message: `✅ 流水线 "${removed.name}" 已删除`,
    data: removed
  };
}

async function handleRun(params) {
  const [id, ...inputParts] = params;
  let inputs = {};

  if (inputParts.length > 0) {
    try {
      inputs = JSON.parse(inputParts.join(' '));
    } catch (err) {
      inputs = {};
    }
  }

  const result = await pipelineManager.run(id, inputs);

  return {
    success: result.success,
    message: result.message,
    data: result.data
  };
}

function handleRuns(params) {
  const [pipelineId, limitStr] = params;
  const limit = limitStr ? parseInt(limitStr) : 20;
  const runs = pipelineManager.getRuns(pipelineId || null, limit);

  if (runs.length === 0) {
    return { success: true, message: '📭 暂无运行记录', data: [] };
  }

  return {
    success: true,
    message: `📋 运行记录 (${runs.length}条)`,
    data: runs
  };
}

function handleCancel(params) {
  if (params.length === 0) {
    return { success: false, message: '用法: /pipeline cancel <run-id>' };
  }

  const [id] = params;
  const result = pipelineManager.cancelRun(id);

  return {
    success: result.success,
    message: result.success ? `✅ ${result.message}` : `❌ ${result.message}`
  };
}

function handleStats() {
  const stats = pipelineManager.getStats();

  return {
    success: true,
    message: '📊 流水线统计',
    data: stats
  };
}

function showHelp() {
  return {
    success: true,
    message: `🔧 /pipeline - 自动化流水线

用法:
  /pipeline add <name> <stages-json> [description]  创建流水线
  /pipeline get <id>                                 获取流水线详情
  /pipeline list [status]                            列出所有流水线
  /pipeline update <id> <key> <value>                更新流水线
  /pipeline remove <id>                              删除流水线
  /pipeline run <id> [inputs-json]                  执行流水线
  /pipeline runs [pipeline-id] [limit]              查看运行记录
  /pipeline cancel <run-id>                          取消运行
  /pipeline stats                                    查看统计

stages格式: [{"id":"s1","name":"构建","type":"build","config":{}}]`
  };
}

module.exports = { handle };
