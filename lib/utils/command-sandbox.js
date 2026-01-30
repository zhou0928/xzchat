import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

/**
 * 命令沙箱
 * 提供安全的命令执行环境
 */
export class CommandSandbox {
  constructor(options = {}) {
    this.allowedCommands = options.allowedCommands || this.getDefaultAllowedCommands();
    this.blockedCommands = options.blockedCommands || ['rm', 'mkfs', 'dd', 'format'];
    this.allowedPaths = options.allowedPaths || [process.cwd()];
    this.maxExecutionTime = options.maxExecutionTime || 30000; // 30秒
    this.maxOutputSize = options.maxOutputSize || 1024 * 1024; // 1MB
    this.dryRun = options.dryRun || false;
    this.enableLogging = options.enableLogging !== false;
    this.logger = options.logger || console.log;
  }

  /**
   * 获取默认允许的命令列表
   */
  getDefaultAllowedCommands() {
    return [
      // Git 命令
      'git',
      
      // 文件操作
      'ls', 'dir', 'cat', 'type', 'head', 'tail', 'wc',
      'grep', 'find', 'fd', 'rg',
      
      // Node.js 相关
      'node', 'npm', 'npx', 'yarn', 'pnpm',
      
      // 开发工具
      'eslint', 'prettier', 'tsc', 'jest', 'vitest',
      
      // 通用工具
      'echo', 'pwd', 'cd', 'date', 'whoami',
      'curl', 'wget', 'tar', 'gzip', 'zip', 'unzip',
      
      // 文本处理
      'sed', 'awk', 'sort', 'uniq', 'cut',
      
      // 系统信息
      'ps', 'top', 'df', 'du', 'free'
    ];
  }

  /**
   * 验证命令是否允许执行
   */
  validateCommand(command) {
    // 提取命令名称
    const cmdName = command.trim().split(/\s+/)[0];
    
    // 检查是否在黑名单
    if (this.blockedCommands.some(blocked => cmdName.endsWith(blocked))) {
      throw new Error(`❌ 命令 "${cmdName}" 被禁止执行`);
    }

    // 如果有白名单，检查是否在白名单
    if (this.allowedCommands.length > 0) {
      if (!this.allowedCommands.some(allowed => cmdName.endsWith(allowed))) {
        throw new Error(`❌ 命令 "${cmdName}" 不在允许列表中`);
      }
    }

    // 检查命令是否存在
    const cmdPath = this.resolveCommand(cmdName);
    if (!cmdPath || !existsSync(cmdPath)) {
      throw new Error(`❌ 命令 "${cmdName}" 不存在`);
    }

    return { cmdName, cmdPath };
  }

  /**
   * 解析命令路径
   */
  resolveCommand(cmdName) {
    // 在 macOS/Linux 上，which 命令
    if (process.platform !== 'win32') {
      try {
        const { spawnSync } = require('node:child_process');
        const result = spawnSync('which', [cmdName], { encoding: 'utf-8' });
        if (result.status === 0 && result.stdout) {
          return result.stdout.trim();
        }
      } catch (e) {
        // 忽略错误
      }
    }
    return null;
  }

  /**
   * 验证路径是否安全
   */
  validatePath(pathToCheck) {
    const resolved = resolve(pathToCheck);
    
    // 检查是否在允许的路径内
    const isAllowed = this.allowedPaths.some(allowedPath => {
      const resolvedAllowed = resolve(allowedPath);
      return resolved.startsWith(resolvedAllowed);
    });

    if (!isAllowed) {
      throw new Error(`❌ 路径 "${resolved}" 不在允许的目录中`);
    }

    return resolved;
  }

  /**
   * 检测危险选项
   */
  detectDangerousOptions(command) {
    const dangerousPatterns = [
      /--force/, /-f/,
      /--recursive/, /-r/,
      /--delete/,
      /sudo/i,
      />\s*\/dev\/\w+/, // 重写到设备文件
      />\s*\/etc\/\w+/, // 写到系统配置
      />\s*\/usr\/\w+/, // 写到系统目录
      /&&\s*(rm|dd|mkfs)/, // 组合命令中的危险操作
      /\|\s*(rm|dd|mkfs)/, // 管道到危险命令
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error(`❌ 检测到危险选项: ${pattern.source}`);
      }
    }

    return true;
  }

  /**
   * 执行命令（沙箱环境）
   */
  async execute(command, options = {}) {
    const {
      cwd = process.cwd(),
      env = process.env,
      timeout = this.maxExecutionTime,
      captureOutput = true,
      interactive = false
    } = options;

    try {
      // 验证命令
      const { cmdName } = this.validateCommand(command);
      
      // 检测危险选项
      this.detectDangerousOptions(command);

      // 验证工作目录
      this.validatePath(cwd);

      // 记录执行日志
      if (this.enableLogging) {
        this.logger(`🔒 [Sandbox] 执行命令: ${command}`);
        this.logger(`   工作目录: ${cwd}`);
      }

      // 如果是 dry-run 模式，只记录不执行
      if (this.dryRun) {
        this.logger(`ℹ️  [Dry-run] 命令未实际执行`);
        return {
          success: true,
          exitCode: 0,
          stdout: '[Dry-run mode - command not executed]',
          stderr: ''
        };
      }

      // 执行命令
      const result = await this.spawnCommand(command, {
        cwd,
        env,
        timeout,
        captureOutput,
        interactive
      });

      // 记录结果
      if (this.enableLogging) {
        const status = result.success ? '✅' : '❌';
        this.logger(`${status} [Sandbox] 退出码: ${result.exitCode}`);
      }

      return result;

    } catch (error) {
      // 记录错误
      if (this.enableLogging) {
        this.logger(`❌ [Sandbox] 执行失败: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 生成执行命令
   */
  spawnCommand(command, options) {
    return new Promise((resolve, reject) => {
      const args = command.split(/\s+/);
      const cmd = args.shift();
      const { cwd, env, timeout, captureOutput, interactive } = options;

      const child = spawn(cmd, args, {
        cwd,
        env,
        stdio: interactive ? 'inherit' : 'pipe'
      });

      let stdout = '';
      let stderr = '';
      let outputSize = 0;

      if (captureOutput && !interactive) {
        child.stdout?.on('data', (data) => {
          const chunk = data.toString();
          
          // 检查输出大小
          outputSize += chunk.length;
          if (outputSize > this.maxOutputSize) {
            child.kill();
            reject(new Error(`❌ 输出超过最大限制 (${this.maxOutputSize} bytes)`));
            return;
          }

          stdout += chunk;
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      // 超时处理
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`❌ 命令执行超时 (${timeout}ms)`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        const success = code === 0;
        resolve({
          success,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * 设置允许的命令
   */
  setAllowedCommands(commands) {
    this.allowedCommands = commands;
  }

  /**
   * 添加允许的命令
   */
  addAllowedCommand(command) {
    if (!this.allowedCommands.includes(command)) {
      this.allowedCommands.push(command);
    }
  }

  /**
   * 移除允许的命令
   */
  removeAllowedCommand(command) {
    this.allowedCommands = this.allowedCommands.filter(c => c !== command);
  }

  /**
   * 设置允许的路径
   */
  setAllowedPaths(paths) {
    this.allowedPaths = paths;
  }

  /**
   * 添加允许的路径
   */
  addAllowedPath(path) {
    if (!this.allowedPaths.includes(path)) {
      this.allowedPaths.push(path);
    }
  }

  /**
   * 设置 dry-run 模式
   */
  setDryRun(enabled) {
    this.dryRun = enabled;
  }

  /**
   * 创建默认沙箱实例
   */
  static createDefault() {
    return new CommandSandbox({
      allowedCommands: [
        'git', 'node', 'npm', 'npx',
        'eslint', 'prettier', 'tsc', 'jest', 'vitest',
        'ls', 'cat', 'head', 'tail', 'grep', 'find'
      ],
      allowedPaths: [process.cwd()],
      maxExecutionTime: 30000,
      maxOutputSize: 1024 * 1024
    });
  }
}

/**
 * 创建命令执行审计记录
 */
export function auditCommandExecution(command, result, context = {}) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    command: command,
    exitCode: result.exitCode,
    success: result.success,
    duration: context.duration || 0,
    user: context.user || process.env.USER || 'unknown',
    pid: process.pid,
    cwd: context.cwd || process.cwd(),
    outputSize: result.stdout?.length || 0
  };

  // 可以写入日志文件或发送到审计系统
  if (context.auditLog && typeof context.auditLog === 'function') {
    context.auditLog(auditEntry);
  }

  return auditEntry;
}
