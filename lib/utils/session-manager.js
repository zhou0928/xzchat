import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export class SessionManager {
  constructor(baseDir = null) {
    this.baseDir = baseDir || os.homedir();
    this.currentSession = null;
    this.currentSessionName = 'default';
  }

  getSessionPath(sessionName) {
    const safeName = String(sessionName).replace(/[^a-zA-Z0-9_\-]/g, "_");
    if (sessionName === 'default') {
      return path.join(this.baseDir, '.newapi-chat-history.json');
    }
    return path.join(this.baseDir, `.newapi-chat-history-${safeName}.json`);
  }

  loadSession(sessionName) {
    const sessionPath = this.getSessionPath(sessionName);

    if (!fs.existsSync(sessionPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(sessionPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`加载会话失败: ${error.message}`);
      return [];
    }
  }

  saveSession(messages, sessionName) {
    const sessionPath = this.getSessionPath(sessionName);

    // 自动截断保护（保留最近 500 条）
    const toSave = messages.length > 500 ? messages.slice(-500) : messages;

    try {
      fs.writeFileSync(sessionPath, JSON.stringify(toSave, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`保存会话失败: ${error.message}`);
      return false;
    }
  }

  listSessions() {
    try {
      const files = fs.readdirSync(this.baseDir);
      const sessions = [];

      for (const file of files) {
        if (file === '.newapi-chat-history.json') {
          sessions.push('default');
        } else if (file.startsWith('.newapi-chat-history-') && file.endsWith('.json')) {
          const name = file.slice('.newapi-chat-history-'.length, -'.json'.length);
          sessions.push(name);
        }
      }

      return sessions;
    } catch (error) {
      console.error(`列出会话失败: ${error.message}`);
      return [];
    }
  }

  deleteSession(sessionName) {
    if (sessionName === 'default') {
      // 清空而不是删除
      return this.clearSession(sessionName);
    }

    const sessionPath = this.getSessionPath(sessionName);

    try {
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`删除会话失败: ${error.message}`);
      return false;
    }
  }

  clearSession(sessionName) {
    const sessionPath = this.getSessionPath(sessionName);

    try {
      fs.writeFileSync(sessionPath, JSON.stringify([], null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`清空会话失败: ${error.message}`);
      return false;
    }
  }

  cloneSession(sourceName, targetName) {
    const sourceMessages = this.loadSession(sourceName);

    if (sourceMessages.length === 0) {
      console.warn(`源会话 "${sourceName}" 为空`);
      return false;
    }

    const success = this.saveSession(sourceMessages, targetName);

    if (success) {
      console.log(`✅ 已克隆会话 "${sourceName}" -> "${targetName}"`);
    }

    return success;
  }

  searchSessions(keyword) {
    const sessions = this.listSessions();
    const results = [];

    for (const sessionName of sessions) {
      const messages = this.loadSession(sessionName);

      for (const message of messages) {
        if (message.content && message.content.toLowerCase().includes(keyword.toLowerCase())) {
          results.push({
            session: sessionName,
            role: message.role,
            preview: message.content.slice(0, 100),
            timestamp: message.timestamp || new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  exportSession(messages, format = 'json', filepath = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (!filepath) {
      const ext = format === 'md' ? 'md' : 'json';
      filepath = path.join(this.baseDir, `chat-export-${timestamp}.${ext}`);
    }

    let content;

    if (format === 'md') {
      content = this.exportToMarkdown(messages);
    } else {
      content = this.exportToJSON(messages);
    }

    try {
      fs.writeFileSync(filepath, content, 'utf-8');
      console.log(`✅ 已导出会话: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`导出失败: ${error.message}`);
      return null;
    }
  }

  exportToMarkdown(messages) {
    let markdown = `# 对话导出\n`;
    markdown += `导出时间: ${new Date().toLocaleString()}\n\n`;

    for (const message of messages) {
      if (message.role === 'system') continue;

      const role = message.role === 'user' ? '用户' : '助手';
      const content = message.content || '';

      markdown += `## ${role}\n\n${content}\n\n---\n\n`;
    }

    return markdown;
  }

  exportToJSON(messages) {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    }, null, 2);
  }

  getCurrentSessionName() {
    return this.currentSessionName;
  }

  setCurrentSessionName(name) {
    this.currentSessionName = name;
  }
}

export default SessionManager;
