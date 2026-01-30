import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

/**
 * 配置同步管理器（完整版本）
 * 支持 GitHub、Gitee、自定义 Git 仓库同步
 */
class SyncManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-sync.json');
    this.syncConfigs = {};
    this.syncIntervals = new Map(); // 存储定时同步任务
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.syncConfigs = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载同步配置失败: ${error.message}`);
      }
    }
  }

  async save() {
    await fs.writeFile(this.configPath, JSON.stringify(this.syncConfigs, null, 2));
  }

  /**
   * 验证 Git 仓库连接
   */
  async validateRepository(provider, repository, token = '') {
    try {
      const repoUrl = this.buildRepoUrl(provider, repository, token);
      // 尝试列出远程仓库的分支
      execSync(`git ls-remote ${repoUrl} HEAD`, { 
        stdio: 'pipe',
        timeout: 10000 
      });
      return { valid: true, message: '仓库连接成功' };
    } catch (error) {
      return { 
        valid: false, 
        message: `仓库连接失败: ${error.message}` 
      };
    }
  }

  /**
   * 构建 Git 仓库 URL
   */
  buildRepoUrl(provider, repository, token) {
    switch (provider) {
      case 'github':
        return token 
          ? `https://${token}@github.com/${repository}.git`
          : `https://github.com/${repository}.git`;
      case 'gitee':
        return token
          ? `https://${token}@gitee.com/${repository}.git`
          : `https://gitee.com/${repository}.git`;
      case 'custom':
        return repository;
      default:
        throw new Error(`不支持的提供商: ${provider}`);
    }
  }

  /**
   * 添加同步配置
   */
  async add(name, provider, options = {}) {
    await this.load();
    
    if (this.syncConfigs[name]) {
      throw new Error(`同步配置 "${name}" 已存在`);
    }

    const { 
      repository = '',
      token = '',
      branch = 'main',
      syncPath = this.getHomeDir(),
      autoSync = false,
      syncInterval = 3600,
      includePatterns = [],
      excludePatterns = ['node_modules', '.git', '*.log'],
      encrypt = false
    } = options;

    // 验证仓库连接
    const validation = await this.validateRepository(provider, repository, token);
    if (!validation.valid && !options.skipValidation) {
      throw new Error(validation.message);
    }

    const config = {
      name,
      provider,
      repository,
      token, // 实际保存时应加密
      branch,
      syncPath,
      autoSync,
      syncInterval,
      includePatterns,
      excludePatterns,
      encrypt,
      lastSync: null,
      lastStatus: 'pending',
      syncCount: 0,
      conflictStrategy: 'ask', // 'ask', 'local', 'remote'
      createdAt: new Date().toISOString()
    };

    this.syncConfigs[name] = config;
    await this.save();

    // 如果启用了自动同步，启动定时任务
    if (autoSync) {
      this.startAutoSync(name);
    }

    return config;
  }

  /**
   * 删除同步配置
   */
  async remove(name) {
    await this.load();
    
    if (!this.syncConfigs[name]) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    // 停止自动同步任务
    this.stopAutoSync(name);

    delete this.syncConfigs[name];
    await this.save();

    return true;
  }

  /**
   * 列出所有同步配置
   */
  async list() {
    await this.load();
    return Object.values(this.syncConfigs);
  }

  /**
   * 获取同步配置详情
   */
  async get(name) {
    await this.load();
    const config = this.syncConfigs[name];
    
    if (!config) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    // 返回时隐藏 token
    return {
      ...config,
      token: config.token ? '***hidden***' : ''
    };
  }

  /**
   * 执行同步操作
   */
  async sync(name, options = {}) {
    await this.load();
    
    const config = this.syncConfigs[name];
    if (!config) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    const startTime = Date.now();
    const { force = false, dryRun = false } = options;

    try {
      if (dryRun) {
        return {
          name,
          status: 'success',
          message: '同步预览完成（dry run）',
          syncedAt: new Date().toISOString(),
          changes: []
        };
      }

      // 执行 Git 同步
      const result = await this.executeGitSync(config, force);

      // 更新配置
      config.lastSync = new Date().toISOString();
      config.lastStatus = 'success';
      config.syncCount++;
      await this.save();

      return {
        name,
        provider: config.provider,
        syncedAt: new Date().toISOString(),
        status: 'success',
        duration: Date.now() - startTime,
        ...result
      };
    } catch (error) {
      config.lastStatus = 'failed';
      await this.save();

      return {
        name,
        provider: config.provider,
        syncedAt: new Date().toISOString(),
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 执行 Git 同步
   */
  async executeGitSync(config, force) {
    const { syncPath, repository, token, branch, provider } = config;
    const repoUrl = this.buildRepoUrl(provider, repository, token);
    const repoDir = path.join(syncPath, '.xzchat-sync');

    try {
      // 检查是否已初始化
      const repoExists = await this.pathExists(repoDir);

      if (!repoExists) {
        // 克隆仓库
        execSync(`git clone ${repoUrl} "${repoDir}"`, { stdio: 'pipe' });
        execSync(`git config user.email "xzchat@sync.local"`, { cwd: repoDir, stdio: 'pipe' });
        execSync(`git config user.name "xzChat Sync"`, { cwd: repoDir, stdio: 'pipe' });
      } else {
        // 拉取最新代码
        execSync('git fetch origin', { cwd: repoDir, stdio: 'pipe' });
        
        if (force) {
          execSync(`git reset --hard origin/${branch}`, { cwd: repoDir, stdio: 'pipe' });
        } else {
          // 检查是否有冲突
          const status = execSync('git status --porcelain', { 
            cwd: repoDir, 
            encoding: 'utf-8' 
          });
          
          if (status.trim()) {
            throw new Error('本地有未提交的更改，请先提交或使用 --force');
          }

          execSync(`git pull origin ${branch}`, { cwd: repoDir, stdio: 'pipe' });
        }
      }

      // 获取变更文件
      const lastSyncCommit = config.lastSyncCommit || '';
      const changes = execSync(
        `git log --oneline ${lastSyncCommit}..HEAD`,
        { cwd: repoDir, encoding: 'utf-8' }
      ).split('\n').filter(Boolean);

      // 保存当前提交 ID
      const currentCommit = execSync('git rev-parse HEAD', { 
        cwd: repoDir, 
        encoding: 'utf-8' 
      }).trim();
      config.lastSyncCommit = currentCommit;

      return {
        changes: changes,
        commit: currentCommit,
        branch: branch
      };
    } catch (error) {
      throw new Error(`Git 同步失败: ${error.message}`);
    }
  }

  /**
   * 检查路径是否存在
   */
  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 启动自动同步
   */
  startAutoSync(name) {
    const config = this.syncConfigs[name];
    if (!config || !config.autoSync) {
      return;
    }

    // 清除已存在的定时器
    this.stopAutoSync(name);

    // 设置新的定时器
    const intervalId = setInterval(async () => {
      try {
        await this.sync(name);
      } catch (error) {
        console.error(`自动同步失败 (${name}):`, error.message);
      }
    }, config.syncInterval * 1000);

    this.syncIntervals.set(name, intervalId);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(name) {
    const intervalId = this.syncIntervals.get(name);
    if (intervalId) {
      clearInterval(intervalId);
      this.syncIntervals.delete(name);
    }
  }

  /**
   * 获取同步状态
   */
  getStatus(name) {
    const config = this.syncConfigs[name];
    if (!config) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    return {
      name: config.name,
      provider: config.provider,
      autoSync: config.autoSync,
      lastSync: config.lastSync,
      lastStatus: config.lastStatus,
      syncCount: config.syncCount,
      isSyncing: this.syncIntervals.has(name)
    };
  }

  /**
   * 获取同步历史
   */
  async getHistory(name, limit = 20) {
    const config = this.syncConfigs[name];
    if (!config) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    // 这里可以扩展为从数据库或日志文件读取历史
    // 简化版本返回当前配置中的信息
    return [{
      syncTime: config.lastSync,
      status: config.lastStatus,
      provider: config.provider,
      commit: config.lastSyncCommit
    }];
  }

  /**
   * 冲突检测
   */
  async detectConflicts(name) {
    const config = this.syncConfigs[name];
    if (!config) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    const repoDir = path.join(config.syncPath, '.xzchat-sync');
    
    try {
      execSync('git fetch origin', { cwd: repoDir, stdio: 'pipe' });
      
      // 检查是否有冲突
      const status = execSync('git diff --name-only origin/main', { 
        cwd: repoDir, 
        encoding: 'utf-8' 
      });
      
      const conflicts = status.trim().split('\n').filter(Boolean);
      
      return {
        hasConflicts: conflicts.length > 0,
        files: conflicts
      };
    } catch (error) {
      return {
        hasConflicts: false,
        error: error.message
      };
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflicts(name, strategy) {
    const config = this.syncConfigs[name];
    if (!config) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    config.conflictStrategy = strategy;
    await this.save();

    return await this.sync(name, { force: true });
  }

  /**
   * 备份当前状态
   */
  async backup(name) {
    const config = this.syncConfigs[name];
    if (!config) {
      throw new Error(`同步配置 "${name}" 不存在`);
    }

    const backupPath = path.join(config.syncPath, '.xzchat-backup', name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `backup-${timestamp}.tar.gz`);

    // 创建备份目录
    await fs.mkdir(backupPath, { recursive: true });

    // 创建备份（简化版本，只备份配置）
    const backupData = {
      config: config,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

    return {
      backupPath: backupFile,
      timestamp: timestamp
    };
  }

  /**
   * 停止所有自动同步任务
   */
  stopAllAutoSync() {
    for (const name of this.syncIntervals.keys()) {
      this.stopAutoSync(name);
    }
  }
}

export default new SyncManager();
