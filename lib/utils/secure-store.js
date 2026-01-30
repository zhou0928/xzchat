/**
 * @fileoverview 安全存储模块 - 使用keytar实现加密存储
 * @description 提供API Key和其他敏感信息的加密存储功能
 * @author xzChat Development Team
 * @version 1.0.0
 * @since 2024-01-28
 */

import { logger } from './logger.js';

// 错误消息
const ERROR_MESSAGES = {
  SERVICE_NOT_AVAILABLE: '安全存储服务不可用',
  INVALID_INPUT: '无效的输入参数',
  KEY_NOT_FOUND: '密钥不存在',
  KEY_EXISTS: '密钥已存在',
  ENCRYPTION_FAILED: '加密失败',
  DECRYPTION_FAILED: '解密失败',
  SAVE_FAILED: '保存失败',
  DELETE_FAILED: '删除失败',
  LIST_FAILED: '列表获取失败',
  INVALID_PASSWORD: '无效的密码',
  BACKUP_FAILED: '备份失败',
  RESTORE_FAILED: '恢复失败'
};

/**
 * 加密密钥
 * @private
 */
let ENCRYPTION_KEY = null;

/**
 * 初始化加密密钥
 * @param {string} password - 密码
 * @returns {boolean} 是否成功
 * @private
 */
function initEncryptionKey(password) {
  try {
    // 使用密码生成简单的加密密钥
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    ENCRYPTION_KEY = Math.abs(hash).toString(16);
    return true;
  } catch (error) {
    logger.error('初始化加密密钥失败', error);
    return false;
  }
}

/**
 * 简单加密函数
 * @param {string} text - 明文
 * @returns {string} 密文
 * @private
 */
function encrypt(text) {
  if (!ENCRYPTION_KEY) {
    return text;
  }

  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyCharCode = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode ^ keyCharCode);
    }
    return Buffer.from(result).toString('base64');
  } catch (error) {
    logger.error('加密失败', error);
    throw new Error(ERROR_MESSAGES.ENCRYPTION_FAILED);
  }
}

/**
 * 简单解密函数
 * @param {string} encrypted - 密文
 * @returns {string} 明文
 * @private
 */
function decrypt(encrypted) {
  if (!ENCRYPTION_KEY) {
    return encrypted;
  }

  try {
    const text = Buffer.from(encrypted, 'base64').toString('utf-8');
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyCharCode = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode ^ keyCharCode);
    }
    return result;
  } catch (error) {
    logger.error('解密失败', error);
    throw new Error(ERROR_MESSAGES.DECRYPTION_FAILED);
  }
}

/**
 * 存储项类
 */
class SecureItem {
  /**
   * 创建存储项
   * @param {Object} options - 选项
   * @param {string} options.key - 键名
   * @param {string} options.value - 值
   * @param {string} options.description - 描述
   * @param {Date} options.createdAt - 创建时间
   * @param {Date} options.updatedAt - 更新时间
   */
  constructor(options = {}) {
    this.key = options.key || '';
    this.value = options.value || '';
    this.description = options.description || '';
    this.createdAt = options.createdAt || new Date();
    this.updatedAt = options.updatedAt || new Date();
  }

  /**
   * 转换为JSON
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      key: this.key,
      value: this.value,
      description: this.description,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * 从JSON创建
   * @param {Object} json - JSON对象
   * @returns {SecureItem} 存储项
   */
  static fromJSON(json) {
    return new SecureItem({
      key: json.key,
      value: json.value,
      description: json.description,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    });
  }
}

/**
 * 安全存储引擎类
 */
class SecureStoreEngine {
  /**
   * 创建存储引擎
   * @param {Object} options - 选项
   * @param {string} options.serviceName - 服务名称
   * @param {string} options.password - 密码 (可选)
   * @param {boolean} options.enableEncryption - 是否启用加密
   * @param {boolean} options.useKeytar - 是否使用keytar
   */
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'xz-chat';
    this.enableEncryption = options.enableEncryption !== false;
    this.useKeytar = options.useKeytar !== false;
    this.items = new Map();
    this.keytar = null;

    // 初始化加密
    if (options.password) {
      initEncryptionKey(options.password);
    }

    // 尝试加载keytar
    if (this.useKeytar) {
      this._loadKeytar();
    }

    // 加载存储的项
    this._loadItems();
  }

  /**
   * 加载keytar模块
   * @private
   */
  async _loadKeytar() {
    try {
      this.keytar = await import('keytar');
      logger.debug('keytar模块加载成功');
    } catch (error) {
      logger.warn('keytar模块不可用，使用内存存储');
      this.keytar = null;
    }
  }

  /**
   * 加载存储的项
   * @private
   */
  _loadItems() {
    if (this.keytar) {
      // 使用keytar异步加载
      this._loadFromKeytar();
    } else {
      // 从环境变量加载
      this._loadFromEnv();
    }
  }

  /**
   * 从keytar加载
   * @private
   */
  async _loadFromKeytar() {
    try {
      const data = await this.keytar.getPassword(this.serviceName, 'secure_items');
      if (data) {
        const decrypted = this.enableEncryption ? decrypt(data) : data;
        const items = JSON.parse(decrypted);
        items.forEach(item => {
          this.items.set(item.key, SecureItem.fromJSON(item));
        });
        logger.debug(`从keytar加载了 ${this.items.size} 个存储项`);
      }
    } catch (error) {
      logger.error('从keytar加载失败', error);
    }
  }

  /**
   * 从环境变量加载
   * @private
   */
  _loadFromEnv() {
    try {
      const data = process.env.XZCHAT_SECURE_ITEMS;
      if (data) {
        const decrypted = this.enableEncryption ? decrypt(data) : data;
        const items = JSON.parse(decrypted);
        items.forEach(item => {
          this.items.set(item.key, SecureItem.fromJSON(item));
        });
        logger.debug(`从环境变量加载了 ${this.items.size} 个存储项`);
      }
    } catch (error) {
      logger.error('从环境变量加载失败', error);
    }
  }

  /**
   * 保存项
   * @private
   */
  async _saveItems() {
    if (this.keytar) {
      await this._saveToKeytar();
    } else {
      // keytar不可用时，只保存在内存中
      logger.debug('keytar不可用，存储项保存在内存中');
    }
  }

  /**
   * 保存到keytar
   * @private
   */
  async _saveToKeytar() {
    try {
      const items = Array.from(this.items.values()).map(item => item.toJSON());
      const data = JSON.stringify(items);
      const encrypted = this.enableEncryption ? encrypt(data) : data;
      await this.keytar.setPassword(this.serviceName, 'secure_items', encrypted);
      logger.debug(`保存了 ${items.length} 个存储项到keytar`);
    } catch (error) {
      logger.error('保存到keytar失败', error);
      throw new Error(ERROR_MESSAGES.SAVE_FAILED);
    }
  }

  /**
   * 检查keytar是否可用
   * @returns {boolean} 是否可用
   */
  isKeytarAvailable() {
    return this.keytar !== null;
  }

  /**
   * 设置密码
   * @param {string} password - 新密码
   * @returns {boolean} 是否成功
   */
  setPassword(password) {
    if (!password) {
      throw new Error(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    return initEncryptionKey(password);
  }

  /**
   * 添加存储项
   * @param {string} key - 键名
   * @param {string} value - 值
   * @param {string} description - 描述
   * @returns {Promise<boolean>} 是否成功
   */
  async set(key, value, description = '') {
    if (!key || value === undefined) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }

    const item = new SecureItem({
      key,
      value,
      description,
      createdAt: this.items.has(key) ? this.items.get(key).createdAt : new Date(),
      updatedAt: new Date()
    });

    this.items.set(key, item);
    await this._saveItems();

    logger.debug(`存储项已保存: ${key}`);
    return true;
  }

  /**
   * 获取存储项
   * @param {string} key - 键名
   * @returns {Promise<string|null>} 值
   */
  async get(key) {
    if (!key) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }

    const item = this.items.get(key);
    if (!item) {
      return null;
    }

    return item.value;
  }

  /**
   * 删除存储项
   * @param {string} key - 键名
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(key) {
    if (!key) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }

    const deleted = this.items.delete(key);
    if (deleted) {
      await this._saveItems();
      logger.debug(`存储项已删除: ${key}`);
    }

    return deleted;
  }

  /**
   * 检查存储项是否存在
   * @param {string} key - 键名
   * @returns {boolean} 是否存在
   */
  has(key) {
    return this.items.has(key);
  }

  /**
   * 获取所有存储项的键名
   * @returns {Array<string>} 键名数组
   */
  keys() {
    return Array.from(this.items.keys());
  }

  /**
   * 列出所有存储项
   * @returns {Array<SecureItem>} 存储项数组
   */
  list() {
    return Array.from(this.items.values());
  }

  /**
   * 获取存储项详情
   * @param {string} key - 键名
   * @returns {SecureItem|null} 存储项
   */
  getItem(key) {
    return this.items.get(key) || null;
  }

  /**
   * 更新存储项描述
   * @param {string} key - 键名
   * @param {string} description - 描述
   * @returns {Promise<boolean>} 是否成功
   */
  async updateDescription(key, description) {
    const item = this.items.get(key);
    if (!item) {
      throw new Error(ERROR_MESSAGES.KEY_NOT_FOUND);
    }

    item.description = description;
    item.updatedAt = new Date();
    await this._saveItems();

    return true;
  }

  /**
   * 清空所有存储项
   * @returns {Promise<boolean>} 是否成功
   */
  async clear() {
    this.items.clear();
    await this._saveItems();
    logger.debug('所有存储项已清空');
    return true;
  }

  /**
   * 获取存储项数量
   * @returns {number} 数量
   */
  count() {
    return this.items.size;
  }

  /**
   * 备份存储项
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否成功
   */
  async backup(filePath) {
    try {
      const items = Array.from(this.items.values()).map(item => item.toJSON());
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, JSON.stringify(items, null, 2));
      logger.debug(`备份已保存到: ${filePath}`);
      return true;
    } catch (error) {
      logger.error('备份失败', error);
      throw new Error(ERROR_MESSAGES.BACKUP_FAILED);
    }
  }

  /**
   * 从备份恢复存储项
   * @param {string} filePath - 文件路径
   * @param {boolean} merge - 是否合并
   * @returns {Promise<boolean>} 是否成功
   */
  async restore(filePath, merge = true) {
    try {
      const fs = await import('fs/promises');
      const data = await fs.readFile(filePath, 'utf-8');
      const items = JSON.parse(data);

      if (merge) {
        // 合并模式
        items.forEach(item => {
          this.items.set(item.key, SecureItem.fromJSON(item));
        });
      } else {
        // 替换模式
        this.items.clear();
        items.forEach(item => {
          this.items.set(item.key, SecureItem.fromJSON(item));
        });
      }

      await this._saveItems();
      logger.debug(`从备份恢复了 ${items.length} 个存储项`);
      return true;
    } catch (error) {
      logger.error('恢复失败', error);
      throw new Error(ERROR_MESSAGES.RESTORE_FAILED);
    }
  }

  /**
   * 导出存储项 (不包含敏感值)
   * @returns {Array<Object>} 导出的数据
   */
  export() {
    return Array.from(this.items.values()).map(item => ({
      key: item.key,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      hasValue: !!item.value
    }));
  }
}

// 全局存储引擎实例
let globalStore = null;

/**
 * 创建安全存储引擎
 * @param {Object} options - 选项
 * @returns {SecureStoreEngine} 存储引擎
 */
export function createSecureStore(options = {}) {
  if (!globalStore) {
    globalStore = new SecureStoreEngine(options);
  }
  return globalStore;
}

/**
 * 获取全局存储引擎
 * @returns {SecureStoreEngine} 存储引擎
 */
export function getSecureStore() {
  if (!globalStore) {
    globalStore = new SecureStoreEngine();
  }
  return globalStore;
}

/**
 * API Key管理器
 */
class APIKeyManager {
  /**
   * 创建API Key管理器
   * @param {SecureStoreEngine} store - 存储引擎
   */
  constructor(store) {
    this.store = store || getSecureStore();
  }

  /**
   * 添加API Key
   * @param {string} name - 名称
   * @param {string} key - API Key
   * @param {string} provider - 提供商
   * @returns {Promise<boolean>} 是否成功
   */
  async addKey(name, key, provider = 'default') {
    const storageKey = `api_key_${provider}_${name}`;
    const description = `${provider} API Key: ${name}`;
    return await this.store.set(storageKey, key, description);
  }

  /**
   * 获取API Key
   * @param {string} name - 名称
   * @param {string} provider - 提供商
   * @returns {Promise<string|null>} API Key
   */
  async getKey(name, provider = 'default') {
    const storageKey = `api_key_${provider}_${name}`;
    return await this.store.get(storageKey);
  }

  /**
   * 删除API Key
   * @param {string} name - 名称
   * @param {string} provider - 提供商
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteKey(name, provider = 'default') {
    const storageKey = `api_key_${provider}_${name}`;
    return await this.store.delete(storageKey);
  }

  /**
   * 列出所有API Key
   * @returns {Array<Object>} API Key列表
   */
  listKeys() {
    const items = this.store.list();
    return items
      .filter(item => item.key.startsWith('api_key_'))
      .map(item => {
        const parts = item.key.split('_');
        return {
          name: parts.slice(2).join('_'),
          provider: parts[2] || 'default',
          description: item.description,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });
  }
}

/**
 * 创建API Key管理器
 * @param {SecureStoreEngine} store - 存储引擎
 * @returns {APIKeyManager} API Key管理器
 */
export function createAPIKeyManager(store) {
  return new APIKeyManager(store);
}

/**
 * 格式化存储项列表
 * @param {Array<SecureItem>} items - 存储项数组
 * @returns {string} 格式化的字符串
 */
export function formatItemList(items) {
  if (items.length === 0) {
    return '  暂无存储项\n';
  }

  let output = '\n';

  items.forEach((item, index) => {
    output += `  ${index + 1}. ${item.key}\n`;
    output += `     描述: ${item.description || '无'}\n`;
    output += `     创建: ${item.createdAt.toLocaleString()}\n`;
    output += `     更新: ${item.updatedAt.toLocaleString()}\n\n`;
  });

  return output;
}

/**
 * 格式化API Key列表
 * @param {Array<Object>} keys - API Key数组
 * @returns {string} 格式化的字符串
 */
export function formatAPIKeyList(keys) {
  if (keys.length === 0) {
    return '  暂无API Key\n';
  }

  let output = '\n';

  keys.forEach((key, index) => {
    output += `  ${index + 1}. ${key.name}\n`;
    output += `     提供商: ${key.provider}\n`;
    output += `     描述: ${key.description || '无'}\n`;
    output += `     添加时间: ${key.createdAt.toLocaleString()}\n\n`;
  });

  return output;
}

// 导出类和函数
export {
  SecureStoreEngine,
  SecureItem,
  APIKeyManager,
  ERROR_MESSAGES
};
