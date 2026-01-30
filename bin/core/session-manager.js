import fs from "node:fs";
import path from "node:path";

/**
 * 会话管理器
 * 管理会话、历史记录和消息
 */
export class SessionManager {
  constructor(options = {}) {
    this.historyDir = options.historyDir || path.join(process.cwd(), '.chat-history');
    this.currentSession = options.currentSession || 'default';
    this.messages = [];
    this.maxHistoryFiles = options.maxHistoryFiles || 100;
    this.autoSave = options.autoSave !== false;
    
    this.ensureHistoryDir();
  }

  /**
   * 确保历史目录存在
   */
  ensureHistoryDir() {
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * 获取会话文件路径
   */
  getSessionFilePath(sessionName) {
    return path.join(this.historyDir, `${sessionName}.json`);
  }

  /**
   * 加载会话历史
   */
  loadHistory(sessionName) {
    const sessionFile = this.getSessionFilePath(sessionName);
    
    if (!fs.existsSync(sessionFile)) {
      return [];
    }

    try {
      const data = fs.readFileSync(sessionFile, 'utf-8');
      const history = JSON.parse(data);
      return Array.isArray(history) ? history : [];
    } catch (e) {
      console.log(`⚠️  加载会话失败: ${e.message}`);
      return [];
    }
  }

  /**
   * 保存会话历史
   */
  saveHistory(sessionName, messages) {
    const sessionFile = this.getSessionFilePath(sessionName);
    
    try {
      fs.writeFileSync(sessionFile, JSON.stringify(messages, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.log(`❌ 保存会话失败: ${e.message}`);
      return false;
    }
  }

  /**
   * 列出所有会话
   */
  listSessions() {
    try {
      const files = fs.readdirSync(this.historyDir);
      const sessions = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .sort((a, b) => {
          const aTime = fs.statSync(path.join(this.historyDir, `${a}.json`)).mtimeMs;
          const bTime = fs.statSync(path.join(this.historyDir, `${b}.json`)).mtimeMs;
          return bTime - aTime; // 降序
        });
      
      return sessions;
    } catch (e) {
      console.log(`⚠️  列出会话失败: ${e.message}`);
      return [];
    }
  }

  /**
   * 删除会话
   */
  deleteSession(sessionName) {
    const sessionFile = this.getSessionFilePath(sessionName);
    
    if (!fs.existsSync(sessionFile)) {
      return { success: false, error: '会话不存在' };
    }

    try {
      fs.unlinkSync(sessionFile);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 切换会话
   */
  switchSession(sessionName) {
    // 保存当前会话
    if (this.autoSave && this.messages.length > 0) {
      this.saveHistory(this.currentSession, this.messages);
    }

    // 加载新会话
    this.messages = this.loadHistory(sessionName);
    this.currentSession = sessionName;

    console.log(`✅ 已切换到会话: ${sessionName}`);
    console.log(`📝 消息数量: ${this.messages.length}`);

    return this.messages;
  }

  /**
   * 清空当前会话
   */
  clearSession() {
    this.messages = [];
    console.log(`✅ 已清空当前会话: ${this.currentSession}`);
    return this.messages;
  }

  /**
   * 删除当前会话
   */
  deleteCurrentSession() {
    const result = this.deleteSession(this.currentSession);
    
    if (result.success) {
      console.log(`✅ 已删除会话: ${this.currentSession}`);
      this.messages = [];
      this.currentSession = 'default';
    } else {
      console.log(`❌ 删除失败: ${result.error}`);
    }

    return result;
  }

  /**
   * 添加消息到会话
   */
  addMessage(role, content) {
    this.messages.push({ role, content });
    
    // 自动保存
    if (this.autoSave) {
      this.saveHistory(this.currentSession, this.messages);
    }

    return this.messages;
  }

  /**
   * 获取当前消息
   */
  getMessages() {
    return this.messages;
  }

  /**
   * 设置消息
   */
  setMessages(messages) {
    this.messages = messages;
    
    if (this.autoSave) {
      this.saveHistory(this.currentSession, this.messages);
    }

    return this.messages;
  }

  /**
   * 导出会话到文件
   */
  exportSession(sessionName, format = 'json') {
    const messages = sessionName ? this.loadHistory(sessionName) : this.messages;
    
    if (format === 'json') {
      return JSON.stringify(messages, null, 2);
    } else if (format === 'markdown') {
      let markdown = `# 会话: ${sessionName || this.currentSession}\n\n`;
      
      for (const msg of messages) {
        const role = msg.role === 'user' ? '👤 用户' : '🤖 AI';
        markdown += `## ${role}\n\n${msg.content}\n\n---\n\n`;
      }

      return markdown;
    } else if (format === 'txt') {
      let text = `会话: ${sessionName || this.currentSession}\n${'='.repeat(50)}\n\n`;
      
      for (const msg of messages) {
        const role = msg.role === 'user' ? '用户' : 'AI';
        text += `[${role}]\n${msg.content}\n\n`;
      }

      return text;
    }

    throw new Error(`不支持的格式: ${format}`);
  }

  /**
   * 获取会话统计
   */
  getSessionStats(sessionName) {
    const messages = sessionName ? this.loadHistory(sessionName) : this.messages;
    
    let userMessages = 0;
    let assistantMessages = 0;
    let totalTokens = 0;
    
    for (const msg of messages) {
      if (msg.role === 'user') userMessages++;
      if (msg.role === 'assistant') assistantMessages++;
      if (msg.content) totalTokens += msg.content.length / 4; // 粗略估算
    }

    return {
      messageCount: messages.length,
      userMessages,
      assistantMessages,
      estimatedTokens: Math.floor(totalTokens)
    };
  }

  /**
   * 清理旧的历史文件
   */
  cleanupOldHistory() {
    const sessions = this.listSessions();
    
    if (sessions.length <= this.maxHistoryFiles) {
      return { deleted: 0 };
    }

    const toDelete = sessions.slice(this.maxHistoryFiles);
    let deleted = 0;

    for (const session of toDelete) {
      const result = this.deleteSession(session);
      if (result.success) deleted++;
    }

    console.log(`🧹 已清理 ${deleted} 个旧会话`);

    return { deleted };
  }
}
