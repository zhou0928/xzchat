/**
 * 计算器插件
 * 支持基本运算和科学计算
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class CalculatorPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.variables = new Map();

    this.commands = {
      '/calc': {
        handler: this.handleCalc.bind(this),
        description: '计算表达式',
        usage: '/calc <expression>',
        category: 'utility'
      },
      '/calc-history': {
        handler: this.handleHistory.bind(this),
        description: '查看计算历史',
        usage: '/calc-history',
        category: 'utility'
      },
      '/calc-var': {
        handler: this.handleVariable.bind(this),
        description: '设置变量',
        usage: '/calc-var <name> = <value>',
        category: 'utility'
      },
      '/calc-vars': {
        handler: this.handleVariables.bind(this),
        description: '列出所有变量',
        usage: '/calc-vars',
        category: 'utility'
      },
      '/calc-clear': {
        handler: this.handleClear.bind(this),
        description: '清除历史和变量',
        usage: '/calc-clear',
        category: 'utility'
      }
    };

    this.history = [];
  }

  async onEnable(context) {
    this.context.logger.info('计算器插件已启用');
  }

  async onDisable(context) {
    this.history = [];
    this.variables.clear();
    this.context.logger.info('计算器插件已禁用');
  }

  /**
   * 处理计算命令
   */
  async handleCalc(args) {
    try {
      const expression = this.replaceVariables(args);
      const result = this.evaluate(expression);

      // 保存历史
      this.history.push({
        expression: args,
        result: result,
        timestamp: new Date().toISOString()
      });

      // 限制历史记录数量
      if (this.history.length > 50) {
        this.history.shift();
      }

      return {
        success: true,
        message: `🔢 计算结果:\n\n${expression} = ${result}`
      };
    } catch (error) {
      return {
        error: `计算错误: ${error.message}`
      };
    }
  }

  /**
   * 处理历史命令
   */
  async handleHistory() {
    if (this.history.length === 0) {
      return { message: '📜 计算历史为空' };
    }

    const message = `📜 计算历史 (最近 ${Math.min(10, this.history.length)} 条):\n\n` +
      this.history.slice(-10).reverse().map((item, index) => {
        const time = new Date(item.timestamp).toLocaleTimeString();
        return `${this.history.length - index}. ${item.expression} = ${item.result}\n   ${time}`;
      }).join('\n\n');

    return {
      success: true,
      message
    };
  }

  /**
   * 处理变量设置
   */
  async handleVariable(args) {
    const match = args.match(/^(\w+)\s*=\s*(.+)$/);
    if (!match) {
      return {
        error: '格式错误，使用: /calc-var <name> = <value>\n例如: /calc-var pi = 3.14159'
      };
    }

    const [, name, value] = match;
    const numValue = this.evaluate(value);

    this.variables.set(name, numValue);

    return {
      success: true,
      message: `✅ 变量已设置: ${name} = ${numValue}`
    };
  }

  /**
   * 处理变量列表
   */
  async handleVariables() {
    if (this.variables.size === 0) {
      return { message: '📊 没有设置变量' };
    }

    const message = `📊 变量列表:\n\n` +
      Array.from(this.variables.entries())
        .map(([name, value]) => `  ${name} = ${value}`)
        .join('\n');

    return {
      success: true,
      message
    };
  }

  /**
   * 处理清除命令
   */
  async handleClear() {
    this.history = [];
    this.variables.clear();

    return {
      success: true,
      message: '🗑️ 历史和变量已清除'
    };
  }

  /**
   * 替换表达式中的变量
   */
  replaceVariables(expression) {
    let result = expression;
    for (const [name, value] of this.variables.entries()) {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      result = result.replace(regex, value.toString());
    }
    return result;
  }

  /**
   * 安全地计算表达式
   */
  evaluate(expression) {
    // 常量
    const constants = {
      'pi': Math.PI,
      'e': Math.E,
      'sqrt2': Math.SQRT2,
      'sqrt1_2': Math.SQRT1_2,
      'ln2': Math.LN2,
      'ln10': Math.LN10,
      'log2e': Math.LOG2E,
      'log10e': Math.LOG10E
    };

    // 函数映射
    const functions = {
      'sin': Math.sin,
      'cos': Math.cos,
      'tan': Math.tan,
      'asin': Math.asin,
      'acos': Math.acos,
      'atan': Math.atan,
      'sqrt': Math.sqrt,
      'abs': Math.abs,
      'ceil': Math.ceil,
      'floor': Math.floor,
      'round': Math.round,
      'exp': Math.exp,
      'log': Math.log,
      'log10': Math.log10,
      'log2': Math.log2,
      'pow': Math.pow,
      'random': Math.random,
      'max': Math.max,
      'min': Math.min
    };

    let expr = expression.toLowerCase();

    // 替换常量
    for (const [name, value] of Object.entries(constants)) {
      expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
    }

    // 替换函数调用
    for (const [name, func] of Object.entries(functions)) {
      const regex = new RegExp(`${name}\\(([^)]+)\\)`, 'g');
      expr = expr.replace(regex, (match, args) => {
        const argValues = args.split(',').map(a => this.evaluate(a.trim()));
        return `(${func(...argValues)})`;
      });
    }

    // 替换运算符
    expr = expr.replace(/\^/g, '**');

    // 安全计算
    if (!/^[0-9+\-*/().\s%]+$/i.test(expr)) {
      throw new Error('表达式包含非法字符');
    }

    return Function(`"use strict"; return (${expr})`)();
  }
}
