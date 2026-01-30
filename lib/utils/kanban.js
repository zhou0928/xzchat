import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const BOARDS_FILE = path.join(DATA_DIR, 'kanban-boards.json');

/**
 * 看板管理器类
 */
export class KanbanBoard {
  constructor() {
    this.boards = {};
    this.loadBoards();
  }

  async loadBoards() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(BOARDS_FILE, 'utf-8');
      this.boards = JSON.parse(data);
    } catch (error) {
      this.boards = {
        default: this.createDefaultBoard()
      };
    }
  }

  async saveBoards() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(BOARDS_FILE, JSON.stringify(this.boards, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存看板失败:', error.message);
    }
  }

  createDefaultBoard() {
    return {
      name: 'default',
      columns: [
        { name: '待办', order: 0, tasks: [] },
        { name: '进行中', order: 1, tasks: [] },
        { name: '已完成', order: 2, tasks: [] }
      ],
      createdAt: new Date().toISOString()
    };
  }

  getBoard(name) {
    return this.boards[name] || this.boards['default'];
  }

  addTask(boardName, title, priority = 'medium') {
    const board = this.boards[boardName] || this.boards['default'];

    if (!board) {
      return { success: false, error: '看板不存在' };
    }

    const taskId = `task-${Date.now()}`;
    const task = {
      id: taskId,
      title,
      description: '',
      assignee: '',
      priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    board.columns[0].tasks.push(task);
    this.saveBoards();

    return { success: true, taskId };
  }

  moveTask(taskId, columnName) {
    for (const boardName in this.boards) {
      const board = this.boards[boardName];

      for (const col of board.columns) {
        const taskIndex = col.tasks.findIndex(t => t.id === taskId);

        if (taskIndex !== -1) {
          const task = col.tasks.splice(taskIndex, 1)[0];
          task.status = columnName;
          task.updatedAt = new Date().toISOString();

          const targetCol = board.columns.find(c => c.name === columnName);
          if (targetCol) {
            targetCol.tasks.push(task);
          }

          this.saveBoards();
          return { success: true };
        }
      }
    }

    return { success: false, error: '任务不存在' };
  }

  updateTask(taskId, field, value) {
    for (const boardName in this.boards) {
      const board = this.boards[boardName];

      for (const col of board.columns) {
        const task = col.tasks.find(t => t.id === taskId);

        if (task) {
          task[field] = value;
          task.updatedAt = new Date().toISOString();

          this.saveBoards();
          return { success: true };
        }
      }
    }

    return { success: false, error: '任务不存在' };
  }

  removeTask(taskId) {
    for (const boardName in this.boards) {
      const board = this.boards[boardName];

      for (const col of board.columns) {
        const taskIndex = col.tasks.findIndex(t => t.id === taskId);

        if (taskIndex !== -1) {
          col.tasks.splice(taskIndex, 1);
          this.saveBoards();
          return { success: true };
        }
      }
    }

    return { success: false, error: '任务不存在' };
  }

  getColumns() {
    const board = this.boards['default'];

    return board.columns.map(col => ({
      name: col.name,
      tasks: col.tasks.length
    }));
  }

  getStats() {
    const board = this.boards['default'];

    const todo = board.columns.find(c => c.name === '待办')?.tasks.length || 0;
    const inProgress = board.columns.find(c => c.name === '进行中')?.tasks.length || 0;
    const completed = board.columns.find(c => c.name === '已完成')?.tasks.length || 0;
    const total = todo + inProgress + completed;

    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
    };
  }

  async export(filePath) {
    try {
      await fs.writeFile(filePath, JSON.stringify(this.boards, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
