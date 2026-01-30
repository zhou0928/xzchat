import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

class EnvManager {
  constructor() {
    this.envPath = path.join(os.homedir(), '.xzchat-env.json');
    this.envs = {};
    this.activeEnv = 'default';
  }

  async load() {
    try {
      const data = await fs.readFile(this.envPath, 'utf-8');
      const loaded = JSON.parse(data);
      this.envs = loaded.envs || {};
      this.activeEnv = loaded.activeEnv || 'default';
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.envs = { default: {} };
        await this.save();
      }
    }
  }

  async save() {
    await fs.writeFile(this.envPath, JSON.stringify({
      envs: this.envs,
      activeEnv: this.activeEnv
    }, null, 2), 'utf-8');
  }

  encrypt(text) {
    const key = process.env.XZCHAT_ENCRYPTION_KEY || 'default-key-change-me';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key.padEnd(32, '0'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encrypted) {
    const key = process.env.XZCHAT_ENCRYPTION_KEY || 'default-key-change-me';
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key.padEnd(32, '0'), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async set(envName, key, value, encrypted = false) {
    await this.load();
    if (!this.envs[envName]) this.envs[envName] = {};
    this.envs[envName][key] = encrypted ? this.encrypt(value) : { value, encrypted: false };
    await this.save();
  }

  async get(envName, key) {
    await this.load();
    const env = this.envs[envName];
    if (!env || !env[key]) return null;

    const item = env[key];
    if (typeof item === 'string') return this.decrypt(item);
    return item.value;
  }

  async list(envName) {
    await this.load();
    const env = this.envs[envName] || {};
    return Object.entries(env).map(([key, item]) => ({
      key,
      value: typeof item === 'string' ? '***ENCRYPTED***' : item.value,
      encrypted: typeof item === 'string'
    }));
  }

  async remove(envName, key) {
    await this.load();
    if (this.envs[envName] && this.envs[envName][key]) {
      delete this.envs[envName][key];
      await this.save();
      return true;
    }
    return false;
  }

  async createEnv(name) {
    await this.load();
    this.envs[name] = {};
    await this.save();
  }

  async deleteEnv(name) {
    await this.load();
    if (name === 'default') throw new Error('不能删除默认环境');
    if (this.envs[name]) {
      delete this.envs[name];
      if (this.activeEnv === name) this.activeEnv = 'default';
      await this.save();
      return true;
    }
    return false;
  }

  async setActive(name) {
    await this.load();
    if (!this.envs[name]) throw new Error(`环境不存在: ${name}`);
    this.activeEnv = name;
    await this.save();
  }

  async exportToFile(envName, filepath) {
    await this.load();
    const env = this.envs[envName] || {};
    const content = Object.entries(env).map(([key, item]) => {
      const value = typeof item === 'string' ? this.decrypt(item) : item.value;
      return `${key}=${value}`;
    }).join('\n');
    await fs.writeFile(filepath, content, 'utf-8');
  }

  async importFromFile(envName, filepath, encrypted = false) {
    await this.load();
    const content = await fs.readFile(filepath, 'utf-8');
    const lines = content.split('\n');
    if (!this.envs[envName]) this.envs[envName] = {};

    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        this.envs[envName][key] = encrypted ? this.encrypt(value) : { value, encrypted: false };
      }
    }
    await this.save();
  }

  formatList(vars) {
    if (vars.length === 0) return '暂无变量';
    let output = '';
    vars.forEach(v => {
      const encrypted = v.encrypted ? ' 🔒' : '';
      output += `${v.key}: ${v.value}${encrypted}\n`;
    });
    return output.trim();
  }
}

const envManager = new EnvManager();
export default envManager;
export { EnvManager };
