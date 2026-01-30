/**
 * 数据库支持模块
 * 支持多种数据库后端：JSON文件、SQLite、LevelDB
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 数据库类型
 */
export const DATABASE_TYPES = {
  JSON: 'json',
  SQLITE: 'sqlite',
  LEVELDB: 'leveldb'
};

/**
 * 数据库配置
 */
const DEFAULT_CONFIG = {
  type: DATABASE_TYPES.JSON,
  dataDir: path.join(__dirname, '..', '..', 'data'),
  encryption: false,
  compression: true
};

/**
 * JSON数据库实现
 */
class JSONDatabase {
  constructor(config) {
    this.config = config;
    this.dataPath = path.join(config.dataDir, `${config.name}.json`);
    this.cache = new Map();
    this.loaded = false;
  }

  /**
   * 初始化数据库
   */
  async init() {
    try {
      await fs.mkdir(this.config.dataDir, { recursive: true });

      const exists = await this.exists();
      if (!exists) {
        await this._save({});
      } else {
        await this.load();
      }

      this.loaded = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize JSON database:', error);
      throw error;
    }
  }

  /**
   * 检查数据库是否存在
   */
  async exists() {
    try {
      await fs.access(this.dataPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 加载数据
   */
  async load() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);

      // 更新缓存
      this.cache.clear();
      for (const [key, value] of Object.entries(parsed)) {
        this.cache.set(key, value);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load JSON database:', error);
      return {};
    }
  }

  /**
   * 保存数据
   */
  async _save(data) {
    try {
      const json = JSON.stringify(data, null, 2);
      await fs.writeFile(this.dataPath, json, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save JSON database:', error);
      throw error;
    }
  }

  /**
   * 获取值
   */
  async get(key) {
    return this.cache.get(key);
  }

  /**
   * 设置值
   */
  async set(key, value) {
    this.cache.set(key, value);

    // 异步保存
    const data = Object.fromEntries(this.cache);
    await this._save(data);
  }

  /**
   * 删除值
   */
  async delete(key) {
    this.cache.delete(key);

    const data = Object.fromEntries(this.cache);
    await this._save(data);
  }

  /**
   * 检查键是否存在
   */
  async has(key) {
    return this.cache.has(key);
  }

  /**
   * 获取所有键
   */
  async keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取所有数据
   */
  async getAll() {
    return Object.fromEntries(this.cache);
  }

  /**
   * 清空数据库
   */
  async clear() {
    this.cache.clear();
    await this._save({});
  }

  /**
   * 批量设置
   */
  async batch(items) {
    for (const [key, value] of Object.entries(items)) {
      this.cache.set(key, value);
    }

    const data = Object.fromEntries(this.cache);
    await this._save(data);
  }

  /**
   * 查询（简单实现）
   */
  async query(predicate) {
    const results = [];
    for (const [key, value] of this.cache.entries()) {
      if (predicate(value, key)) {
        results.push({ key, value });
      }
    }
    return results;
  }

  /**
   * 关闭数据库
   */
  async close() {
    // 确保最后的数据被保存
    const data = Object.fromEntries(this.cache);
    await this._save(data);
    this.loaded = false;
  }
}

/**
 * SQLite数据库实现（占位符）
 * 需要安装: npm install better-sqlite3
 */
class SQLiteDatabase {
  constructor(config) {
    this.config = config;
    this.db = null;
  }

  async init() {
    try {
      // const Database = await import('better-sqlite3');
      // this.db = new Database(this.dataPath);
      console.warn('SQLite support requires better-sqlite3 package');
      return false;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  async get(key) {
    // SQLite实现
    throw new Error('SQLite not implemented');
  }

  async set(key, value) {
    throw new Error('SQLite not implemented');
  }

  async delete(key) {
    throw new Error('SQLite not implemented');
  }

  async close() {
    // if (this.db) this.db.close();
  }
}

/**
 * LevelDB数据库实现（占位符）
 * 需要安装: npm install level
 */
class LevelDBDatabase {
  constructor(config) {
    this.config = config;
    this.db = null;
  }

  async init() {
    try {
      // const level = await import('level');
      // this.db = await level(this.dataPath);
      console.warn('LevelDB support requires level package');
      return false;
    } catch (error) {
      console.error('Failed to initialize LevelDB database:', error);
      throw error;
    }
  }

  async get(key) {
    throw new Error('LevelDB not implemented');
  }

  async set(key, value) {
    throw new Error('LevelDB not implemented');
  }

  async delete(key) {
    throw new Error('LevelDB not implemented');
  }

  async close() {
    // if (this.db) await this.db.close();
  }
}

/**
 * 数据库工厂
 */
export function createDatabase(name, options = {}) {
  const config = { ...DEFAULT_CONFIG, name, ...options };
  config.dataDir = path.resolve(config.dataDir);

  switch (config.type) {
    case DATABASE_TYPES.SQLITE:
      return new SQLiteDatabase(config);
    case DATABASE_TYPES.LEVELDB:
      return new LevelDBDatabase(config);
    case DATABASE_TYPES.JSON:
    default:
      return new JSONDatabase(config);
  }
}

/**
 * 数据库管理器（管理多个数据库实例）
 */
export class DatabaseManager {
  constructor() {
    this.databases = new Map();
  }

  /**
   * 获取或创建数据库
   */
  async getDatabase(name, options = {}) {
    if (!this.databases.has(name)) {
      const db = createDatabase(name, options);
      await db.init();
      this.databases.set(name, db);
    }
    return this.databases.get(name);
  }

  /**
   * 关闭所有数据库
   */
  async closeAll() {
    const promises = [];
    for (const db of this.databases.values()) {
      promises.push(db.close());
    }
    await Promise.all(promises);
    this.databases.clear();
  }

  /**
   * 获取所有数据库名称
   */
  listDatabases() {
    return Array.from(this.databases.keys());
  }
}

/**
 * 创建全局数据库管理器实例
 */
let globalDBManager = null;

export function getDatabaseManager() {
  if (!globalDBManager) {
    globalDBManager = new DatabaseManager();
  }
  return globalDBManager;
}

/**
 * 会话数据库
 */
export class SessionDatabase {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.dbName = 'sessions';
  }

  async init() {
    this.db = await this.dbManager.getDatabase(this.dbName);
  }

  async saveSession(sessionId, session) {
    await this.db.set(sessionId, session);
  }

  async loadSession(sessionId) {
    return await this.db.get(sessionId);
  }

  async deleteSession(sessionId) {
    await this.db.delete(sessionId);
  }

  async listSessions() {
    const all = await this.db.getAll();
    return Object.entries(all).map(([id, session]) => ({ id, ...session }));
  }
}

/**
 * 用户数据库
 */
export class UserDatabase {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.dbName = 'users';
  }

  async init() {
    this.db = await this.dbManager.getDatabase(this.dbName);
  }

  async saveUser(userId, userData) {
    await this.db.set(userId, userData);
  }

  async getUser(userId) {
    return await this.db.get(userId);
  }

  async deleteUser(userId) {
    await this.db.delete(userId);
  }

  async listUsers() {
    const all = await this.db.getAll();
    return Object.entries(all).map(([id, user]) => ({ id, ...user }));
  }
}

/**
 * 配置数据库
 */
export class ConfigDatabase {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.dbName = 'config';
  }

  async init() {
    this.db = await this.dbManager.getDatabase(this.dbName);
  }

  async get(key) {
    return await this.db.get(key);
  }

  async set(key, value) {
    await this.db.set(key, value);
  }

  async getAll() {
    return await this.db.getAll();
  }
}
