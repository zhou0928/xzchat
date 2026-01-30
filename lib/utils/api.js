import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const REQUESTS_FILE = path.join(DATA_DIR, 'api-requests.json');
const HISTORY_FILE = path.join(DATA_DIR, 'api-history.json');

/**
 * API测试器类
 */
export class APITester {
  constructor() {
    this.requests = [];
    this.history = [];
    this.loadData();
  }

  async loadData() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      const requestsData = await fs.readFile(REQUESTS_FILE, 'utf-8');
      this.requests = JSON.parse(requestsData);

      const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(historyData);
    } catch (error) {
      this.requests = [];
      this.history = [];
    }
  }

  async saveData() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(REQUESTS_FILE, JSON.stringify(this.requests, null, 2), 'utf-8');
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存数据失败:', error.message);
    }
  }

  async testRequest(url, method = 'GET') {
    const startTime = Date.now();

    try {
      const response = await fetch(url, { method });
      const data = await response.json();

      const result = {
        url,
        method,
        status: response.status,
        duration: Date.now() - startTime,
        data
      };

      this.history.unshift({
        timestamp: new Date().toISOString(),
        method,
        url,
        status: response.status
      });

      if (this.history.length > 100) {
        this.history = this.history.slice(0, 100);
      }

      this.saveData();

      return result;
    } catch (error) {
      return {
        url,
        method,
        status: 'Error',
        duration: Date.now() - startTime,
        data: { error: error.message }
      };
    }
  }

  saveRequest(name, config) {
    try {
      const parsedConfig = JSON.parse(config);
      this.requests.push({
        name,
        ...parsedConfig,
        createdAt: new Date().toISOString()
      });

      this.saveData();

      return { success: true };
    } catch (error) {
      return { success: false, error: '配置格式错误，应为JSON' };
    }
  }

  listRequests() {
    return this.requests.map(r => ({
      name: r.name,
      method: r.method || 'GET',
      url: r.url
    }));
  }

  async runRequest(name) {
    const request = this.requests.find(r => r.name === name);

    if (!request) {
      return { success: false, error: `请求 "${name}" 不存在` };
    }

    const response = await this.testRequest(request.url, request.method);

    return { success: true, response };
  }

  generateDocs() {
    if (this.requests.length === 0) {
      return '暂无API文档';
    }

    let docs = '# API文档\n\n';
    docs += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    this.requests.forEach(req => {
      docs += `## ${req.name}\n\n`;
      docs += `- **URL**: ${req.url}\n`;
      docs += `- **方法**: ${req.method || 'GET'}\n`;
      if (req.description) {
        docs += `- **描述**: ${req.description}\n`;
      }
      docs += '\n';
    });

    return docs;
  }

  async saveDocs(file, docs) {
    try {
      await fs.writeFile(file, docs, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  generateMock(name) {
    return {
      name: name || 'mock-server',
      port: 3000,
      routes: this.requests.map(req => ({
        method: req.method || 'GET',
        path: req.url.replace(/https?:\/\/[^\/]+/, ''),
        response: 'Mock response'
      }))
    };
  }

  getHistory(limit) {
    return this.history.slice(0, limit);
  }
}
