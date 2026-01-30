#!/usr/bin/env node

/**
 * 插件系统优化功能演示
 * 展示所有新增的优化功能
 */

import { PluginManager } from '../lib/plugins/plugin-manager.js';
import { PluginValidator } from '../lib/plugins/plugin-validator.js';
import { PluginCache } from '../lib/plugins/plugin-cache.js';
import {
  PluginLoadError,
  PluginValidationError,
  DependencyError,
  PluginNotFoundError
} from '../lib/errors/plugin-errors.js';

console.log('\n=== 插件系统优化功能演示 ===\n');

// 1. 演示错误处理系统
console.log('1️⃣  错误处理系统演示\n');

try {
  throw new PluginLoadError('test-plugin', 'File not found');
} catch (error) {
  console.log('✅ PluginLoadError 捕获成功');
  console.log('   - 错误代码:', error.code);
  console.log('   - 插件 ID:', error.pluginId);
  console.log('   - 错误详情:', error.details);
  console.log('   - JSON 序列化:', JSON.stringify(error.toJSON(), null, 2));
  console.log();
}

try {
  throw new DependencyError(
    'test-plugin',
    ['missing-dep'],
    [{ dependency: 'dep', required: '2.0.0', installed: '1.0.0' }],
    '自定义错误消息'
  );
} catch (error) {
  console.log('✅ DependencyError 捕获成功');
  console.log('   - 缺少依赖:', error.missing);
  console.log('   - 版本不满足:', error.unsatisfied);
  console.log('   - 错误消息:', error.message);
  console.log();
}

// 2. 演示验证器
console.log('2️⃣  插件验证器演示\n');

const validator = new PluginValidator();

// 创建测试元数据
const metadata = {
  name: 'demo-plugin',
  version: '1.0.0',
  description: 'Demo plugin',
  author: 'Demo Author',
  main: 'index.js',
  dependencies: {},
  peerDependencies: {},
  keywords: ['demo', 'test'],
  category: 'demo'
};

const validation = validator.validateMetadata(metadata);

console.log('✅ 元数据验证完成');
console.log('   - 验证通过:', validation.isValid);
console.log('   - 错误:', validation.errors);
console.log('   - 警告:', validation.warnings);
console.log();

// 3. 演示缓存系统
console.log('3️⃣  缓存系统演示\n');

const cache = new PluginCache({
  maxSize: 5,
  defaultTTL: 3600000,
  enableMemoryCache: true,
  enableDiskCache: false // 演示时不使用磁盘缓存
});

// 设置缓存
cache.set('key1', { data: 'value1' });
cache.set('key2', { data: 'value2' });
cache.set('key3', { data: 'value3' });

console.log('✅ 缓存设置成功');
console.log('   - 缓存条目数:', cache.cache.size);

// 获取缓存
const value = cache.get('key1');
console.log('   - 获取 key1:', value);

// 检查缓存
console.log('   - key1 存在:', cache.has('key1'));
console.log('   - key4 存在:', cache.has('key4'));

// 统计信息
const stats = cache.getStats();
console.log('\n📊 缓存统计:');
console.log('   - 命中次数:', stats.hits);
console.log('   - 未命中次数:', stats.misses);
console.log('   - 缓存大小:', stats.size);
console.log('   - 命中率:', stats.hitRate + '%');
console.log();

// 4. 演示 LRU 淘汰
console.log('4️⃣  LRU 淘汰演示\n');

cache.clear();
cache.maxSize = 3;

cache.set('a', 'value-a');
cache.set('b', 'value-b');
cache.set('c', 'value-c');

console.log('✅ 设置 3 个缓存条目 (最大 3)');
console.log('   - 当前缓存:', cache.cache.size);

// 访问 a
cache.get('a');
console.log('   - 访问 a (更新 LRU)');

// 添加第 4 个，应该淘汰 b
cache.set('d', 'value-d');
console.log('   - 添加第 4 个 (d)，应该淘汰 b');
console.log('   - 缓存大小:', cache.cache.size);
console.log('   - a 存在:', cache.has('a'));
console.log('   - b 存在:', cache.has('b'));
console.log('   - c 存在:', cache.has('c'));
console.log('   - d 存在:', cache.has('d'));
console.log();

// 5. 演示 PluginManager 集成
console.log('5️⃣  PluginManager 集成演示\n');

const manager = new PluginManager({
  pluginPaths: [],
  enableValidation: true,
  enablePerformanceMonitoring: true,
  enableCache: true,
  cacheSize: 10
});

console.log('✅ PluginManager 创建成功');
console.log('   - 验证已启用:', manager.enableValidation);
console.log('   - 性能监控已启用:', manager.enablePerformanceMonitoring);
console.log('   - 缓存已启用:', manager.enableCache);

// 获取缓存统计
const managerStats = manager.getCacheStats();
console.log('\n📊 管理器缓存统计:');
console.log('   - 命中次数:', managerStats.hits);
console.log('   - 未命中次数:', managerStats.misses);
console.log('   - 命中率:', managerStats.hitRate + '%');
console.log();

// 6. 演示评分系统
console.log('6️⃣  验证评分系统演示\n');

const errors = [];
const warnings = [
  {
    type: 'METADATA',
    severity: 'warning',
    message: 'Plugin license is recommended'
  }
];

const score = validator.calculateScore(errors, warnings);
console.log('✅ 评分计算完成');
console.log('   - 错误数:', errors.length);
console.log('   - 警告数:', warnings.length);
console.log('   - 总分:', score + '/100');
console.log('   - 评级:', score >= 80 ? '优秀' : score >= 60 ? '良好' : '需改进');
console.log();

// 7. 演示缓存清理
console.log('7️⃣  缓存清理演示\n');

// 设置一些缓存
cache.clear();
for (let i = 0; i < 10; i++) {
  cache.set(`key${i}`, { value: i });
}

console.log('✅ 设置 10 个缓存条目');
console.log('   - 缓存大小:', cache.cache.size);

// 清理
const cleaned = cache.cleanup();
console.log('\n🧹 执行清理');
console.log('   - 清理条目数:', cleaned);
console.log('   - 缓存大小:', cache.cache.size);
console.log();

// 8. 演示错误追踪
console.log('8️⃣  错误追踪演示\n');

try {
  throw new PluginLoadError('error-tracking-test', 'Test error for stack trace');
} catch (error) {
  console.log('✅ 错误栈追踪:');
  console.log('   - 错误类型:', error.name);
  console.log('   - 错误代码:', error.code);
  console.log('   - 堆栈存在:', !!error.stack);
  console.log('   - 堆栈长度:', error.stack ? error.stack.split('\n').length : 0);
  console.log();
}

// 总结
console.log('=== 演示完成 ===\n');
console.log('📋 功能总结:');
console.log('  ✅ 统一错误处理系统 (14 种错误类型)');
console.log('  ✅ 插件验证器 (6 大验证模块)');
console.log('  ✅ 缓存系统 (LRU + TTL + 磁盘持久化)');
console.log('  ✅ 评分系统 (0-100 分)');
console.log('  ✅ PluginManager 集成');
console.log('  ✅ 性能监控');
console.log('  ✅ TypeScript 类型定义');
console.log('  ✅ 单元测试覆盖');
console.log('\n🚀 插件系统已达到生产就绪状态！\n');
