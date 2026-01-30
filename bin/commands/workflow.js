import workflowManager from '../../lib/utils/workflow.js';

export const handle = async (args, context) => {
  const [action, ...rest] = args;

  try {
    switch (action) {
      case 'list':
        return await handleList();
      case 'get':
        return await handleGet(rest[0]);
      case 'add':
        return await handleAdd(rest);
      case 'remove':
        return await handleRemove(rest[0]);
      case 'update':
        return await handleUpdate(rest);
      case 'run':
        return await handleRun(rest);
      case 'history':
        return await handleHistory(rest[0]);
      case 'validate':
        return await handleValidate(rest[0]);
      case 'export':
        return await handleExport(rest[0]);
      case 'import':
        return await handleImport(rest[0]);
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleList() {
  const workflows = await workflowManager.list();
  
  let output = '📋 工作流列表\n\n';
  
  if (workflows.length === 0) {
    output += '暂无工作流。使用 /workflow add 创建新工作流。\n';
    return output;
  }

  workflows.forEach(wf => {
    output += `• ${wf.id}\n`;
    output += `  名称: ${wf.name}\n`;
    output += `  描述: ${wf.description}\n`;
    output += `  步骤数: ${wf.steps}\n\n`;
  });

  return output.trim();
}

async function handleGet(id) {
  if (!id) {
    return '❌ 请指定工作流 ID\n用法: /workflow get <id>';
  }

  const workflow = await workflowManager.get(id);
  
  if (!workflow) {
    return `❌ 工作流 "${id}" 不存在`;
  }

  let output = `📋 工作流: ${workflow.name}\n\n`;
  output += `ID: ${id}\n`;
  output += `描述: ${workflow.description}\n`;
  output += `创建时间: ${new Date(workflow.createdAt).toLocaleString('zh-CN')}\n`;
  output += `更新时间: ${new Date(workflow.updatedAt).toLocaleString('zh-CN')}\n\n`;
  
  output += '步骤:\n';
  workflow.steps.forEach((step, index) => {
    output += `  ${index + 1}. [${step.type}] ${step.name || step.action}\n`;
    output += `     Action: ${step.action}\n`;
    if (step.condition) {
      output += `     Condition: ${step.condition}\n`;
    }
    if (step.updateVars) {
      output += `     UpdateVars: ${JSON.stringify(step.updateVars)}\n`;
    }
  });

  if (Object.keys(workflow.variables).length > 0) {
    output += '\n变量:\n';
    Object.entries(workflow.variables).forEach(([key, value]) => {
      output += `  • ${key}: ${value}\n`;
    });
  }

  return output.trim();
}

async function handleAdd(args) {
  const [id, name, description, ...stepArgs] = args;
  
  if (!id || !name) {
    return '❌ 用法: /workflow add <id> <名称> [描述]\n示例: /workflow add my-flow 我的流程 测试工作流';
  }

  const workflow = await workflowManager.add(
    id,
    name,
    description || '无描述',
    [], // 空步骤，后续可以通过 update 添加
    {}  // 空变量
  );

  return `✅ 工作流 "${name}" 创建成功！\n\n使用 /workflow update ${id} 添加步骤和变量。`;
}

async function handleRemove(id) {
  if (!id) {
    return '❌ 请指定工作流 ID\n用法: /workflow remove <id>';
  }

  await workflowManager.remove(id);
  return `✅ 工作流 "${id}" 已删除`;
}

async function handleUpdate(args) {
  const [id, field, ...values] = args;
  
  if (!id) {
    return '❌ 请指定工作流 ID\n用法: /workflow update <id> <field> <value>';
  }

  const updates = {};

  if (field === 'name') {
    updates.name = values.join(' ');
  } else if (field === 'description') {
    updates.description = values.join(' ');
  } else if (field === 'step') {
    // /workflow update <id> step add <type> <action> [name]
    const [action, type, actionValue, stepName] = values;
    const workflow = await workflowManager.get(id);
    
    if (action === 'add') {
      if (!type || !actionValue) {
        return '❌ 用法: /workflow update <id> step add <type> <action> [name]';
      }
      workflow.steps.push({
        type,
        action: actionValue,
        name: stepName || `Step ${workflow.steps.length + 1}`
      });
      updates.steps = workflow.steps;
    } else if (action === 'remove') {
      const index = parseInt(actionValue) - 1;
      if (index >= 0 && index < workflow.steps.length) {
        workflow.steps.splice(index, 1);
        updates.steps = workflow.steps;
      } else {
        return `❌ 无效的步骤索引: ${index}`;
      }
    }
  } else if (field === 'var') {
    // /workflow update <id> var <key> <value>
    const [key, ...varValues] = values;
    const workflow = await workflowManager.get(id);
    workflow.variables[key] = varValues.join(' ');
    updates.variables = workflow.variables;
  } else {
    return `❌ 不支持的字段: ${field}\n支持的字段: name, description, step, var`;
  }

  const updated = await workflowManager.update(id, updates);
  return `✅ 工作流 "${id}" 更新成功！`;
}

async function handleRun(args) {
  const [id, ...varArgs] = args;
  
  if (!id) {
    return '❌ 请指定工作流 ID\n用法: /workflow run <id> [key=value ...]';
  }

  // 解析变量
  const variables = {};
  varArgs.forEach(arg => {
    const [key, ...values] = arg.split('=');
    if (key) {
      variables[key] = values.join('=');
    }
  });

  const execution = await workflowManager.execute(id, variables);

  let output = `🚀 执行工作流: ${id}\n\n`;
  output += `执行ID: ${execution.id}\n`;
  output += `状态: ${execution.status}\n`;
  output += `开始时间: ${new Date(execution.startedAt).toLocaleString('zh-CN')}\n\n`;

  output += '执行步骤:\n';
  execution.steps.forEach(step => {
    const statusIcon = step.status === 'completed' ? '✅' : '❌';
    output += `${statusIcon} ${step.index + 1}. ${step.name}\n`;
    output += `   类型: ${step.type}\n`;
    output += `   动作: ${step.action}\n`;
    if (step.result?.output) {
      output += `   输出: ${step.result.output.substring(0, 100)}\n`;
    }
    if (step.result?.error) {
      output += `   错误: ${step.result.error}\n`;
    }
    output += '\n';
  });

  if (execution.status === 'failed') {
    output += `❌ 执行失败: ${execution.error}\n`;
  } else {
    output += `✅ 执行完成！\n`;
    output += `结束时间: ${new Date(execution.completedAt).toLocaleString('zh-CN')}\n`;
  }

  return output.trim();
}

async function handleHistory(id) {
  if (id) {
    const execution = workflowManager.getExecutionHistory(id);
    if (!execution) {
      return `❌ 执行记录 "${id}" 不存在`;
    }
    
    let output = `📊 执行记录: ${execution.id}\n\n`;
    output += `工作流: ${execution.workflowId}\n`;
    output += `状态: ${execution.status}\n`;
    output += `开始时间: ${new Date(execution.startedAt).toLocaleString('zh-CN')}\n`;
    output += `完成时间: ${execution.completedAt ? new Date(execution.completedAt).toLocaleString('zh-CN') : '进行中'}\n`;
    
    return output;
  }

  const history = workflowManager.getExecutionHistory();
  
  let output = '📊 执行历史\n\n';
  
  if (history.length === 0) {
    output += '暂无执行记录。\n';
    return output;
  }

  history.slice(-10).reverse().forEach(exec => {
    const statusIcon = exec.status === 'completed' ? '✅' : exec.status === 'running' ? '⏳' : '❌';
    output += `${statusIcon} ${exec.id}\n`;
    output += `   工作流: ${exec.workflowId}\n`;
    output += `   时间: ${new Date(exec.startedAt).toLocaleString('zh-CN')}\n`;
    output += `   状态: ${exec.status}\n`;
    if (exec.error) {
      output += `   错误: ${exec.error}\n`;
    }
    output += '\n';
  });

  return output.trim();
}

async function handleValidate(id) {
  if (!id) {
    return '❌ 请指定工作流 ID\n用法: /workflow validate <id>';
  }

  const result = await workflowManager.validate(id);

  let output = `🔍 验证工作流: ${id}\n\n`;
  output += `状态: ${result.valid ? '✅ 通过' : '❌ 失败'}\n\n`;

  if (result.errors.length > 0) {
    output += '错误:\n';
    result.errors.forEach(err => {
      output += `  ❌ ${err}\n`;
    });
    output += '\n';
  }

  if (result.warnings.length > 0) {
    output += '警告:\n';
    result.warnings.forEach(warn => {
      output += `  ⚠️  ${warn}\n`;
    });
  }

  return output.trim();
}

async function handleExport(format = 'json') {
  const content = await workflowManager.export(format);
  return `📤 工作流导出 (${format})\n\n\`\`\`${format}\n${content}\n\`\`\``;
}

async function handleImport(filePath) {
  if (!filePath) {
    return '❌ 请指定文件路径\n用法: /workflow import <file.json>';
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const count = await workflowManager.import(content);

  return `✅ 成功导入 ${count} 个工作流！`;
}

function showHelp() {
  return `📋 工作流自动化管理

用法:
  /workflow list                    列出所有工作流
  /workflow get <id>                查看工作流详情
  /workflow add <id> <名称> [描述]  创建新工作流
  /workflow remove <id>             删除工作流
  /workflow update <id> <field>     更新工作流
    字段: name, description, step, var
    示例: /workflow update my-flow step add command "/git log" 查看日志
         /workflow update my-flow var PROJECT my-project
  /workflow run <id> [key=value]   执行工作流
  /workflow history [id]            查看执行历史
  /workflow validate <id>           验证工作流
  /workflow export [format]         导出工作流 (json/yaml)
  /workflow import <file>           导入工作流

工作流步骤类型:
  • command  - 执行 xzChat 命令
  • prompt   - 发送给 AI 处理
  • snippet  - 操作代码片段
  • bookmark - 操作书签
  • todo     - 操作任务
  • env      - 操作环境变量
  • shell    - 执行 shell 命令
  • wait     - 等待 (秒数)

变量使用: {{变量名}}
条件: {{变量名}} == value`;
}
