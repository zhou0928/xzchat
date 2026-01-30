import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * 任务管理器
 */
class TodoManager {
  constructor() {
    this.todosPath = path.join(os.homedir(), '.xzchat-todos.json');
    this.todos = [];
  }

  /**
   * 加载任务列表
   */
  async load() {
    try {
      const data = await fs.readFile(this.todosPath, 'utf-8');
      this.todos = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.todos = [];
        await this.save();
      }
    }
  }

  /**
   * 保存任务列表
   */
  async save() {
    await fs.writeFile(
      this.todosPath,
      JSON.stringify(this.todos, null, 2),
      'utf-8'
    );
  }

  /**
   * 添加任务
   */
  async add(text, priority = 'medium') {
    await this.load();
    const todo = {
      id: Date.now().toString(),
      text,
      priority, // low, medium, high
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    };
    this.todos.push(todo);
    await this.save();
    return todo;
  }

  /**
   * 删除任务
   */
  async remove(id) {
    await this.load();
    const index = this.todos.findIndex(t => t.id === id);
    if (index !== -1) {
      const removed = this.todos.splice(index, 1)[0];
      await this.save();
      return removed;
    }
    return null;
  }

  /**
   * 更新任务状态
   */
  async updateStatus(id, status) {
    await this.load();
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.status = status;
      todo.updatedAt = new Date().toISOString();
      if (status === 'completed') {
        todo.completedAt = new Date().toISOString();
      }
      await this.save();
      return todo;
    }
    return null;
  }

  /**
   * 更新任务
   */
  async update(id, updates) {
    await this.load();
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      Object.assign(todo, updates, { updatedAt: new Date().toISOString() });
      await this.save();
      return todo;
    }
    return null;
  }

  /**
   * 获取任务
   */
  async get(id) {
    await this.load();
    return this.todos.find(t => t.id === id);
  }

  /**
   * 列出所有任务
   */
  async list(options = {}) {
    await this.load();
    let results = [...this.todos];

    // 按状态过滤
    if (options.status) {
      results = results.filter(t => t.status === options.status);
    }

    // 按优先级过滤
    if (options.priority) {
      results = results.filter(t => t.priority === options.priority);
    }

    // 按标签过滤
    if (options.tag) {
      results = results.filter(t => t.tags.includes(options.tag));
    }

    // 按关键词搜索
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      results = results.filter(t => t.text.toLowerCase().includes(searchLower));
    }

    // 排序
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    results.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
      if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
      return 0;
    });

    return results;
  }

  /**
   * 添加标签
   */
  async addTag(id, tag) {
    await this.load();
    const todo = this.todos.find(t => t.id === id);
    if (todo && !todo.tags.includes(tag)) {
      todo.tags.push(tag);
      todo.updatedAt = new Date().toISOString();
      await this.save();
      return todo;
    }
    return null;
  }

  /**
   * 移除标签
   */
  async removeTag(id, tag) {
    await this.load();
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.tags = todo.tags.filter(t => t !== tag);
      todo.updatedAt = new Date().toISOString();
      await this.save();
      return todo;
    }
    return null;
  }

  /**
   * 获取所有标签
   */
  async getTags() {
    await this.load();
    const tags = new Set();
    for (const todo of this.todos) {
      todo.tags.forEach(tag => tags.add(tag));
    }
    return Array.from(tags).sort();
  }

  /**
   * 清除已完成的任务
   */
  async clearCompleted() {
    await this.load();
    const completedCount = this.todos.filter(t => t.status === 'completed').length;
    this.todos = this.todos.filter(t => t.status !== 'completed');
    await this.save();
    return completedCount;
  }

  /**
   * 清空所有任务
   */
  async clear() {
    this.todos = [];
    await this.save();
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    await this.load();
    return {
      total: this.todos.length,
      pending: this.todos.filter(t => t.status === 'pending').length,
      inProgress: this.todos.filter(t => t.status === 'in-progress').length,
      completed: this.todos.filter(t => t.status === 'completed').length,
      high: this.todos.filter(t => t.priority === 'high').length,
      medium: this.todos.filter(t => t.priority === 'medium').length,
      low: this.todos.filter(t => t.priority === 'low').length
    };
  }

  /**
   * 从 AI 对话提取任务
   */
  async extractFromText(text) {
    await this.load();
    const taskRegex = /(?:-|\*|\d+\.|\[ \])\s*(.+?)(?=\n|$)/g;
    const matches = [];
    let match;

    while ((match = taskRegex.exec(text)) !== null) {
      const taskText = match[1].trim();
      if (taskText.length > 5) { // 忽略太短的内容
        const todo = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          text: taskText,
          priority: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['extracted']
        };
        this.todos.push(todo);
        matches.push(todo);
      }
    }

    if (matches.length > 0) {
      await this.save();
    }

    return matches;
  }

  /**
   * 格式化任务列表
   */
  formatList(todos) {
    if (todos.length === 0) {
      return '暂无任务';
    }

    let output = '';
    const prioritySymbols = { high: '🔴', medium: '🟡', low: '🟢' };
    const statusSymbols = { pending: '⬜', 'in-progress': '🔄', completed: '✅' };

    todos.forEach((todo, index) => {
      const priority = prioritySymbols[todo.priority] || '⚪';
      const status = statusSymbols[todo.status] || '⬜';
      const date = new Date(todo.createdAt).toLocaleDateString('zh-CN');
      const tags = todo.tags.length > 0 ? ` [${todo.tags.join(', ')}]` : '';

      output += `${index + 1}. ${status} ${priority} ${todo.text}${tags}\n`;
      output += `   ID: ${todo.id} | ${date}\n`;
    });

    return output.trim();
  }

  /**
   * 格式化统计信息
   */
  formatStats(stats) {
    return `
📊 任务统计

总任务: ${stats.total}
⬜ 待办: ${stats.pending}
🔄 进行中: ${stats.inProgress}
✅ 已完成: ${stats.completed}

优先级分布:
🔴 高优先级: ${stats.high}
🟡 中优先级: ${stats.medium}
🟢 低优先级: ${stats.low}
`.trim();
  }
}

// 创建单例实例
const todoManager = new TodoManager();

export default todoManager;
export { TodoManager };
