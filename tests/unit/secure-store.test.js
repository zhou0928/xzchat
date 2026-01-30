/**
 * @fileoverview 安全存储模块单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SecureStoreEngine,
  SecureItem,
  APIKeyManager,
  createSecureStore,
  getSecureStore,
  createAPIKeyManager,
  formatItemList,
  formatAPIKeyList,
  ERROR_MESSAGES
} from '../../lib/utils/secure-store.js';

describe('SecureItem', () => {
  it('应该创建存储项', () => {
    const item = new SecureItem({
      key: 'test_key',
      value: 'test_value',
      description: '测试项'
    });

    expect(item.key).toBe('test_key');
    expect(item.value).toBe('test_value');
    expect(item.description).toBe('测试项');
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });

  it('应该转换为JSON', () => {
    const item = new SecureItem({
      key: 'test_key',
      value: 'test_value',
      description: '测试项'
    });

    const json = item.toJSON();

    expect(json.key).toBe('test_key');
    expect(json.value).toBe('test_value');
    expect(json.description).toBe('测试项');
    expect(json.createdAt).toBeDefined();
    expect(json.updatedAt).toBeDefined();
  });

  it('应该从JSON创建', () => {
    const json = {
      key: 'test_key',
      value: 'test_value',
      description: '测试项',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const item = SecureItem.fromJSON(json);

    expect(item.key).toBe('test_key');
    expect(item.value).toBe('test_value');
    expect(item.description).toBe('测试项');
  });
});

describe('SecureStoreEngine', () => {
  let store;

  beforeEach(() => {
    store = new SecureStoreEngine({
      useKeytar: false,
      enableEncryption: false
    });
  });

  afterEach(() => {
    if (store) {
      store.clear();
    }
  });

  describe('基本操作', () => {
    it('应该添加存储项', async () => {
      const result = await store.set('test_key', 'test_value', '测试项');

      expect(result).toBe(true);
      expect(store.has('test_key')).toBe(true);
    });

    it('应该获取存储项', async () => {
      await store.set('test_key', 'test_value', '测试项');
      const value = await store.get('test_key');

      expect(value).toBe('test_value');
    });

    it('应该删除存储项', async () => {
      await store.set('test_key', 'test_value', '测试项');
      const deleted = await store.delete('test_key');

      expect(deleted).toBe(true);
      expect(store.has('test_key')).toBe(false);
    });

    it('应该检查存储项是否存在', async () => {
      await store.set('test_key', 'test_value', '测试项');

      expect(store.has('test_key')).toBe(true);
      expect(store.has('non_existent_key')).toBe(false);
    });

    it('应该获取所有键名', async () => {
      await store.set('key1', 'value1');
      await store.set('key2', 'value2');
      await store.set('key3', 'value3');

      const keys = store.keys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('应该列出所有存储项', async () => {
      await store.set('key1', 'value1', '描述1');
      await store.set('key2', 'value2', '描述2');

      const items = store.list();

      expect(items).toHaveLength(2);
      expect(items[0]).toBeInstanceOf(SecureItem);
      expect(items[0].key).toBe('key1');
      expect(items[0].value).toBe('value1');
    });

    it('应该获取存储项数量', async () => {
      expect(store.count()).toBe(0);

      await store.set('key1', 'value1');
      await store.set('key2', 'value2');

      expect(store.count()).toBe(2);
    });

    it('应该清空所有存储项', async () => {
      await store.set('key1', 'value1');
      await store.set('key2', 'value2');

      await store.clear();

      expect(store.count()).toBe(0);
    });
  });

  describe('更新操作', () => {
    it('应该更新存储项值', async () => {
      await store.set('test_key', 'old_value');
      await store.set('test_key', 'new_value');

      const value = await store.get('test_key');

      expect(value).toBe('new_value');
      const item = store.getItem('test_key');
      expect(item.updatedAt.getTime()).toBeGreaterThan(item.createdAt.getTime());
    });

    it('应该更新存储项描述', async () => {
      await store.set('test_key', 'value', '旧描述');

      await store.updateDescription('test_key', '新描述');

      const item = store.getItem('test_key');
      expect(item.description).toBe('新描述');
    });

    it('应该获取存储项详情', async () => {
      await store.set('test_key', 'test_value', '测试描述');

      const item = store.getItem('test_key');

      expect(item).toBeInstanceOf(SecureItem);
      expect(item.key).toBe('test_key');
      expect(item.value).toBe('test_value');
      expect(item.description).toBe('测试描述');
    });

    it('更新不存在的存储项应该抛出错误', async () => {
      await expect(
        store.updateDescription('non_existent_key', '描述')
      ).rejects.toThrow(ERROR_MESSAGES.KEY_NOT_FOUND);
    });
  });

  describe('错误处理', () => {
    it('添加空键应该抛出错误', async () => {
      await expect(store.set('', 'value')).rejects.toThrow();
    });

    it('添加undefined值应该抛出错误', async () => {
      await expect(store.set('key', undefined)).rejects.toThrow();
    });

    it('设置无效密码应该抛出错误', () => {
      expect(() => store.setPassword('')).toThrow();
    });
  });

  describe('导出和导入', () => {
    it('应该导出存储项', async () => {
      await store.set('key1', 'value1', '描述1');
      await store.set('key2', 'value2', '描述2');

      const exported = store.export();

      expect(exported).toHaveLength(2);
      expect(exported[0].key).toBe('key1');
      expect(exported[0].hasValue).toBe(true);
      expect(exported[0].value).toBeUndefined();
    });

    it('应该备份存储项到文件', async () => {
      await store.set('key1', 'value1', '描述1');
      await store.set('key2', 'value2', '描述2');

      const backupPath = '/tmp/test-backup.json';
      await store.backup(backupPath);

      const fs = await import('fs/promises');
      const data = await fs.readFile(backupPath, 'utf-8');
      const items = JSON.parse(data);

      expect(items).toHaveLength(2);
      expect(items[0].key).toBe('key1');
      expect(items[0].value).toBe('value1');

      // 清理
      await fs.unlink(backupPath);
    }, 10000);

    it('应该从备份恢复存储项', async () => {
      const backupPath = '/tmp/test-backup.json';
      const fs = await import('fs/promises');

      // 创建备份文件
      const backupData = [
        { key: 'key1', value: 'value1', description: '描述1', createdAt: new Date(), updatedAt: new Date() },
        { key: 'key2', value: 'value2', description: '描述2', createdAt: new Date(), updatedAt: new Date() }
      ];
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      // 恢复
      await store.restore(backupPath);

      expect(store.count()).toBe(2);
      expect(await store.get('key1')).toBe('value1');
      expect(await store.get('key2')).toBe('value2');

      // 清理
      await fs.unlink(backupPath);
    }, 10000);

    it('应该合并恢复存储项', async () => {
      const backupPath = '/tmp/test-backup.json';
      const fs = await import('fs/promises');

      // 添加现有项
      await store.set('key1', 'old_value1', '描述1');

      // 创建备份文件
      const backupData = [
        { key: 'key1', value: 'new_value1', description: '新描述1', createdAt: new Date(), updatedAt: new Date() },
        { key: 'key2', value: 'value2', description: '描述2', createdAt: new Date(), updatedAt: new Date() }
      ];
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      // 合并恢复
      await store.restore(backupPath, true);

      expect(store.count()).toBe(2);
      expect(await store.get('key1')).toBe('new_value1');
      expect(await store.get('key2')).toBe('value2');

      // 清理
      await fs.unlink(backupPath);
    }, 10000);
  });
});

describe('APIKeyManager', () => {
  let store;
  let apiKeyManager;

  beforeEach(() => {
    store = new SecureStoreEngine({
      useKeytar: false,
      enableEncryption: false
    });
    apiKeyManager = new APIKeyManager(store);
  });

  it('应该添加API Key', async () => {
    const result = await apiKeyManager.addKey('test_key', 'sk-123456', 'openai');

    expect(result).toBe(true);
  });

  it('应该获取API Key', async () => {
    await apiKeyManager.addKey('test_key', 'sk-123456', 'openai');

    const key = await apiKeyManager.getKey('test_key', 'openai');

    expect(key).toBe('sk-123456');
  });

  it('应该删除API Key', async () => {
    await apiKeyManager.addKey('test_key', 'sk-123456', 'openai');

    const deleted = await apiKeyManager.deleteKey('test_key', 'openai');

    expect(deleted).toBe(true);
  });

  it('应该列出所有API Key', async () => {
    await apiKeyManager.addKey('key1', 'sk-111', 'openai');
    await apiKeyManager.addKey('key2', 'sk-222', 'openai');
    await apiKeyManager.addKey('key3', 'sk-333', 'anthropic');

    const keys = apiKeyManager.listKeys();

    expect(keys).toHaveLength(3);
    expect(keys[0].name).toBe('key1');
    expect(keys[0].provider).toBe('openai');
  });

  it('应该使用默认提供商', async () => {
    await apiKeyManager.addKey('test_key', 'sk-123456');

    const key = await apiKeyManager.getKey('test_key');

    expect(key).toBe('sk-123456');
  });
});

describe('工厂函数', () => {
  it('应该创建安全存储引擎', () => {
    const store = createSecureStore();

    expect(store).toBeInstanceOf(SecureStoreEngine);
  });

  it('应该返回全局存储引擎', () => {
    const store1 = getSecureStore();
    const store2 = getSecureStore();

    expect(store1).toBe(store2);
  });

  it('应该创建API Key管理器', () => {
    const manager = createAPIKeyManager();

    expect(manager).toBeInstanceOf(APIKeyManager);
  });

  it('创建存储引擎时应该使用自定义选项', () => {
    const store = createSecureStore({
      serviceName: 'custom-service',
      enableEncryption: true
    });

    expect(store.serviceName).toBe('custom-service');
    expect(store.enableEncryption).toBe(true);
  });
});

describe('格式化函数', () => {
  it('应该格式化存储项列表', () => {
    const items = [
      new SecureItem({ key: 'key1', value: 'value1', description: '描述1' }),
      new SecureItem({ key: 'key2', value: 'value2', description: '描述2' })
    ];

    const formatted = formatItemList(items);

    expect(formatted).toContain('key1');
    expect(formatted).toContain('key2');
    expect(formatted).toContain('描述1');
    expect(formatted).toContain('描述2');
  });

  it('应该格式化空列表', () => {
    const formatted = formatItemList([]);

    expect(formatted).toContain('暂无存储项');
  });

  it('应该格式化API Key列表', () => {
    const keys = [
      { name: 'key1', provider: 'openai', description: 'OpenAI API Key', createdAt: new Date(), updatedAt: new Date() },
      { name: 'key2', provider: 'anthropic', description: 'Anthropic API Key', createdAt: new Date(), updatedAt: new Date() }
    ];

    const formatted = formatAPIKeyList(keys);

    expect(formatted).toContain('key1');
    expect(formatted).toContain('key2');
    expect(formatted).toContain('openai');
    expect(formatted).toContain('anthropic');
  });

  it('应该格式化空的API Key列表', () => {
    const formatted = formatAPIKeyList([]);

    expect(formatted).toContain('暂无API Key');
  });
});

describe('加密功能', () => {
  it('应该初始化加密密钥', () => {
    const store = new SecureStoreEngine({
      password: 'test_password',
      enableEncryption: true,
      useKeytar: false
    });

    expect(store.enableEncryption).toBe(true);
  });

  it('应该设置新密码', () => {
    const store = new SecureStoreEngine({ useKeytar: false });

    const result = store.setPassword('new_password');

    expect(result).toBe(true);
  });

  it('设置空密码应该抛出错误', () => {
    const store = new SecureStoreEngine({ useKeytar: false });

    expect(() => store.setPassword('')).toThrow();
  });
});
