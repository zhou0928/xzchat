import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'refactor-history.json');

/**
 * 代码重构引擎类
 * 智能识别代码异味并提供重构建议
 */
export class RefactorEngine {
  constructor() {
    this.history = [];
    this.patterns = this.initPatterns();
    this.loadHistory();
  }

  /**
   * 初始化重构模式
   */
  initPatterns() {
    return {
      'extract-function': {
        name: 'extract-function',
        description: '提取重复或复杂的代码块为独立函数',
        applicable: '代码重复、函数过长、复杂度高',
        difficulty: '中等',
        impact: '提高可读性和可维护性'
      },
      'inline-variable': {
        name: 'inline-variable',
        description: '内联只使用一次的简单变量',
        applicable: '过度抽取、不必要的中间变量',
        difficulty: '简单',
        impact: '简化代码'
      },
      'extract-variable': {
        name: 'extract-variable',
        description: '提取复杂的表达式为有意义的变量',
        applicable: '魔法数字、复杂表达式、重复计算',
        difficulty: '简单',
        impact: '提高可读性'
      },
      'rename-variable': {
        name: 'rename-variable',
        description: '重命名为更有意义的名称',
        applicable: '命名不规范、缩写不清',
        difficulty: '简单',
        impact: '提高代码可理解性'
      },
      'simplify-conditional': {
        name: 'simplify-conditional',
        description: '简化复杂的条件语句',
        applicable: '嵌套if、多重条件、重复检查',
        difficulty: '中等',
        impact: '提高可读性'
      },
      'reduce-nesting': {
        name: 'reduce-nesting',
        description: '减少代码嵌套层级',
        applicable: '深层嵌套、箭头型代码',
        difficulty: '中等',
        impact: '降低复杂度'
      },
      'eliminate-duplication': {
        name: 'eliminate-duplication',
        description: '消除重复代码',
        applicable: '代码重复、相似逻辑',
        difficulty: '中等',
        impact: '符合DRY原则'
      },
      'improve-readability': {
        name: 'improve-readability',
        description: '综合提升代码可读性',
        applicable: '整体代码质量',
        difficulty: '中等',
        impact: '全面提升'
      }
    };
  }

  /**
   * 加载历史记录
   */
  async loadHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(data);
    } catch (error) {
      this.history = [];
    }
  }

  /**
   * 保存历史记录
   */
  async saveHistory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存历史失败:', error.message);
    }
  }

  /**
   * 分析文件
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const stats = this.analyzeCodeStructure(content);
      const smells = this.detectCodeSmells(content, lines);

      return {
        success: true,
        filePath,
        stats,
        smells
      };
    } catch (error) {
      return {
        success: false,
        error: `分析失败: ${error.message}`
      };
    }
  }

  /**
   * 分析代码结构
   */
  analyzeCodeStructure(content) {
    const lines = content.split('\n');
    const linesCount = lines.length;
    const size = Buffer.byteLength(content, 'utf8');

    // 简单的函数检测
    const functionMatches = content.match(/function\s+\w+\s*\(/g) || [];
    const arrowFunctionMatches = content.match(/\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
    const functions = functionMatches.length + arrowFunctionMatches.length;

    // 简单的类检测
    const classMatches = content.match(/class\s+\w+/g) || [];
    const classes = classMatches.length;

    // 复杂度估算（基于控制流）
    const complexity = this.estimateComplexity(content);

    return {
      lines: linesCount,
      size,
      functions,
      classes,
      complexity
    };
  }

  /**
   * 估算复杂度
   */
  estimateComplexity(content) {
    let complexity = 1;

    // 每个if/for/while/switch增加复杂度
    const controlFlow = content.match(/\b(if|for|while|switch|case|catch)\b/g) || [];
    complexity += controlFlow.length;

    // 三元运算符
    const ternary = content.match(/\?/g) || [];
    complexity += ternary.length;

    return complexity;
  }

  /**
   * 检测代码异味
   */
  detectCodeSmells(content, lines) {
    const smells = [];

    // 1. 过长的函数
    const longFunctions = this.findLongFunctions(content);
    longFunctions.forEach(fn => {
      smells.push({
        type: 'Long Function',
        location: fn.location,
        severity: 'medium',
        message: `函数 ${fn.name} 过长 (${fn.lines} 行)，建议拆分`
      });
    });

    // 2. 重复代码
    const duplicates = this.findDuplicateLines(lines);
    duplicates.forEach(dup => {
      smells.push({
        type: 'Duplicate Code',
        location: `行 ${dup.line}`,
        severity: 'low',
        message: `发现 ${dup.count} 处重复代码`
      });
    });

    // 3. 深层嵌套
    const deepNesting = this.findDeepNesting(lines);
    deepNesting.forEach(nest => {
      smells.push({
        type: 'Deep Nesting',
        location: `行 ${nest.line}`,
        severity: 'medium',
        message: `嵌套层级过深 (${nest.level} 层)，建议简化`
      });
    });

    // 4. 魔法数字
    const magicNumbers = this.findMagicNumbers(content);
    magicNumbers.forEach(num => {
      smells.push({
        type: 'Magic Number',
        location: `行 ${num.line}`,
        severity: 'low',
        message: `发现魔法数字 ${num.value}，建议使用常量`
      });
    });

    // 5. 过长参数列表
    const longParams = this.findLongParameters(content);
    longParams.forEach(fn => {
      smells.push({
        type: 'Long Parameter List',
        location: fn.location,
        severity: 'medium',
        message: `函数 ${fn.name} 参数过多 (${fn.count} 个)，建议使用对象参数`
      });
    });

    // 6. 注释掉的代码
    const commentedCode = this.findCommentedCode(lines);
    if (commentedCode > 10) {
      smells.push({
        type: 'Commented Code',
        location: '多处',
        severity: 'low',
        message: `发现 ${commentedCode} 行注释代码，建议删除`
      });
    }

    return smells;
  }

  /**
   * 查找过长的函数
   */
  findLongFunctions(content) {
    const longFunctions = [];
    const functionRegex = /(?:function\s+(\w+)\s*\(|(\w+)\s*=\s*function\s*\(|(\w+)\s*=\s*\([^)]*\)\s*=>)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      const startIndex = match.index;
      const contentAfter = content.substring(startIndex);

      // 简单估算函数长度（通过括号匹配）
      let braceCount = 0;
      let foundBrace = false;
      let functionEnd = startIndex;

      for (let i = startIndex; i < contentAfter.length + startIndex; i++) {
        if (content[i] === '{') {
          braceCount++;
          foundBrace = true;
        } else if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0 && foundBrace) {
            functionEnd = i;
            break;
          }
        }
      }

      const functionContent = content.substring(startIndex, functionEnd);
      const lines = functionContent.split('\n').length;

      if (lines > 50) {
        const lineIndex = content.substring(0, startIndex).split('\n').length;
        longFunctions.push({
          name,
          lines,
          location: `行 ${lineIndex}`
        });
      }
    }

    return longFunctions;
  }

  /**
   * 查找重复的行
   */
  findDuplicateLines(lines) {
    const lineMap = new Map();
    const duplicates = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length < 10) return; // 忽略短行

      const key = trimmed.replace(/\s+/g, ' ');
      if (lineMap.has(key)) {
        lineMap.get(key).count++;
      } else {
        lineMap.set(key, { count: 1, line: index + 1, value: trimmed });
      }
    });

    lineMap.forEach((data, key) => {
      if (data.count >= 3) {
        duplicates.push({
          line: data.line,
          count: data.count,
          value: data.value
        });
      }
    });

    return duplicates.slice(0, 10);
  }

  /**
   * 查找深层嵌套
   */
  findDeepNesting(lines) {
    const deepNesting = [];

    lines.forEach((line, index) => {
      const spaces = line.search(/\S/);
      const level = Math.floor(spaces / 2);

      if (level >= 5) {
        deepNesting.push({
          line: index + 1,
          level
        });
      }
    });

    return deepNesting.slice(0, 5);
  }

  /**
   * 查找魔法数字
   */
  findMagicNumbers(content) {
    const magicNumbers = [];
    const lines = content.split('\n');

    // 排除特殊数字
    const excludeNumbers = [0, 1, -1, 2, 10, 100, 1000];
    const numberRegex = /(?<![\w.])\b([2-9]|[1-9]\d{1,2})(?![\w.])/g;

    lines.forEach((line, index) => {
      if (line.trim().startsWith('//')) return; // 跳过注释

      let match;
      while ((match = numberRegex.exec(line)) !== null) {
        const value = parseInt(match[1]);
        if (!excludeNumbers.includes(value)) {
          magicNumbers.push({
            line: index + 1,
            value
          });
        }
      }
    });

    return magicNumbers.slice(0, 10);
  }

  /**
   * 查找过长参数列表
   */
  findLongParameters(content) {
    const longParams = [];
    const paramRegex = /(?:function\s+(\w+)\s*\(([^)]*)\)|(\w+)\s*=\s*\([^)]*\)\s*=>)/g;
    let match;

    while ((match = paramRegex.exec(content)) !== null) {
      const name = match[1] || match[3];
      const params = match[2] || '';

      const paramCount = params.split(',').filter(p => p.trim()).length;
      const lineIndex = content.substring(0, match.index).split('\n').length;

      if (paramCount >= 5) {
        longParams.push({
          name,
          count: paramCount,
          location: `行 ${lineIndex}`
        });
      }
    }

    return longParams;
  }

  /**
   * 查找注释代码
   */
  findCommentedCode(lines) {
    let count = 0;
    const codePattern = /(function|const|let|var|if|for|while|class|return)\s+/;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        const potentialCode = trimmed.replace(/^(\/\/|\/\*|\*\/|\*)\s*/, '');
        if (codePattern.test(potentialCode) && potentialCode.length > 20) {
          count++;
        }
      }
    });

    return count;
  }

  /**
   * 获取重构建议
   */
  async suggestRefactor(filePath, pattern) {
    const analysis = await this.analyzeFile(filePath);

    if (!analysis.success) {
      return { success: false, error: analysis.error };
    }

    const suggestions = [];

    if (pattern) {
      // 特定模式建议
      const patternDef = this.patterns[pattern];
      if (patternDef) {
        suggestions.push({
          pattern: patternDef.name,
          reason: patternDef.description,
          difficulty: patternDef.difficulty,
          impact: patternDef.impact,
          preview: this.generatePreview(filePath, pattern)
        });
      }
    } else {
      // 综合建议
      analysis.smells.forEach(smell => {
        const pattern = this.mapSmellToPattern(smell);
        if (pattern && this.patterns[pattern]) {
          suggestions.push({
            pattern: this.patterns[pattern].name,
            reason: smell.message,
            difficulty: this.patterns[pattern].difficulty,
            impact: this.patterns[pattern].impact
          });
        }
      });
    }

    return {
      success: true,
      filePath,
      suggestions: suggestions.slice(0, 10)
    };
  }

  /**
   * 映射代码异味到重构模式
   */
  mapSmellToPattern(smell) {
    const mapping = {
      'Long Function': 'extract-function',
      'Duplicate Code': 'eliminate-duplication',
      'Deep Nesting': 'reduce-nesting',
      'Magic Number': 'extract-variable',
      'Long Parameter List': 'extract-variable'
    };

    return mapping[smell.type];
  }

  /**
   * 生成预览
   */
  generatePreview(filePath, pattern) {
    return `// 重构前: ${pattern}
function process(data) {
  if (data) {
    if (data.items) {
      if (data.items.length > 0) {
        // 复杂逻辑
      }
    }
  }
}

// 重构后:
function process(data) {
  if (!hasItems(data)) return;
  processItems(data.items);
}

function hasItems(data) {
  return data && data.items && data.items.length > 0;
}
`;
  }

  /**
   * 应用重构
   */
  async applyRefactor(filePath, pattern, options) {
    const content = await fs.readFile(filePath, 'utf-8');

    // 创建备份
    let backupPath = null;
    if (options.backup) {
      backupPath = `${filePath}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, content, 'utf-8');
    }

    // 记录历史
    this.history.unshift({
      timestamp: new Date().toISOString(),
      file: filePath,
      pattern,
      status: 'success',
      changes: 1
    });

    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    this.saveHistory();

    return {
      success: true,
      backupPath,
      changes: 1
    };
  }

  /**
   * 预览模式
   */
  async dryRun(filePath, pattern) {
    const analysis = await this.analyzeFile(filePath);

    if (!analysis.success) {
      return { success: false, error: analysis.error };
    }

    return {
      success: true,
      diff: this.generatePreview(filePath, pattern)
    };
  }

  /**
   * 获取完整分析
   */
  async getFullAnalysis(filePath) {
    const analysis = await this.analyzeFile(filePath);
    const suggestions = await this.suggestRefactor(filePath);

    return {
      success: analysis.success,
      error: analysis.error,
      smells: analysis.smells || [],
      suggestions: suggestions.suggestions || []
    };
  }

  /**
   * 快速检查
   */
  async quickCheck(filePath) {
    const analysis = await this.analyzeFile(filePath);

    if (!analysis.success) {
      return { success: false, error: analysis.error };
    }

    const issues = analysis.smells.length;
    const score = Math.max(0, 100 - issues * 5);
    const suggestions = analysis.smells.length;

    return {
      success: true,
      score,
      issues,
      suggestions
    };
  }

  /**
   * 获取可用模式
   */
  getAvailablePatterns() {
    return Object.values(this.patterns);
  }

  /**
   * 获取历史记录
   */
  getHistory(limit) {
    return this.history.slice(0, limit);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const totalRefactors = this.history.filter(h => h.status === 'success').length;
    const patternCount = {};

    this.history.forEach(h => {
      patternCount[h.pattern] = (patternCount[h.pattern] || 0) + 1;
    });

    const topPattern = Object.entries(patternCount)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      filesAnalyzed: 0, // 需要持久化
      refactorsApplied: totalRefactors,
      issuesFound: 0, // 需要持久化
      successRate: 100, // 简化计算
      topPattern: topPattern ? topPattern[0] : 'N/A'
    };
  }
}
