import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const SUMMARIES_FILE = path.join(DATA_DIR, 'summaries.json');

/**
 * 文档摘要管理器类
 * 提供文档/代码摘要生成功能，支持多种摘要类型和自定义模板
 */
export class SummarizeManager {
  constructor() {
    this.summaries = [];
    this.templates = this.getDefaultTemplates();
    this.loadSummaries();
  }

  /**
   * 加载摘要记录
   */
  async loadSummaries() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(SUMMARIES_FILE, 'utf-8');
      const saved = JSON.parse(data);
      this.summaries = saved.summaries || [];
      if (saved.templates) {
        this.templates = saved.templates;
      }
    } catch (error) {
      this.summaries = [];
      await this.saveSummaries();
    }
  }

  /**
   * 保存摘要记录
   */
  async saveSummaries() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        SUMMARIES_FILE,
        JSON.stringify({ summaries: this.summaries, templates: this.templates }, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`保存摘要记录失败: ${error.message}`);
    }
  }

  /**
   * 获取默认模板
   */
  getDefaultTemplates() {
    return [
      {
        id: 'brief',
        name: '简短摘要',
        description: '生成简短的摘要（100字以内）',
        maxLength: 100
      },
      {
        id: 'standard',
        name: '标准摘要',
        description: '生成标准长度的摘要（200字）',
        maxLength: 200
      },
      {
        id: 'detailed',
        name: '详细摘要',
        description: '生成详细的摘要（500字）',
        maxLength: 500
      },
      {
        id: 'bullet-points',
        name: '要点摘要',
        description: '以要点形式列出关键内容',
        format: 'bullet'
      },
      {
        id: 'code',
        name: '代码摘要',
        description: '代码功能说明',
        type: 'code'
      },
      {
        id: 'api',
        name: 'API文档',
        description: 'API接口摘要',
        type: 'api'
      }
    ];
  }

  /**
   * 创建摘要
   */
  async createSummary(source, content, templateId) {
    const template = this.templates.find(t => t.id === templateId) || this.templates[1];
    const summaryId = Date.now().toString();

    const summary = {
      id: summaryId,
      source,
      content,
      summary: '', // 将由AI生成
      templateId: template.id,
      templateName: template.name,
      type: template.type || 'text',
      timestamp: new Date().toISOString(),
      metadata: {
        length: content.length,
        wordCount: content.split(/\s+/).length
      }
    };

    this.summaries.unshift(summary);
    // 保留最近50条记录
    if (this.summaries.length > 50) {
      this.summaries = this.summaries.slice(0, 50);
    }

    await this.saveSummaries();
    return summary;
  }

  /**
   * 更新摘要内容
   */
  async updateSummary(id, summaryText) {
    const summary = this.summaries.find(s => s.id === id);
    if (!summary) {
      return { success: false, error: '摘要不存在' };
    }

    summary.summary = summaryText;
    summary.updatedAt = new Date().toISOString();
    await this.saveSummaries();
    return { success: true, summary };
  }

  /**
   * 获取摘要
   */
  getSummary(id) {
    const summary = this.summaries.find(s => s.id === id);
    return summary || null;
  }

  /**
   * 搜索摘要
   */
  searchSummaries(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.summaries.filter(s =>
      s.source.toLowerCase().includes(lowerKeyword) ||
      s.content.toLowerCase().includes(lowerKeyword) ||
      s.summary?.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 列出所有摘要
   */
  listSummaries(filter = {}) {
    let result = this.summaries;

    if (filter.type) {
      result = result.filter(s => s.type === filter.type);
    }

    if (filter.templateId) {
      result = result.filter(s => s.templateId === filter.templateId);
    }

    return result.map(s => ({
      id: s.id,
      source: s.source,
      templateName: s.templateName,
      timestamp: s.timestamp,
      hasSummary: !!s.summary
    }));
  }

  /**
   * 添加自定义模板
   */
  async addTemplate(template) {
    const id = template.id || `custom-${Date.now()}`;
    const newTemplate = {
      id,
      name: template.name,
      description: template.description,
      maxLength: template.maxLength,
      format: template.format,
      type: template.type,
      prompt: template.prompt
    };

    this.templates.push(newTemplate);
    await this.saveSummaries();
    return { success: true, template: newTemplate };
  }

  /**
   * 获取模板
   */
  getTemplates() {
    return this.templates;
  }

  /**
   * 删除摘要
   */
  async deleteSummary(id) {
    const index = this.summaries.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, error: '摘要不存在' };
    }

    this.summaries.splice(index, 1);
    await this.saveSummaries();
    return { success: true };
  }

  /**
   * 批量摘要
   */
  async batchSummarize(items, templateId) {
    const results = [];
    for (const item of items) {
      const summary = await this.createSummary(item.source, item.content, templateId);
      results.push(summary);
    }
    return { success: true, count: results.length, summaries: results };
  }

  /**
   * 导出摘要
   */
  async exportSummaries(filePath) {
    try {
      const exportData = this.summaries.map(s => ({
        source: s.source,
        summary: s.summary,
        template: s.templateName,
        timestamp: s.timestamp
      }));

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: `导出失败: ${error.message}` };
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalSummaries: this.summaries.length,
      templatesCount: this.templates.length,
      summarizedCount: this.summaries.filter(s => s.summary).length,
      pendingCount: this.summaries.filter(s => !s.summary).length,
      avgLength: this.summaries.length > 0
        ? Math.round(this.summaries.reduce((sum, s) => sum + s.metadata.length, 0) / this.summaries.length)
        : 0
    };
  }
}
