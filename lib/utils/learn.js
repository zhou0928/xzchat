import fs from 'fs/promises';
import path from 'path';

/**
 * AI 学习模式管理器
 * 记录用户偏好，自动适应回复风格
 */
class LearnManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-learn.json');
    this.preferences = {};
    this.patterns = [];
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.preferences = parsed.preferences || {};
      this.patterns = parsed.patterns || [];
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载学习配置失败: ${error.message}`);
      }
    }
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify({
      preferences: this.preferences,
      patterns: this.patterns
    }, null, 2));
  }

  /**
   * 记录用户偏好
   */
  async recordPreference(category, key, value) {
    await this.load();

    if (!this.preferences[category]) {
      this.preferences[category] = {};
    }

    this.preferences[category][key] = {
      value,
      timestamp: new Date().toISOString(),
      usageCount: (this.preferences[category][key]?.usageCount || 0) + 1
    };

    await this.save();
  }

  /**
   * 获取偏好
   */
  async getPreference(category, key) {
    await this.load();
    return this.preferences[category]?.[key]?.value || null;
  }

  /**
   * 记录学习模式
   */
  async recordPattern(pattern) {
    await this.load();

    const existingIndex = this.patterns.findIndex(p => p.type === pattern.type && p.pattern === pattern.pattern);

    if (existingIndex >= 0) {
      // 更新现有模式
      this.patterns[existingIndex].occurrences++;
      this.patterns[existingIndex].lastSeen = new Date().toISOString();
      this.patterns[existingIndex].confidence = Math.min(1, this.patterns[existingIndex].confidence + 0.1);
    } else {
      // 添加新模式
      this.patterns.push({
        ...pattern,
        occurrences: 1,
        confidence: 0.1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });
    }

    await this.save();
  }

  /**
   * 获取建议
   */
  async getSuggestions(context) {
    await this.load();

    // 基于上下文和历史模式生成建议
    const suggestions = [];

    // 基于偏好的建议
    Object.entries(this.preferences).forEach(([category, prefs]) => {
      Object.entries(prefs).forEach(([key, pref]) => {
        suggestions.push({
          type: 'preference',
          category,
          key,
          value: pref.value,
          confidence: Math.min(1, pref.usageCount * 0.1)
        });
      });
    });

    // 基于模式的建议
    this.patterns.forEach(pattern => {
      if (pattern.confidence >= 0.5 && this.matchesContext(pattern, context)) {
        suggestions.push({
          type: 'pattern',
          pattern: pattern.pattern,
          action: pattern.action,
          confidence: pattern.confidence
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  matchesContext(pattern, context) {
    // 简化的上下文匹配
    if (pattern.context) {
      return Object.entries(pattern.context).every(([key, value]) => {
        return context[key] === value;
      });
    }
    return true;
  }

  /**
   * 学习用户的命令使用习惯
   */
  async learnCommand(command, args, context) {
    const pattern = {
      type: 'command',
      pattern: command,
      args: args,
      context: {
        category: context.category,
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().getDay()
      },
      action: 'execute'
    };

    await this.recordPattern(pattern);
  }

  /**
   * 学习用户的回复偏好
   */
  async learnReplyStyle(message, reply) {
    const style = {
      length: reply.length,
      tone: this.detectTone(reply),
      format: this.detectFormat(reply),
      language: this.detectLanguage(reply)
    };

    await this.recordPreference('replyStyle', 'default', style);
  }

  detectTone(text) {
    // 简化的语气检测
    const formal = text.includes('请') || text.includes('您') || text.includes('谢谢');
    const casual = text.includes('哈哈') || text.includes('😊');
    
    if (formal) return 'formal';
    if (casual) return 'casual';
    return 'neutral';
  }

  detectFormat(text) {
    if (text.includes('```')) return 'code';
    if (text.includes('1.') || text.includes('- ')) return 'list';
    if (text.length > 500) return 'long';
    return 'short';
  }

  detectLanguage(text) {
    const chinese = /[\u4e00-\u9fa5]/.test(text);
    return chinese ? 'zh' : 'en';
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * 获取学习统计
   */
  async getStats() {
    await this.load();

    const stats = {
      preferences: Object.keys(this.preferences).length,
      patterns: this.patterns.length,
      highConfidencePatterns: this.patterns.filter(p => p.confidence >= 0.7).length,
      categories: Object.keys(this.preferences),
      topPatterns: this.patterns.sort((a, b) => b.occurrences - a.occurrences).slice(0, 5)
    };

    return stats;
  }

  /**
   * 导出学习数据
   */
  async export() {
    await this.load();
    return JSON.stringify({
      preferences: this.preferences,
      patterns: this.patterns,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  /**
   * 导入学习数据
   */
  async import(content) {
    const data = JSON.parse(content);

    await this.load();

    // 合并偏好
    Object.entries(data.preferences || {}).forEach(([category, prefs]) => {
      if (!this.preferences[category]) {
        this.preferences[category] = {};
      }
      Object.assign(this.preferences[category], prefs);
    });

    // 合并模式
    if (data.patterns) {
      data.patterns.forEach(pattern => {
        const existingIndex = this.patterns.findIndex(
          p => p.type === pattern.type && p.pattern === pattern.pattern
        );
        if (existingIndex >= 0) {
          this.patterns[existingIndex].occurrences += pattern.occurrences || 0;
        } else {
          this.patterns.push(pattern);
        }
      });
    }

    await this.save();
  }

  /**
   * 重置学习数据
   */
  async reset(category = null) {
    await this.load();

    if (category) {
      delete this.preferences[category];
    } else {
      this.preferences = {};
      this.patterns = [];
    }

    await this.save();
  }

  /**
   * 获取自适应建议
   */
  async getAdaptiveSuggestions(context) {
    const suggestions = await this.getSuggestions(context);

    let output = '💡 智能建议\n\n';

    if (suggestions.length === 0) {
      output += '暂无建议。随着使用，AI 会学习你的偏好。';
      return output;
    }

    suggestions.slice(0, 3).forEach((s, i) => {
      if (s.type === 'preference') {
        output += `${i + 1}. 根据偏好，你可能需要: ${s.category} - ${s.key}\n`;
      } else if (s.type === 'pattern') {
        output += `${i + 1}. 你之前经常使用: ${s.pattern}\n`;
      }
    });

    return output.trim();
  }
}

export default new LearnManager();
