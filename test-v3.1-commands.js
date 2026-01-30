#!/usr/bin/env node
/**
 * V3.1.0 新命令测试脚本
 * 测试所有新增的命令模块
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 要测试的命令列表
const commands = [
  // AI/智能化功能
  { name: 'ask', file: 'bin/commands/ask.js', testArgs: 'help', expectedResult: '帮助' },
  { name: 'code-review', file: 'bin/commands/code-review.js', testArgs: 'help', expectedResult: '代码审查' },
  { name: 'summarize', file: 'bin/commands/summarize.js', testArgs: 'help', expectedResult: '文档摘要' },
  { name: 'explain', file: 'bin/commands/explain.js', testArgs: 'help', expectedResult: '代码解释' },

  // 开发工具增强
  { name: 'docker', file: 'bin/commands/docker.js', testArgs: 'help', expectedResult: 'Docker' },
  { name: 'k8s', file: 'bin/commands/k8s.js', testArgs: 'help', expectedResult: 'Kubernetes' },
  { name: 'ci-cd', file: 'bin/commands/ci-cd.js', testArgs: 'help', expectedResult: 'CI/CD' },
  { name: 'proxy', file: 'bin/commands/proxy.js', testArgs: 'help', expectedResult: '代理' },

  // 数据分析模块
  { name: 'metrics', file: 'bin/commands/metrics.js', testArgs: 'help', expectedResult: '性能指标' },
  { name: 'analyze', file: 'bin/commands/analyze.js', testArgs: 'help', expectedResult: '项目分析' }
];

// 对应的工具库
const utils = [
  'lib/utils/ask.js',
  'lib/utils/code-review.js',
  'lib/utils/summarize.js',
  'lib/utils/explain.js',
  'lib/utils/docker.js',
  'lib/utils/k8s.js',
  'lib/utils/ci-cd.js',
  'lib/utils/proxy.js',
  'lib/utils/metrics.js',
  'lib/utils/analyze.js',
  'lib/utils/profile.js',
  'lib/utils/benchmark.js'
];

console.log('🚀 开始测试 V3.1.0 新命令...\n');

// 测试工具库
console.log('📦 第一步: 检查工具库文件语法...');
let utilsPassed = 0;
let utilsFailed = 0;

for (const util of utils) {
  try {
    execSync(`node --check ${util}`, { encoding: 'utf-8' });
    console.log(`  ✅ ${util}`);
    utilsPassed++;
  } catch (error) {
    console.log(`  ❌ ${util} - ${error.message}`);
    utilsFailed++;
  }
}

console.log(`\n工具库测试: ${utilsPassed}/${utils.length} 通过\n`);

// 测试命令文件
console.log('📝 第二步: 检查命令文件语法...');
let commandsPassed = 0;
let commandsFailed = 0;

for (const cmd of commands) {
  try {
    execSync(`node --check ${cmd.file}`, { encoding: 'utf-8' });
    console.log(`  ✅ ${cmd.file}`);
    commandsPassed++;
  } catch (error) {
    console.log(`  ❌ ${cmd.file} - ${error.message}`);
    commandsFailed++;
  }
}

console.log(`\n命令文件测试: ${commandsPassed}/${commands.length} 通过\n`);

// 测试导入
console.log('🔧 第三步: 测试模块导入...');
let importPassed = 0;
let importFailed = 0;

for (const util of utils) {
  try {
    const modulePath = path.join(__dirname, util);
    const module = await import(modulePath);
    if (Object.keys(module).length > 0) {
      console.log(`  ✅ ${util} - 导出 ${Object.keys(module).length} 个对象`);
      importPassed++;
    } else {
      console.log(`  ⚠️  ${util} - 未导出任何对象`);
      importFailed++;
    }
  } catch (error) {
    console.log(`  ❌ ${util} - ${error.message}`);
    importFailed++;
  }
}

console.log(`\n模块导入测试: ${importPassed}/${utils.length} 通过\n`);

// 测试命令导出
console.log('📤 第四步: 测试命令导出...');
let cmdExportPassed = 0;
let cmdExportFailed = 0;

for (const cmd of commands) {
  try {
    const modulePath = path.join(__dirname, cmd.file);
    const module = await import(modulePath);
    if (module.handle && typeof module.handle === 'function') {
      console.log(`  ✅ ${cmd.name} - handle 函数存在`);
      cmdExportPassed++;
    } else {
      console.log(`  ❌ ${cmd.name} - 缺少 handle 函数`);
      cmdExportFailed++;
    }
  } catch (error) {
    console.log(`  ❌ ${cmd.name} - ${error.message}`);
    cmdExportFailed++;
  }
}

console.log(`\n命令导出测试: ${cmdExportPassed}/${commands.length} 通过\n`);

// 测试命令执行
console.log('⚡ 第五步: 测试命令执行...');
let execPassed = 0;
let execFailed = 0;

for (const cmd of commands) {
  try {
    // 模拟命令执行
    const modulePath = path.join(__dirname, cmd.file);
    const module = await import(modulePath);

    const mockContext = {
      logger: {
        error: () => {},
        info: () => {},
        warn: () => {},
        success: () => {}
      }
    };

    // 调用 help 命令
    const args = cmd.testArgs.split(' ');
    await module.handle(args, mockContext);

    console.log(`  ✅ ${cmd.name} - help 命令执行成功`);
    execPassed++;
  } catch (error) {
    console.log(`  ❌ ${cmd.name} - ${error.message}`);
    execFailed++;
  }
}

console.log(`\n命令执行测试: ${execPassed}/${commands.length} 通过\n`);

// 检查data目录
console.log('📁 第六步: 检查数据文件...');
const dataDir = path.join(__dirname, 'data');
try {
  await fs.mkdir(dataDir, { recursive: true });
  console.log(`  ✅ data 目录存在`);
} catch (error) {
  console.log(`  ❌ data 目录创建失败 - ${error.message}`);
}

// 总结
console.log('\n' + '='.repeat(60));
console.log('📊 测试总结');
console.log('='.repeat(60));
console.log(`工具库语法:  ${utilsPassed}/${utils.length} 通过 (${utilsFailed} 失败)`);
console.log(`命令文件语法:  ${commandsPassed}/${commands.length} 通过 (${commandsFailed} 失败)`);
console.log(`模块导入:  ${importPassed}/${utils.length} 通过 (${importFailed} 失败)`);
console.log(`命令导出:  ${cmdExportPassed}/${commands.length} 通过 (${cmdExportFailed} 失败)`);
console.log(`命令执行:  ${execPassed}/${commands.length} 通过 (${execFailed} 失败)`);
console.log('='.repeat(60));

const totalPassed = utilsPassed + commandsPassed + importPassed + cmdExportPassed + execPassed;
const totalTests = utils.length + commands.length + utils.length + commands.length + commands.length;
const passRate = ((totalPassed / totalTests) * 100).toFixed(2);

console.log(`\n总体通过率: ${passRate}% (${totalPassed}/${totalTests})`);

if (passRate === '100.00') {
  console.log('\n🎉 所有测试通过! V3.1.0 命令已就绪!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  存在 ${totalTests - totalPassed} 个失败的测试，请检查\n`);
  process.exit(1);
}
