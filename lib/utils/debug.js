import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'debug-history.json');

/**
 * 调试助手类
 */
export class DebugHelper {
  constructor() {
    this.breakpoints = new Map();
    this.history = [];
    this.errorPatterns = this.initErrorPatterns();
    this.loadHistory();
  }

  initErrorPatterns() {
    return {
      'ReferenceError': {
        type: '引用错误',
        suggestions: ['检查变量是否已声明', '检查拼写错误', '检查作用域']
      },
      'TypeError': {
        type: '类型错误',
        suggestions: ['检查数据类型', '使用 typeof 验证', '转换数据类型']
      },
      'SyntaxError': {
        type: '语法错误',
        suggestions: ['检查括号匹配', '检查引号匹配', '检查语法拼写']
      },
      'NetworkError': {
        type: '网络错误',
        suggestions: ['检查网络连接', '检查API地址', '检查CORS配置']
      }
    };
  }

  async loadHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(data);
    } catch (error) {
      this.history = [];
    }
  }

  async saveHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存历史失败:', error.message);
    }
  }

  analyzeError(error, code = '') {
    const pattern = Object.keys(this.errorPatterns).find(key =>
      error.includes(key)
    );

    const errorInfo = pattern ? this.errorPatterns[pattern] : {
      type: '未知错误',
      suggestions: ['检查错误消息', '查看堆栈跟踪', '搜索类似问题']
    };

    return {
      type: errorInfo.type,
      location: code ? '代码中' : '未知位置',
      description: error,
      suggestions: errorInfo.suggestions
    };
  }

  async generateTrace(file) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      return {
        lines: lines.map((code, number) => ({ number: number + 1, code })),
        calls: this.extractFunctionCalls(content)
      };
    } catch (error) {
      return { lines: [], calls: [] };
    }
  }

  extractFunctionCalls(code) {
    const calls = [];
    const patterns = [
      /(\w+)\s*\(/g,
      /await\s+(\w+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        calls.push(match[1] + '()');
      }
    });

    return [...new Set(calls)].slice(0, 10);
  }

  addBreakpoint(file, line) {
    const key = `${file}:${line}`;

    if (this.breakpoints.has(key)) {
      return { success: false, error: '断点已存在' };
    }

    this.breakpoints.set(key, { file, line, active: true });
    return { success: true };
  }

  log(type, content) {
    this.history.unshift({
      timestamp: new Date().toISOString(),
      type,
      message: content
    });

    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    this.saveHistory();
  }

  getHistory(limit) {
    return this.history.slice(0, limit);
  }

  getFixSuggestions(error) {
    const analysis = this.analyzeError(error);

    return analysis.suggestions.map(s => ({
      title: s,
      description: `建议: ${s}`
    }));
  }

  generateFix(error) {
    const analysis = this.analyzeError(error);

    return {
      code: `// 修复方案\ntry {\n  // 你的代码\n} catch (err) {\n  console.error('${analysis.type}:', err.message);\n}`,
      explanation: `使用try-catch捕获${analysis.type}`
    };
  }
}
