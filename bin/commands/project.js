import projectManager from '../../lib/utils/project.js';

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
      case 'milestone':
        return await handleMilestone(rest);
      case 'task':
        return await handleTask(rest);
      case 'progress':
        return await handleProgress(rest[0]);
      default:
        return showHelp();
    }
  } catch (error) {
    return `❌ 错误: ${error.message}`;
  }
};

async function handleList() {
  const projects = await projectManager.list();
  
  let output = '📁 项目列表\n\n';
  
  if (projects.length === 0) {
    output += '暂无项目。\n';
    return output;
  }

  projects.forEach(p => {
    output += `• ${p.name}\n`;
    output += `  ID: ${p.id}\n`;
    output += `  描述: ${p.description || '无'}\n`;
    output += `  成员: ${p.members?.join(', ') || '无'}\n\n`;
  });

  return output.trim();
}

async function handleGet(id) {
  if (!id) {
    return '❌ 请指定项目 ID\n用法: /project get <id>';
  }

  const project = await projectManager.get(id);
  
  if (!project) {
    return `❌ 项目 "${id}" 不存在`;
  }

  let output = `📁 项目: ${project.name}\n\n`;
  output += `ID: ${project.id}\n`;
  output += `描述: ${project.description || '无'}\n`;
  output += `技术栈: ${project.techStack?.join(', ') || '无'}\n`;
  output += `成员: ${project.members?.join(', ') || '无'}\n`;
  output += `创建: ${new Date(project.createdAt).toLocaleString('zh-CN')}\n\n`;
  
  output += `里程碑: ${project.milestones?.length || 0}\n`;
  output += `任务: ${project.tasks?.length || 0}`;

  return output;
}

async function handleAdd(args) {
  const id = args[0];
  const name = args[1];
  
  if (!id || !name) {
    return '❌ 用法: /project add <id> <名称> [--desc 描述]';
  }

  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--desc' && args[i + 1]) {
      options.description = args.slice(i + 1).join(' ');
      break;
    }
  }

  const project = await projectManager.add(id, name, options);
  return `✅ 项目 "${name}" 创建成功！`;
}

async function handleRemove(id) {
  if (!id) {
    return '❌ 请指定项目 ID\n用法: /project remove <id>';
  }

  await projectManager.remove(id);
  return `✅ 项目已删除`;
}

async function handleUpdate(args) {
  const [id, field, ...values] = args;
  
  if (!id || !field) {
    return '❌ 用法: /project update <id> <field> <value>\n字段: name, description, status';
  }

  const updates = {};
  if (field === 'name') {
    updates.name = values.join(' ');
  } else if (field === 'description') {
    updates.description = values.join(' ');
  } else if (field === 'status') {
    updates.status = values[0];
  } else {
    return `❌ 不支持的字段: ${field}`;
  }

  await projectManager.update(id, updates);
  return `✅ 项目更新成功！`;
}

async function handleMilestone(args) {
  const [id, action, ...values] = args;
  
  if (!id || !action) {
    return '❌ 用法: /project milestone <id> add <名称> [日期]';
  }

  if (action === 'add') {
    const name = values[0];
    const date = values[1];
    await projectManager.addMilestone(id, { name, dueDate: date, status: 'pending' });
    return `✅ 里程碑已添加`;
  }

  return `❌ 不支持的操作: ${action}`;
}

async function handleTask(args) {
  const [id, action, ...values] = args;
  
  if (!id || !action) {
    return '❌ 用法: /project task <id> add <名称> [assignee]';
  }

  if (action === 'add') {
    const name = values[0];
    const assignee = values[1];
    await projectManager.addTask(id, { name, assignee, status: 'todo' });
    return `✅ 任务已添加`;
  }

  return `❌ 不支持的操作: ${action}`;
}

async function handleProgress(id) {
  if (!id) {
    return '❌ 请指定项目 ID\n用法: /project progress <id>';
  }

  const progress = await projectManager.getProgress(id);
  
  let output = `📊 项目进度: ${progress.name}\n\n`;
  output += `任务进度: ${progress.taskProgress}% (${progress.completedTasks}/${progress.totalTasks})\n`;
  output += `里程碑: ${progress.milestoneProgress}% (${progress.completedMilestones}/${progress.totalMilestones})`;

  return output;
}

function showHelp() {
  return `📁 项目管理

用法:
  /project list                    列出所有项目
  /project get <id>                查看项目详情
  /project add <id> <名称>         创建项目
    选项: --desc 描述
  /project remove <id>             删除项目
  /project update <id> <field>     更新项目
    字段: name, description, status
  /project milestone <id> add      添加里程碑
  /project task <id> add           添加任务
  /project progress <id>           查看进度

示例:
  /project add myapp "我的应用" --desc "一个Web应用"
  /project milestone myapp add "Beta发布" 2026-03-01
  /project task myapp add "实现登录功能" Alice
  /project progress myapp`;
}
