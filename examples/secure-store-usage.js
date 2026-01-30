/**
 * @fileoverview 安全存储模块使用示例
 * @description 演示如何使用 secure-store 模块进行加密存储
 */

import {
  createSecureStore,
  getSecureStore,
  createAPIKeyManager,
  formatItemList,
  formatAPIKeyList,
  ERROR_MESSAGES
} from '../lib/utils/secure-store.js';

// ============================================
// 示例 1: 基础使用
// ============================================
export async function example1_BasicUsage() {
  console.log('\n📦 示例 1: 基础使用\n');

  const store = createSecureStore({
    useKeytar: false,
    enableEncryption: false
  });

  // 添加存储项
  await store.set('user_api_key', 'sk-1234567890', 'OpenAI API Key');
  await store.set('secret_token', 'token_abc123', '访问令牌');

  console.log('✅ 存储项已添加');

  // 获取存储项
  const apiKey = await store.get('user_api_key');
  console.log(`获取的API Key: ${apiKey.substring(0, 10)}...`);

  // 列出所有存储项
  const items = store.list();
  console.log('\n存储项列表:');
  console.log(formatItemList(items));
}

// ============================================
// 示例 2: API Key管理
// ============================================
export async function example2_APIKeyManagement() {
  console.log('\n🔑 示例 2: API Key管理\n');

  const store = createSecureStore({
    useKeytar: false,
    enableEncryption: false
  });

  const apiKeyManager = createAPIKeyManager(store);

  // 添加API Key
  await apiKeyManager.addKey('production', 'sk-prod-123456', 'openai');
  await apiKeyManager.addKey('development', 'sk-dev-789012', 'openai');
  await apiKeyManager.addKey('main', 'sk-ant-345678', 'anthropic');

  console.log('✅ API Key已添加');

  // 列出所有API Key
  const keys = apiKeyManager.listKeys();
  console.log('\nAPI Key列表:');
  console.log(formatAPIKeyList(keys));

  // 获取特定的API Key
  const prodKey = await apiKeyManager.getKey('production', 'openai');
  console.log(`\n生产环境Key: ${prodKey.substring(0, 15)}...`);

  // 删除API Key
  await apiKeyManager.deleteKey('development', 'openai');
  console.log('开发环境Key已删除');

  // 列出删除后的API Key
  const updatedKeys = apiKeyManager.listKeys();
  console.log(`\n更新后的API Key数量: ${updatedKeys.length}`);
}

// ============================================
// 示例 3: 加密存储
// ============================================
export async function example3_EncryptedStorage() {
  console.log('\n🔒 示例 3: 加密存储\n');

  const store = createSecureStore({
    password: 'my_secure_password',
    enableEncryption: true,
    useKeytar: false
  });

  console.log('✅ 加密存储已初始化');

  // 添加敏感数据
  await store.set('credit_card', '4111111111111111', '信用卡号');
  await store.set('ssn', '123-45-6789', '社会保险号');

  console.log('✅ 敏感数据已加密存储');

  // 获取数据 (自动解密)
  const creditCard = await store.get('credit_card');
  console.log(`获取的信用卡号: ****-****-****-${creditCard.slice(-4)}`);

  // 检查存储项是否存在
  const exists = store.has('ssn');
  console.log(`SSN是否存在: ${exists}`);
}

// ============================================
// 示例 4: 备份和恢复
// ============================================
export async function example4_BackupAndRestore() {
  console.log('\n💾 示例 4: 备份和恢复\n');

  const store = createSecureStore({
    useKeytar: false,
    enableEncryption: false
  });

  // 添加数据
  await store.set('key1', 'value1', '数据1');
  await store.set('key2', 'value2', '数据2');
  await store.set('key3', 'value3', '数据3');

  console.log('✅ 数据已添加');

  // 备份到文件
  const backupPath = '/tmp/secure-store-backup.json';
  await store.backup(backupPath);
  console.log(`✅ 备份已保存到: ${backupPath}`);

  // 清空存储
  await store.clear();
  console.log('✅ 存储已清空');

  // 从备份恢复
  await store.restore(backupPath);
  console.log('✅ 从备份恢复成功');

  // 验证恢复的数据
  console.log(`恢复后的存储项数量: ${store.count()}`);

  // 清理备份文件
  const fs = await import('fs/promises');
  await fs.unlink(backupPath);
  console.log(`✅ 备份文件已删除`);
}

// ============================================
// 示例 5: 合并恢复
// ============================================
export async function example5_MergeRestore() {
  console.log('\n🔄 示例 5: 合并恢复\n');

  const store = createSecureStore({
    useKeytar: false,
    enableEncryption: false
  });

  // 添加现有数据
  await store.set('key1', 'old_value1', '旧数据1');
  await store.set('key2', 'old_value2', '旧数据2');
  console.log('✅ 现有数据已添加');

  // 创建备份文件
  const backupPath = '/tmp/merge-backup.json';
  const fs = await import('fs/promises');
  const backupData = [
    { key: 'key1', value: 'new_value1', description: '新数据1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { key: 'key3', value: 'value3', description: '数据3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];
  await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`✅ 备份文件已创建: ${backupPath}`);

  // 合并恢复
  await store.restore(backupPath, true);
  console.log('✅ 合并恢复成功');

  // 查看结果
  const value1 = await store.get('key1');
  const value2 = await store.get('key2');
  const value3 = await store.get('key3');

  console.log(`\nkey1 (应被更新): ${value1}`);
  console.log(`key2 (应保留): ${value2}`);
  console.log(`key3 (应新增): ${value3}`);

  // 清理
  await fs.unlink(backupPath);
}

// ============================================
// 示例 6: 存储项管理
// ============================================
export async function example6_ItemManagement() {
  console.log('\n📋 示例 6: 存储项管理\n');

  const store = createSecureStore({
    useKeytar: false,
    enableEncryption: false
  });

  // 添加多个存储项
  await store.set('config1', 'value1', '配置1');
  await store.set('config2', 'value2', '配置2');
  await store.set('config3', 'value3', '配置3');

  console.log('✅ 存储项已添加');

  // 获取所有键名
  const keys = store.keys();
  console.log('\n所有键名:');
  keys.forEach((key, index) => {
    console.log(`  ${index + 1}. ${key}`);
  });

  // 获取存储项数量
  const count = store.count();
  console.log(`\n存储项数量: ${count}`);

  // 更新描述
  await store.updateDescription('config1', '这是更新后的配置1描述');
  const item = store.getItem('config1');
  console.log(`\nconfig1的新描述: ${item.description}`);

  // 导出数据 (不包含敏感值)
  const exported = store.export();
  console.log('\n导出的数据:');
  exported.forEach(item => {
    console.log(`  ${item.key}: ${item.description} (有值: ${item.hasValue})`);
  });
}

// ============================================
// 示例 7: 错误处理
// ============================================
export async function example7_ErrorHandling() {
  console.log('\n⚠️  示例 7: 错误处理\n');

  const store = createSecureStore({
    useKeytar: false,
    enableEncryption: false
  });

  // 尝试添加无效数据
  try {
    await store.set('', 'value');
  } catch (error) {
    console.log(`✅ 捕获到错误: ${error.message}`);
  }

  // 尝试获取不存在的键
  const value = await store.get('non_existent_key');
  console.log(`不存在键的值: ${value}`);

  // 尝试删除不存在的键
  const deleted = await store.delete('non_existent_key');
  console.log(`删除不存在的键: ${deleted}`);

  // 尝试更新不存在键的描述
  try {
    await store.updateDescription('non_existent_key', '描述');
  } catch (error) {
    console.log(`✅ 捕获到错误: ${error.message}`);
  }

  // 尝试设置空密码
  try {
    store.setPassword('');
  } catch (error) {
    console.log(`✅ 捕获到错误: ${error.message}`);
  }
}

// ============================================
// 示例 8: 多提供商API Key管理
// ============================================
export async function example8_MultiProviderKeys() {
  console.log('\n🌐 示例 8: 多提供商API Key管理\n');

  const store = createSecureStore({
    useKeytar: false,
    enableEncryption: false
  });

  const apiKeyManager = createAPIKeyManager(store);

  // 为不同提供商添加API Key
  await apiKeyManager.addKey('production', 'sk-openai-prod', 'openai');
  await apiKeyManager.addKey('production', 'sk-ant-prod', 'anthropic');
  await apiKeyManager.addKey('production', 'sk-google-prod', 'google');
  await apiKeyManager.addKey('development', 'sk-openai-dev', 'openai');
  await apiKeyManager.addKey('development', 'sk-ant-dev', 'anthropic');

  console.log('✅ 多提供商API Key已添加');

  // 列出所有API Key
  const keys = apiKeyManager.listKeys();
  console.log(`\n总共 ${keys.length} 个API Key:`);
  keys.forEach((key, index) => {
    console.log(`  ${index + 1}. ${key.provider}/${key.name} - ${key.description}`);
  });

  // 按提供商获取Key
  const openaiProd = await apiKeyManager.getKey('production', 'openai');
  const anthropicProd = await apiKeyManager.getKey('production', 'anthropic');

  console.log(`\nOpenAI生产Key: ${openaiProd.substring(0, 15)}...`);
  console.log(`Anthropic生产Key: ${anthropicProd.substring(0, 15)}...`);
}

// ============================================
// 示例 9: 全局存储实例
// ============================================
export async function example9_GlobalStoreInstance() {
  console.log('\n🌍 示例 9: 全局存储实例\n');

  // 获取全局存储实例
  const store1 = getSecureStore();
  const store2 = getSecureStore();

  console.log(`store1 === store2: ${store1 === store2}`);

  // 在store1中添加数据
  await store1.set('global_key', 'global_value', '全局数据');
  console.log('✅ 在store1中添加了数据');

  // 在store2中获取数据
  const value = await store2.get('global_key');
  console.log(`在store2中获取数据: ${value}`);

  // 清空全局存储
  await store1.clear();
  console.log('✅ 全局存储已清空');
}

// ============================================
// 示例 10: 实际应用场景
// ============================================
export async function example10_RealWorldUsage() {
  console.log('\n🎯 示例 10: 实际应用场景\n');

  const store = createSecureStore({
    password: 'app_password_123',
    enableEncryption: true,
    useKeytar: false
  });

  const apiKeyManager = createAPIKeyManager(store);

  // 场景1: 用户首次设置
  console.log('\n📝 场景1: 用户首次设置');
  await apiKeyManager.addKey('main', 'sk-1234567890', 'openai');
  console.log('✅ API Key已保存');

  // 场景2: 应用启动时验证
  console.log('\n🔍 场景2: 应用启动时验证');
  const apiKey = await apiKeyManager.getKey('main', 'openai');
  if (apiKey) {
    console.log('✅ API Key验证成功，应用可以正常使用');
  } else {
    console.log('❌ API Key不存在，需要用户设置');
  }

  // 场景3: 更新API Key
  console.log('\n🔄 场景3: 更新API Key');
  await apiKeyManager.deleteKey('main', 'openai');
  await apiKeyManager.addKey('main', 'sk-newkey987654', 'openai');
  console.log('✅ API Key已更新');

  // 场景4: 定期备份
  console.log('\n💾 场景4: 定期备份');
  const backupPath = '/tmp/app-backup.json';
  await store.backup(backupPath);
  console.log(`✅ 备份已保存: ${backupPath}`);

  // 场景5: 查看管理界面
  console.log('\n📊 场景5: 查看管理界面');
  const keys = apiKeyManager.listKeys();
  console.log('当前配置的API Key:');
  console.log(formatAPIKeyList(keys));

  // 清理
  const fs = await import('fs/promises');
  try {
    await fs.unlink(backupPath);
    console.log('✅ 备份文件已清理');
  } catch (error) {
    // 忽略文件不存在的错误
  }
}

// ============================================
// 运行所有示例
// ============================================
export async function runAllExamples() {
  console.log('🚀 开始运行安全存储模块示例\n');
  console.log('=' .repeat(60));

  try {
    await example1_BasicUsage();
    await example2_APIKeyManagement();
    await example3_EncryptedStorage();
    await example4_BackupAndRestore();
    await example5_MergeRestore();
    await example6_ItemManagement();
    await example7_ErrorHandling();
    await example8_MultiProviderKeys();
    await example9_GlobalStoreInstance();
    await example10_RealWorldUsage();

    console.log('\n' + '=' .repeat(60));
    console.log('✅ 所有示例运行完成!\n');
  } catch (error) {
    console.error('\n❌ 示例运行失败:', error);
  }
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
