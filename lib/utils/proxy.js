import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const PROXY_FILE = path.join(DATA_DIR, 'proxy-config.json');

/**
 * 代理配置管理器
 * 管理HTTP/HTTPS代理设置
 */
export class ProxyManager {
  constructor() {
    this.configs = [];
    this.activeConfig = null;
    this.loadConfigs();
  }

  async loadConfigs() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(PROXY_FILE, 'utf-8');
      const saved = JSON.parse(data);
      this.configs = saved.configs || [];
      this.activeConfig = saved.activeConfig || null;
    } catch (error) {
      this.configs = [];
      this.activeConfig = null;
      await this.saveConfigs();
    }
  }

  async saveConfigs() {
    await fs.writeFile(
      PROXY_FILE,
      JSON.stringify({ configs: this.configs, activeConfig: this.activeConfig }, null, 2),
      'utf-8'
    );
  }

  addConfig(name, host, port, username = '', password = '') {
    const config = {
      id: Date.now().toString(),
      name,
      host,
      port,
      username,
      password,
      protocol: 'http',
      createdAt: new Date().toISOString()
    };
    this.configs.push(config);
    this.saveConfigs();
    return { success: true, config };
  }

  listConfigs() { return this.configs; }

  setActive(id) {
    const config = this.configs.find(c => c.id === id);
    if (config) {
      this.activeConfig = id;
      this.saveConfigs();
      return { success: true, config };
    }
    return { success: false };
  }

  removeConfig(id) {
    this.configs = this.configs.filter(c => c.id !== id);
    if (this.activeConfig === id) {
      this.activeConfig = null;
    }
    this.saveConfigs();
    return { success: true };
  }
}
