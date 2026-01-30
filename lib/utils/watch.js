import fs from 'fs/promises';
import path from 'path';
import { watch, existsSync } from 'fs';

/**
 * 文件监控管理器
 * 监控文件变化并自动触发命令
 */
class WatchManager {
  constructor() {
    this.configPath = path.join(this.getHomeDir(), '.xzchat-watch.json');
    this.watches = new Map();
    this.activeWatchers = new Map();
  }

  getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || '.';
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const watches = JSON.parse(data);
      this.watches = new Map(Object.entries(watches));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`加载监控配置失败: ${error.message}`);
      }
    }
  }

  async save() {
    const watchesObj = {};
    this.watches.forEach((value, key) => {
      watchesObj[key] = value;
    });
    await fs.writeFile(this.configPath, JSON.stringify(watchesObj, null, 2));
  }

  async list() {
    await this.load();
    return Array.from(this.watches.values());
  }

  async get(id) {
    await this.load();
    return this.watches.get(id) || null;
  }

  async add(id, targetPath, command, options = {}) {
    await this.load();
    
    if (this.watches.has(id)) {
      throw new Error(`监控 "${id}" 已存在`);
    }

    if (!existsSync(targetPath)) {
      throw new Error(`路径不存在: ${targetPath}`);
    }

    const watchConfig = {
      id,
      targetPath: path.resolve(targetPath),
      command,
      eventType: options.eventType || 'all', // 'all', 'change', 'rename', 'unlink'
      debounceMs: options.debounceMs || 1000,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0
    };

    this.watches.set(id, watchConfig);
    await this.save();

    // 如果启用，立即开始监控
    if (watchConfig.enabled) {
      await this.startWatch(id);
    }

    return watchConfig;
  }

  async remove(id) {
    await this.load();
    
    if (!this.watches.has(id)) {
      throw new Error(`监控 "${id}" 不存在`);
    }

    await this.stopWatch(id);
    this.watches.delete(id);
    await this.save();

    return true;
  }

  async update(id, updates) {
    await this.load();
    
    if (!this.watches.has(id)) {
      throw new Error(`监控 "${id}" 不存在`);
    }

    const watch = this.watches.get(id);
    const needRestart = updates.targetPath || updates.eventType;

    Object.assign(watch, updates, { updatedAt: new Date().toISOString() });

    await this.save();

    if (needRestart && watch.enabled) {
      await this.stopWatch(id);
      await this.startWatch(id);
    }

    return watch;
  }

  async enable(id) {
    await this.load();
    
    if (!this.watches.has(id)) {
      throw new Error(`监控 "${id}" 不存在`);
    }

    const watch = this.watches.get(id);
    watch.enabled = true;
    await this.save();
    await this.startWatch(id);

    return watch;
  }

  async disable(id) {
    await this.load();
    
    if (!this.watches.has(id)) {
      throw new Error(`监控 "${id}" 不存在`);
    }

    const watch = this.watches.get(id);
    watch.enabled = false;
    await this.save();
    await this.stopWatch(id);

    return watch;
  }

  /**
   * 启动监控
   */
  async startWatch(id) {
    const watch = this.watches.get(id);
    if (!watch) {
      throw new Error(`监控 "${id}" 不存在`);
    }

    if (this.activeWatchers.has(id)) {
      return; // 已在运行
    }

    let timeoutId = null;

    const handleEvent = (eventType, filename) => {
      if (!eventType || !filename) return;

      const shouldTrigger = 
        watch.eventType === 'all' || 
        eventType === watch.eventType;

      if (shouldTrigger) {
        // 防抖
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          this.triggerCommand(watch, { eventType, filename });
          watch.lastTriggered = new Date().toISOString();
          watch.triggerCount++;
          this.save();
        }, watch.debounceMs);
      }
    };

    const watcher = watch(watch.targetPath, { recursive: true }, (eventType, filename) => {
      handleEvent(eventType, filename);
    });

    this.activeWatchers.set(id, watcher);
  }

  /**
   * 停止监控
   */
  async stopWatch(id) {
    if (this.activeWatchers.has(id)) {
      const watcher = this.activeWatchers.get(id);
      watcher.close();
      this.activeWatchers.delete(id);
    }
  }

  /**
   * 触发命令
   */
  async triggerCommand(watch, eventInfo) {
    const command = this.replaceVariables(watch.command, {
      path: watch.targetPath,
      file: eventInfo.filename,
      event: eventInfo.eventType,
      timestamp: new Date().toISOString()
    });

    console.log(`[WATCH] 触发命令: ${command}`);
    console.log(`[WATCH] 事件: ${eventInfo.eventType}, 文件: ${eventInfo.filename}`);

    // 实际执行命令（需要集成到主程序）
    // 这里只记录日志
  }

  /**
   * 替换变量
   */
  replaceVariables(text, variables) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * 获取活跃监控
   */
  getActiveWatches() {
    return Array.from(this.watches.values())
      .filter(w => w.enabled)
      .map(w => ({
        id: w.id,
        targetPath: w.targetPath,
        command: w.command,
        triggerCount: w.triggerCount
      }));
  }

  /**
   * 停止所有监控
   */
  async stopAll() {
    for (const id of this.activeWatchers.keys()) {
      await this.stopWatch(id);
    }
  }

  /**
   * 文件差异对比
   */
  async diff(filePath1, filePath2) {
    const content1 = await fs.readFile(filePath1, 'utf-8');
    const content2 = await fs.readFile(filePath2, 'utf-8');

    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const diff = [];
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === line2) {
        diff.push({ type: 'equal', line: i + 1, content: line1 });
      } else if (line1 === undefined) {
        diff.push({ type: 'add', line: i + 1, content: line2 });
      } else if (line2 === undefined) {
        diff.push({ type: 'remove', line: i + 1, content: line1 });
      } else {
        diff.push({ type: 'change', line: i + 1, old: line1, new: line2 });
      }
    }

    return diff;
  }

  /**
   * 获取监控日志
   */
  async getLogs(id) {
    const watch = this.watches.get(id);
    if (!watch) {
      throw new Error(`监控 "${id}" 不存在`);
    }

    return {
      id: watch.id,
      createdAt: watch.createdAt,
      lastTriggered: watch.lastTriggered,
      triggerCount: watch.triggerCount,
      enabled: watch.enabled
    };
  }

  /**
   * 导出监控配置
   */
  async exportConfig() {
    await this.load();
    return JSON.stringify(Array.from(this.watches.values()), null, 2);
  }

  /**
   * 导入监控配置
   */
  async importConfig(content) {
    const watches = JSON.parse(content);
    await this.load();

    let count = 0;
    for (const watch of watches) {
      if (!this.watches.has(watch.id)) {
        watch.createdAt = new Date().toISOString();
        watch.lastTriggered = null;
        watch.triggerCount = 0;
        this.watches.set(watch.id, watch);
        
        if (watch.enabled) {
          await this.startWatch(watch.id);
        }
        count++;
      }
    }

    await this.save();
    return count;
  }

  /**
   * 获取预设模板
   */
  getPresets() {
    return {
      'reload-config': {
        command: '/env reload',
        description: '配置文件变化时重新加载'
      },
      'run-tests': {
        command: '/test run',
        description: '代码变化时运行测试'
      },
      'restart-server': {
        command: '/restart',
        description: '文件变化时重启服务器'
      }
    };
  }
}

export default new WatchManager();
