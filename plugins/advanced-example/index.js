/**
 * 高级插件示例
 * 展示如何使用依赖管理、版本控制、性能监控等高级功能
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class AdvancedExamplePlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.commands = {
      '/demo-dep': {
        handler: this.handleDemoDependency.bind(this),
        description: '演示依赖管理',
        usage: '/demo-dep',
        category: 'demo'
      },
      '/demo-version': {
        handler: this.handleDemoVersion.bind(this),
        description: '演示版本控制',
        usage: '/demo-version',
        category: 'demo'
      },
      '/demo-perf': {
        handler: this.handleDemoPerformance.bind(this),
        description: '演示性能监控',
        usage: '/demo-perf',
        category: 'demo'
      },
      '/demo-all': {
        handler: this.handleDemoAll.bind(this),
        description: '演示所有功能',
        usage: '/demo-all',
        category: 'demo'
      }
    };
  }

  async onEnable(context) {
    this.context.logger.info('高级示例插件已启用');

    // 使用性能监控记录启用操作
    if (context.performanceMonitor) {
      context.performanceMonitor.recordMetric(
        this.metadata.id,
        'onEnable',
        10,
        { success: true }
      );
    }
  }

  async onDisable(context) {
    this.context.logger.info('高级示例插件已禁用');

    if (context.performanceMonitor) {
      context.performanceMonitor.recordMetric(
        this.metadata.id,
        'onDisable',
        5,
        { success: true }
      );
    }
  }

  /**
   * 演示依赖管理
   */
  async handleDemoDependency() {
    const depManager = this.context.dependencyManager;

    if (!depManager) {
      return { error: '依赖管理器未初始化' };
    }

    // 检查自己的依赖
    const check = depManager.checkDependencies(this.metadata.id);

    const message = `📦 依赖管理演示\n\n` +
      `插件 ID: ${this.metadata.id}\n` +
      `依赖检查: ${check.satisfied ? '✅ 满足' : '❌ 不满足'}\n\n`;

    if (check.missing.length > 0) {
      message += `缺少依赖:\n  ${check.missing.join('\n  ')}\n\n`;
    }

    if (check.unsatisfied.length > 0) {
      message += `版本不满足:\n`;
      check.unsatisfied.forEach(u => {
        message += `  ${u.dependency}: 需要 ${u.required}, 当前 ${u.installed}\n`;
      });
      message += '\n';
    }

    // 获取依赖树
    const tree = depManager.getDependencyTree(this.metadata.id);
    if (Object.keys(tree).length > 0) {
      message += `依赖树:\n${JSON.stringify(tree, null, 2).split('\n').map(l => '  ' + l).join('\n')}\n`;
    } else {
      message += `依赖树: 无\n`;
    }

    // 获取反向依赖
    const reverse = depManager.getReverseDependencies(this.metadata.id);
    message += `\n被以下插件依赖: ${reverse.length > 0 ? reverse.join(', ') : '无'}\n`;

    // 检查是否可以安全卸载
    const canUnload = depManager.canSafelyUnload(this.metadata.id);
    message += `\n可安全卸载: ${canUnload.canUnload ? '✅ 是' : '❌ 否'}`;

    return { success: true, message };
  }

  /**
   * 演示版本控制
   */
  async handleDemoVersion() {
    const versionManager = this.context.versionManager;

    if (!versionManager) {
      return { error: '版本管理器未初始化' };
    }

    const message = `📌 版本控制演示\n\n` +
      `插件版本: ${this.metadata.version}\n` +
      `系统版本: ${this.context.systemVersion || '未知'}\n\n`;

    // 检查兼容性
    const compat = versionManager.checkCompatibility(
      this.metadata,
      this.context.systemVersion || '2.3.5'
    );
    message += `兼容性检查: ${compat.compatible ? '✅ 兼容' : '❌ 不兼容'}\n`;
    message += `要求范围: ${compat.minVersion} - ${compat.maxVersion}\n`;
    message += `当前版本: ${compat.currentVersion}\n\n`;

    // 获取版本历史
    const history = versionManager.getVersionHistory(this.metadata.id);
    message += `版本历史 (${history.length} 个备份):\n`;
    history.slice(0, 5).forEach((h, i) => {
      message += `  ${i + 1}. ${h.version} (${new Date(h.timestamp).toLocaleString()})\n`;
      message += `     哈希: ${h.hash.substring(0, 16)}...\n`;
    });

    // 验证完整性
    const verify = await versionManager.verifyIntegrity(this.metadata.id);
    message += `\n完整性验证: ${verify.verified ? '✅ 通过' : '❌ 未通过'}\n`;
    if (!verify.verified) {
      message += `当前哈希: ${verify.currentHash}\n`;
      message += `备份哈希: ${verify.backupHash}\n`;
    }

    return { success: true, message };
  }

  /**
   * 演示性能监控
   */
  async handleDemoPerformance() {
    const perfMonitor = this.context.performanceMonitor;

    if (!perfMonitor) {
      return { error: '性能监控器未初始化' };
    }

    const message = `📊 性能监控演示\n\n`;

    // 模拟一些操作
    const operations = [
      { name: 'operation1', duration: 50 },
      { name: 'operation2', duration: 120 },
      { name: 'operation3', duration: 200 },
      { name: 'operation4', duration: 80 }
    ];

    for (const op of operations) {
      perfMonitor.recordMetric(
        this.metadata.id,
        op.name,
        op.duration,
        { success: true }
      );
    }

    // 获取指标
    const metrics = perfMonitor.getMetrics(this.metadata.id);
    if (metrics) {
      message += `总操作数: ${metrics.operationCount}\n`;
      message += `总错误数: ${metrics.errors}\n`;
      message += `总耗时: ${Math.round(metrics.totalDuration)}ms\n`;
      message += `平均耗时: ${Math.round(metrics.totalDuration / metrics.operationCount)}ms\n\n`;

      message += `操作详情:\n`;
      for (const [opName, opMetric] of Object.entries(metrics.operations)) {
        message += `  ${opName}:\n`;
        message += `    执行次数: ${opMetric.count}\n`;
        message += `    平均耗时: ${Math.round(opMetric.avgDuration)}ms\n`;
        message += `    最小耗时: ${opMetric.minDuration}ms\n`;
        message += `    最大耗时: ${opMetric.maxDuration}ms\n`;
      }
    } else {
      message += `暂无性能数据\n`;
    }

    // 添加一条日志
    perfMonitor.addLog(this.metadata.id, 'info', {
      message: '演示日志',
      demo: true
    });

    message += `\n✅ 已添加演示日志`;

    return { success: true, message };
  }

  /**
   * 演示所有功能
   */
  async handleDemoAll() {
    const results = [];

    // 依赖管理
    try {
      const dep = await this.handleDemoDependency();
      results.push('--- 依赖管理 ---\n' + dep.message);
    } catch (e) {
      results.push('--- 依赖管理 (错误) ---\n' + e.message);
    }

    // 版本控制
    try {
      const ver = await this.handleDemoVersion();
      results.push('\n--- 版本控制 ---\n' + ver.message);
    } catch (e) {
      results.push('\n--- 版本控制 (错误) ---\n' + e.message);
    }

    // 性能监控
    try {
      const perf = await this.handleDemoPerformance();
      results.push('\n--- 性能监控 ---\n' + perf.message);
    } catch (e) {
      results.push('\n--- 性能监控 (错误) ---\n' + e.message);
    }

    return {
      success: true,
      message: `🎉 高级插件功能演示\n\n${results.join('\n')}`
    };
  }
}
