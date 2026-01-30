#!/usr/bin/env node

/**
 * 插件自动化测试脚本（修复版）
 * 测试所有插件的功能是否正常
 */

import { PluginManager } from './lib/plugins/plugin-manager.js';
import { logger } from './lib/utils/logger.js';
import path from 'path';

// 模拟 confirm 函数
global.confirm = () => false;

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  plugins: {}
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function printSuccess(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function printError(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function printSkip(msg) {
  console.log(`${colors.yellow}⊘${colors.reset} ${msg}`);
}

function printInfo(msg) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function printHeader(msg) {
  console.log(`\n${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${msg}${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);
}

/**
 * 测试插件加载
 */
async function testPluginLoad(manager, pluginName) {
  printInfo(`测试加载插件: ${pluginName}`);
  try {
    const loaded = await manager.loadPluginByName(pluginName);
    if (loaded) {
      printSuccess(`插件 ${pluginName} 加载成功`);
      testResults.plugins[pluginName].load = true;
      testResults.passed++;
      return true;
    } else {
      printError(`插件 ${pluginName} 加载失败`);
      testResults.plugins[pluginName].load = false;
      testResults.failed++;
      testResults.errors.push(`${pluginName}: 加载失败`);
      return false;
    }
  } catch (error) {
    printError(`插件 ${pluginName} 加载异常: ${error.message}`);
    testResults.plugins[pluginName].load = false;
    testResults.failed++;
    testResults.errors.push(`${pluginName}: ${error.message}`);
    return false;
  }
}

/**
 * 测试插件命令
 */
async function testPluginCommands(manager, pluginName) {
  printInfo(`测试 ${pluginName} 的命令`);
  const plugin = manager.plugins.get(pluginName);

  if (!plugin || !plugin.instance || !plugin.instance.commands) {
    printError(`插件 ${pluginName} 没有可测试的命令`);
    testResults.plugins[pluginName].commands = {};
    return;
  }

  testResults.plugins[pluginName].commands = {};

  for (const [cmd, config] of Object.entries(plugin.instance.commands)) {
    try {
      printInfo(`  测试命令: ${cmd}`);
      let testArgs = '';
      let expectedResult = 'success';

      // 根据命令类型准备测试参数
      switch (cmd) {
        case '/note':
          testArgs = '测试笔记 #test';
          break;
        case '/note-search':
          testArgs = 'test';
          break;
        case '/note-delete':
          testArgs = '999999';
          expectedResult = 'error'; // 不存在的ID
          break;
        case '/note-import':
          testArgs = '/nonexistent/file.txt';
          expectedResult = 'error';
          break;
        case '/note-clear':
          testArgs = '';
          expectedResult = 'info'; // 预期返回取消信息
          break;
        case '/calc':
          testArgs = '1 + 1';
          break;
        case '/calc-var':
          testArgs = 'x = 10';
          break;
        case '/timer':
          testArgs = '5';
          break;
        case '/weather':
          testArgs = '北京';
          break;
        case '/translate':
          testArgs = 'en:zh Hello World';
          break;
        case '/search':
        case '/google':
        case '/bing':
        case '/duckduckgo':
        case '/github':
        case '/stack':
          testArgs = 'JavaScript';
          break;
        case '/demo-dep':
        case '/demo-version':
        case '/demo-perf':
          expectedResult = 'error'; // 需要子系统
          break;
        default:
          testArgs = '';
      }

      // 执行命令
      const result = await config.handler(testArgs);

      // 检查结果
      const hasError = result && result.error;
      const hasSuccess = result && result.success;
      const hasMessage = result && result.message;

      if (hasError && expectedResult === 'error') {
        printSuccess(`  ${cmd} - 返回预期错误`);
        testResults.plugins[pluginName].commands[cmd] = true;
        testResults.passed++;
      } else if (hasError && expectedResult === 'info') {
        printSuccess(`  ${cmd} - 返回预期信息`);
        testResults.plugins[pluginName].commands[cmd] = true;
        testResults.passed++;
      } else if (hasSuccess || hasMessage || !hasError) {
        printSuccess(`  ${cmd} - 执行成功`);
        testResults.plugins[pluginName].commands[cmd] = true;
        testResults.passed++;
      } else {
        printError(`  ${cmd} - 执行失败: ${result?.error || '未知错误'}`);
        testResults.plugins[pluginName].commands[cmd] = false;
        testResults.failed++;
        testResults.errors.push(`${pluginName}.${cmd}: ${result?.error || '未知错误'}`);
      }
    } catch (error) {
      printError(`  ${cmd} - 执行异常: ${error.message}`);
      testResults.plugins[pluginName].commands[cmd] = false;
      testResults.failed++;
      testResults.errors.push(`${pluginName}.${cmd}: ${error.message}`);
    }
  }
}

/**
 * 测试插件卸载
 */
async function testPluginUnload(manager, pluginName) {
  printInfo(`测试卸载插件: ${pluginName}`);
  try {
    const plugin = manager.plugins.get(pluginName);
    if (!plugin) {
      printError(`插件 ${pluginName} 未加载，无法卸载`);
      testResults.plugins[pluginName].unload = false;
      testResults.failed++;
      return false;
    }

    const unloaded = await plugin.unload();
    manager.plugins.delete(pluginName);

    if (unloaded) {
      printSuccess(`插件 ${pluginName} 卸载成功`);
      testResults.plugins[pluginName].unload = true;
      testResults.passed++;
      return true;
    } else {
      printError(`插件 ${pluginName} 卸载失败`);
      testResults.plugins[pluginName].unload = false;
      testResults.failed++;
      return false;
    }
  } catch (error) {
    printError(`插件 ${pluginName} 卸载异常: ${error.message}`);
    testResults.plugins[pluginName].unload = false;
    testResults.failed++;
    return false;
  }
}

/**
 * 测试所有插件
 */
async function testAllPlugins() {
  printHeader('插件自动化测试开始（修复版）');

  // 初始化插件管理器
  const pluginDir = path.join(process.cwd(), 'plugins');
  const manager = new PluginManager({
    pluginPaths: [pluginDir],
    logger
  });

  printInfo(`插件目录: ${pluginDir}`);

  // 扫描插件
  const discovered = await manager.scanPlugins();
  const pluginNames = discovered.map(p => p.metadata.name);
  printInfo(`发现 ${discovered.length} 个插件: ${pluginNames.join(', ')}`);

  if (discovered.length === 0) {
    printError('未发现任何插件');
    return;
  }

  // 测试每个插件的基本功能
  for (const pluginInfo of discovered) {
    const pluginName = pluginInfo.metadata.name;
    testResults.plugins[pluginName] = {};

    printHeader(`测试插件: ${pluginName}`);

    // 加载插件
    const loadSuccess = await testPluginLoad(manager, pluginName);

    if (!loadSuccess) {
      continue;
    }

    // 测试命令
    await testPluginCommands(manager, pluginName);

    // 卸载插件
    await testPluginUnload(manager, pluginName);
  }

  // 打印测试报告
  printTestReport();
}

/**
 * 打印测试报告
 */
function printTestReport() {
  printHeader('测试报告');

  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : 0;

  console.log(`总测试数: ${total}`);
  console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}跳过: ${testResults.skipped}${colors.reset}`);
  console.log(`通过率: ${colors.magenta}${passRate}%${colors.reset}\n`);

  if (testResults.failed > 0) {
    console.log(`${colors.red}失败详情:${colors.reset}\n`);
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
  }

  // 插件测试详情
  console.log(`${colors.cyan}插件测试详情:${colors.reset}\n`);
  Object.entries(testResults.plugins).forEach(([pluginName, results]) => {
    const cmdStatus = results.commands ? Object.values(results.commands).every(v => v === true) : true;
    const allPassed = (results.load !== false) && (results.unload !== false) && cmdStatus;
    const status = allPassed ? '✓' : '✗';
    const statusColor = allPassed ? colors.green : colors.red;
    
    console.log(`${statusColor}${status}${colors.reset} ${pluginName}`);
    if (results.load !== undefined) {
      console.log(`    加载: ${results.load ? '✓' : '✗'}`);
    }
    if (results.unload !== undefined) {
      console.log(`    卸载: ${results.unload ? '✓' : '✗'}`);
    }
    if (results.commands) {
      const passedCmds = Object.values(results.commands).filter(v => v === true).length;
      const totalCmds = Object.values(results.commands).length;
      console.log(`    命令: ${passedCmds}/${totalCmds} 通过`);
    }
  });

  console.log('');
}

// 运行测试
testAllPlugins().catch(error => {
  printError(`测试过程中发生错误: ${error.message}`);
  console.error(error);
  process.exit(1);
});
