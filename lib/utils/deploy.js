import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DEPLOYMENTS_FILE = path.join(DATA_DIR, 'deployments.json');
const HISTORY_FILE = path.join(DATA_DIR, 'deploy-history.json');

/**
 * 部署管理器类
 */
export class DeploymentManager {
  constructor() {
    this.deployments = [];
    this.history = [];
    this.loadData();
  }

  async loadData() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      const deploymentsData = await fs.readFile(DEPLOYMENTS_FILE, 'utf-8');
      this.deployments = JSON.parse(deploymentsData);

      const historyData = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(historyData);
    } catch (error) {
      this.deployments = [];
      this.history = [];
    }
  }

  async saveData() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DEPLOYMENTS_FILE, JSON.stringify(this.deployments, null, 2), 'utf-8');
      await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存数据失败:', error.message);
    }
  }

  listDeployments() {
    return this.deployments.map(d => ({
      name: d.name,
      platform: d.platform,
      url: d.url,
      status: d.status
    }));
  }

  addDeployment(name, platform, url = '') {
    const existing = this.deployments.find(d => d.name === name);

    if (existing) {
      return { success: false, error: '部署环境已存在' };
    }

    const deployment = {
      name,
      platform,
      url,
      status: 'idle',
      version: '1.0.0',
      createdAt: new Date().toISOString()
    };

    this.deployments.push(deployment);
    this.saveData();

    return { success: true };
  }

  removeDeployment(name) {
    const index = this.deployments.findIndex(d => d.name === name);

    if (index === -1) {
      return { success: false, error: '部署环境不存在' };
    }

    this.deployments.splice(index, 1);
    this.saveData();

    return { success: true };
  }

  async deploy(name) {
    const deployment = this.deployments.find(d => d.name === name);

    if (!deployment) {
      return { success: false, error: '部署环境不存在' };
    }

    deployment.status = 'deploying';
    this.saveData();

    const startTime = Date.now();

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      deployment.status = 'running';
      deployment.version = `v${Date.now()}`;

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.addToHistory(name, 'deploy', 'success');

      return {
        success: true,
        duration,
        version: deployment.version
      };
    } catch (error) {
      deployment.status = 'failed';

      this.addToHistory(name, 'deploy', 'failed');

      return { success: false, error: error.message };
    }
  }

  async rollback(name) {
    const deployment = this.deployments.find(d => d.name === name);

    if (!deployment) {
      return { success: false, error: '部署环境不存在' };
    }

    const previousVersion = `v${Date.now() - 100000}`;

    deployment.version = previousVersion;

    this.addToHistory(name, 'rollback', 'success');

    return {
      success: true,
      version: previousVersion
    };
  }

  getLogs(name) {
    const deployment = this.deployments.find(d => d.name === name);

    if (!deployment) {
      return [];
    }

    return [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Deployment ${deployment.status}`
      },
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Version: ${deployment.version}`
      }
    ];
  }

  addToHistory(name, action, status) {
    this.history.unshift({
      timestamp: new Date().toISOString(),
      name,
      action,
      status
    });

    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveData();
  }

  getHistory(limit) {
    return this.history.slice(0, limit);
  }

  getStatus() {
    return {
      total: this.deployments.length,
      running: this.deployments.filter(d => d.status === 'running').length,
      failed: this.deployments.filter(d => d.status === 'failed').length
    };
  }
}
