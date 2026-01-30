import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const COMMANDS_FILE = path.join(DATA_DIR, 'quick-commands.json');

/**
 * 快捷命令管理器类
 * 管理常用AI提示词的快捷命令
 */
export class QuickManager {
  constructor() {
    this.commands = [];
    this.loadCommands();
  }

  /**
   * 加载命令数据
   */
  async loadCommands() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(COMMANDS_FILE, 'utf-8');
      this.commands = JSON.parse(data);
    } catch (error) {
      this.commands = [];
      await this.saveCommands();
    }
  }

  /**
   * 保存命令数据
   */
  async saveCommands() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(COMMANDS_FILE, JSON.stringify(this.commands, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`保存命令失败: ${error.message}`);
    }
  }

  /**
   * 列出所有命令
   */
  listCommands() {
    return this.commands.map(cmd => ({
      name: cmd.name,
      aliases: cmd.aliases || [],
      description: cmd.description || '',
      template: cmd.template || '',
      variables: cmd.variables || [],
      usageCount: cmd.usageCount || 0,
      lastUsed: cmd.lastUsed || null
    }));
  }

  /**
   * 获取单个命令
   */
  getCommand(name) {
    const cmd = this.findCommand(name);
    return cmd ? { ...cmd } : null;
  }

  /**
   * 查找命令
   */
  findCommand(name) {
    return this.commands.find(cmd =>
      cmd.name === name || (cmd.aliases && cmd.aliases.includes(name))
    );
  }

  /**
   * 创建新命令
   */
  createCommand(name, description) {
    if (this.findCommand(name)) {
      return { success: false, error: `命令 "${name}" 已存在` };
    }

    const command = {
      id: Date.now().toString(),
      name,
      description,
      aliases: [],
      template: '',
      variables: [],
      usageCount: 0,
      lastUsed: null,
      createdAt: new Date().toISOString()
    };

    this.commands.push(command);
    this.saveCommands();

    return { success: true };
  }

  /**
   * 更新命令
   */
  updateCommand(name, field, value) {
    const cmd = this.findCommand(name);

    if (!cmd) {
      return { success: false, error: `命令 "${name}" 不存在` };
    }

    switch (field) {
      case 'template':
        cmd.template = value;
        // 自动提取变量
        cmd.variables = this.extractVariables(value);
        break;

      case 'aliases':
        cmd.aliases = value.split(',').map(a => a.trim()).filter(a => a);
        break;

      case 'description':
        cmd.description = value;
        break;

      case 'variables':
        cmd.variables = value.split(',').map(v => v.trim()).filter(v => v);
        break;

      default:
        return { success: false, error: `未知字段: ${field}` };
    }

    cmd.updatedAt = new Date().toISOString();
    this.saveCommands();

    return { success: true };
  }

  /**
   * 删除命令
   */
  removeCommand(name) {
    const index = this.commands.findIndex(cmd =>
      cmd.name === name || (cmd.aliases && cmd.aliases.includes(name))
    );

    if (index === -1) {
      return { success: false, error: `命令 "${name}" 不存在` };
    }

    this.commands.splice(index, 1);
    this.saveCommands();

    return { success: true };
  }

  /**
   * 执行命令
   */
  executeCommand(name, variables) {
    const cmd = this.findCommand(name);

    if (!cmd) {
      return { success: false, error: `命令 "${name}" 不存在` };
    }

    if (!cmd.template) {
      return { success: false, error: `命令 "${name}" 尚未设置模板` };
    }

    // 替换变量
    let prompt = cmd.template;
    (cmd.variables || []).forEach((varName, index) => {
      const placeholder = `{${varName}}`;
      const value = variables[index] || '';
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });

    // 更新使用统计
    cmd.usageCount++;
    cmd.lastUsed = new Date().toISOString();
    this.saveCommands();

    return { success: true, prompt };
  }

  /**
   * 搜索命令
   */
  searchCommands(keyword) {
    const lowerKeyword = keyword.toLowerCase();

    return this.commands
      .filter(cmd =>
        cmd.name.toLowerCase().includes(lowerKeyword) ||
        cmd.description.toLowerCase().includes(lowerKeyword) ||
        (cmd.aliases && cmd.aliases.some(a => a.toLowerCase().includes(lowerKeyword))) ||
        (cmd.template && cmd.template.toLowerCase().includes(lowerKeyword))
      )
      .map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        template: cmd.template
      }));
  }

  /**
   * 导入命令
   */
  async importCommands(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        return { success: false, error: '导入文件格式错误: 应为命令数组' };
      }

      let count = 0;
      data.forEach(importCmd => {
        if (!importCmd.name) return;

        const existingIndex = this.commands.findIndex(c => c.name === importCmd.name);
        if (existingIndex >= 0) {
          this.commands[existingIndex] = {
            ...this.commands[existingIndex],
            ...importCmd,
            id: this.commands[existingIndex].id
          };
        } else {
          this.commands.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...importCmd
          });
        }
        count++;
      });

      this.saveCommands();

      return { success: true, count };
    } catch (error) {
      return { success: false, error: `导入失败: ${error.message}` };
    }
  }

  /**
   * 导出命令
   */
  async exportCommands(filePath) {
    try {
      const exportData = this.commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        template: cmd.template,
        aliases: cmd.aliases,
        variables: cmd.variables
      }));

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');

      return { success: true };
    } catch (error) {
      return { success: false, error: `导出失败: ${error.message}` };
    }
  }

  /**
   * 验证命令
   */
  validateCommand(name) {
    const cmd = this.findCommand(name);

    if (!cmd) {
      return {
        valid: false,
        errors: [`命令 "${name}" 不存在`],
        warnings: []
      };
    }

    const errors = [];
    const warnings = [];

    // 检查必填字段
    if (!cmd.template) {
      errors.push('缺少模板');
    }

    if (!cmd.description) {
      warnings.push('缺少描述');
    }

    // 检查变量匹配
    if (cmd.template) {
      const templateVars = this.extractVariables(cmd.template);
      const declaredVars = cmd.variables || [];

      templateVars.forEach(varName => {
        if (!declaredVars.includes(varName)) {
          warnings.push(`模板中使用的变量 ${varName} 未在variables中声明`);
        }
      });

      declaredVars.forEach(varName => {
        if (!templateVars.includes(varName)) {
          warnings.push(`声明的变量 ${varName} 未在模板中使用`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 从模板中提取变量
   */
  extractVariables(template) {
    const matches = template.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalCommands: this.commands.length,
      totalUsage: this.commands.reduce((sum, cmd) => sum + (cmd.usageCount || 0), 0),
      mostUsed: this.getMostUsedCommand(),
      recentlyCreated: this.getRecentlyCreatedCommands(5)
    };
  }

  /**
   * 获取最常用的命令
   */
  getMostUsedCommand() {
    if (this.commands.length === 0) return null;

    return this.commands.reduce((max, cmd) =>
      (cmd.usageCount || 0) > (max.usageCount || 0) ? cmd : max
    );
  }

  /**
   * 获取最近创建的命令
   */
  getRecentlyCreatedCommands(limit = 5) {
    return [...this.commands]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
      .map(cmd => ({
        name: cmd.name,
        createdAt: cmd.createdAt
      }));
  }
}
