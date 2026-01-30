/**
 * 上下文感知帮助系统
 * 根据用户状态、历史和上下文提供智能帮助建议
 */

import { logger } from './logger.js';
import { COMMAND_HELP } from './messages.js';
import { getRecommendations } from './recommendation-engine.js';
import { analyzeAndSuggest } from './auto-fix.js';
import { getActiveConfig, listProfiles } from '../config.js';

/**
 * 上下文类型枚举
 */
export const ContextType = {
  IDLE: 'idle',                    // 空闲状态
  CHATTING: 'chatting',            // 正在对话
  EDITING: 'editing',              // 正在编辑
  ERROR: 'error',                  // 错误状态
  CONFIG: 'config',                // 配置中
  SESSION: 'session',              // 会话管理
  BRANCH: 'branch',                // 分支操作
  RAG: 'rag',                     // RAG 操作
  GIT: 'git',                     // Git 操作
  FILE: 'file',                   // 文件操作
  TOOL: 'tool',                   // 工具使用
  NEW_USER: 'new_user'            // 新用户
};

/**
 * 上下文状态类
 */
class ContextState {
  constructor() {
    this.contextType = ContextType.IDLE;
    this.previousCommands = [];
    this.lastError = null;
    this.sessionId = null;
    this.messageCount = 0;
    this.configuredFeatures = new Set();
    this.userLevel = 'intermediate'; // beginner, intermediate, advanced
    this.lastActionTime = null;
  }

  /**
   * 更新上下文类型
   */
  setContextType(type) {
    this.contextType = type;
    this.lastActionTime = new Date().toISOString();
  }

  /**
   * 记录命令
   */
  recordCommand(command) {
    this.previousCommands.push({
      command,
      timestamp: new Date().toISOString()
    });

    // 只保留最近 50 条命令
    if (this.previousCommands.length > 50) {
      this.previousCommands.shift();
    }

    // 更新用户等级
    this.updateUserLevel();

    // 检测配置的功能
    this.detectConfiguredFeatures(command);
  }

  /**
   * 设置会话 ID
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * 设置消息数量
   */
  setMessageCount(count) {
    this.messageCount = count;
  }

  /**
   * 记录错误
   */
  recordError(error) {
    this.lastError = {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 更新用户等级
   */
  updateUserLevel() {
    const commandCount = this.previousCommands.length;
    const uniqueCommands = new Set(this.previousCommands.map(c => c.command.split(' ')[0]));

    if (commandCount < 10) {
      this.userLevel = 'beginner';
    } else if (commandCount < 50) {
      this.userLevel = 'intermediate';
    } else {
      this.userLevel = 'advanced';
    }

    // 根据使用的命令数量调整
    if (uniqueCommands.size > 10) {
      this.userLevel = 'advanced';
    } else if (uniqueCommands.size > 5) {
      this.userLevel = 'intermediate';
    }
  }

  /**
   * 检测已配置的功能
   */
  detectConfiguredFeatures(command) {
    const features = {
      'rag': ['index', 'search'],
      'git': ['commit', 'review', 'git'],
      'session': ['session'],
      'branch': ['branch'],
      'config': ['config'],
      'tools': ['tools']
    };

    const commandBase = command.split(' ')[0];
    for (const [feature, commands] of Object.entries(features)) {
      if (commands.includes(commandBase)) {
        this.configuredFeatures.add(feature);
      }
    }
  }

  /**
   * 获取常用命令
   */
  getCommonCommands() {
    const counts = {};
    this.previousCommands.forEach(cmd => {
      const base = cmd.command.split(' ')[0];
      counts[base] = (counts[base] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd, count]) => ({ command: cmd, count }));
  }

  /**
   * 获取上下文摘要
   */
  getSummary() {
    return {
      contextType: this.contextType,
      userLevel: this.userLevel,
      messageCount: this.messageCount,
      configuredFeatures: Array.from(this.configuredFeatures),
      recentCommands: this.previousCommands.slice(-5).map(c => c.command),
      hasError: !!this.lastError,
      timeSinceLastAction: this.lastActionTime
        ? Date.now() - new Date(this.lastActionTime).getTime()
        : null
    };
  }
}

/**
 * 上下文感知帮助引擎
 */
export class ContextualHelpEngine {
  constructor(options = {}) {
    this.options = {
      maxSuggestions: options.maxSuggestions || 5,
      enableRecommendations: options.enableRecommendations !== false,
      enableAutoFix: options.enableAutoFix !== false,
      ...options
    };

    this.context = new ContextState();
    this.helpRules = new Map();
    this.initializeHelpRules();
  }

  /**
   * 初始化帮助规则
   */
  initializeHelpRules() {
    // 新用户引导
    this.registerHelpRule({
      id: 'new_user_welcome',
      contextType: ContextType.NEW_USER,
      priority: 100,
      matcher: (ctx) => ctx.userLevel === 'beginner' && ctx.messageCount === 0,
      generator: () => ({
        title: '👋 欢迎使用 xzChat!',
        description: '让我帮你快速开始',
        type: 'welcome',
        suggestions: [
          {
            action: '开始对话',
            command: '直接输入你的问题开始对话',
            description: 'xzChat 会智能理解并回答你的问题'
          },
          {
            action: '查看帮助',
            command: '/help',
            description: '查看所有可用命令和功能'
          },
          {
            action: '配置向导',
            command: '/config init',
            description: '使用交互式向导配置 API'
          }
        ],
        tips: [
          '💡 提示: 按 Tab 键可以自动补全命令',
          '💡 提示: 使用 Ctrl+L 清屏，Ctrl+R 重新发送',
          '💡 提示: 输入 /help 查看更多帮助'
        ]
      })
    });

    // 空闲状态
    this.registerHelpRule({
      id: 'idle_suggestions',
      contextType: ContextType.IDLE,
      priority: 70,
      matcher: (ctx) => ctx.contextType === ContextType.IDLE && ctx.messageCount > 0,
      generator: (ctx) => {
        const commonCommands = ctx.getCommonCommands();
        return {
          title: '💡 下一步建议',
          description: '基于你之前的使用习惯',
          type: 'suggestions',
          suggestions: [
            {
              action: '继续对话',
              command: '直接输入问题',
              description: '继续与 AI 对话'
            },
            {
              action: '查看历史',
              command: '/history',
              description: '查看对话历史'
            },
            ...(commonCommands.length > 0 ? [{
              action: '常用操作',
              command: commonCommands[0].command,
              description: `你已使用 ${commonCommands[0].count} 次`
            }] : [])
          ]
        };
      }
    });

    // 错误状态
    this.registerHelpRule({
      id: 'error_recovery',
      contextType: ContextType.ERROR,
      priority: 100,
      matcher: (ctx) => ctx.hasError && ctx.lastError,
      generator: (ctx) => {
        // 使用自动修复建议
        const error = ctx.lastError;
        const errorObj = new Error(error.message);
        if (error.code) errorObj.code = error.code;

        const fixAnalysis = analyzeAndSuggest(errorObj);

        return {
          title: '🔧 错误修复建议',
          description: '检测到错误，以下是修复建议',
          type: 'error_fix',
          error: error,
          suggestions: fixAnalysis.suggestions.slice(0, 3).map(s => ({
            action: s.title,
            command: s.quickFix || s.actions?.[0]?.command,
            description: s.description
          })),
          tips: [
            '💡 提示: 如果问题持续，查看 /help 获取更多帮助',
            '💡 提示: 某些错误可能需要重新配置'
          ]
        };
      }
    });

    // 配置状态
    this.registerHelpRule({
      id: 'config_help',
      contextType: ContextType.CONFIG,
      priority: 90,
      matcher: (ctx) => ctx.contextType === ContextType.CONFIG,
      generator: () => {
        const config = getActiveConfig();
        const profiles = listProfiles();

        return {
          title: '⚙️  配置帮助',
          description: '当前配置信息',
          type: 'config',
          currentConfig: {
            provider: config.provider,
            model: config.model,
            baseUrl: config.baseUrl
          },
          profiles: profiles.length,
          suggestions: [
            {
              action: '查看配置',
              command: '/config show',
              description: '查看当前配置'
            },
            {
              action: '切换 Profile',
              command: '/profile list',
              description: `当前有 ${profiles.length} 个 Profile`
            },
            {
              action: '重置配置',
              command: '/config reset',
              description: '恢复默认配置'
            }
          ]
        };
      }
    });

    // 会话状态
    this.registerHelpRule({
      id: 'session_help',
      contextType: ContextType.SESSION,
      priority: 80,
      matcher: (ctx) => ctx.contextType === ContextType.SESSION,
      generator: (ctx) => {
        const sessionInfo = COMMAND_HELP.session;

        return {
          title: '📁 会话管理',
          description: sessionInfo.summary,
          type: 'session',
          subcommands: sessionInfo.subcommands,
          suggestions: [
            {
              action: '列出会话',
              command: '/session list',
              description: '查看所有会话'
            },
            {
              action: '创建会话',
              command: '/session new <name>',
              description: '创建新的会话'
            },
            {
              action: '搜索会话',
              command: '/session search <keyword>',
              description: '搜索历史内容'
            }
          ],
          tips: sessionInfo.tips
        };
      }
    });

    // 分支状态
    this.registerHelpRule({
      id: 'branch_help',
      contextType: ContextType.BRANCH,
      priority: 80,
      matcher: (ctx) => ctx.contextType === ContextType.BRANCH,
      generator: () => {
        const branchInfo = COMMAND_HELP.branch;

        return {
          title: '🌳 分支管理',
          description: branchInfo.summary,
          type: 'branch',
          subcommands: branchInfo.subcommands,
          suggestions: [
            {
              action: '列出分支',
              command: '/branch list',
              description: '查看所有分支'
            },
            {
              action: '创建分支',
              command: '/branch create <描述>',
              description: '从当前对话创建分支'
            },
            {
              action: '比较分支',
              command: '/branch compare <id1> <id2>',
              description: '比较两个分支的差异'
            }
          ],
          tips: branchInfo.tips
        };
      }
    });

    // RAG 状态
    this.registerHelpRule({
      id: 'rag_help',
      contextType: ContextType.RAG,
      priority: 80,
      matcher: (ctx) => ctx.contextType === ContextType.RAG,
      generator: () => {
        const indexInfo = COMMAND_HELP.index;
        const searchInfo = COMMAND_HELP.search;

        return {
          title: '🔍 代码搜索',
          description: '使用 RAG 技术搜索代码库',
          type: 'rag',
          suggestions: [
            {
              action: '建立索引',
              command: '/index [目录]',
              description: '为代码库建立向量索引'
            },
            {
              action: '搜索代码',
              command: '/search <查询>',
              description: '搜索相关代码片段'
            },
            {
              action: '查看索引状态',
              command: '/rag status',
              description: '查看索引状态'
            }
          ],
          tips: [
            ...indexInfo.tips,
            ...searchInfo.tips
          ]
        };
      }
    });

    // Git 操作状态
    this.registerHelpRule({
      id: 'git_help',
      contextType: ContextType.GIT,
      priority: 80,
      matcher: (ctx) => ctx.contextType === ContextType.GIT,
      generator: () => {
        const commitInfo = COMMAND_HELP.commit;
        const reviewInfo = COMMAND_HELP.review;

        return {
          title: '📝 Git 辅助',
          description: 'AI 驱动的 Git 工具',
          type: 'git',
          suggestions: [
            {
              action: '生成提交信息',
              command: '/commit',
              description: '自动生成符合规范的提交信息'
            },
            {
              action: '代码审查',
              command: '/review',
              description: 'AI 代码审查'
            },
            {
              action: '查看 Git 日志',
              command: '/git log',
              description: '查看提交历史'
            }
          ],
          tips: [
            ...commitInfo.tips,
            ...reviewInfo.tips
          ]
        };
      }
    });

    // 文件操作状态
    this.registerHelpRule({
      id: 'file_help',
      contextType: ContextType.FILE,
      priority: 75,
      matcher: (ctx) => ctx.contextType === ContextType.FILE,
      generator: () => {
        const loadInfo = COMMAND_HELP.load;
        const scanInfo = COMMAND_HELP.scan;

        return {
          title: '📄 文件操作',
          description: '加载和查看文件',
          type: 'file',
          suggestions: [
            {
              action: '加载文件',
              command: '/load [文件]',
              description: '加载文件到对话上下文'
            },
            {
              action: '扫描项目',
              command: '/scan',
              description: '扫描项目结构'
            },
            {
              action: '打开文件',
              command: '/open <文件>',
              description: '用默认程序打开'
            }
          ],
          tips: [
            ...loadInfo.tips,
            ...scanInfo.tips
          ]
        };
      }
    });

    // 插件系统状态
    this.registerHelpRule({
      id: 'plugin_help',
      contextType: ContextType.CONFIG,
      priority: 85,
      matcher: (ctx) => ctx.contextType === ContextType.CONFIG,
      generator: () => {
        const pluginInfo = COMMAND_HELP.plugin;

        return {
          title: '🔌 插件管理',
          description: pluginInfo.summary,
          type: 'plugin',
          subcommands: pluginInfo.subcommands,
          suggestions: [
            {
              action: '列出插件',
              command: '/plugin list',
              description: '查看所有已安装插件'
            },
            {
              action: '启用插件',
              command: '/plugin enable <name>',
              description: '启用指定插件'
            },
            {
              action: '查看插件信息',
              command: '/plugin info <name>',
              description: '查看插件详细信息'
            },
            {
              action: '插件市场',
              command: '/plugin marketplace',
              description: '浏览和安装插件'
            },
            {
              action: '插件验证',
              command: '/plugin validate <name>',
              description: '验证插件代码质量'
            }
          ],
          tips: [
            ...pluginInfo.tips,
            '💡 提示: 插件可以扩展命令、钩子和中间件',
            '💡 提示: 使用性能监控查看插件运行状态'
          ]
        };
      }
    });

    // 对话中状态
    this.registerHelpRule({
      id: 'chatting_help',
      contextType: ContextType.CHATTING,
      priority: 60,
      matcher: (ctx) => ctx.contextType === ContextType.CHATTING && ctx.messageCount > 5,
      generator: (ctx) => {
        const suggestions = [];

        // 基于对话长度建议
        if (ctx.messageCount > 10) {
          suggestions.push({
            action: '创建分支',
            command: '/branch create <描述>',
            description: '当前对话较长，可以创建分支保存不同方向'
          });
        }

        // 基于配置的功能建议
        if (ctx.configuredFeatures.has('rag')) {
          suggestions.push({
            action: '搜索相关代码',
            command: '/search <关键词>',
            description: '在代码库中查找相关实现'
          });
        }

        if (ctx.configuredFeatures.has('git')) {
          suggestions.push({
            action: '代码审查',
            command: '/review',
            description: '让 AI 审查当前代码变更'
          });
        }

        return {
          title: '💡 对话建议',
          description: '基于当前对话状态',
          type: 'chatting',
          suggestions: suggestions.length > 0 ? suggestions : [
            {
              action: '继续对话',
              command: '直接输入问题',
              description: '继续当前对话'
            },
            {
              action: '创建分支',
              command: '/branch create 新方向',
              description: '探索不同的实现方式'
            }
          ]
        };
      }
    });

    // 高级用户
    this.registerHelpRule({
      id: 'advanced_features',
      contextType: ContextType.IDLE,
      priority: 50,
      matcher: (ctx) => ctx.userLevel === 'advanced',
      generator: (ctx) => {
        return {
          title: '⚡ 高级功能',
          description: '你已经是高级用户，这里有一些高级功能',
          type: 'advanced',
          suggestions: [
            {
              action: '插件系统',
              command: '/plugins list',
              description: '查看和管理插件'
            },
            {
              action: '成本分析',
              command: '/token all',
              description: '查看详细的成本统计'
            },
            {
              action: '批量处理',
              command: '/batch',
              description: '批量处理多个查询'
            }
          ],
          tips: [
            '💡 提示: 使用 Profile 管理多套配置',
            '💡 提示: 分支系统适合并行探索',
            '💡 提示: RAG 搜索可以大幅提高效率'
          ]
        };
      }
    });
  }

  /**
   * 注册帮助规则
   */
  registerHelpRule(rule) {
    this.helpRules.set(rule.id, rule);
  }

  /**
   * 更新上下文
   */
  updateContext(updates) {
    if (updates.contextType) {
      this.context.setContextType(updates.contextType);
    }
    if (updates.sessionId) {
      this.context.setSessionId(updates.sessionId);
    }
    if (updates.messageCount !== undefined) {
      this.context.setMessageCount(updates.messageCount);
    }
    if (updates.command) {
      this.context.recordCommand(updates.command);
      // 自动检测上下文类型
      this.detectContextFromCommand(updates.command);
    }
    if (updates.error) {
      this.context.recordError(updates.error);
      this.context.setContextType(ContextType.ERROR);
    }
  }

  /**
   * 从命令检测上下文类型
   */
  detectContextFromCommand(command) {
    const commandBase = command.split(' ')[0];

    const contextMap = {
      '/session': ContextType.SESSION,
      '/branch': ContextType.BRANCH,
      '/config': ContextType.CONFIG,
      '/profile': ContextType.CONFIG,
      '/index': ContextType.RAG,
      '/search': ContextType.RAG,
      '/rag': ContextType.RAG,
      '/commit': ContextType.GIT,
      '/review': ContextType.GIT,
      '/git': ContextType.GIT,
      '/load': ContextType.FILE,
      '/open': ContextType.FILE,
      '/scan': ContextType.FILE
    };

    if (contextMap[commandBase]) {
      this.context.setContextType(contextMap[commandBase]);
    } else {
      this.context.setContextType(ContextType.CHATTING);
    }
  }

  /**
   * 获取上下文帮助
   */
  getContextualHelp() {
    const summary = this.context.getSummary();
    const matchedRules = [];

    // 查找匹配的规则
    for (const [id, rule] of this.helpRules) {
      try {
        if (rule.matcher(summary)) {
          const help = rule.generator(summary);
          matchedRules.push({
            id,
            priority: rule.priority,
            help
          });
        }
      } catch (error) {
        logger.error('生成上下文帮助失败', { id, error: error.message });
      }
    }

    // 按优先级排序
    matchedRules.sort((a, b) => b.priority - a.priority);

    // 获取智能推荐
    let recommendations = [];
    if (this.options.enableRecommendations) {
      try {
        recommendations = getRecommendations({
          sessionId: this.context.sessionId
        });
      } catch (error) {
        logger.error('获取推荐失败', { error: error.message });
      }
    }

    // 限制数量
    const topRules = matchedRules.slice(0, 2);
    const helpItems = [];

    for (const rule of topRules) {
      helpItems.push(rule.help);
    }

    return {
      context: summary,
      helps: helpItems,
      recommendations: recommendations.slice(0, 3)
    };
  }

  /**
   * 格式化帮助输出
   */
  formatHelpOutput(contextualHelp) {
    const lines = [];

    if (contextualHelp.helps.length === 0) {
      lines.push('\n💡 提示: 输入 /help 查看所有命令\n');
      return lines.join('\n');
    }

    for (const help of contextualHelp.helps) {
      lines.push('\n' + '='.repeat(60));
      lines.push(`  ${help.title}`);
      lines.push('='.repeat(60));
      lines.push(`  ${help.description}`);
      lines.push('');

      // 显示建议
      if (help.suggestions && help.suggestions.length > 0) {
        lines.push('  📌 建议:');
        help.suggestions.forEach((s, idx) => {
          lines.push(`    ${idx + 1}. ${s.action}`);
          if (s.command) {
            lines.push(`       命令: ${s.command}`);
          }
          if (s.description) {
            lines.push(`       ${s.description}`);
          }
          lines.push('');
        });
      }

      // 显示提示
      if (help.tips && help.tips.length > 0) {
        lines.push('  💡 提示:');
        help.tips.forEach(tip => {
          lines.push(`    ${tip}`);
        });
      }

      lines.push('='.repeat(60));
    }

    // 显示推荐命令
    if (contextualHelp.recommendations.length > 0) {
      lines.push('\n⭐ 推荐命令:');
      contextualHelp.recommendations.forEach((rec, idx) => {
        lines.push(`  ${idx + 1}. ${rec.command} - ${rec.description}`);
        if (rec.confidence > 0.7) {
          lines.push(`     🎯 高度相关`);
        }
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 获取简短帮助
   */
  getQuickHelp() {
    const help = this.getContextualHelp();
    const quickLines = [];

    if (help.helps.length > 0) {
      const primaryHelp = help.helps[0];
      quickLines.push(`\n${primaryHelp.title}`);
      quickLines.push(`${primaryHelp.description}`);

      if (primaryHelp.suggestions && primaryHelp.suggestions.length > 0) {
        primaryHelp.suggestions.slice(0, 2).forEach((s, idx) => {
          quickLines.push(`  ${idx + 1}. ${s.action}: ${s.command}`);
        });
      }
    }

    return quickLines.join('\n');
  }

  /**
   * 打印帮助
   */
  printHelp() {
    const help = this.getContextualHelp();
    const output = this.formatHelpOutput(help);
    console.log(output);

    logger.info('显示上下文帮助', {
      contextType: help.context.contextType,
      userLevel: help.context.userLevel
    });

    return help;
  }

  /**
   * 获取 JSON 格式
   */
  toJSON() {
    const help = this.getContextualHelp();
    return JSON.stringify(help, null, 2);
  }
}

// 创建单例实例
const defaultEngine = new ContextualHelpEngine();

/**
 * 快捷函数
 */
export function updateContext(updates) {
  defaultEngine.updateContext(updates);
}

export function getContextualHelp() {
  return defaultEngine.getContextualHelp();
}

export function printContextualHelp() {
  return defaultEngine.printHelp();
}

export function getQuickHelp() {
  return defaultEngine.getQuickHelp();
}

export default ContextualHelpEngine;
