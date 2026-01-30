#!/usr/bin/env node

/**
 * 插件系统新功能演示
 * 展示依赖管理、版本控制、性能监控等功能
 */

import { PluginManager } from '../lib/plugins/plugin-manager.js';
import { logger } from '../lib/utils/logger.js';
import path from 'path';

async function demo() {
  console.log('\n🚀 插件系统新功能演示\n');

  // 初始化插件管理器
  const pluginManager = new PluginManager({
    pluginPaths: [path.join(process.cwd(), 'plugins')],
    autoLoad: false
  });

  // 初始化子系统
  console.log('📦 初始化子系统...\n');
  await pluginManager.dependencyManager.loadDependencies();
  await pluginManager.marketplace.loadLocalRegistry();
  await pluginManager.versionManager.initialize();
  await pluginManager.performanceMonitor.initialize();

  // 扫描插件
  console.log('🔍 扫描插件...\n');
  const discovered = await pluginManager.scanPlugins();
  console.log(`发现 ${discovered.length} 个插件\n`);

  // 加载所有插件
  console.log('⚡ 加载插件...\n');
  for (const pluginId of discovered) {
    try {
      await pluginManager.load(pluginId);
      console.log(`✅ 已加载: ${pluginId}`);
    } catch (error) {
      console.log(`❌ 加载失败: ${pluginId} - ${error.message}`);
    }
  }

  // 演示 1: 依赖管理
  console.log('\n--- 演示 1: 依赖管理 ---\n');

  pluginManager.dependencyManager.buildDependencyGraph(discovered);
  const cycleCheck = pluginManager.dependencyManager.checkCircularDependencies();

  console.log(`循环依赖检查: ${cycleCheck.hasCycle ? '❌ 发现循环依赖' : '✅ 无循环依赖'}`);
  if (cycleCheck.hasCycle) {
    console.log(`循环路径: ${cycleCheck.cycle.join(' -> ')}`);
  }

  const loadOrder = pluginManager.dependencyManager.resolveLoadOrder();
  console.log(`推荐加载顺序: ${loadOrder.join(' -> ')}\n`);

  // 检查每个插件的依赖
  for (const pluginId of discovered) {
    const check = pluginManager.dependencyManager.checkDependencies(pluginId);
    if (check.missing.length > 0 || check.unsatisfied.length > 0) {
      console.log(`⚠️  ${pluginId}:`);
      if (check.missing.length > 0) {
        console.log(`   缺少依赖: ${check.missing.join(', ')}`);
      }
      if (check.unsatisfied.length > 0) {
        console.log(`   版本不满足:`);
        check.unsatisfied.forEach(u => {
          console.log(`     ${u.dependency}: 需要 ${u.required}, 当前 ${u.installed}`);
        });
      }
    }
  }

  // 演示 2: 版本控制
  console.log('\n--- 演示 2: 版本控制 ---\n');

  for (const pluginId of discovered) {
    const plugin = pluginManager.plugins.get(pluginId);
    if (plugin) {
      const version = plugin.metadata.version;

      console.log(`📌 ${pluginId} (版本 ${version})`);

      // 记录版本
      const backup = await pluginManager.versionManager.recordVersion(pluginId, version);
      console.log(`   ✅ 已创建备份: ${backup.id}`);
      console.log(`   📁 备份路径: ${backup.path}`);
      console.log(`   🔒 哈希: ${backup.hash.substring(0, 16)}...\n`);

      // 检查兼容性
      const compat = pluginManager.versionManager.checkCompatibility(
        plugin.metadata,
        '2.3.5'
      );
      console.log(`   兼容性: ${compat.compatible ? '✅ 兼容' : '❌ 不兼容'}`);
      console.log(`   系统版本: ${compat.currentVersion}`);
      console.log(`   要求范围: ${compat.minVersion} - ${compat.maxVersion}\n`);
    }
  }

  // 演示 3: 性能监控
  console.log('--- 演示 3: 性能监控 ---\n');

  // 模拟一些操作
  console.log('🔄 模拟插件操作...\n');

  for (const pluginId of discovered) {
    const plugin = pluginManager.plugins.get(pluginId);
    if (plugin && plugin.commands) {
      for (const [cmdName, cmd] of Object.entries(plugin.commands)) {
        // 记录操作
        pluginManager.performanceMonitor.recordMetric(
          pluginId,
          cmdName,
          Math.random() * 100 + 10,
          { success: true }
        );
      }
    }
  }

  // 模拟一些错误
  pluginManager.performanceMonitor.recordError(
    'test-plugin',
    'test-operation',
    new Error('测试错误')
  );

  console.log('✅ 已记录性能数据\n');

  // 获取性能报告
  const report = pluginManager.performanceMonitor.getPerformanceReport();

  console.log('📊 性能报告:\n');
  console.log(`   总插件数: ${report.totalPlugins}`);
  console.log(`   总操作数: ${report.totalOperations}`);
  console.log(`   总错误数: ${report.totalErrors}`);
  console.log(`   总耗时: ${Math.round(report.totalDuration / 1000)}s\n`);

  console.log('🏆 操作最多的插件:\n');
  report.topPluginsByOperations.slice(0, 5).forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.pluginId}: ${m.operationCount} 次操作`);
  });

  if (report.slowOperations.length > 0) {
    console.log('\n🐌 慢操作 (平均耗时 > 1s):\n');
    report.slowOperations.slice(0, 5).forEach((op, i) => {
      console.log(`   ${i + 1}. ${op.pluginId}::${op.operation}`);
      console.log(`      平均: ${Math.round(op.avgDuration)}ms, 最大: ${Math.round(op.maxDuration)}ms`);
    });
  }

  // 演示 4: 依赖树
  console.log('\n--- 演示 4: 依赖树 ---\n');

  for (const pluginId of discovered) {
    const tree = pluginManager.dependencyManager.getDependencyTree(pluginId);
    if (Object.keys(tree).length > 0) {
      console.log(`📂 ${pluginId} 的依赖树:`);
      console.log(JSON.stringify(tree, null, 2).split('\n').map(l => '   ' + l).join('\n') + '\n');
    }
  }

  // 演示 5: 市场功能
  console.log('--- 演示 5: 插件市场 ---\n');

  // 模拟搜索
  const searchResults = pluginManager.marketplace.searchPlugins('翻译');
  console.log(`🔍 搜索 "翻译" (找到 ${searchResults.length} 个结果):\n`);
  searchResults.slice(0, 3).forEach(plugin => {
    console.log(`   • ${plugin.name}`);
    console.log(`     描述: ${plugin.description.substring(0, 50)}...`);
    console.log(`     分类: ${plugin.category}`);
    console.log(`     下载: ${plugin.downloads || 0} 次\n`);
  });

  // 演示 6: 报告导出
  console.log('--- 演示 6: 报告导出 ---\n');

  const reportText = await pluginManager.performanceMonitor.exportReport('text');
  console.log('📄 性能报告 (文本格式):\n');
  console.log(reportText);

  // 演示 7: 日志查看
  console.log('\n--- 演示 7: 日志查看 ---\n');

  const errorLogs = pluginManager.performanceMonitor.getLogs(null, 'error', 5);
  console.log(`❌ 错误日志 (${errorLogs.length} 条):\n`);
  errorLogs.forEach(log => {
    console.log(`   [${log.timestamp}] ${log.pluginId}`);
    console.log(`   操作: ${log.operation}`);
    console.log(`   错误: ${log.error}\n`);
  });

  // 演示 8: 安全卸载检查
  console.log('--- 演示 8: 安全卸载检查 ---\n');

  for (const pluginId of discovered) {
    const check = pluginManager.dependencyManager.canSafelyUnload(pluginId);
    console.log(`${pluginId}:`);
    console.log(`   可安全卸载: ${check.canUnload ? '✅ 是' : '❌ 否'}`);
    if (check.dependents.length > 0) {
      console.log(`   被以下插件依赖: ${check.dependents.join(', ')}`);
    }
    console.log();
  }

  // 总结
  console.log('\n🎉 演示完成！\n');
  console.log('📚 总结:\n');
  console.log('✅ 依赖管理系统 - 检测循环依赖，自动解析加载顺序');
  console.log('✅ 版本控制系统 - 自动备份，安全恢复，兼容性检查');
  console.log('✅ 性能监控系统 - 追踪操作，分析热点，生成报告');
  console.log('✅ 插件市场系统 - 搜索插件，分类浏览，安装更新\n');

  console.log('🔧 生成的配置文件:\n');
  console.log('   .xzchat-dependencies.json       # 依赖配置');
  console.log('   .xzchat-registry.json           # 插件注册表');
  console.log('   .xzchat-plugin-versions.json    # 版本信息');
  console.log('   .xzchat-plugin-metrics.json     # 性能指标');
  console.log('   .xzchat-plugin-logs.json        # 运行日志');
  console.log('   .xzchat-plugin-backups/         # 备份目录\n');

  console.log('💡 下一步:\n');
  console.log('   1. 查看 docs/PLUGINS_OPTIMIZATION_SUMMARY.md 了解详细功能');
  console.log('   2. 查看每个子系统的 API 文档');
  console.log('   3. 开发自己的插件并使用这些高级功能\n');
}

// 运行演示
demo().catch(console.error);
