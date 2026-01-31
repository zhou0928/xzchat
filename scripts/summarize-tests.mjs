#!/usr/bin/env node
/**
 * 测试摘要脚本 - 统计测试结果
 */

import { execSync } from 'child_process';

try {
  const output = execSync('npx vitest run --reporter=basic 2>&1', {
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  const lines = output.split('\n');

  // 查找测试文件行的模式
  const testFileLines = lines.filter(line => line.includes('tests/') && line.includes('tests)'));

  console.log('\n📊 测试结果摘要\n' + '='.repeat(60));

  let totalTestFiles = 0;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  testFileLines.forEach(line => {
    // 提取文件名
    const match = line.match(/tests\/[^>]+>/);
    if (match) {
      const fileName = match[0].replace('tests/', '');
      const testsMatch = line.match(/\((\d+)\s*tests/);
      const failedMatch = line.match(/(\d+)\s*failed/);

      if (testsMatch) {
        const numTests = parseInt(testsMatch[1]);
        const numFailed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const numPassed = numTests - numFailed;
        const passRate = Math.round((numPassed / numTests) * 100);

        totalTestFiles++;
        totalTests += numTests;
        totalPassed += numPassed;
        totalFailed += numFailed;

        const icon = numFailed === 0 ? '✅' : numFailed < numTests ? '⚠️' : '❌';
        console.log(`${icon} ${fileName.padEnd(40)} ${numPassed.toString().padStart(3)}/${numTests} passed (${passRate}%)`);
      }
    }
  });

  console.log('='.repeat(60));
  console.log(`总计: ${totalTestFiles} 个测试文件`);
  console.log(`      ${totalPassed}/${totalTests} 测试通过 (${Math.round(totalPassed/totalTests*100)}%)`);
  console.log(`      ${totalFailed} 测试失败\n`);

  process.exit(totalFailed > 0 ? 1 : 0);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
