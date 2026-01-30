/**
 * 插件管理命令
 * 提供插件的加载、启用、禁用、列表等功能
 */

import { logger } from '../../lib/utils/logger.js';
import { PluginManager } from '../../lib/plugins/plugin-manager.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pluginManager = null;

/**
 * 初始化插件管理器
 */
function initPluginManager() {
  if (!pluginManager) {
    const pluginsDir = path.join(__dirname, '../../plugins');
    const packagePath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

    pluginManager = new PluginManager({
      pluginPaths: [pluginsDir],
      autoLoad: false, // 不自动加载，让用户手动控制
      enableValidation: true,
      enablePerformanceMonitoring: true,
      enableCache: true,
      context: {
        logger,
        version: packageJson.version || '1.0.0'
      }
    });
  }
  return pluginManager;
}

/**
 * 处理插件命令
 */
export async function handlePlugin(args) {
  const manager = initPluginManager();

  if (args.length === 0) {
    return showPluginHelp();
  }

  const subcommand = args[0].toLowerCase();
  const pluginArgs = args.slice(1);

  switch (subcommand) {
    case 'list':
    case 'ls':
      return await handleListPlugins(manager);
    case 'load':
      return await handleLoadPlugin(manager, pluginArgs);
    case 'unload':
      return await handleUnloadPlugin(manager, pluginArgs);
    case 'enable':
      return await handleEnablePlugin(manager, pluginArgs);
    case 'disable':
      return await handleDisablePlugin(manager, pluginArgs);
    case 'info':
      return await handlePluginInfo(manager, pluginArgs);
    case 'scan':
      return await handleScanPlugins(manager);
    case 'reload':
      return await handleReloadPlugin(manager, pluginArgs);
    case 'validate':
      return await handleValidatePlugin(manager, pluginArgs);
    case 'marketplace':
      return await handleMarketplace(manager, pluginArgs);
    case 'install':
      return await handleInstallPlugin(manager, pluginArgs);
    case 'search':
      return await handleSearchPlugin(manager, pluginArgs);
    case 'update':
      return await handleUpdatePlugin(manager, pluginArgs);
    case 'uninstall':
      return await handleUninstallPlugin(manager, pluginArgs);
    case 'performance':
      return await handlePerformance(manager, pluginArgs);
    case 'cache':
      return await handleCache(manager, pluginArgs);
    case 'deps':
    case 'dependencies':
      return await handleDependencies(manager, pluginArgs);
    case 'history':
      return await handleHistory(manager, pluginArgs);
    case 'restore':
      return await handleRestore(manager, pluginArgs);
    default:
      console.log(`❌ 未知的插件子命令: ${subcommand}`);
      return showPluginHelp();
  }
}

/**
 * 显示插件帮助
 */
function showPluginHelp() {
  console.log(`
🔌 插件管理命令

用法: /plugin <subcommand> [options]

基础子命令:
  list, ls              列出所有插件
  load <name>           加载插件
  unload <name>         卸载插件
  enable <name>         启用插件
  disable <name>        禁用插件
  info <name>           显示插件详细信息
  scan                  扫描插件目录
  reload <name>         重新加载插件

高级子命令:
  validate <name>       验证插件代码质量
  marketplace           访问插件市场
  install <name>        从市场安装插件
  search <keyword>      搜索插件
  update <name>         更新插件
  uninstall <name>      卸载并删除插件

性能与缓存:
  performance            查看插件性能统计
  cache [clear|stats]   管理插件缓存
  deps <name>            查看插件依赖关系
  history <name>        查看插件版本历史
  restore <name> <ver>  恢复插件版本

示例:
  /plugin list
  /plugin load example-timer
  /plugin enable example-timer
  /plugin info example-timer
  /plugin validate example-timer
  /plugin marketplace
  /plugin performance
  /plugin cache stats

  `);
}

/**
 * 列出所有插件
 */
async function handleListPlugins(manager) {
  const loadedPlugins = manager.getAllPlugins();

  // 如果没有加载的插件，先扫描显示可用插件
  if (loadedPlugins.length === 0) {
    console.log('\n🔍 没有已加载的插件，正在扫描可用插件...\n');

    try {
      const discovered = await manager.scanPlugins();

      if (discovered.length === 0) {
        console.log('📦 没有找到任何插件');
        console.log('\n💡 提示: 请确保 plugins 目录下有包含 package.json 的插件目录');
        return;
      }

      console.log(`✅ 发现 ${discovered.length} 个可用插件:\n`);

      discovered.forEach(({ metadata }) => {
        console.log(`  📦 ${metadata.name}`);
        console.log(`     版本: ${metadata.version}`);
        console.log(`     描述: ${metadata.description}`);
        if (metadata.author) {
          console.log(`     作者: ${metadata.author}`);
        }
        console.log(`     状态: ⚪ 未加载`);
        console.log('');
      });

      console.log(`总计: ${discovered.length} 个可用插件\n`);
      console.log('💡 使用 /plugin load <name> 加载插件');
      console.log('💡 使用 /plugin enable <name> 启用插件\n');
    } catch (error) {
      console.log(`❌ 扫描插件失败:`, error.message);
    }
    return;
  }

  // 显示已加载的插件
  console.log('\n📦 已加载插件列表:\n');

  loadedPlugins.forEach(plugin => {
    const statusEmoji = {
      loaded: '✅',
      enabled: '🟢',
      disabled: '⏸️',
      error: '❌',
      unloaded: '⚪'
    }[plugin.status] || '❓';

    console.log(`  ${statusEmoji} ${plugin.metadata.name}`);
    console.log(`     版本: ${plugin.metadata.version}`);
    console.log(`     描述: ${plugin.metadata.description}`);
    console.log(`     状态: ${plugin.status}`);
    if (plugin.metadata.author) {
      console.log(`     作者: ${plugin.metadata.author}`);
    }
    console.log('');
  });

  console.log(`总计: ${loadedPlugins.length} 个已加载插件\n`);
}

/**
 * 加载插件
 */
async function handleLoadPlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要加载的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`📦 正在加载插件: ${pluginName}...`);

  try {
    const success = await manager.loadPluginByName(pluginName);
    if (success) {
      console.log(`✅ 插件 ${pluginName} 加载成功`);
    } else {
      console.log(`⚠️ 插件 ${pluginName} 已加载`);
    }
  } catch (error) {
    if (error.message.includes('already loaded')) {
      console.log(`⚠️ 插件 ${pluginName} 已加载`);
    } else {
      console.log(`❌ 加载插件失败:`, error.message);
    }
  }
}

/**
 * 卸载插件
 */
async function handleUnloadPlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要卸载的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`🗑️ 正在卸载插件: ${pluginName}...`);

  try {
    const success = await manager.unloadPlugin(pluginName);
    if (success) {
      console.log(`✅ 插件 ${pluginName} 卸载成功`);
    } else {
      console.log(`⚠️ 插件 ${pluginName} 未找到或已卸载`);
    }
  } catch (error) {
    console.log(`❌ 卸载插件失败:`, error.message);
  }
}

/**
 * 启用插件
 */
async function handleEnablePlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要启用的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`🟢 正在启用插件: ${pluginName}...`);

  try {
    // 检查插件是否已加载
    let plugin = manager.getPlugin(pluginName);

    if (!plugin) {
      console.log(`📦 插件 ${pluginName} 未加载，正在加载...`);

      // 加载插件
      try {
        await manager.loadPluginByName(pluginName);
      } catch (error) {
        if (error.message.includes('not found')) {
          console.log(`❌ 未找到插件: ${pluginName}`);
          console.log(`💡 提示: 使用 /plugin list 查看可用插件`);
          return;
        }
        throw error;
      }

      plugin = manager.getPlugin(pluginName);
      if (!plugin) {
        console.log(`❌ 插件加载后仍未在管理器中找到: ${pluginName}`);
        return;
      }

      console.log(`✅ 插件 ${pluginName} 加载成功`);
    }

    const success = await manager.enablePlugin(pluginName);
    if (success) {
      console.log(`✅ 插件 ${pluginName} 启用成功`);
      // 显示插件提供的命令
      plugin = manager.getPlugin(pluginName);
      if (plugin && plugin.instance && plugin.instance.commands) {
        const commands = Object.keys(plugin.instance.commands);
        if (commands.length > 0) {
          console.log(`\n📋 可用命令:`);
          commands.forEach(cmd => {
            const cmdInfo = plugin.instance.commands[cmd];
            console.log(`   ${cmd} - ${cmdInfo.description || ''}`);
          });
          console.log('');
        }
      }
    } else {
      console.log(`⚠️ 插件 ${pluginName} 未找到或已启用`);
    }
  } catch (error) {
    console.log(`❌ 启用插件失败:`, error.message);
  }
}

/**
 * 禁用插件
 */
async function handleDisablePlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要禁用的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`⏸️  正在禁用插件: ${pluginName}...`);

  try {
    // 检查插件是否已加载
    const plugin = manager.getPlugin(pluginName);

    if (!plugin) {
      console.log(`⚠️ 插件 ${pluginName} 未加载，无需禁用`);
      return;
    }

    const success = await manager.disablePlugin(pluginName);
    if (success) {
      console.log(`✅ 插件 ${pluginName} 禁用成功`);
    } else {
      console.log(`⚠️ 插件 ${pluginName} 未找到或已禁用`);
    }
  } catch (error) {
    console.log(`❌ 禁用插件失败:`, error.message);
  }
}

/**
 * 显示插件详细信息
 */
async function handlePluginInfo(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要查看的插件名称');
    return;
  }

  const pluginName = args[0];
  const plugin = manager.getPlugin(pluginName);

  if (!plugin) {
    console.log(`❌ 未找到插件: ${pluginName}`);
    return;
  }

  console.log(`\n📦 插件详情: ${pluginName}\n`);
  console.log(`  名称: ${plugin.metadata.name}`);
  console.log(`  版本: ${plugin.metadata.version}`);
  console.log(`  描述: ${plugin.metadata.description}`);
  console.log(`  作者: ${plugin.metadata.author || '未知'}`);
  console.log(`  许可证: ${plugin.metadata.license || '未知'}`);
  console.log(`  分类: ${plugin.metadata.category || '通用'}`);
  console.log(`  状态: ${plugin.status}`);
  console.log(`  路径: ${plugin.path}`);

  if (plugin.metadata.dependencies && Object.keys(plugin.metadata.dependencies).length > 0) {
    console.log(`  依赖: ${Object.keys(plugin.metadata.dependencies).join(', ')}`);
  }

  if (plugin.metadata.keywords && plugin.metadata.keywords.length > 0) {
    console.log(`  关键词: ${plugin.metadata.keywords.join(', ')}`);
  }

  // 显示插件命令
  if (plugin.instance && plugin.instance.commands) {
    const commands = Object.entries(plugin.instance.commands);
    if (commands.length > 0) {
      console.log(`\n  📋 提供的命令:`);
      commands.forEach(([cmd, cmdInfo]) => {
        console.log(`     ${cmd}`);
        console.log(`        描述: ${cmdInfo.description || '无'}`);
        console.log(`        用法: ${cmdInfo.usage || '无'}`);
        console.log(`        分类: ${cmdInfo.category || 'general'}`);
      });
    }
  }

  // 显示插件钩子
  if (plugin.instance && plugin.instance.hooks) {
    const hooks = Object.keys(plugin.instance.hooks);
    if (hooks.length > 0) {
      console.log(`\n  🪝 注册的钩子:`);
      hooks.forEach(hook => {
        console.log(`     ${hook}`);
      });
    }
  }

  if (plugin.enabledAt) {
    console.log(`\n  启用时间: ${new Date(plugin.enabledAt).toLocaleString()}`);
  }

  console.log('');
}

/**
 * 扫描插件目录
 */
async function handleScanPlugins(manager) {
  console.log('🔍 正在扫描插件目录...\n');

  try {
    const plugins = await manager.discoverPlugins();

    if (plugins.length === 0) {
      console.log('📦 未发现任何插件');
      return;
    }

    console.log(`✅ 发现 ${plugins.length} 个插件:\n`);

    plugins.forEach(metadata => {
      console.log(`  📦 ${metadata.name}`);
      console.log(`     版本: ${metadata.version}`);
      console.log(`     描述: ${metadata.description}`);
      console.log('');
    });

    // 询问是否自动加载
    console.log('提示: 使用 /plugin load <name> 加载插件');
    console.log('提示: 使用 /plugin enable <name> 启用插件\n');

  } catch (error) {
    console.log(`❌ 扫描插件失败:`, error.message);
  }
}

/**
 * 重新加载插件
 */
async function handleReloadPlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要重新加载的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`🔄 正在重新加载插件: ${pluginName}...`);

  try {
    // 先卸载
    await manager.disablePlugin(pluginName);
    await manager.unloadPlugin(pluginName);

    // 再加载并启用
    await manager.loadPlugin(pluginName);
    await manager.enablePlugin(pluginName);

    console.log(`✅ 插件 ${pluginName} 重新加载成功`);
  } catch (error) {
    console.log(`❌ 重新加载插件失败:`, error.message);
  }
}

/**
 * 验证插件
 */
async function handleValidatePlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要验证的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`🔍 正在验证插件: ${pluginName}...\n`);

  try {
    const plugin = manager.getPlugin(pluginName);
    if (!plugin) {
      console.log(`❌ 未找到插件: ${pluginName}`);
      return;
    }

    const report = await manager.validator.validate(plugin.path, plugin.metadata);

    console.log(`✅ 验证完成: ${pluginName}`);
    console.log(`\n📊 验证报告:`);
    console.log(`  总分: ${report.score}/100`);
    console.log(`  状态: ${report.valid ? '✅ 通过' : '❌ 未通过'}`);

    if (report.errors && report.errors.length > 0) {
      console.log(`\n❌ 错误 (${report.errors.length}):`);
      report.errors.forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error}`);
      });
    }

    if (report.warnings && report.warnings.length > 0) {
      console.log(`\n⚠️  警告 (${report.warnings.length}):`);
      report.warnings.forEach((warning, idx) => {
        console.log(`  ${idx + 1}. ${warning}`);
      });
    }

    if (report.modules) {
      console.log(`\n📋 验证模块:`);
      Object.entries(report.modules).forEach(([module, result]) => {
        const status = result.valid ? '✅' : '❌';
        console.log(`  ${status} ${module}: ${result.score || 'N/A'}`);
      });
    }
  } catch (error) {
    console.log(`❌ 验证插件失败:`, error.message);
  }
}

/**
 * 插件市场
 */
async function handleMarketplace(manager, args) {
  console.log(`🛒 插件市场\n`);

  try {
    const action = args[0] || 'list';

    switch (action) {
      case 'list':
        const plugins = await manager.marketplace.listPlugins();
        console.log(`\n📦 可用插件 (${plugins.length}):\n`);
        plugins.forEach(plugin => {
          console.log(`  📦 ${plugin.name} v${plugin.version}`);
          console.log(`     ${plugin.description}`);
          if (plugin.author) console.log(`     作者: ${plugin.author}`);
          if (plugin.rating) console.log(`     评分: ${plugin.rating} ⭐`);
          if (plugin.downloads) console.log(`     下载: ${plugin.downloads}`);
          console.log('');
        });
        break;

      case 'search':
        if (args.length < 2) {
          console.log('❌ 请指定搜索关键词');
          return;
        }
        const keyword = args.slice(1).join(' ');
        const results = await manager.marketplace.search(keyword);
        console.log(`\n🔍 搜索结果 "${keyword}" (${results.length}):\n`);
        results.forEach(plugin => {
          console.log(`  📦 ${plugin.name} v${plugin.version}`);
          console.log(`     ${plugin.description}`);
          console.log('');
        });
        break;

      case 'popular':
        const popular = await manager.marketplace.getPopularPlugins();
        console.log(`\n🔥 热门插件:\n`);
        popular.forEach((plugin, idx) => {
          console.log(`  ${idx + 1}. ${plugin.name} v${plugin.version}`);
          console.log(`     下载: ${plugin.downloads} | 评分: ${plugin.rating}`);
          console.log('');
        });
        break;

      default:
        console.log('❌ 未知的操作，可用操作: list, search, popular');
    }

    console.log('💡 提示: 使用 /plugin install <name> 安装插件');
  } catch (error) {
    console.log(`❌ 插件市场操作失败:`, error.message);
  }
}

/**
 * 安装插件
 */
async function handleInstallPlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要安装的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`📥 正在安装插件: ${pluginName}...`);

  try {
    const result = await manager.marketplace.install(pluginName);
    if (result.success) {
      console.log(`✅ 插件 ${pluginName} 安装成功`);
      console.log(`📁 路径: ${result.path}`);
      console.log(`\n💡 提示: 使用 /plugin load ${pluginName} 加载插件`);
    } else {
      console.log(`❌ 安装失败: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ 安装插件失败:`, error.message);
  }
}

/**
 * 搜索插件
 */
async function handleSearchPlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定搜索关键词');
    return;
  }

  const keyword = args.join(' ');
  console.log(`🔍 正在搜索插件: ${keyword}...\n`);

  try {
    const results = await manager.marketplace.search(keyword);

    if (results.length === 0) {
      console.log('📦 未找到匹配的插件');
      return;
    }

    console.log(`✅ 找到 ${results.length} 个插件:\n`);
    results.forEach(plugin => {
      console.log(`  📦 ${plugin.name} v${plugin.version}`);
      console.log(`     ${plugin.description}`);
      if (plugin.author) console.log(`     作者: ${plugin.author}`);
      if (plugin.rating) console.log(`     评分: ${plugin.rating} ⭐`);
      console.log('');
    });
  } catch (error) {
    console.log(`❌ 搜索插件失败:`, error.message);
  }
}

/**
 * 更新插件
 */
async function handleUpdatePlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要更新的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`🔄 正在更新插件: ${pluginName}...`);

  try {
    const result = await manager.marketplace.update(pluginName);
    if (result.success) {
      console.log(`✅ 插件 ${pluginName} 更新成功`);
      console.log(`   旧版本: ${result.oldVersion}`);
      console.log(`   新版本: ${result.newVersion}`);
    } else {
      console.log(`❌ 更新失败: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ 更新插件失败:`, error.message);
  }
}

/**
 * 卸载插件
 */
async function handleUninstallPlugin(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定要卸载的插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`🗑️  正在卸载插件: ${pluginName}...`);

  try {
    await manager.disablePlugin(pluginName);
    await manager.unloadPlugin(pluginName);

    // 删除插件目录
    const pluginPath = manager.getPlugin(pluginName)?.path;
    if (pluginPath) {
      const fs = await import('node:fs');
      const path = await import('node:path');
      fs.rmSync(pluginPath, { recursive: true, force: true });
      console.log(`✅ 插件 ${pluginName} 已完全卸载`);
    } else {
      console.log(`⚠️ 插件 ${pluginName} 已卸载，但文件删除失败`);
    }
  } catch (error) {
    console.log(`❌ 卸载插件失败:`, error.message);
  }
}

/**
 * 性能统计
 */
async function handlePerformance(manager, args) {
  console.log(`📊 插件性能统计\n`);

  try {
    const plugins = manager.getAllPlugins();

    if (plugins.length === 0) {
      console.log('📦 没有找到任何插件');
      return;
    }

    console.log('插件性能概览:\n');
    plugins.forEach(plugin => {
      const metrics = manager.performanceMonitor.getPluginMetrics(plugin.metadata.name);
      if (metrics) {
        console.log(`  📦 ${plugin.metadata.name}`);
        console.log(`     调用次数: ${metrics.callCount}`);
        console.log(`     总耗时: ${metrics.totalTime}ms`);
        console.log(`     平均耗时: ${metrics.avgTime.toFixed(2)}ms`);
        console.log(`     错误数: ${metrics.errorCount}`);
        console.log('');
      }
    });

    const summary = manager.performanceMonitor.getSummary();
    console.log('总体统计:\n');
    console.log(`  总调用次数: ${summary.totalCalls}`);
    console.log(`  总耗时: ${summary.totalTime}ms`);
    console.log(`  平均耗时: ${summary.avgTime.toFixed(2)}ms`);
    console.log(`  错误率: ${summary.errorRate.toFixed(2)}%`);
  } catch (error) {
    console.log(`❌ 获取性能统计失败:`, error.message);
  }
}

/**
 * 缓存管理
 */
async function handleCache(manager, args) {
  const action = args[0] || 'stats';

  switch (action) {
    case 'stats':
      console.log(`📊 插件缓存统计\n`);
      try {
        const stats = await manager.getCacheStats();
        console.log(`  内存缓存:`);
        console.log(`     大小: ${stats.memorySize}/${stats.maxMemorySize}`);
        console.log(`     命中率: ${stats.memoryHitRate.toFixed(2)}%`);
        console.log(`  磁盘缓存:`);
        console.log(`     大小: ${stats.diskSize}`);
        console.log(`     命中率: ${stats.diskHitRate.toFixed(2)}%`);
      } catch (error) {
        console.log(`❌ 获取缓存统计失败:`, error.message);
      }
      break;

    case 'clear':
      console.log(`🧹 正在清理缓存...`);
      try {
        await manager.clearCache();
        console.log(`✅ 缓存已清理`);
      } catch (error) {
        console.log(`❌ 清理缓存失败:`, error.message);
      }
      break;

    default:
      console.log('❌ 未知的操作，可用操作: stats, clear');
  }
}

/**
 * 查看依赖关系
 */
async function handleDependencies(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`🔗 插件依赖关系: ${pluginName}\n`);

  try {
    const deps = await manager.dependencyManager.getDependencies(pluginName);

    console.log('依赖的插件:');
    deps.dependencies.forEach(dep => {
      const status = dep.installed ? '✅' : '❌';
      console.log(`  ${status} ${dep.name} ${dep.version} (需要: ${dep.requiredVersion})`);
    });

    if (deps.dependents && deps.dependents.length > 0) {
      console.log('\n依赖此插件的插件:');
      deps.dependents.forEach(dep => {
        console.log(`  ↗ ${dep.name}`);
      });
    }

    if (deps.hasCircular) {
      console.log('\n⚠️  警告: 检测到循环依赖');
    }
  } catch (error) {
    console.log(`❌ 获取依赖关系失败:`, error.message);
  }
}

/**
 * 查看版本历史
 */
async function handleHistory(manager, args) {
  if (args.length === 0) {
    console.log('❌ 请指定插件名称');
    return;
  }

  const pluginName = args[0];
  console.log(`📜 插件版本历史: ${pluginName}\n`);

  try {
    const history = await manager.versionManager.getVersionHistory(pluginName);

    if (history.length === 0) {
      console.log('📦 没有版本历史记录');
      return;
    }

    history.forEach((version, idx) => {
      const isCurrent = version.isCurrent ? '(当前)' : '';
      console.log(`  ${idx + 1}. ${version.version} ${isCurrent}`);
      console.log(`     时间: ${new Date(version.timestamp).toLocaleString()}`);
      console.log(`     SHA256: ${version.hash.substring(0, 16)}...`);
      if (version.backupPath) {
        console.log(`     备份: ${version.backupPath}`);
      }
      console.log('');
    });
  } catch (error) {
    console.log(`❌ 获取版本历史失败:`, error.message);
  }
}

/**
 * 恢复版本
 */
async function handleRestore(manager, args) {
  if (args.length < 2) {
    console.log('❌ 请指定插件名称和版本号');
    return;
  }

  const pluginName = args[0];
  const version = args[1];
  console.log(`🔄 正在恢复插件 ${pluginName} 到版本 ${version}...`);

  try {
    const result = await manager.versionManager.restore(pluginName, version);
    if (result.success) {
      console.log(`✅ 插件已恢复到版本 ${version}`);
    } else {
      console.log(`❌ 恢复失败: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ 恢复版本失败:`, error.message);
  }
}
