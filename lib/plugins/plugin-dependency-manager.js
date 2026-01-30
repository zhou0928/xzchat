/**
 * 插件依赖管理系统
 * 处理插件之间的依赖关系、安装和卸载
 */

import { promises as fs } from 'fs';
import path from 'path';

export class PluginDependencyManager {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.dependencyGraph = new Map();
    this.installedDependencies = new Map();
    this.dependenciesFile = path.join(process.cwd(), '.xzchat-dependencies.json');
  }

  /**
   * 加载依赖配置
   */
  async loadDependencies() {
    try {
      const data = await fs.readFile(this.dependenciesFile, 'utf-8');
      this.installedDependencies = new Map(JSON.parse(data));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 保存依赖配置
   */
  async saveDependencies() {
    await fs.writeFile(
      this.dependenciesFile,
      JSON.stringify(Array.from(this.installedDependencies), null, 2)
    );
  }

  /**
   * 构建依赖图
   */
  buildDependencyGraph(plugins) {
    this.dependencyGraph.clear();

    plugins.forEach(plugin => {
      const dependencies = plugin.metadata?.dependencies || [];
      this.dependencyGraph.set(plugin.id, dependencies);
    });
  }

  /**
   * 检查循环依赖
   */
  checkCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (pluginId) => {
      if (recursionStack.has(pluginId)) {
        return true;
      }
      if (visited.has(pluginId)) {
        return false;
      }

      visited.add(pluginId);
      recursionStack.add(pluginId);

      const dependencies = this.dependencyGraph.get(pluginId) || [];
      for (const dep of dependencies) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      recursionStack.delete(pluginId);
      return false;
    };

    for (const pluginId of this.dependencyGraph.keys()) {
      if (hasCycle(pluginId)) {
        return {
          hasCycle: true,
          cycle: Array.from(recursionStack)
        };
      }
    }

    return { hasCycle: false };
  }

  /**
   * 解析依赖顺序（拓扑排序）
   */
  resolveLoadOrder() {
    const visited = new Set();
    const order = [];

    const visit = (pluginId) => {
      if (visited.has(pluginId)) {
        return;
      }

      visited.add(pluginId);

      const dependencies = this.dependencyGraph.get(pluginId) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      order.push(pluginId);
    };

    for (const pluginId of this.dependencyGraph.keys()) {
      visit(pluginId);
    }

    return order.reverse();
  }

  /**
   * 检查插件依赖是否满足
   */
  checkDependencies(pluginId) {
    const dependencies = this.dependencyGraph.get(pluginId) || [];
    const missing = [];
    const unsatisfied = [];

    dependencies.forEach(dep => {
      const depParts = dep.split('@');
      const depName = depParts[0];
      const depVersion = depParts[1];

      // 检查是否安装
      const installedPlugin = this.pluginManager.plugins.get(depName);
      if (!installedPlugin) {
        missing.push(depName);
        return;
      }

      // 检查版本（如果指定）
      if (depVersion) {
        const installedVersion = installedPlugin.metadata?.version || '0.0.0';
        if (!this.satisfiesVersion(installedVersion, depVersion)) {
          unsatisfied.push({
            dependency: depName,
            required: depVersion,
            installed: installedVersion
          });
        }
      }
    });

    return {
      satisfied: missing.length === 0 && unsatisfied.length === 0,
      missing,
      unsatisfied
    };
  }

  /**
   * 版本检查
   */
  satisfiesVersion(installed, required) {
    const instParts = installed.split('.').map(Number);
    const reqParts = required.split('.').map(Number);

    for (let i = 0; i < reqParts.length; i++) {
      if (instParts[i] === undefined) {
        return false;
      }
      if (instParts[i] > reqParts[i]) {
        return true;
      }
      if (instParts[i] < reqParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取依赖树
   */
  getDependencyTree(pluginId, depth = 0) {
    const dependencies = this.dependencyGraph.get(pluginId) || [];
    const tree = {};

    dependencies.forEach(dep => {
      tree[dep] = this.getDependencyTree(dep, depth + 1);
    });

    return tree;
  }

  /**
   * 获取反向依赖（哪些插件依赖当前插件）
   */
  getReverseDependencies(pluginId) {
    const reverse = [];

    for (const [id, deps] of this.dependencyGraph.entries()) {
      if (deps.includes(pluginId)) {
        reverse.push(id);
      }
    }

    return reverse;
  }

  /**
   * 安装依赖
   */
  async installDependencies(pluginId) {
    const dependencies = this.dependencyGraph.get(pluginId) || [];
    const results = [];

    for (const dep of dependencies) {
      const check = this.checkDependencies(dep);
      if (!check.satisfied) {
        results.push({
          dependency: dep,
          status: 'failed',
          reason: check.missing.length > 0
            ? `缺少依赖: ${check.missing.join(', ')}`
            : `版本不满足: ${check.unsatisfied.map(u => `${u.dependency} 需要 ${u.required}`).join(', ')}`
        });
      } else {
        results.push({
          dependency: dep,
          status: 'installed'
        });
      }
    }

    return results;
  }

  /**
   * 检查是否可以安全卸载
   */
  canSafelyUnload(pluginId) {
    const reverse = this.getReverseDependencies(pluginId);
    return {
      canUnload: reverse.length === 0,
      dependents: reverse
    };
  }

  /**
   * 获取依赖报告
   */
  getDependencyReport() {
    const report = {
      totalPlugins: this.dependencyGraph.size,
      pluginsWithDependencies: 0,
      hasCycles: false,
      cycleInfo: null,
      loadOrder: [],
      dependenciesSummary: {}
    };

    for (const [pluginId, deps] of this.dependencyGraph.entries()) {
      if (deps.length > 0) {
        report.pluginsWithDependencies++;
        report.dependenciesSummary[pluginId] = deps;
      }
    }

    const cycleCheck = this.checkCircularDependencies();
    report.hasCycles = cycleCheck.hasCycle;
    report.cycleInfo = cycleCheck.cycle;

    report.loadOrder = this.resolveLoadOrder();

    return report;
  }
}
