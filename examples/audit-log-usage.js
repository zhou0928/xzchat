/**
 * @fileoverview 审计日志模块使用示例
 * @description 演示如何使用 audit-log 模块记录敏感操作
 */

import {
  createAuditLogger,
  getAuditLogger,
  auditLog,
  OperationType,
  AuditLevel,
  formatAuditEntry,
  formatAuditLogList,
  formatAuditStatistics
} from '../lib/utils/audit-log.js';

// ============================================
// 示例 1: 基础使用
// ============================================
export async function example1_BasicUsage() {
  console.log('\n📝 示例 1: 基础使用\n');

  const logger = createAuditLogger({
    logDir: '/tmp/audit-example'
  });

  // 记录API Key创建
  const entry1 = logger.log(
    OperationType.API_KEY_CREATE,
    '用户创建新的API Key'
  );
  console.log('✅ 记录API Key创建:', entry1.id);

  // 记录会话创建
  const entry2 = logger.log(
    OperationType.SESSION_CREATE,
    '用户创建新会话'
  );
  console.log('✅ 记录会话创建:', entry2.id);

  // 记录配置更新
  const entry3 = logger.log(
    OperationType.CONFIG_UPDATE,
    '用户更新配置'
  );
  console.log('✅ 记录配置更新:', entry3.id);
}

// ============================================
// 示例 2: 记录失败操作
// ============================================
export async function example2_FailedOperations() {
  console.log('\n❌ 示例 2: 记录失败操作\n');

  const logger = createAuditLogger();

  // 记录失败的API Key删除
  const entry1 = logger.log(
    OperationType.API_KEY_DELETE,
    '删除API Key失败',
    {
      level: AuditLevel.ERROR,
      success: false,
      errorMessage: 'API Key不存在',
      context: { keyId: 'non-existent-key' }
    }
  );
  console.log('✅ 记录失败操作:', entry1.id);

  // 记录失败的会话切换
  const entry2 = logger.log(
    OperationType.SESSION_SWITCH,
    '切换会话失败',
    {
      level: AuditLevel.WARNING,
      success: false,
      errorMessage: '会话ID无效',
      context: { sessionId: 'invalid-session-id' }
    }
  );
  console.log('✅ 记录警告操作:', entry2.id);
}

// ============================================
// 示例 3: 记录带用户信息的操作
// ============================================
export async function example3_UserInformation() {
  console.log('\n👤 示例 3: 记录带用户信息的操作\n');

  const logger = createAuditLogger();

  // 记录带用户信息的操作
  const entry1 = logger.log(
    OperationType.SECURITY_LOGIN,
    '用户登录',
    {
      userId: 'user123',
      sessionId: 'session456',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      context: { loginMethod: 'password' }
    }
  );
  console.log('✅ 记录用户登录:', entry1.id);

  const entry2 = logger.log(
    OperationType.SECURITY_PASSWORD_CHANGE,
    '用户修改密码',
    {
      userId: 'user123',
      ipAddress: '192.168.1.100',
      level: AuditLevel.WARNING,
      context: { previousPasswordChanged: true }
    }
  );
  console.log('✅ 记录密码修改:', entry2.id);
}

// ============================================
// 示例 4: 查询审计日志
// ============================================
export async function example4_QueryLogs() {
  console.log('\n🔍 示例 4: 查询审计日志\n');

  const logger = createAuditLogger();

  // 添加一些测试数据
  logger.log(OperationType.API_KEY_CREATE, '创建API Key', { userId: 'user1' });
  logger.log(OperationType.API_KEY_READ, '读取API Key', { userId: 'user1' });
  logger.log(OperationType.SESSION_CREATE, '创建会话', { userId: 'user2' });
  logger.log(OperationType.CONFIG_UPDATE, '更新配置', {
    level: AuditLevel.WARNING,
    success: false
  });

  // 查询所有日志
  const allLogs = logger.getAllLogs();
  console.log(`总日志数: ${allLogs.length}`);

  // 按操作类型查询
  const apiKeyLogs = logger.query({ operation: OperationType.API_KEY_CREATE });
  console.log(`API Key创建日志数: ${apiKeyLogs.length}`);

  // 按用户ID查询
  const user1Logs = logger.query({ userId: 'user1' });
  console.log(`用户1的日志数: ${user1Logs.length}`);

  // 查询失败的日志
  const failedLogs = logger.query({ success: false });
  console.log(`失败操作日志数: ${failedLogs.length}`);

  // 按级别查询
  const warningLogs = logger.query({ level: AuditLevel.WARNING });
  console.log(`警告级别日志数: ${warningLogs.length}`);
}

// ============================================
// 示例 5: 统计信息
// ============================================
export async function example5_Statistics() {
  console.log('\n📊 示例 5: 统计信息\n');

  const logger = createAuditLogger();

  // 添加测试数据
  logger.log(OperationType.API_KEY_CREATE, '创建API Key');
  logger.log(OperationType.API_KEY_CREATE, '创建另一个API Key');
  logger.log(OperationType.SESSION_CREATE, '创建会话');
  logger.log(OperationType.CONFIG_UPDATE, '更新配置', {
    level: AuditLevel.WARNING
  });
  logger.log(OperationType.API_KEY_DELETE, '删除API Key', {
    success: false,
    errorMessage: 'API Key不存在'
  });

  // 获取统计信息
  const stats = logger.getStatistics();

  console.log(`\n总日志数: ${stats.total}`);
  console.log(`\n按操作类型:`);
  for (const [op, count] of Object.entries(stats.byOperation)) {
    console.log(`  ${op}: ${count}`);
  }

  console.log(`\n按日志级别:`);
  for (const [level, count] of Object.entries(stats.byLevel)) {
    console.log(`  ${level}: ${count}`);
  }

  console.log(`\n按成功状态:`);
  console.log(`  成功: ${stats.bySuccess.true}`);
  console.log(`  失败: ${stats.bySuccess.false}`);
}

// ============================================
// 示例 6: 导出和导入
// ============================================
export async function example6_ExportAndImport() {
  console.log('\n💾 示例 6: 导出和导入\n');

  const logger = createAuditLogger();

  // 添加一些测试数据
  logger.log(OperationType.API_KEY_CREATE, '创建API Key');
  logger.log(OperationType.SESSION_CREATE, '创建会话');
  logger.log(OperationType.CONFIG_UPDATE, '更新配置');

  // 导出所有日志
  const exportPath = '/tmp/audit-export.json';
  const exportResult = logger.export(exportPath);
  console.log(`✅ 导出${exportResult ? '成功' : '失败'}: ${exportPath}`);

  // 导出带过滤条件的日志
  const filteredExportPath = '/tmp/audit-export-filtered.json';
  const filteredResult = logger.export(filteredExportPath, {
    operation: OperationType.API_KEY_CREATE
  });
  console.log(`✅ 导出过滤日志${filteredResult ? '成功' : '失败'}: ${filteredExportPath}`);

  // 导入日志
  const importPath = '/tmp/audit-import.json';
  const importResult = logger.import(exportPath);
  console.log(`✅ 导入${importResult ? '成功' : '失败'}: ${importPath}`);

  // 清理文件
  const fs = await import('fs/promises');
  try {
    await fs.unlink(exportPath);
    await fs.unlink(filteredExportPath);
  } catch (error) {
    // 忽略文件不存在的错误
  }
}

// ============================================
// 示例 7: 格式化输出
// ============================================
export async function example7_Formatting() {
  console.log('\n🎨 示例 7: 格式化输出\n');

  const logger = createAuditLogger();

  // 添加测试数据
  const entry1 = logger.log(OperationType.API_KEY_CREATE, '创建API Key');
  const entry2 = logger.log(OperationType.API_KEY_DELETE, '删除API Key失败', {
    level: AuditLevel.ERROR,
    success: false,
    errorMessage: 'API Key不存在'
  });

  // 格式化单个日志项
  console.log('\n单个日志项:');
  console.log(formatAuditEntry(entry1));

  console.log('\n失败的日志项:');
  console.log(formatAuditEntry(entry2));

  // 格式化日志列表
  const logs = logger.getRecentLogs(5);
  console.log('\n日志列表:');
  console.log(formatAuditLogList(loggs));

  // 格式化统计信息
  const stats = logger.getStatistics();
  console.log(formatAuditStatistics(stats));
}

// ============================================
// 示例 8: 快捷记录函数
// ============================================
export async function example8_QuickLog() {
  console.log('\n⚡ 示例 8: 快捷记录函数\n');

  // 使用快捷函数记录
  const entry1 = auditLog(OperationType.API_KEY_CREATE, '快捷记录API Key创建');
  console.log('✅ 快捷记录:', entry1.id);

  const entry2 = auditLog(
    OperationType.SESSION_DELETE,
    '快捷记录会话删除',
    {
      level: AuditLevel.WARNING,
      success: false,
      errorMessage: '会话不存在'
    }
  );
  console.log('✅ 快捷记录失败操作:', entry2.id);

  const entry3 = auditLog(
    OperationType.CONFIG_UPDATE,
    '快捷记录配置更新',
    { userId: 'user123', context: { setting: 'theme' } }
  );
  console.log('✅ 快捷记录带用户信息:', entry3.id);
}

// ============================================
// 示例 9: 多种操作类型
// ============================================
export async function example9_OperationTypes() {
  console.log('\n📋 示例 9: 多种操作类型\n');

  const logger = createAuditLogger();

  // API Key操作
  logger.log(OperationType.API_KEY_CREATE, '创建API Key');
  logger.log(OperationType.API_KEY_READ, '读取API Key');
  logger.log(OperationType.API_KEY_UPDATE, '更新API Key');
  logger.log(OperationType.API_KEY_DELETE, '删除API Key');
  logger.log(OperationType.API_KEY_EXPORT, '导出API Key');
  console.log('✅ 记录API Key操作');

  // 会话操作
  logger.log(OperationType.SESSION_CREATE, '创建会话');
  logger.log(OperationType.SESSION_READ, '读取会话');
  logger.log(OperationType.SESSION_UPDATE, '更新会话');
  logger.log(OperationType.SESSION_DELETE, '删除会话');
  logger.log(OperationType.SESSION_SWITCH, '切换会话');
  console.log('✅ 记录会话操作');

  // 分支操作
  logger.log(OperationType.BRANCH_CREATE, '创建分支');
  logger.log(OperationType.BRANCH_READ, '读取分支');
  logger.log(OperationType.BRANCH_DELETE, '删除分支');
  logger.log(OperationType.BRANCH_MERGE, '合并分支');
  console.log('✅ 记录分支操作');

  // 配置操作
  logger.log(OperationType.CONFIG_READ, '读取配置');
  logger.log(OperationType.CONFIG_UPDATE, '更新配置');
  logger.log(OperationType.CONFIG_RESET, '重置配置');
  console.log('✅ 记录配置操作');

  // RAG操作
  logger.log(OperationType.RAG_INDEX_ADD, '添加RAG索引');
  logger.log(OperationType.RAG_INDEX_REMOVE, '移除RAG索引');
  logger.log(OperationType.RAG_INDEX_CLEAR, '清空RAG索引');
  console.log('✅ 记录RAG操作');

  // 安全操作
  logger.log(OperationType.SECURITY_LOGIN, '用户登录');
  logger.log(OperationType.SECURITY_LOGOUT, '用户登出');
  logger.log(OperationType.SECURITY_PASSWORD_CHANGE, '修改密码');
  logger.log(OperationType.SECURITY_BACKUP, '备份数据');
  logger.log(OperationType.SECURITY_RESTORE, '恢复数据');
  console.log('✅ 记录安全操作');

  // 系统操作
  logger.log(OperationType.SYSTEM_START, '系统启动');
  logger.log(OperationType.SYSTEM_STOP, '系统停止');
  logger.log(OperationType.SYSTEM_ERROR, '系统错误', {
    level: AuditLevel.ERROR,
    success: false,
    errorMessage: '未知错误'
  });
  console.log('✅ 记录系统操作');
}

// ============================================
// 示例 10: 实际应用场景
// ============================================
export async function example10_RealWorldUsage() {
  console.log('\n🎯 示例 10: 实际应用场景\n');

  const logger = createAuditLogger();

  // 场景1: 用户登录流程
  console.log('\n📝 场景1: 用户登录流程');
  const loginEntry = logger.log(
    OperationType.SECURITY_LOGIN,
    '用户user123登录系统',
    {
      userId: 'user123',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      context: { loginMethod: 'password', loginTime: Date.now() }
    }
  );
  console.log('✅ 登录已记录');

  // 场景2: API Key管理
  console.log('\n📝 场景2: API Key管理');
  logger.log(
    OperationType.API_KEY_CREATE,
    '用户创建OpenAI API Key',
    {
      userId: 'user123',
      context: { provider: 'openai', keyName: 'production' }
    }
  );
  console.log('✅ API Key创建已记录');

  // 场景3: 会话管理
  console.log('\n📝 场景3: 会话管理');
  logger.log(
    OperationType.SESSION_CREATE,
    '用户创建新会话',
    {
      userId: 'user123',
      context: { model: 'gpt-4', initialPrompt: '你好' }
    }
  );
  console.log('✅ 会话创建已记录');

  // 场景4: 错误处理
  console.log('\n📝 场景4: 错误处理');
  logger.log(
    OperationType.API_KEY_DELETE,
    '删除API Key失败',
    {
      userId: 'user123',
      level: AuditLevel.ERROR,
      success: false,
      errorMessage: 'API Key不存在或已被删除',
      context: { keyId: 'non-existent-key' }
    }
  );
  console.log('✅ 错误已记录');

  // 场景5: 配置管理
  console.log('\n📝 场景5: 配置管理');
  logger.log(
    OperationType.CONFIG_UPDATE,
    '用户更新主题配置',
    {
      userId: 'user123',
      context: { setting: 'theme', oldValue: 'dark', newValue: 'light' }
    }
  );
  console.log('✅ 配置更新已记录');

  // 场景6: 安全审计
  console.log('\n📝 场景6: 安全审计');
  const stats = logger.getStatistics();
  console.log(`\n总操作数: ${stats.total}`);
  console.log(`成功操作: ${stats.bySuccess.true}`);
  console.log(`失败操作: ${stats.bySuccess.false}`);
  console.log(`\n按级别分布:`);
  for (const [level, count] of Object.entries(stats.byLevel)) {
    console.log(`  ${level}: ${count}`);
  }

  // 场景7: 导出审计报告
  console.log('\n📝 场景7: 导出审计报告');
  const reportPath = '/tmp/audit-report.json';
  const exportResult = logger.export(reportPath, { userId: 'user123' });
  console.log(`审计报告${exportResult ? '已' : '未'}导出到: ${reportPath}`);

  // 清理
  const fs = await import('fs/promises');
  try {
    await fs.unlink(reportPath);
  } catch (error) {
    // 忽略文件不存在的错误
  }
}

// ============================================
// 运行所有示例
// ============================================
export async function runAllExamples() {
  console.log('🚀 开始运行审计日志模块示例\n');
  console.log('='.repeat(60));

  try {
    await example1_BasicUsage();
    await example2_FailedOperations();
    await example3_UserInformation();
    await example4_QueryLogs();
    await example5_Statistics();
    await example6_ExportAndImport();
    await example7_Formatting();
    await example8_QuickLog();
    await example9_OperationTypes();
    await example10_RealWorldUsage();

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有示例运行完成!\n');
  } catch (error) {
    console.error('\n❌ 示例运行失败:', error);
  }
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
