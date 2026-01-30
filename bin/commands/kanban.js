import { KanbanBoard } from "../../lib/utils/kanban.js";

/**
 * 任务看板
 * 可视化任务管理和进度跟踪
 */

const kanbanBoard = new KanbanBoard();

export const handle = async (args, context) => {
  const { logger } = context;
  const [action, ...params] = args;

  try {
    switch (action) {
      case 'board':
        await handleBoard(params[0]);
        break;

      case 'add':
        await handleAdd(params[0], params[1], params[2]);
        break;

      case 'move':
        await handleMove(params[0], params[1]);
        break;

      case 'update':
        await handleUpdate(params[0], params[1], params[2]);
        break;

      case 'remove':
        await handleRemove(params[0]);
        break;

      case 'columns':
        await handleColumns();
        break;

      case 'stats':
        await handleStats();
        break;

      case 'export':
        await handleExport(params[0]);
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    logger.error(`看板操作失败: ${error.message}`);
  }
};

async function handleBoard(boardName) {
  const name = boardName || 'default';
  const board = kanbanBoard.getBoard(name);

  console.log(`\n📋 看板: ${board.name}\n`);

  board.columns.forEach(col => {
    console.log(`\n${col.name} (${col.tasks.length}):\n`);
    col.tasks.forEach((task, i) => {
      console.log(`  ${i + 1}. [${task.priority}] ${task.title}`);
      if (task.assignee) console.log(`     负责人: ${task.assignee}`);
    });
  });
  console.log('');
}

async function handleAdd(boardName, title, priority) {
  const name = boardName || 'default';

  if (!title) {
    console.error('错误: 请提供任务标题');
    console.log('用法: /kanban add [board] <title> [priority]');
    return;
  }

  const result = kanbanBoard.addTask(name, title, priority || 'medium');

  if (result.success) {
    console.log(`\n✅ 任务已添加: ${result.taskId}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleMove(taskId, column) {
  if (!taskId || !column) {
    console.error('错误: 请提供任务ID和目标列');
    console.log('用法: /kanban move <taskId> <column>');
    return;
  }

  const result = kanbanBoard.moveTask(taskId, column);

  if (result.success) {
    console.log(`\n✅ 任务已移动到 ${column}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleUpdate(taskId, field, value) {
  if (!taskId || !field || !value) {
    console.error('错误: 请提供任务ID、字段和值');
    console.log('用法: /kanban update <taskId> <field> <value>');
    return;
  }

  const result = kanbanBoard.updateTask(taskId, field, value);

  if (result.success) {
    console.log(`\n✅ 任务已更新\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleRemove(taskId) {
  if (!taskId) {
    console.error('错误: 请提供任务ID');
    return;
  }

  const result = kanbanBoard.removeTask(taskId);

  if (result.success) {
    console.log(`\n✅ 任务已删除\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

async function handleColumns() {
  const columns = kanbanBoard.getColumns();

  console.log(`\n📊 可用列\n`);
  columns.forEach((col, i) => {
    console.log(`  ${i + 1}. ${col.name} (${col.tasks})`);
  });
  console.log('');
}

async function handleStats() {
  const stats = kanbanBoard.getStats();

  console.log(`\n📈 看板统计\n`);
  console.log(`总任务: ${stats.total}`);
  console.log(`已完成: ${stats.completed}`);
  console.log(`进行中: ${stats.inProgress}`);
  console.log(`待办: ${stats.todo}`);
  console.log(`完成率: ${stats.completionRate}%\n`);
}

async function handleExport(file) {
  const path = file || 'kanban-export.json';
  const result = await kanbanBoard.export(path);

  if (result.success) {
    console.log(`\n✅ 看板已导出到: ${path}\n`);
  } else {
    console.error(`\n❌ ${result.error}\n`);
  }
}

function showHelp() {
  console.log(`
📋 任务看板 - 帮助

可视化任务管理和进度跟踪。

子命令:
  /kanban board [name]            查看看板
  /kanban add [board] <title> [pri] 添加任务
  /kanban move <id> <column>       移动任务
  /kanban update <id> <field> <val> 更新任务
  /kanban remove <id>              删除任务
  /kanban columns                  查看列
  /kanban stats                    统计信息
  /kanban export [file]            导出看板

字段: title, description, assignee, priority, dueDate

优先级: low, medium, high, critical

示例:
  /kanban add "修复登录bug" "high"
  /kanban move 1 "进行中"
  /kanban update 1 assignee "John"
  /kanban stats
`);
}
