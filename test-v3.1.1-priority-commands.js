#!/usr/bin/env node
/**
 * 测试V3.1.1高优先级命令
 * settings, preference, migration
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [
  { name: 'settings', file: 'bin/commands/settings.js', testArgs: 'help', key: 'theme' },
  { name: 'preference', file: 'bin/commands/preference.js', testArgs: 'help', key: 'recent' },
  { name: 'migration', file: 'bin/commands/migration.js', testArgs: 'help', key: 'status' }
];

const utils = [
  'lib/utils/settings.js',
  'lib/utils/preference.js',
  'lib/utils/migration.js'
];

console.log('🚀 测试V3.1.1高优先级命令...\n');

// 测试工具库
console.log('📦 测试工具库...');
let utilsPassed = 0;
for (const util of utils) {
  try {
    execSync(`node --check ${util}`, { encoding: 'utf-8' });
    console.log(`  ✅ ${util}`);
    utilsPassed++;
  } catch (error) {
    console.log(`  ❌ ${util} - ${error.message}`);
  }
}

// 测试命令文件
console.log('\n📝 测试命令文件...');
let commandsPassed = 0;
for (const cmd of commands) {
  try {
    execSync(`node --check ${cmd.file}`, { encoding: 'utf-8' });
    console.log(`  ✅ ${cmd.file}`);
    commandsPassed++;
  } catch (error) {
    console.log(`  ❌ ${cmd.file} - ${error.message}`);
  }
}

// 测试导入
console.log('\n🔧 测试模块导入...');
let importPassed = 0;
for (const util of utils) {
  try {
    const modulePath = path.join(__dirname, util);
    await import(modulePath);
    console.log(`  ✅ ${util}`);
    importPassed++;
  } catch (error) {
    console.log(`  ❌ ${util} - ${error.message}`);
  }
}

// 测试命令执行
console.log('\n⚡ 测试命令执行...');
let execPassed = 0;
for (const cmd of commands) {
  try {
    const modulePath = path.join(__dirname, cmd.file);
    const module = await import(modulePath);
    await module.handle(cmd.testArgs.split(' '), {
      logger: { error: () => {} }
    });
    console.log(`  ✅ ${cmd.name}`);
    execPassed++;
  } catch (error) {
    console.log(`  ❌ ${cmd.name} - ${error.message}`);
  }
}

// 总结
console.log('\n' + '='.repeat(60));
console.log('📊 测试总结');
console.log('='.repeat(60));
console.log(`工具库: ${utilsPassed}/${utils.length}`);
console.log(`命令文件: ${commandsPassed}/${commands.length}`);
console.log(`模块导入: ${importPassed}/${utils.length}`);
console.log(`命令执行: ${execPassed}/${commands.length}`);
console.log('='.repeat(60));

const totalPassed = utilsPassed + commandsPassed + importPassed + execPassed;
const totalTests = utils.length + commands.length + utils.length + commands.length;
const passRate = ((totalPassed / totalTests) * 100).toFixed(2);

console.log(`\n通过率: ${passRate}% (${totalPassed}/${totalTests})`);

if (passRate === '100.00') {
  console.log('\n🎉 V3.1.1高优先级命令测试通过!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  存在 ${totalTests - totalPassed} 个失败\n`);
  process.exit(1);
}
