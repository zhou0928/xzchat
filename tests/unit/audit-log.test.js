/**
 * @fileoverview 审计日志模块单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  AuditLogEngine,
  AuditLogEntry,
  AuditLevel,
  OperationType,
  createAuditLogger,
  getAuditLogger,
  auditLog,
  formatAuditEntry,
  formatAuditLogList,
  formatAuditStatistics,
  ERROR_MESSAGES
} from '../../lib/utils/audit-log.js';

describe('AuditLogEntry', () => {
  it('应该创建审计日志项', () => {
    const entry = new AuditLogEntry({
      operation: OperationType.API_KEY_CREATE,
      level: AuditLevel.INFO,
      message: '创建API Key',
      userId: 'user123',
      sessionId: 'session456'
    });

    expect(entry.operation).toBe(OperationType.API_KEY_CREATE);
    expect(entry.level).toBe(AuditLevel.INFO);
    expect(entry.message).toBe('创建API Key');
    expect(entry.userId).toBe('user123');
    expect(entry.sessionId).toBe('session456');
    expect(entry.success).toBe(true);
  });

  it('应该转换为JSON', () => {
    const entry = new AuditLogEntry({
      operation: OperationType.API_KEY_CREATE,
      level: AuditLevel.INFO,
      message: '创建API Key'
    });

    const json = entry.toJSON();

    expect(json.operation).toBe(OperationType.API_KEY_CREATE);
    expect(json.level).toBe(AuditLevel.INFO);
    expect(json.message).toBe('创建API Key');
    expect(json.timestamp).toBeDefined();
  });

  it('应该清理敏感信息', () => {
    const entry = new AuditLogEntry({
      operation: OperationType.API_KEY_CREATE,
      message: '创建API Key',
      context: {
        apiKey: 'sk-123456',
        password: 'secret123',
        normalData: 'public'
      }
    });

    const json = entry.toJSON();

    expect(json.context.apiKey).toBe('***REDACTED***');
    expect(json.context.password).toBe('***REDACTED***');
    expect(json.context.normalData).toBe('public');
  });

  it('应该从JSON创建', () => {
    const json = {
      id: 'test-id',
      operation: OperationType.API_KEY_CREATE,
      level: AuditLevel.INFO,
      message: '创建API Key',
      context: {},
      userId: 'user123',
      sessionId: 'session456',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
      success: true,
      errorMessage: null,
      timestamp: new Date().toISOString()
    };

    const entry = AuditLogEntry.fromJSON(json);

    expect(entry.operation).toBe(OperationType.API_KEY_CREATE);
    expect(userId).toBe('user123');
  });
});

describe('AuditLogEngine', () => {
  let engine;
  let tempLogDir;

  beforeEach(() => {
    // 使用临时目录进行测试
    tempLogDir = `/tmp/audit-test-${Date.now()}`;
    engine = new AuditLogEngine({
      logDir: tempLogDir,
      enableFile: true,
      maxFileSize: 1024, // 1KB 用于快速测试
      maxFileCount: 5,
      retentionDays: 1
    });
  });

  afterEach(() => {
    if (engine) {
      engine.clear();
    }
  });

  describe('基本操作', () => {
    it('应该记录审计日志', () => {
      const entry = engine.log(OperationType.API_KEY_CREATE, '创建API Key');

      expect(entry.operation).toBe(OperationType.API_KEY_CREATE);
      expect(entry.message).toBe('创建API Key');
      expect(entry.success).toBe(true);
    });

    it('应该记录失败的审计日志', () => {
      const entry = engine.log(
        OperationType.API_KEY_DELETE,
        '删除API Key失败',
        { success: false, errorMessage: 'API Key不存在' }
      );

      expect(entry.success).toBe(false);
      expect(entry.errorMessage).toBe('API Key不存在');
    });

    it('应该记录带上下文的审计日志', () => {
      const entry = engine.log(
        OperationType.SESSION_CREATE,
        '创建会话',
        {
          context: { sessionId: 'session123', model: 'gpt-4' }
        }
      );

      expect(entry.context.sessionId).toBe('session123');
      expect(entry.context.model).toBe('gpt-4');
    });

    it('应该记录带用户信息的审计日志', () => {
      const entry = engine.log(
        OperationType.CONFIG_UPDATE,
        '更新配置',
        {
          userId: 'user123',
          sessionId: 'session456',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent'
        }
      );

      expect(entry.userId).toBe('user123');
      expect(entry.sessionId).toBe('session456');
      expect(entry.ipAddress).toBe('127.0.0.1');
      expect(entry.userAgent).toBe('test-agent');
    });
  });

  describe('查询功能', () => {
    beforeEach(() => {
      // 添加测试数据
      engine.log(OperationType.API_KEY_CREATE, '创建API Key', { userId: 'user1' });
      engine.log(OperationType.API_KEY_READ, '读取API Key', { userId: 'user1' });
      engine.log(OperationType.SESSION_CREATE, '创建会话', { userId: 'user2' });
      engine.log(OperationType.CONFIG_UPDATE, '更新配置', {
        level: AuditLevel.WARNING,
        success: false
      });
    });

    it('应该查询所有日志', () => {
      const logs = engine.getAllLogs();

      expect(logs.length).toBeGreaterThanOrEqual(4);
    });

    it('应该按操作类型过滤', () => {
      const logs = engine.query({ operation: OperationType.API_KEY_CREATE });

      expect(logs.length).toBe(1);
      expect(logs[0].operation).toBe(OperationType.API_KEY_CREATE);
    });

    it('应该按用户ID过滤', () => {
      const logs = engine.query({ userId: 'user1' });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.every(log => log.userId === 'user1')).toBe(true);
    });

    it('应该按成功状态过滤', () => {
      const logs = engine.query({ success: false });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs.every(log => log.success === false)).toBe(true);
    });

    it('应该按级别过滤', () => {
      const logs = engine.query({ level: AuditLevel.WARNING });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs.every(log => log.level === AuditLevel.WARNING)).toBe(true);
    });
  });

  describe('统计功能', () => {
    beforeEach(() => {
      // 添加测试数据
      engine.log(OperationType.API_KEY_CREATE, '创建API Key');
      engine.log(OperationType.API_KEY_CREATE, '创建另一个API Key');
      engine.log(OperationType.SESSION_CREATE, '创建会话');
      engine.log(OperationType.CONFIG_UPDATE, '更新配置', {
        level: AuditLevel.WARNING
      });
    });

    it('应该获取统计信息', () => {
      const stats = engine.getStatistics();

      expect(stats.total).toBeGreaterThanOrEqual(4);
      expect(stats.byOperation[OperationType.API_KEY_CREATE]).toBe(2);
      expect(stats.byLevel[AuditLevel.INFO]).toBeGreaterThanOrEqual(3);
      expect(stats.bySuccess.true).toBeGreaterThanOrEqual(3);
    });

    it('应该按操作类型统计', () => {
      const stats = engine.getStatistics();

      expect(stats.byOperation[OperationType.API_KEY_CREATE]).toBe(2);
      expect(stats.byOperation[OperationType.SESSION_CREATE]).toBe(1);
    });

    it('应该按级别统计', () => {
      const stats = engine.getStatistics();

      expect(stats.byLevel[AuditLevel.INFO]).toBeGreaterThanOrEqual(3);
      expect(stats.byLevel[AuditLevel.WARNING]).toBeGreaterThanOrEqual(1);
    });
  });

  describe('导入导出', () => {
    it('应该导出日志', () => {
      engine.log(OperationType.API_KEY_CREATE, '创建API Key');
      engine.log(OperationType.SESSION_CREATE, '创建会话');

      const exportPath = `/tmp/audit-export-${Date.now()}.json`;
      const result = engine.export(exportPath);

      expect(result).toBe(true);

      // 验证文件存在
      const fs = require('fs');
      expect(fs.existsSync(exportPath)).toBe(true);

      // 清理
      fs.unlinkSync(exportPath);
    });

    it('应该导入日志', () => {
      const importPath = `/tmp/audit-import-${Date.now()}.json`;
      const fs = require('fs');

      // 创建导入文件
      const importData = [
        {
          id: 'import-id-1',
          operation: OperationType.API_KEY_CREATE,
          level: AuditLevel.INFO,
          message: '导入的API Key',
          context: {},
          userId: null,
          sessionId: null,
          ipAddress: null,
          userAgent: null,
          success: true,
          errorMessage: null,
          timestamp: new Date().toISOString()
        }
      ];
      fs.writeFileSync(importPath, JSON.stringify(importData));

      const result = engine.import(importPath);

      expect(result).toBe(true);

      // 验证导入的数据
      const logs = engine.query({ operation: OperationType.API_KEY_CREATE });
      expect(logs.some(log => log.message === '导入的API Key')).toBe(true);

      // 清理
      fs.unlinkSync(importPath);
    });

    it('应该导出带过滤条件的日志', () => {
      engine.log(OperationType.API_KEY_CREATE, '创建API Key', { userId: 'user1' });
      engine.log(OperationType.SESSION_CREATE, '创建会话', { userId: 'user2' });

      const exportPath = `/tmp/audit-export-filtered-${Date.now()}.json`;
      const result = engine.export(exportPath, { userId: 'user1' });

      expect(result).toBe(true);

      // 验证导出的数据
      const fs = require('fs');
      const content = fs.readFileSync(exportPath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.every(log => log.userId === 'user1')).toBe(true);

      // 清理
      fs.unlinkSync(exportPath);
    });
  });

  describe('清理功能', () => {
    it('应该清空所有日志', () => {
      engine.log(OperationType.API_KEY_CREATE, '创建API Key');
      engine.log(OperationType.SESSION_CREATE, '创建会话');

      const result = engine.clear();

      expect(result).toBe(true);

      // 验证日志已清空
      const logs = engine.getAllLogs();
      expect(logs.length).toBe(0);
    });
  });
});

describe('工厂函数', () => {
  it('应该创建审计日志引擎', () => {
    const engine = createAuditLogger();

    expect(engine).toBeInstanceOf(AuditLogEngine);
  });

  it('应该返回全局审计日志引擎', () => {
    const engine1 = getAuditLogger();
    const engine2 = getAuditLogger();

    expect(engine1).toBe(engine2);
  });

  it('创建审计日志引擎时应该使用自定义选项', () => {
    const engine = createAuditLogger({
      maxFileSize: 5 * 1024 * 1024,
      retentionDays: 30
    });

    expect(engine.maxFileSize).toBe(5 * 1024 * 1024);
    expect(engine.retentionDays).toBe(30);
  });
});

describe('快捷记录函数', () => {
  it('应该快捷记录审计日志', () => {
    const entry = auditLog(OperationType.API_KEY_CREATE, '创建API Key');

    expect(entry.operation).toBe(OperationType.API_KEY_CREATE);
    expect(entry.message).toBe('创建API Key');
  });

  it('应该记录带选项的审计日志', () => {
    const entry = auditLog(
      OperationType.API_KEY_DELETE,
      '删除API Key',
      {
        level: AuditLevel.WARNING,
        success: false,
        errorMessage: 'API Key不存在'
      }
    );

    expect(entry.level).toBe(AuditLevel.WARNING);
    expect(entry.success).toBe(false);
    expect(entry.errorMessage).toBe('API Key不存在');
  });
});

describe('格式化函数', () => {
  it('应该格式化审计日志项', () => {
    const entry = new AuditLogEntry({
      operation: OperationType.API_KEY_CREATE,
      message: '创建API Key',
      level: AuditLevel.INFO,
      success: true
    });

    const formatted = formatAuditEntry(entry);

    expect(formatted).toContain('创建API Key');
    expect(formatted).toContain('✅');
    expect(formatted).toContain('ℹ️');
    expect(formatted).toContain('API_KEY_CREATE');
  });

  it('应该格式化失败的审计日志项', () => {
    const entry = new AuditLogEntry({
      operation: OperationType.API_KEY_DELETE,
      message: '删除API Key失败',
      level: AuditLevel.ERROR,
      success: false,
      errorMessage: 'API Key不存在'
    });

    const formatted = formatAuditEntry(entry);

    expect(formatted).toContain('❌');
    expect(formatted).toContain('API Key不存在');
  });

  it('应该格式化审计日志列表', () => {
    const entries = [
      new AuditLogEntry({
        operation: OperationType.API_KEY_CREATE,
        message: '创建API Key',
        success: true
      }),
      new AuditLogEntry({
        operation: OperationType.SESSION_CREATE,
        message: '创建会话',
        success: true
      })
    ];

    const formatted = formatAuditLogList(entries);

    expect(formatted).toContain('创建API Key');
    expect(formatted).toContain('创建会话');
  });

  it('应该格式化空列表', () => {
    const formatted = formatAuditLogList([]);

    expect(formatted).toContain('暂无审计日志');
  });

  it('应该格式化统计信息', () => {
    const stats = {
      total: 100,
      byOperation: {
        API_KEY_CREATE: 50,
        SESSION_CREATE: 30,
        CONFIG_UPDATE: 20
      },
      byLevel: {
        INFO: 80,
        WARNING: 15,
        ERROR: 5
      },
      bySuccess: {
        true: 90,
        false: 10
      },
      byDate: {
        '2024-01-28': 100
      }
    };

    const formatted = formatAuditStatistics(stats);

    expect(formatted).toContain('总日志数: 100');
    expect(formatted).toContain('API_KEY_CREATE: 50');
    expect(formatted).toContain('INFO: 80');
    expect(formatted).toContain('成功: 90');
    expect(formatted).toContain('失败: 10');
  });
});

describe('常量和枚举', () => {
  it('应该定义所有审计日志级别', () => {
    expect(AuditLevel.INFO).toBe('INFO');
    expect(AuditLevel.WARNING).toBe('WARNING');
    expect(AuditLevel.ERROR).toBe('ERROR');
    expect(AuditLevel.CRITICAL).toBe('CRITICAL');
  });

  it('应该定义所有操作类型', () => {
    expect(OperationType.API_KEY_CREATE).toBe('API_KEY_CREATE');
    expect(OperationType.API_KEY_READ).toBe('API_KEY_READ');
    expect(OperationType.API_KEY_UPDATE).toBe('API_KEY_UPDATE');
    expect(OperationType.API_KEY_DELETE).toBe('API_KEY_DELETE');
    expect(OperationType.SESSION_CREATE).toBe('SESSION_CREATE');
    expect(OperationType.SESSION_DELETE).toBe('SESSION_DELETE');
    expect(OperationType.BRANCH_CREATE).toBe('BRANCH_CREATE');
    expect(OperationType.BRANCH_MERGE).toBe('BRANCH_MERGE');
    expect(OperationType.CONFIG_UPDATE).toBe('CONFIG_UPDATE');
    expect(OperationType.SECURITY_LOGIN).toBe('SECURITY_LOGIN');
  });
});
