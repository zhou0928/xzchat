/**
 * 密钥管理器 - 安全存储和管理密钥
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecretManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/secrets.json');
    this.secrets = [];
    this.init();
  }

  async init() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.secrets = JSON.parse(data);
    } catch (err) {
      this.secrets = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.secrets, null, 2));
  }

  add(name, value, type = 'api_key', description = '', environment = 'production') {
    const secret = {
      id: crypto.randomUUID(),
      name,
      value: this._encrypt(value),
      type, // 'api_key', 'token', 'password', 'certificate'
      description,
      environment, // 'development', 'staging', 'production'
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      lastRotatedAt: new Date().toISOString(),
      expiresAt: null,
      status: 'active'
    };
    this.secrets.push(secret);
    this.save();
    return { ...secret, value: '***' };
  }

  get(id) {
    const secret = this.secrets.find(s => s.id === id);
    if (!secret) return null;
    return { ...secret, value: this._decrypt(secret.value) };
  }

  getByName(name) {
    const secret = this.secrets.find(s => s.name === name);
    if (!secret) return null;
    return { ...secret, value: this._decrypt(secret.value) };
  }

  getAll(showValue = false) {
    return this.secrets.map(s => ({
      ...s,
      value: showValue ? this._decrypt(s.value) : '***'
    }));
  }

  getByEnvironment(environment) {
    return this.secrets
      .filter(s => s.environment === environment)
      .map(s => ({ ...s, value: '***' }));
  }

  update(id, updates) {
    const index = this.secrets.findIndex(s => s.id === id);
    if (index !== -1) {
      if (updates.value) {
        updates.value = this._encrypt(updates.value);
      }
      this.secrets[index] = {
        ...this.secrets[index],
        ...updates,
        lastRotatedAt: new Date().toISOString()
      };
      this.save();
      return { ...this.secrets[index], value: '***' };
    }
    return null;
  }

  remove(id) {
    const index = this.secrets.findIndex(s => s.id === id);
    if (index !== -1) {
      const removed = this.secrets.splice(index, 1)[0];
      this.save();
      return { ...removed, value: '***' };
    }
    return null;
  }

  async rotate(id) {
    const secret = this.get(id);
    if (!secret) return null;

    // 生成新值（这里简化处理，实际应根据类型生成）
    const newValue = this._generateNewValue(secret.type);
    const updated = this.update(id, {
      value: newValue,
      lastRotatedAt: new Date().toISOString()
    });

    return updated;
  }

  markUsed(id) {
    const index = this.secrets.findIndex(s => s.id === id);
    if (index !== -1) {
      this.secrets[index].lastUsedAt = new Date().toISOString();
      this.save();
    }
  }

  search(keyword) {
    const lower = keyword.toLowerCase();
    return this.secrets
      .filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower)
      )
      .map(s => ({ ...s, value: '***' }));
  }

  getStats() {
    const now = new Date();
    return {
      total: this.secrets.length,
      active: this.secrets.filter(s => s.status === 'active').length,
      byType: {
        api_key: this.secrets.filter(s => s.type === 'api_key').length,
        token: this.secrets.filter(s => s.type === 'token').length,
        password: this.secrets.filter(s => s.type === 'password').length,
        certificate: this.secrets.filter(s => s.type === 'certificate').length
      },
      byEnvironment: {
        development: this.secrets.filter(s => s.environment === 'development').length,
        staging: this.secrets.filter(s => s.environment === 'staging').length,
        production: this.secrets.filter(s => s.environment === 'production').length
      },
      expired: this.secrets.filter(s => s.expiresAt && new Date(s.expiresAt) < now).length
    };
  }

  _encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${key.toString('hex')}:${encrypted}`;
  }

  _decrypt(encryptedText) {
    const algorithm = 'aes-256-cbc';
    const [ivHex, keyHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(keyHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  _generateNewValue(type) {
    switch (type) {
      case 'api_key':
        return `api_${crypto.randomBytes(16).toString('hex')}`;
      case 'token':
        return `tok_${crypto.randomBytes(24).toString('hex')}`;
      case 'password':
        return crypto.randomBytes(12).toString('base64');
      default:
        return crypto.randomBytes(16).toString('hex');
    }
  }
}

module.exports = SecretManager;
