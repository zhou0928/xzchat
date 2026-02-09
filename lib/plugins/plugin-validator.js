/**
 * 插件验证器
 * 验证插件的结构、代码质量、安全性和性能
 */

import { ValidationError } from '../errors/plugin-errors.js';

export class PluginValidator {
  constructor() {
    this.rules = {
      metadata: this.getMetadataRules(),
      code: this.getCodeRules(),
      security: this.getSecurityRules(),
      performance: this.getPerformanceRules()
    };
  }

  /**
   * 完整验证插件
   */
  validate(plugin) {
    const errors = [];
    const warnings = [];

    try {
      // 1. 验证元数据 (必需)
      if (!plugin.metadata) {
        errors.push({
          type: 'VALIDATION',
          severity: 'error',
          message: 'Plugin metadata is required'
        });
      } else {
        const metadataResult = this.validateMetadata(plugin.metadata);
        errors.push(...metadataResult.errors);
        warnings.push(...metadataResult.warnings);
      }

      // 2-4. 验证代码、安全、性能 (仅在插件已加载时验证)
      // 如果插件只提供了 metadata 和 path，说明还未加载，跳过这些检查
      if (plugin.instance || plugin.commands) {
        // 2. 验证代码质量
        const codeResult = this.validateCodeQuality(plugin);
        errors.push(...codeResult.errors);
        warnings.push(...codeResult.warnings);

        // 3. 验证安全性
        const securityResult = this.validateSecurity(plugin);
        errors.push(...securityResult.errors);
        warnings.push(...securityResult.warnings);

        // 4. 验证性能
        const performanceResult = this.validatePerformance(plugin);
        errors.push(...performanceResult.errors);
        warnings.push(...performanceResult.warnings);
      }

    } catch (error) {
      errors.push({
        type: 'VALIDATION',
        severity: 'error',
        message: `Validation failed: ${error.message}`,
        stack: error.stack
      });
    }

    return {
      valid: errors.length === 0,
      isValid: errors.length === 0,  // 兼容性字段
      errors: errors.length === 0 ? [] : errors,  // 如果没有错误，返回空数组
      warnings,
      score: this.calculateScore(errors, warnings)
    };
  }

  /**
   * 验证元数据
   */
  validateMetadata(metadata) {
    const errors = [];
    const warnings = [];

    // 必需字段
    if (!metadata.name) {
      errors.push({
        type: 'METADATA',
        field: 'name',
        severity: 'error',
        message: 'Plugin name is required'
      });
    } else if (!/^[a-z0-9-]+$/.test(metadata.name)) {
      errors.push({
        type: 'METADATA',
        field: 'name',
        severity: 'error',
        message: 'Plugin name must be lowercase alphanumeric with hyphens'
      });
    }

    if (!metadata.version) {
      errors.push({
        type: 'METADATA',
        field: 'version',
        severity: 'error',
        message: 'Plugin version is required'
      });
    } else if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
      errors.push({
        type: 'METADATA',
        field: 'version',
        severity: 'error',
        message: 'Version must follow semantic versioning (e.g., 1.0.0)'
      });
    }

    if (!metadata.description) {
      warnings.push({
        type: 'METADATA',
        field: 'description',
        severity: 'warning',
        message: 'Plugin description is recommended'
      });
    } else if (metadata.description.length < 10) {
      warnings.push({
        type: 'METADATA',
        field: 'description',
        severity: 'warning',
        message: 'Description should be at least 10 characters'
      });
    }

    if (!metadata.author) {
      warnings.push({
        type: 'METADATA',
        field: 'author',
        severity: 'warning',
        message: 'Plugin author is recommended'
      });
    }

    if (!metadata.license) {
      warnings.push({
        type: 'METADATA',
        field: 'license',
        severity: 'warning',
        message: 'Plugin license is recommended'
      });
    }

    if (!metadata.main) {
      errors.push({
        type: 'METADATA',
        field: 'main',
        severity: 'error',
        message: 'Plugin main file is required'
      });
    }

    // 验证依赖
    if (metadata.dependencies) {
      for (const [depName, depVersion] of Object.entries(metadata.dependencies)) {
        if (!/^[><~^=]?\d+\.\d+\.\d+/.test(depVersion)) {
          warnings.push({
            type: 'METADATA',
            field: 'dependencies',
            severity: 'warning',
            message: `Dependency ${depName} version ${depVersion} may not be valid`
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证代码质量
   */
  validateCodeQuality(plugin) {
    const errors = [];
    const warnings = [];

    // 支持直接传入code字符串或plugin对象
    if (plugin.code && typeof plugin.code === 'string') {
      // 如果是code字符串，检查可疑模式
      const code = plugin.code;
      const suspiciousPatterns = ['eval(', 'require(', 'import(', 'Function('];

      for (const pattern of suspiciousPatterns) {
        if (code.includes(pattern)) {
          errors.push({
            type: 'CODE',
            severity: 'error',
            message: `Suspicious pattern detected: ${pattern}`
          });
        }
      }
      return { errors, warnings };
    }

    // 检查是否有命令
    if (!plugin.commands || Object.keys(plugin.commands).length === 0) {
      warnings.push({
        type: 'CODE',
        severity: 'warning',
        message: 'Plugin should have at least one command'
      });
    }

    // 检查命令是否有效
    if (plugin.commands) {
      for (const [cmdName, cmd] of Object.entries(plugin.commands)) {
        if (!cmd.handler || typeof cmd.handler !== 'function') {
          errors.push({
            type: 'CODE',
            field: `commands.${cmdName}.handler`,
            severity: 'error',
            message: `Command ${cmdName} must have a valid handler function`
          });
        }

        if (!cmd.description) {
          warnings.push({
            type: 'CODE',
            field: `commands.${cmdName}.description`,
            severity: 'warning',
            message: `Command ${cmdName} should have a description`
          });
        }

        if (!cmd.usage) {
          warnings.push({
            type: 'CODE',
            field: `commands.${cmdName}.usage`,
            severity: 'warning',
            message: `Command ${cmdName} should have usage information`
          });
        }
      }
    }

    // 检查命令命名
    if (plugin.commands) {
      const invalidNames = Object.keys(plugin.commands).filter(
        name => !name.startsWith('/')
      );

      invalidNames.forEach(name => {
        errors.push({
          type: 'CODE',
          field: `commands.${name}`,
          severity: 'error',
          message: `Command name "${name}" must start with "/" prefix`
        });
      });
    }

    return { errors, warnings };
  }

  /**
   * 验证安全性
   */
  validateSecurity(plugin) {
    const errors = [];
    const warnings = [];

    // 支持直接传入code字符串
    const code = plugin.code || (plugin.instance ? plugin.instance.toString() : '');

    // 检查是否使用了危险的 eval
    if (code.includes('eval(')) {
      errors.push({
        type: 'SECURITY',
        severity: 'error',
        message: 'Plugin should not use eval() for security reasons'
      });
    }

    // 检查是否使用了 Function 构造器
    if (code.includes('new Function(')) {
      errors.push({
        type: 'SECURITY',
        severity: 'error',
        message: 'Plugin should not use Function() constructor for security reasons'
      });
    }

    // 检查是否声明了权限
    if (!plugin.metadata?.permissions && !plugin.permissions) {
      warnings.push({
        type: 'SECURITY',
        severity: 'warning',
        message: 'Plugin should declare required permissions'
      });
    }

    const permissions = plugin.metadata?.permissions || plugin.permissions || [];

    // 检查网络请求
    if (code.includes('fetch(')) {
      if (!permissions.includes('network')) {
        warnings.push({
          type: 'SECURITY',
          severity: 'warning',
          message: 'Plugin uses network requests but does not declare network permission'
        });
      }
    }

    // 检查文件操作
    if (code.includes('fs.')) {
      if (!permissions.includes('file')) {
        warnings.push({
          type: 'SECURITY',
          severity: 'warning',
          message: 'Plugin uses file operations but does not declare file permission'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证性能
   */
  validatePerformance(plugin) {
    const errors = [];
    const warnings = [];

    // 检查初始化性能
    if (plugin.onInitialize) {
      warnings.push({
        type: 'PERFORMANCE',
        severity: 'info',
        message: 'Plugin should implement onInitialize for lazy loading'
      });
    }

    // 支持直接传入code字符串
    const code = plugin.code || (plugin.instance ? plugin.instance.toString() : '');

    // 检查是否有性能监控
    if (!plugin.metadata?.enablePerformanceMonitoring) {
      warnings.push({
        type: 'PERFORMANCE',
        severity: 'info',
        message: 'Consider enabling performance monitoring'
      });
    }

    // 检查是否使用了同步操作
    if (code.includes('fs.readFileSync(') || code.includes('fs.writeFileSync(')) {
      errors.push({
        type: 'PERFORMANCE',
        severity: 'error',
        message: 'Avoid synchronous file operations'
      });
    }

    // 检测潜在的性能问题（如无限循环）
    if (code.includes('while (true)') || code.includes('for (;;')) {
      errors.push({
        type: 'PERFORMANCE',
        severity: 'error',
        message: 'Potential infinite loop detected'
      });
    }

    return { errors, warnings };
  }

  /**
   * 计算验证分数
   */
  calculateScore(errors, warnings) {
    const baseScore = 100;
    const errorPenalty = errors.length * 10;
    const warningPenalty = warnings.length * 2;

    return Math.max(0, baseScore - errorPenalty - warningPenalty);
  }

  /**
   * 生成验证报告
   */
  generateReport(plugin, validationResult) {
    const { valid, errors, warnings, score } = validationResult;

    const lines = [];

    lines.push(`=== Plugin Validation Report ===`);
    lines.push(`\nPlugin: ${plugin.metadata.name || 'Unknown'}`);
    lines.push(`Version: ${plugin.metadata.version || 'Unknown'}`);
    lines.push(`Status: ${valid ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Score: ${score}/100`);

    if (errors.length > 0) {
      lines.push(`\n❌ Errors (${errors.length}):`);
      errors.forEach((error, index) => {
        lines.push(`  ${index + 1}. [${error.type}] ${error.message}`);
        if (error.field) {
          lines.push(`     Field: ${error.field}`);
        }
      });
    }

    if (warnings.length > 0) {
      lines.push(`\n⚠️  Warnings (${warnings.length}):`);
      warnings.forEach((warning, index) => {
        lines.push(`  ${index + 1}. [${warning.type}] ${warning.message}`);
        if (warning.field) {
          lines.push(`     Field: ${warning.field}`);
        }
      });
    }

    if (valid) {
      lines.push(`\n✅ Plugin is valid and ready for use!`);
    } else {
      lines.push(`\n❌ Plugin has errors that must be fixed before use.`);
    }

    return lines.join('\n');
  }

  /**
   * 获取元数据规则
   */
  getMetadataRules() {
    return {
      required: ['name', 'version', 'main'],
      recommended: ['description', 'author', 'license'],
      optional: ['dependencies', 'peerDependencies', 'keywords', 'category', 'permissions']
    };
  }

  /**
   * 获取代码规则
   */
  getCodeRules() {
    return {
      commandsRequired: true,
      commandPrefix: '/',
      asyncPreferred: true
    };
  }

  /**
   * 获取安全规则
   */
  getSecurityRules() {
    return {
      forbidEval: true,
      forbidFunctionConstructor: true,
      requirePermissions: true
    };
  }

  /**
   * 获取性能规则
   */
  getPerformanceRules() {
    return {
      asyncFileOperations: true,
      asyncNetworkRequests: true,
      performanceMonitoring: true
    };
  }
}
