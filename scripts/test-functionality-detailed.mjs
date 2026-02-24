#!/usr/bin/env node

/**
 * 功能深度测试脚本
 * 检查每个命令的具体功能是否可用
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 详细测试的命令列表
const commands = [
  { name: '/ask', file: 'bin/commands/ask.js', util: 'lib/utils/ask.js', category: 'P0' },
  { name: '/secret', file: 'bin/commands/secret.js', util: 'lib/utils/secret.js', category: 'P0' },
  { name: '/audit', file: 'bin/commands/audit.js', util: 'lib/utils/audit.js', category: 'P0' },
  { name: '/review', file: 'bin/commands/review.js', util: 'lib/utils/review.js', category: 'P0' },
  { name: '/notification', file: 'bin/commands/notification.js', util: 'lib/utils/notification.js', category: 'P0' },
  { name: '/docker', file: 'bin/commands/docker.js', util: 'lib/utils/docker.js', category: 'P1' },
  { name: '/k8s', file: 'bin/commands/k8s.js', util: 'lib/utils/k8s.js', category: 'P1' },
  { name: '/ci-cd', file: 'bin/commands/ci-cd.js', util: 'lib/utils/ci-cd.js', category: 'P1' },
  { name: '/integration', file: 'bin/commands/integration.js', util: 'lib/utils/integration.js', category: 'P1' },
  { name: '/pipeline', file: 'bin/commands/pipeline.js', util: 'lib/utils/pipeline.js', category: 'P1' },
  { name: '/webhook', file: 'bin/commands/webhook.js', util: 'lib/utils/webhook.js', category: 'P1' },
];

function analyzeImplementation(filePath) {
  if (!existsSync(filePath)) {
    return {
      exists: false,
      hasDataStore: false,
      hasExternalAPI: false,
      hasMockDelay: false,
      issues: ['文件不存在']
    };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');

    return {
      exists: true,
      hasDataStore: /class\s+\w+Manager|Map\(.*\)|new\s+Map\(\)/.test(content),
      hasExternalAPI: /fetch\(|axios|execSync|spawn|child_process|http\.request/.test(content),
      hasMockDelay: /setTimeout.*\d+\s*\)|await new Promise.*setTimeout/.test(content),
      hasTODO: /TODO|FIXME|NotImplemented/i.test(content),
      issues: []
    };
  } catch (error) {
    return {
      exists: false,
      hasDataStore: false,
      hasExternalAPI: false,
      hasMockDelay: false,
      issues: [`读取失败: ${error.message}`]
    };
  }
}

function testCommand(cmd) {
  const commandPath = join(projectRoot, cmd.file);
  const utilPath = join(projectRoot, cmd.util);

  const commandAnalysis = analyzeImplementation(commandPath);
  const utilAnalysis = analyzeImplementation(utilPath);

  let status = 'FUNCTIONAL';
  let issues = [];

  // 检查文件存在性
  if (!commandAnalysis.exists || !utilAnalysis.exists) {
    status = 'MISSING';
    issues.push('命令或工具文件不存在');
    return { ...cmd, status, issues };
  }

  // 检查是否有真实API调用
  if (!commandAnalysis.hasExternalAPI && !utilAnalysis.hasExternalAPI) {
    status = 'MOCK_ONLY';
    issues.push('仅使用模拟延时，无真实API调用');
  }

  // 检查是否有TODO标记
  if (commandAnalysis.hasTODO || utilAnalysis.hasTODO) {
    if (status === 'FUNCTIONAL') {
      status = 'PARTIAL';
    }
    issues.push('存在TODO/FIXME标记');
  }

  // 检查数据存储
  if (!commandAnalysis.hasDataStore && !utilAnalysis.hasDataStore) {
    if (status === 'FUNCTIONAL') {
      status = 'PARTIAL';
    }
    issues.push('缺少数据持久化');
  }

  return {
    ...cmd,
    status,
    issues,
    hasDataStore: commandAnalysis.hasDataStore || utilAnalysis.hasDataStore,
    hasExternalAPI: commandAnalysis.hasExternalAPI || utilAnalysis.hasExternalAPI,
    hasMockDelay: commandAnalysis.hasMockDelay || utilAnalysis.hasMockDelay
  };
}

function printReport(results) {
  console.log('\n🔍 xzChat 功能深度测试报告\n');
  console.log('=' .repeat(100));

  const p0Results = results.filter(r => r.category === 'P0');
  const p1Results = results.filter(r => r.category === 'P1');

  // P0 报告
  console.log('\n🔴 P0 - 核心功能详细分析\n');
  printDetailedCategory(p0Results);

  // P1 报告
  console.log('\n🟡 P1 - 高优先级功能详细分析\n');
  printDetailedCategory(p1Results);

  // 统计
  const stats = {
    total: results.length,
    functional: results.filter(r => r.status === 'FUNCTIONAL').length,
    partial: results.filter(r => r.status === 'PARTIAL').length,
    mockOnly: results.filter(r => r.status === 'MOCK_ONLY').length,
    missing: results.filter(r => r.status === 'MISSING').length,
  };

  console.log('\n' + '='.repeat(100));
  console.log('\n📊 统计摘要\n');
  console.log(`  总计:         ${stats.total} 个命令`);
  console.log(`  ✅ 完全可用:   ${stats.functional} 个 (${((stats.functional/stats.total)*100).toFixed(1)}%)`);
  console.log(`  🔶 部分可用:   ${stats.partial} 个 (${((stats.partial/stats.total)*100).toFixed(1)}%)`);
  console.log(`  ⚠️  仅模拟:     ${stats.mockOnly} 个 (${((stats.mockOnly/stats.total)*100).toFixed(1)}%)`);
  console.log(`  ❌ 缺失:       ${stats.missing} 个`);

  console.log('\n💡 修复建议:\n');

  const mockOnlyCmds = results.filter(r => r.status === 'MOCK_ONLY');
  if (mockOnlyCmds.length > 0) {
    console.log('  需要补充真实API调用的命令:');
    mockOnlyCmds.forEach(cmd => {
      console.log(`    - ${cmd.name}: ${cmd.issues.join(', ')}`);
    });
  }

  const partialCmds = results.filter(r => r.status === 'PARTIAL');
  if (partialCmds.length > 0) {
    console.log('\n  需要完善的部分实现命令:');
    partialCmds.forEach(cmd => {
      console.log(`    - ${cmd.name}: ${cmd.issues.join(', ')}`);
    });
  }

  console.log('\n' + '='.repeat(100) + '\n');
}

function printDetailedCategory(results) {
  if (results.length === 0) {
    console.log('  (无命令)\n');
    return;
  }

  results.forEach(result => {
    const statusConfig = {
      'FUNCTIONAL': { icon: '✅', color: '可用', desc: '功能完整，数据持久化，真实API' },
      'PARTIAL': { icon: '🔶', color: '部分', desc: '基本可用，但存在TODO或缺失数据存储' },
      'MOCK_ONLY': { icon: '⚠️', color: '模拟', desc: '仅模拟实现，无真实API调用' },
      'MISSING': { icon: '❌', color: '缺失', desc: '文件不存在' }
    }[result.status];

    console.log(`  ${statusConfig.icon} ${result.name.padEnd(20)}`);
    console.log(`     状态: ${statusConfig.desc}`);
    console.log(`     文件: ${result.file} + ${result.util}`);

    if (result.issues.length > 0) {
      console.log(`     问题: ${result.issues.map(i => `• ${i}`).join('\n          ')}`);
    }

    if (result.hasDataStore) {
      console.log(`     ✓ 有数据持久化`);
    }
    if (result.hasExternalAPI) {
      console.log(`     ✓ 有真实API调用`);
    }
    if (result.hasMockDelay) {
      console.log(`     ⚠ 使用模拟延时`);
    }

    console.log('');
  });
}

// 主函数
function main() {
  const results = commands.map(testCommand);
  printReport(results);

  const hasIssues = results.some(r =>
    r.status !== 'FUNCTIONAL'
  );

  process.exit(hasIssues ? 1 : 0);
}

main();
