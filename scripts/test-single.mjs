#!/usr/bin/env node
/**
 * 单个测试运行器 - 测试指定的测试文件
 */

const testFile = process.argv[2] || 'tests/unit/errors.test.js';

import { execSync } from 'child_process';

try {
  console.log(`🧪 运行测试: ${testFile}\n`);
  execSync(`npx vitest run ${testFile}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('\n✅ 测试完成');
} catch (error) {
  console.error(`\n❌ 测试失败: ${error.message}`);
  process.exit(1);
}
