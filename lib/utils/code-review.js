import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const REVIEWS_FILE = path.join(DATA_DIR, 'code-reviews.json');

/**
 * 代码审查管理器类
 * 提供智能代码审查功能，支持规则配置、问题跟踪和改进建议
 */
export class CodeReviewManager {
  constructor() {
    this.reviews = [];
    this.rules = this.getDefaultRules();
    this.loadReviews();
  }

  /**
   * 加载审查记录
   */
  async loadReviews() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
      const saved = JSON.parse(data);
      this.reviews = saved.reviews || [];
      if (saved.rules) {
        this.rules = saved.rules;
      }
    } catch (error) {
      this.reviews = [];
      await this.saveReviews();
    }
  }

  /**
   * 保存审查记录
   */
  async saveReviews() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        REVIEWS_FILE,
        JSON.stringify({ reviews: this.reviews, rules: this.rules }, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`保存审查记录失败: ${error.message}`);
    }
  }

  /**
   * 获取默认规则
   */
  getDefaultRules() {
    return [
      { id: 'naming', name: '命名规范', description: '检查变量和函数命名', enabled: true },
      { id: 'complexity', name: '复杂度', description: '检查圈复杂度', enabled: true },
      { id: 'duplication', name: '代码重复', description: '检测重复代码', enabled: true },
      { id: 'security', name: '安全检查', description: '检查安全隐患', enabled: true },
      { id: 'performance', name: '性能优化', description: '识别性能问题', enabled: true },
      { id: 'best-practices', name: '最佳实践', description: '遵循语言最佳实践', enabled: true },
      { id: 'documentation', name: '文档完整', description: '检查代码注释', enabled: false },
      { id: 'error-handling', name: '错误处理', description: '检查异常处理', enabled: true }
    ];
  }

  /**
   * 创建审查
   */
  async createReview(file, code, rules) {
    const reviewId = Date.now().toString();
    const review = {
      id: reviewId,
      file,
      code,
      rules: rules || this.rules.filter(r => r.enabled),
      issues: [],
      score: 0,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.reviews.push(review);
    await this.saveReviews();
    return review;
  }

  /**
   * 添加问题
   */
  async addIssue(reviewId, issue) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) {
      return { success: false, error: '审查不存在' };
    }

    const issueEntry = {
      id: Date.now().toString(),
      ...issue,
      timestamp: new Date().toISOString(),
      severity: issue.severity || 'medium',
      status: 'open'
    };

    review.issues.push(issueEntry);
    await this.saveReviews();
    return { success: true, issue: issueEntry };
  }

  /**
   * 计算评分
   */
  calculateScore(reviewId) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review || review.issues.length === 0) return 100;

    let score = 100;
    review.issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * 获取审查报告
   */
  getReport(reviewId) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) {
      return { success: false, error: '审查不存在' };
    }

    const issuesBySeverity = {
      critical: review.issues.filter(i => i.severity === 'critical'),
      high: review.issues.filter(i => i.severity === 'high'),
      medium: review.issues.filter(i => i.severity === 'medium'),
      low: review.issues.filter(i => i.severity === 'low')
    };

    return {
      success: true,
      review: {
        ...review,
        score: this.calculateScore(reviewId),
        issuesBySeverity
      }
    };
  }

  /**
   * 列出所有审查
   */
  listReviews() {
    return this.reviews.map(r => ({
      id: r.id,
      file: r.file,
      score: this.calculateScore(r.id),
      issuesCount: r.issues.length,
      timestamp: r.timestamp,
      status: r.status
    }));
  }

  /**
   * 更新规则
   */
  async updateRule(ruleId, updates) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      return { success: false, error: '规则不存在' };
    }

    Object.assign(rule, updates);
    await this.saveReviews();
    return { success: true, rule };
  }

  /**
   * 获取规则
   */
  getRules() {
    return this.rules;
  }

  /**
   * 删除审查
   */
  async deleteReview(reviewId) {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index === -1) {
      return { success: false, error: '审查不存在' };
    }

    this.reviews.splice(index, 1);
    await this.saveReviews();
    return { success: true };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalReviews: this.reviews.length,
      totalIssues: this.reviews.reduce((sum, r) => sum + r.issues.length, 0),
      averageScore: this.reviews.length > 0
        ? Math.round(this.reviews.reduce((sum, r) => sum + this.calculateScore(r.id), 0) / this.reviews.length)
        : 0,
      activeRules: this.rules.filter(r => r.enabled).length
    };
  }

  /**
   * 生成改进建议
   */
  generateSuggestions(reviewId) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) {
      return { success: false, error: '审查不存在' };
    }

    const suggestions = [];
    const severityCount = {};

    review.issues.forEach(issue => {
      severityCount[issue.severity] = (severityCount[issue.severity] || 0) + 1;
    });

    // 优先处理严重问题
    if (severityCount.critical > 0) {
      suggestions.push({
        priority: 1,
        message: `优先修复 ${severityCount.critical} 个严重问题`
      });
    }

    // 代码重复建议
    if (severityCount.medium > 5) {
      suggestions.push({
        priority: 2,
        message: '考虑重构重复代码，提取公共函数'
      });
    }

    // 文档建议
    if (!review.issues.some(i => i.ruleId === 'documentation')) {
      suggestions.push({
        priority: 3,
        message: '建议添加代码注释和文档'
      });
    }

    return { success: true, suggestions };
  }
}
