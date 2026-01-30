import fs from 'fs/promises';
import path from 'path';

/**
 * 命令别名管理器（宏）
 * 支持创建命令组合和参数化宏
 */
class MacroManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-macros.json');
    this.macros = new Map();
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const macros = JSON.parse(data);
      this.macros = new Map(Object.entries(macros));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载宏配置失败: ${error.message}`);
      }
    }
  }

  async save() {
    const macrosObj = {};
    this.macros.forEach((value, key) => {
      macrosObj[key] = value;
    });
    await fs.writeFile(this.configPath, JSON.stringify(macrosObj, null, 2));
  }

  async list() {
    await this.load();
    return Array.from(this.macros.values());
  }

  async get(name) {
    await this.load();
    return this.macros.get(name) || null;
  }

  async add(name, description, commands, parameters = []) {
    await this.load();
    
    if (this.macros.has(name)) {
      throw new Error(`宏 "${name}" 已存在`);
    }

    const macro = {
      name,
      description,
      commands: Array.isArray(commands) ? commands : [commands],
      parameters: Array.isArray(parameters) ? parameters : [parameters],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    this.macros.set(name, macro);
    await this.save();

    return macro;
  }

  async remove(name) {
    await this.load();
    
    if (!this.macros.has(name)) {
      throw new Error(`宏 "${name}" 不存在`);
    }

    this.macros.delete(name);
    await this.save();

    return true;
  }

  async update(name, updates) {
    await this.load();
    
    if (!this.macros.has(name)) {
      throw new Error(`宏 "${name}" 不存在`);
    }

    const macro = this.macros.get(name);

    if (updates.description !== undefined) {
      macro.description = updates.description;
    }

    if (updates.commands) {
      macro.commands = Array.isArray(updates.commands) ? updates.commands : [updates.commands];
    }

    if (updates.parameters) {
      macro.parameters = Array.isArray(updates.parameters) ? updates.parameters : [updates.parameters];
    }

    macro.updatedAt = new Date().toISOString();

    this.macros.set(name, macro);
    await this.save();

    return macro;
  }

  /**
   * 执行宏
   */
  async execute(name, args = {}) {
    await this.load();
    
    const macro = this.macros.get(name);
    if (!macro) {
      throw new Error(`宏 "${name}" 不存在`);
    }

    // 替换参数
    const expandedCommands = macro.commands.map(cmd => {
      let expanded = cmd;
      macro.parameters.forEach(param => {
        const value = args[param.name] || param.default || '';
        expanded = expanded.replace(new RegExp(`\\$\\{${param.name}\\}`, 'g'), value);
      });
      return expanded;
    });

    // 更新使用计数
    macro.usageCount++;
    await this.save();

    return {
      name: macro.name,
      commands: expandedCommands,
      parameters: macro.parameters
    };
  }

  /**
   * 导入宏
   */
  async import(content, format = 'json') {
    let macros;
    if (format === 'json') {
      macros = JSON.parse(content);
    } else {
      throw new Error(`不支持的导入格式: ${format}`);
    }

    await this.load();
    let count = 0;
    for (const macro of Object.values(macros)) {
      if (!this.macros.has(macro.name)) {
        macro.createdAt = new Date().toISOString();
        macro.updatedAt = new Date().toISOString();
        macro.usageCount = 0;
        this.macros.set(macro.name, macro);
        count++;
      }
    }

    await this.save();
    return count;
  }

  /**
   * 导出宏
   */
  async export(name = null, format = 'json') {
    await this.load();
    
    const macros = name ? { [name]: this.macros.get(name) } : Object.fromEntries(this.macros);
    
    if (format === 'json') {
      return JSON.stringify(macros, null, 2);
    }
    
    if (format === 'text') {
      let text = '# 宏导出\n\n';
      for (const macro of Object.values(macros)) {
        text += `## ${macro.name}\n\n`;
        text += `${macro.description}\n\n`;
        text += 'Commands:\n';
        macro.commands.forEach(cmd => {
          text += `  ${cmd}\n`;
        });
        text += '\n';
      }
      return text;
    }

    throw new Error(`不支持的导出格式: ${format}`);
  }

  /**
   * 搜索宏
   */
  async search(query) {
    await this.load();
    const term = query.toLowerCase();

    return Array.from(this.macros.values())
      .filter(macro => 
        macro.name.toLowerCase().includes(term) ||
        macro.description.toLowerCase().includes(term)
      );
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    await this.load();
    
    const macros = Array.from(this.macros.values());
    const totalUsage = macros.reduce((sum, m) => sum + m.usageCount, 0);

    return {
      total: macros.length,
      totalUsage,
      mostUsed: macros.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5)
    };
  }

  /**
   * 验证宏
   */
  async validate(name) {
    await this.load();
    const macro = this.macros.get(name);

    if (!macro) {
      return { valid: false, errors: [`宏 "${name}" 不存在`] };
    }

    const errors = [];
    const warnings = [];

    if (!macro.name) {
      errors.push('宏名称不能为空');
    }

    if (!macro.description) {
      warnings.push('缺少描述');
    }

    if (!macro.commands || macro.commands.length === 0) {
      errors.push('宏至少需要一个命令');
    }

    // 检查参数使用
    const usedParams = new Set();
    macro.commands?.forEach(cmd => {
      const matches = cmd.match(/\$\{(\w+)\}/g) || [];
      matches.forEach(m => {
        const paramName = m.slice(2, -1);
        usedParams.add(paramName);
      });
    });

    const definedParams = new Set(macro.parameters?.map(p => p.name) || []);
    const undefinedParams = [...usedParams].filter(p => !definedParams.has(p));
    
    if (undefinedParams.length > 0) {
      warnings.push(`使用了未定义的参数: ${undefinedParams.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default new MacroManager();
