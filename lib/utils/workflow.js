import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

/**
 * 工作流自动化管理器
 */
class WorkflowManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-workflows.json');
    this.workflows = {};
    this.executions = {};
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.workflows = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.workflows = this.getDefaultWorkflows();
        await this.save();
      } else {
        throw new Error(`加载工作流配置失败: ${error.message}`);
      }
    }
  }

  getDefaultWorkflows() {
    return {
      'daily-report': {
        name: '每日报告',
        description: '生成每日工作报告',
        steps: [
          { type: 'command', action: '/git log --since="1 day ago"', name: '查看今日提交' },
          { type: 'prompt', action: '根据以上提交，帮我写一份每日工作报告', name: '生成报告' },
          { type: 'bookmark', action: 'save', name: '保存报告' }
        ],
        variables: {}
      },
      'code-review': {
        name: '代码审查流程',
        description: '完整的代码审查流程',
        steps: [
          { type: 'command', action: '/git diff --cached', name: '查看暂存区改动' },
          { type: 'command', action: '/review', name: '进行代码审查' },
          { type: 'prompt', action: '请总结审查结果并给出改进建议', name: '总结建议' }
        ],
        variables: {}
      },
      'project-init': {
        name: '项目初始化',
        description: '快速初始化新项目',
        steps: [
          { type: 'command', action: '/scan', name: '扫描项目结构' },
          { type: 'prompt', action: '帮我分析这个项目的技术栈和架构', name: '分析项目' },
          { type: 'snippet', action: 'add', name: '保存项目模板' }
        ],
        variables: {}
      }
    };
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify(this.workflows, null, 2));
  }

  async list() {
    await this.load();
    return Object.entries(this.workflows).map(([key, wf]) => ({
      id: key,
      name: wf.name,
      description: wf.description,
      steps: wf.steps.length
    }));
  }

  async get(id) {
    await this.load();
    return this.workflows[id] || null;
  }

  async add(id, name, description, steps = [], variables = {}) {
    await this.load();
    if (this.workflows[id]) {
      throw new Error(`工作流 "${id}" 已存在`);
    }

    this.workflows[id] = {
      name,
      description,
      steps,
      variables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.save();
    return this.workflows[id];
  }

  async remove(id) {
    await this.load();
    if (!this.workflows[id]) {
      throw new Error(`工作流 "${id}" 不存在`);
    }
    delete this.workflows[id];
    await this.save();
    return true;
  }

  async update(id, updates) {
    await this.load();
    if (!this.workflows[id]) {
      throw new Error(`工作流 "${id}" 不存在`);
    }

    this.workflows[id] = {
      ...this.workflows[id],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.save();
    return this.workflows[id];
  }

  /**
   * 执行工作流（返回执行计划，不实际执行）
   */
  async execute(id, variables = {}) {
    await this.load();
    const workflow = this.workflows[id];

    if (!workflow) {
      throw new Error(`工作流 "${id}" 不存在`);
    }

    const executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.executions[executionId] = {
      id: executionId,
      workflowId: id,
      startedAt: new Date().toISOString(),
      status: 'running',
      steps: [],
      variables: { ...workflow.variables, ...variables }
    };

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const result = await this.executeStep(step, this.executions[executionId].variables);
        
        this.executions[executionId].steps.push({
          index: i,
          name: step.name || `Step ${i + 1}`,
          type: step.type,
          action: step.action,
          status: 'completed',
          result,
          executedAt: new Date().toISOString()
        });

        // 支持条件分支
        if (step.condition && !this.evaluateCondition(step.condition, this.executions[executionId].variables)) {
          break;
        }

        // 支持变量更新
        if (step.updateVars) {
          Object.assign(this.executions[executionId].variables, step.updateVars);
        }
      }

      this.executions[executionId].status = 'completed';
      this.executions[executionId].completedAt = new Date().toISOString();

    } catch (error) {
      this.executions[executionId].status = 'failed';
      this.executions[executionId].error = error.message;
      this.executions[executionId].completedAt = new Date().toISOString();
    }

    return this.executions[executionId];
  }

  async executeStep(step, variables) {
    // 替换变量
    const action = this.replaceVariables(step.action, variables);

    switch (step.type) {
      case 'command':
        return { type: 'command', action, note: '需要手动执行' };
      
      case 'prompt':
        return { type: 'prompt', action, note: '需要AI处理' };
      
      case 'snippet':
        return { type: 'snippet', action, note: '操作代码片段' };
      
      case 'bookmark':
        return { type: 'bookmark', action, note: '操作书签' };
      
      case 'todo':
        return { type: 'todo', action, note: '操作任务' };
      
      case 'env':
        return { type: 'env', action, note: '操作环境变量' };
      
      case 'shell':
        try {
          const output = execSync(action, { encoding: 'utf-8' });
          return { type: 'shell', action, output: output.trim() };
        } catch (error) {
          return { type: 'shell', action, error: error.message };
        }
      
      case 'wait':
        const duration = parseInt(action) * 1000 || 1000;
        await new Promise(resolve => setTimeout(resolve, duration));
        return { type: 'wait', duration: `${duration}ms` };
      
      default:
        throw new Error(`未知的工作流步骤类型: ${step.type}`);
    }
  }

  replaceVariables(text, variables) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  evaluateCondition(condition, variables) {
    // 简单的条件评估
    // 支持格式：{{var}} == value, {{var}} != value, {{var}} > number, {{var}} < number
    const match = condition.match(/\{\{(\w+)\}\}\s*(==|!=|>|<)\s*(.+)$/);
    if (!match) return true;

    const [, varName, operator, value] = match;
    const varValue = variables[varName];

    switch (operator) {
      case '==': return varValue == value;
      case '!=': return varValue != value;
      case '>': return parseFloat(varValue) > parseFloat(value);
      case '<': return parseFloat(varValue) < parseFloat(value);
      default: return true;
    }
  }

  getExecutionHistory(id = null) {
    if (id) {
      return this.executions[id] || null;
    }
    return Object.values(this.executions);
  }

  async export(format = 'json') {
    await this.load();
    if (format === 'json') {
      return JSON.stringify(this.workflows, null, 2);
    }
    if (format === 'yaml') {
      // 简化的 YAML 输出
      let yaml = 'workflows:\n';
      for (const [key, wf] of Object.entries(this.workflows)) {
        yaml += `  ${key}:\n`;
        yaml += `    name: ${wf.name}\n`;
        yaml += `    description: ${wf.description}\n`;
        yaml += `    steps:\n`;
        wf.steps.forEach(step => {
          yaml += `      - type: ${step.type}\n`;
          yaml += `        action: ${step.action}\n`;
        });
      }
      return yaml;
    }
    throw new Error(`不支持的导出格式: ${format}`);
  }

  async import(content) {
    let workflows;
    try {
      workflows = JSON.parse(content);
    } catch (error) {
      throw new Error('导入内容必须是有效的 JSON');
    }

    await this.load();
    Object.assign(this.workflows, workflows);
    await this.save();
    return Object.keys(workflows).length;
  }

  async validate(id) {
    await this.load();
    const workflow = this.workflows[id];

    if (!workflow) {
      return { valid: false, errors: [`工作流 "${id}" 不存在`] };
    }

    const errors = [];

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('工作流必须至少有一个步骤');
    }

    const validTypes = ['command', 'prompt', 'snippet', 'bookmark', 'todo', 'env', 'shell', 'wait'];
    workflow.steps?.forEach((step, index) => {
      if (!validTypes.includes(step.type)) {
        errors.push(`步骤 ${index + 1}: 无效的类型 "${step.type}"`);
      }
      if (!step.action) {
        errors.push(`步骤 ${index + 1}: 缺少 action`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings: errors.length === 0 ? ['工作流验证通过'] : []
    };
  }
}

export default new WorkflowManager();
