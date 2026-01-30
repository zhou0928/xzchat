import fs from 'fs/promises';
import path from 'path';

/**
 * 模板系统管理器
 * 支持预设对话模板和自定义提示词模板
 */
class TemplateManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-templates.json');
    this.templates = {};
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.templates = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.templates = this.getDefaultTemplates();
        await this.save();
      } else {
        throw new Error(`加载模板配置失败: ${error.message}`);
      }
    }
  }

  getDefaultTemplates() {
    return {
      'code-review': {
        name: '代码审查',
        category: 'Code',
        description: '全面的代码审查模板',
        prompt: `请对以下代码进行全面的审查：
1. 检查代码风格和格式
2. 识别潜在的 bug 和边界情况
3. 评估性能和可维护性
4. 提供具体的改进建议
5. 如果有安全问题，请明确指出

代码：
{{code}}`,
        variables: ['code'],
        tags: ['review', 'code', 'quality']
      },
      'bug-fix': {
        name: 'Bug 修复',
        category: 'Code',
        description: 'Bug 修复帮助模板',
        prompt: `我遇到了一个 Bug：

问题描述：
{{problem}}

错误信息：
{{error}}

相关代码：
{{code}}

请帮我：
1. 分析问题原因
2. 提供修复方案
3. 说明如何防止类似问题`,
        variables: ['problem', 'error', 'code'],
        tags: ['debug', 'fix', 'troubleshoot']
      },
      'refactor': {
        name: '代码重构',
        category: 'Code',
        description: '代码重构建议模板',
        prompt: `请帮我重构以下代码，使其更简洁、高效和易维护：

{{code}}

重构要求：
1. 提高代码可读性
2. 减少重复代码
3. 优化性能
4. 添加必要的注释
5. 遵循最佳实践`,
        variables: ['code'],
        tags: ['refactor', 'clean-code', 'optimization']
      },
      'explain': {
        name: '代码解释',
        category: 'Learning',
        description: '详细解释代码功能',
        prompt: `请详细解释以下代码的功能和工作原理：

{{code}}

请说明：
1. 整体功能
2. 关键部分的作用
3. 可能的使用场景
4. 潜在的改进点`,
        variables: ['code'],
        tags: ['explain', 'learn', 'understand']
      },
      'generate-tests': {
        name: '生成测试',
        category: 'Testing',
        description: '为代码生成单元测试',
        prompt: `请为以下代码生成完整的单元测试：

{{code}}

测试要求：
1. 覆盖主要功能
2. 包含边界情况
3. 使用测试框架（Jest/Mocha）
4. 添加测试描述
5. 包含正常和异常情况`,
        variables: ['code'],
        tags: ['test', 'tdd', 'testing']
      },
      'api-design': {
        name: 'API 设计',
        category: 'Architecture',
        description: '设计 RESTful API',
        prompt: `请帮我设计一个 {{feature}} 的 RESTful API：

需求：
{{requirements}}

请提供：
1. API 端点列表
2. 请求/响应示例
3. 错误处理
4. 认证方式
5. 最佳实践建议`,
        variables: ['feature', 'requirements'],
        tags: ['api', 'design', 'architecture']
      },
      'documentation': {
        name: '文档生成',
        category: 'Documentation',
        description: '为代码生成文档',
        prompt: `请为以下代码生成详细的文档：

{{code}}

文档应包含：
1. 功能描述
2. 参数说明
3. 返回值说明
4. 使用示例
5. 注意事项`,
        variables: ['code'],
        tags: ['docs', 'documentation', 'comments']
      },
      'sql-query': {
        name: 'SQL 查询',
        category: 'Database',
        description: 'SQL 查询编写',
        prompt: `请帮我编写一个 SQL 查询：

需求：{{query}}

数据库表结构：
{{schema}}

请提供：
1. SQL 语句
2. 解释说明
3. 性能优化建议`,
        variables: ['query', 'schema'],
        tags: ['sql', 'database', 'query']
      },
      'unit-conversion': {
        name: '单位转换',
        category: 'Utility',
        description: '各种单位转换',
        prompt: `请将 {{value}} 从 {{from}} 转换为 {{to}}。

请提供：
1. 转换结果
2. 计算过程
3. 相关信息`,
        variables: ['value', 'from', 'to'],
        tags: ['convert', 'utility', 'math']
      },
      'summarize': {
        name: '内容摘要',
        category: 'Writing',
        description: '生成内容摘要',
        prompt: `请为以下内容生成简洁的摘要：

{{content}}

摘要要求：
1. 100-200 字
2. 突出要点
3. 条理清晰`,
        variables: ['content'],
        tags: ['summarize', 'writing', 'summary']
      }
    };
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify(this.templates, null, 2));
  }

  async list(filter = {}) {
    await this.load();
    let templates = Object.entries(this.templates);

    if (filter.category) {
      templates = templates.filter(([_, t]) => t.category === filter.category);
    }

    if (filter.tag) {
      templates = templates.filter(([_, t]) => t.tags.includes(filter.tag));
    }

    return templates.map(([key, tpl]) => ({
      id: key,
      name: tpl.name,
      category: tpl.category,
      description: tpl.description,
      tags: tpl.tags,
      variables: tpl.variables
    }));
  }

  async get(id) {
    await this.load();
    return this.templates[id] || null;
  }

  async add(id, name, category, prompt, variables = [], description = '', tags = []) {
    await this.load();
    if (this.templates[id]) {
      throw new Error(`模板 "${id}" 已存在`);
    }

    this.templates[id] = {
      name,
      category,
      prompt,
      variables: Array.isArray(variables) ? variables : [variables],
      description: description || `自定义模板: ${name}`,
      tags: Array.isArray(tags) ? tags : [tags],
      createdAt: new Date().toISOString()
    };

    await this.save();
    return this.templates[id];
  }

  async remove(id) {
    await this.load();
    if (!this.templates[id]) {
      throw new Error(`模板 "${id}" 不存在`);
    }
    delete this.templates[id];
    await this.save();
    return true;
  }

  async update(id, updates) {
    await this.load();
    if (!this.templates[id]) {
      throw new Error(`模板 "${id}" 不存在`);
    }

    this.templates[id] = {
      ...this.templates[id],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.save();
    return this.templates[id];
  }

  /**
   * 使用模板，替换变量
   */
  async use(id, values = {}) {
    await this.load();
    const template = this.templates[id];

    if (!template) {
      throw new Error(`模板 "${id}" 不存在`);
    }

    let prompt = template.prompt;

    // 替换变量
    template.variables.forEach(variable => {
      const value = values[variable] || `[${variable}]`;
      prompt = prompt.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });

    return {
      templateId: id,
      templateName: template.name,
      prompt,
      variables: template.variables,
      values
    };
  }

  /**
   * 预览模板
   */
  async preview(id, values = {}) {
    const result = await this.use(id, values);
    return `📄 模板预览: ${result.templateName}\n\n${result.prompt}`;
  }

  async getCategories() {
    await this.load();
    const categories = new Set();
    Object.values(this.templates).forEach(tpl => {
      categories.add(tpl.category);
    });
    return Array.from(categories);
  }

  async getTags() {
    await this.load();
    const tags = new Set();
    Object.values(this.templates).forEach(tpl => {
      tpl.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }

  async search(query) {
    await this.load();
    const term = query.toLowerCase();
    return Object.entries(this.templates)
      .filter(([_, tpl]) => 
        tpl.name.toLowerCase().includes(term) ||
        tpl.description.toLowerCase().includes(term) ||
        tpl.tags.some(tag => tag.toLowerCase().includes(term))
      )
      .map(([key, tpl]) => ({
        id: key,
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        tags: tpl.tags
      }));
  }

  /**
   * 导出模板
   */
  async export(id = null, format = 'json') {
    await this.load();
    
    const data = id ? { [id]: this.templates[id] } : this.templates;
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    if (format === 'markdown') {
      let md = '# 模板导出\n\n';
      for (const [key, tpl] of Object.entries(data)) {
        md += `## ${tpl.name}\n\n`;
        md += `**ID**: ${key}\n`;
        md += `**分类**: ${tpl.category}\n`;
        md += `**标签**: ${tpl.tags.join(', ') || '无'}\n`;
        md += `**变量**: ${tpl.variables.join(', ') || '无'}\n\n`;
        md += '---\n\n';
        md += '### 提示词模板\n\n';
        md += '```' + '\n' + tpl.prompt + '\n' + '```' + '\n\n';
        md += '---\n\n';
      }
      return md;
    }

    throw new Error(`不支持的导出格式: ${format}`);
  }

  /**
   * 导入模板
   */
  async import(content, format = 'json') {
    let templates;
    if (format === 'json') {
      templates = JSON.parse(content);
    } else {
      throw new Error(`不支持的导入格式: ${format}`);
    }

    await this.load();
    let count = 0;
    for (const [id, tpl] of Object.entries(templates)) {
      if (!this.templates[id]) {
        this.templates[id] = {
          ...tpl,
          createdAt: new Date().toISOString()
        };
        count++;
      }
    }

    await this.save();
    return count;
  }

  /**
   * 验证模板
   */
  async validate(id) {
    await this.load();
    const template = this.templates[id];

    if (!template) {
      return { valid: false, errors: [`模板 "${id}" 不存在`] };
    }

    const errors = [];
    const warnings = [];

    if (!template.name) {
      errors.push('缺少模板名称');
    }

    if (!template.category) {
      errors.push('缺少分类');
    }

    if (!template.prompt) {
      errors.push('缺少提示词内容');
    } else {
      // 检查变量是否都定义了
      const variablesInPrompt = template.prompt.match(/\{\{(\w+)\}\}/g) || [];
      const variableNames = [...new Set(variablesInPrompt.map(v => v.slice(2, -2)))];
      const missingVars = variableNames.filter(v => !template.variables.includes(v));
      
      if (missingVars.length > 0) {
        warnings.push(`提示词中使用的变量未定义: ${missingVars.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    await this.load();
    const templates = Object.values(this.templates);

    return {
      total: templates.length,
      byCategory: templates.reduce((acc, tpl) => {
        acc[tpl.category] = (acc[tpl.category] || 0) + 1;
        return acc;
      }, {}),
      byTag: templates.reduce((acc, tpl) => {
        tpl.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {}),
      totalVariables: templates.reduce((acc, tpl) => acc + tpl.variables.length, 0)
    };
  }
}

export default new TemplateManager();
