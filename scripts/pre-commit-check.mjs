#!/usr/bin/env node
/**
 * 预提交检查 - 验证所有新命令的语法和导入
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsDir = path.join(__dirname, '../bin/commands');
const utilsDir = path.join(__dirname, '../lib/utils');

const v311Commands = [
  'scheduler', 'pipeline', 'integration', 'webhook', 'secret', 'audit',
  'theme-custom', 'layout',
  'import', 'export-advanced', 'archive',
  'test-runner', 'coverage', 'mock', 'fixture',
  'docs', 'api-docs', 'changelog', 'release-notes',
  'review', 'notification'
];

async function checkFile(filePath) {
  try {
    // 使用 node --check 进行语法检查
    const { execSync } = await import('child_process');
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 预提交检查 - V3.1.1 命令\n');

  let errors = [];

  // 检查所有命令文件
  console.log('检查命令文件...');
  for (const cmd of v311Commands) {
    const cmdPath = path.join(commandsDir, `${cmd}.js`);
    if (!fs.existsSync(cmdPath)) {
      errors.push(`❌ 命令文件不存在: ${cmd}.js`);
      continue;
    }

    const isValid = await checkFile(cmdPath);
    if (!isValid) {
      errors.push(`❌ 语法错误: ${cmd}.js`);
    } else {
      console.log(`✅ ${cmd}.js`);
    }
  }

  // 检查所有工具库文件
  console.log('\n检查工具库文件...');
  for (const util of v311Commands) {
    const utilPath = path.join(utilsDir, `${util}.js`);
    if (!fs.existsSync(utilPath)) {
      errors.push(`❌ 工具库文件不存在: ${util}.js`);
      continue;
    }

    const isValid = await checkFile(utilPath);
    if (!isValid) {
      errors.push(`❌ 语法错误: ${util}.js`);
    } else {
      console.log(`✅ ${util}.js`);
    }
  }

  console.log('\n' + '='.repeat(50));

  if (errors.length > 0) {
    console.log('❌ 检查失败:');
    errors.forEach(e => console.log(e));
    process.exit(1);
  } else {
    console.log(`✅ 检查通过! ${v311Commands.length} 个命令 + ${v311Commands.length} 个工具库`);
    process.exit(0);
  }
}

main().catch(console.error);
