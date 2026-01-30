import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const EXPLANATIONS_FILE = path.join(DATA_DIR, 'explanations.json');

/**
 * 代码解释管理器类
 * 提供代码解释功能，支持多种解释级别和上下文分析
 */
export class ExplainManager {
  constructor() {
    this.explanations = [];
    this.loadExplanations();
  }

  /**
   * 加载解释记录
   */
  async loadExplanations() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(EXPLANATIONS_FILE, 'utf-8');
      this.explanations = JSON.parse(data);
    } catch (error) {
      this.explanations = [];
      await this.saveExplanations();
    }
  }

  /**
   * 保存解释记录
   */
  async saveExplanations() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(EXPLANATIONS_FILE, JSON.stringify(this.explanations, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`保存解释记录失败: ${error.message}`);
    }
  }

  /**
   * 创建解释
   */
  async createExplanation(code, options = {}) {
    const explanationId = Date.now().toString();
    const explanation = {
      id: explanationId,
      code,
      language: options.language || this.detectLanguage(code),
      level: options.level || 'intermediate', // beginner, intermediate, advanced
      includeContext: options.includeContext !== false,
      explanation: '',
      analysis: {},
      timestamp: new Date().toISOString(),
      metadata: {
        lineCount: code.split('\n').length,
        charCount: code.length
      }
    };

    this.explanations.unshift(explanation);
    // 保留最近50条记录
    if (this.explanations.length > 50) {
      this.explanations = this.explanations.slice(0, 50);
    }

    await this.saveExplanations();
    return explanation;
  }

  /**
   * 更新解释
   */
  async updateExplanation(id, explanationData) {
    const explanation = this.explanations.find(e => e.id === id);
    if (!explanation) {
      return { success: false, error: '解释不存在' };
    }

    Object.assign(explanation, explanationData);
    explanation.updatedAt = new Date().toISOString();
    await this.saveExplanations();
    return { success: true, explanation };
  }

  /**
   * 获取解释
   */
  getExplanation(id) {
    return this.explanations.find(e => e.id === id) || null;
  }

  /**
   * 搜索解释
   */
  searchExplanations(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.explanations.filter(e =>
      e.code.toLowerCase().includes(lowerKeyword) ||
      e.explanation?.toLowerCase().includes(lowerKeyword) ||
      e.language?.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 列出所有解释
   */
  listExplanations(filter = {}) {
    let result = this.explanations;

    if (filter.language) {
      result = result.filter(e => e.language === filter.language);
    }

    if (filter.level) {
      result = result.filter(e => e.level === filter.level);
    }

    return result.map(e => ({
      id: e.id,
      language: e.language,
      level: e.level,
      timestamp: e.timestamp,
      hasExplanation: !!e.explanation,
      lineCount: e.metadata.lineCount
    }));
  }

  /**
   * 删除解释
   */
  async deleteExplanation(id) {
    const index = this.explanations.findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false, error: '解释不存在' };
    }

    this.explanations.splice(index, 1);
    await this.saveExplanations();
    return { success: true };
  }

  /**
   * 检测编程语言
   */
  detectLanguage(code) {
    const patterns = {
      javascript: [/function\s+\w+/, /=>\s*\{/, /import\s+.*from/, /const\s+\w+\s*=/],
      python: [/def\s+\w+\s*\(/, /import\s+\w+/, /print\s*\(/, /:\s*$/],
      java: [/public\s+class\s+\w+/, /public\s+static\s+void/, /System\.out\.print/],
      cpp: [/#include\s*<\w+/, /int\s+main\s*\(/, /std::/, /cout\s*<</],
      go: [/package\s+\w+/, /func\s+\w+\s*\(/, /import\s*\(/],
      rust: [/fn\s+\w+\s*\(/, /let\s+mut\s+/, /use\s+\w+/, /impl\s+\w+/]
    };

    for (const [lang, langPatterns] of Object.entries(patterns)) {
      if (langPatterns.some(p => p.test(code))) {
        return lang;
      }
    }

    return 'unknown';
  }

  /**
   * 获取解释级别描述
   */
  getLevelDescription(level) {
    const descriptions = {
      beginner: '适合初学者，使用简单语言解释基本概念',
      intermediate: '适合有一定基础的开发者，解释实现细节',
      advanced: '适合资深开发者，深入分析技术细节和优化建议'
    };
    return descriptions[level] || descriptions.intermediate;
  }

  /**
   * 添加分析
   */
  async addAnalysis(id, analysis) {
    const explanation = this.explanations.find(e => e.id === id);
    if (!explanation) {
      return { success: false, error: '解释不存在' };
    }

    explanation.analysis = analysis;
    await this.saveExplanations();
    return { success: true };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const languages = {};
    this.explanations.forEach(e => {
      languages[e.language] = (languages[e.language] || 0) + 1;
    });

    const levels = {};
    this.explanations.forEach(e => {
      levels[e.level] = (levels[e.level] || 0) + 1;
    });

    return {
      totalExplanations: this.explanations.length,
      languages,
      levels,
      explainedCount: this.explanations.filter(e => e.explanation).length,
      avgLineCount: this.explanations.length > 0
        ? Math.round(this.explanations.reduce((sum, e) => sum + e.metadata.lineCount, 0) / this.explanations.length)
        : 0
    };
  }

  /**
   * 导出解释
   */
  async exportExplanations(filePath) {
    try {
      const exportData = this.explanations.map(e => ({
        language: e.language,
        level: e.level,
        code: e.code,
        explanation: e.explanation,
        timestamp: e.timestamp
      }));

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: `导出失败: ${error.message}` };
    }
  }

  /**
   * 清除所有记录
   */
  async clearAll() {
    this.explanations = [];
    await this.saveExplanations();
    return { success: true };
  }
}
