/**
 * 安全存储模块类型定义
 * @description 为 secure-store.js 提供完整的 TypeScript 类型支持
 */

/**
 * 存储项接口
 */
export interface SecureItem {
  key: string;
  value: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 存储项配置选项
 */
export interface SecureItemOptions {
  key?: string;
  value?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * API Key信息
 */
export interface APIKeyInfo {
  name: string;
  provider: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 安全存储引擎配置选项
 */
export interface SecureStoreOptions {
  serviceName?: string;
  password?: string;
  enableEncryption?: boolean;
  useKeytar?: boolean;
}

/**
 * 存储引擎类
 */
export declare class SecureStoreEngine {
  serviceName: string;
  enableEncryption: boolean;
  useKeytar: boolean;
  items: Map<string, SecureItem>;
  keytar: any;

  /**
   * 创建存储引擎
   * @param options - 选项
   */
  constructor(options?: SecureStoreOptions);

  /**
   * 检查keytar是否可用
   * @returns 是否可用
   */
  isKeytarAvailable(): boolean;

  /**
   * 设置密码
   * @param password - 新密码
   * @returns 是否成功
   */
  setPassword(password: string): boolean;

  /**
   * 添加存储项
   * @param key - 键名
   * @param value - 值
   * @param description - 描述
   * @returns 是否成功
   */
  set(key: string, value: string, description?: string): Promise<boolean>;

  /**
   * 获取存储项
   * @param key - 键名
   * @returns 值
   */
  get(key: string): Promise<string | null>;

  /**
   * 删除存储项
   * @param key - 键名
   * @returns 是否成功
   */
  delete(key: string): Promise<boolean>;

  /**
   * 检查存储项是否存在
   * @param key - 键名
   * @returns 是否存在
   */
  has(key: string): boolean;

  /**
   * 获取所有存储项的键名
   * @returns 键名数组
   */
  keys(): string[];

  /**
   * 列出所有存储项
   * @returns 存储项数组
   */
  list(): SecureItem[];

  /**
   * 获取存储项详情
   * @param key - 键名
   * @returns 存储项
   */
  getItem(key: string): SecureItem | null;

  /**
   * 更新存储项描述
   * @param key - 键名
   * @param description - 描述
   * @returns 是否成功
   */
  updateDescription(key: string, description: string): Promise<boolean>;

  /**
   * 清空所有存储项
   * @returns 是否成功
   */
  clear(): Promise<boolean>;

  /**
   * 获取存储项数量
   * @returns 数量
   */
  count(): number;

  /**
   * 备份存储项
   * @param filePath - 文件路径
   * @returns 是否成功
   */
  backup(filePath: string): Promise<boolean>;

  /**
   * 从备份恢复存储项
   * @param filePath - 文件路径
   * @param merge - 是否合并
   * @returns 是否成功
   */
  restore(filePath: string, merge?: boolean): Promise<boolean>;

  /**
   * 导出存储项 (不包含敏感值)
   * @returns 导出的数据
   */
  export(): Array<{
    key: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    hasValue: boolean;
  }>;
}

/**
 * API Key管理器类
 */
export declare class APIKeyManager {
  store: SecureStoreEngine;

  /**
   * 创建API Key管理器
   * @param store - 存储引擎
   */
  constructor(store?: SecureStoreEngine);

  /**
   * 添加API Key
   * @param name - 名称
   * @param key - API Key
   * @param provider - 提供商
   * @returns 是否成功
   */
  addKey(name: string, key: string, provider?: string): Promise<boolean>;

  /**
   * 获取API Key
   * @param name - 名称
   * @param provider - 提供商
   * @returns API Key
   */
  getKey(name: string, provider?: string): Promise<string | null>;

  /**
   * 删除API Key
   * @param name - 名称
   * @param provider - 提供商
   * @returns 是否成功
   */
  deleteKey(name: string, provider?: string): Promise<boolean>;

  /**
   * 列出所有API Key
   * @returns API Key列表
   */
  listKeys(): APIKeyInfo[];
}

/**
 * 创建安全存储引擎
 * @param options - 选项
 * @returns 存储引擎
 */
export declare function createSecureStore(options?: SecureStoreOptions): SecureStoreEngine;

/**
 * 获取全局存储引擎
 * @returns 存储引擎
 */
export declare function getSecureStore(): SecureStoreEngine;

/**
 * 创建API Key管理器
 * @param store - 存储引擎
 * @returns API Key管理器
 */
export declare function createAPIKeyManager(store?: SecureStoreEngine): APIKeyManager;

/**
 * 格式化存储项列表
 * @param items - 存储项数组
 * @returns 格式化的字符串
 */
export declare function formatItemList(items: SecureItem[]): string;

/**
 * 格式化API Key列表
 * @param keys - API Key数组
 * @returns 格式化的字符串
 */
export declare function formatAPIKeyList(keys: APIKeyInfo[]): string;

/**
 * 错误消息常量
 */
export declare const ERROR_MESSAGES: {
  SERVICE_NOT_AVAILABLE: string;
  INVALID_INPUT: string;
  KEY_NOT_FOUND: string;
  KEY_EXISTS: string;
  ENCRYPTION_FAILED: string;
  DECRYPTION_FAILED: string;
  SAVE_FAILED: string;
  DELETE_FAILED: string;
  LIST_FAILED: string;
  INVALID_PASSWORD: string;
  BACKUP_FAILED: string;
  RESTORE_FAILED: string;
};
