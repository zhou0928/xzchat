import {
  handleHelp,
  handleExit,
  handleClear,
  handleConfig,
  handleSystem,
  handleInit,
  handleConfigWizard,
  handleReload
} from "./basic.js";
import {
  handleSession,
  handleHistory,
  handleInitCommand
} from "./session.js";
import {
  handleModels,
  handleRole,
  handleThink
} from "./model.js";
import {
  handleScan,
  handleLoad,
  handlePaste,
  handleCopy,
  handleOptimize
} from "./file.js";
import { handleCommit } from "./git.js";
import { handleMCP } from "./mcp.js";
import { handleRAG } from "./rag.js";
import { handleVoice, handleTTS } from "./voice.js";
import {
  handleAuto,
  handleOpen,
  handleContext,
  handleToken,
  handleCompress,
  handleTools,
  handleEditor,
  handleReview
} from "./advanced.js";

// 新增功能导入
import {
  handleComplete,
  handleCompleteInline
} from "./completion.js";
import {
  handleBatchSearch,
  handleBatchReplace,
  handleBatchAnalyze,
  handleBatchCheck
} from "./batch.js";
import {
  handleRAGIncrementalCheck,
  handleRAGIncrementalUpdate,
  handleRAGIndexClean,
  handleRAGIndexStats
} from "../../lib/utils/rag-incremental.js";

// 高级功能导入
import {
  handleBranch,
  handleCost,
  handleAchievement,
  handleSecureStore,
  handleAuditLog,
  handleAutoFix,
  handleDashboard
} from "./advanced-features.js";

// P2功能导入
import {
  handleLanguage,
  handleLang
} from "./language.js";
import {
  handleTheme,
  handleTh
} from "./theme.js";
import { handleWeb } from "./web.js";

// 插件系统导入
import { handlePlugin } from "./plugin.js";

// 新增功能导入
import { handleExportCommand } from "./export.js";
import { handleFindCommand } from "./find.js";
import { handleAliasCommand } from "./alias.js";
import { handlePromptCommand } from "./prompt.js";

/**
 * 命令定义
 * 使用命令模式，每个命令都有统一的接口
 */
export class Command {
  constructor(config) {
    this.name = config.name;
    this.aliases = config.aliases || [];
    this.description = config.description || '';
    this.handler = config.handler;
    this.category = config.category || 'general';
    this.requiredContext = config.requiredContext || [];
    this.async = config.async !== false;
  }

  /**
   * 检查是否匹配此命令
   */
  matches(command) {
    return this.name === command || this.aliases.includes(command);
  }

  /**
   * 执行命令
   */
  async execute(input, context) {
    // 检查必需的上下文
    this.validateContext(context);

    // 调用处理器
    if (this.async) {
      return await this.handler(input, context);
    } else {
      return this.handler(input, context);
    }
  }

  /**
   * 验证上下文
   */
  validateContext(context) {
    for (const key of this.requiredContext) {
      if (!(key in context)) {
        throw new Error(`缺少必需的上下文: ${key}`);
      }
    }
  }
}

/**
 * 命令注册表
 */
export class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.categories = new Map();
  }

  /**
   * 注册命令
   */
  register(command) {
    // 注册主命令
    this.commands.set(command.name, command);

    // 注册别名
    for (const alias of command.aliases) {
      this.commands.set(alias, command);
    }

    // 添加到分类
    if (!this.categories.has(command.category)) {
      this.categories.set(command.category, []);
    }
    this.categories.get(command.category).push(command);
  }

  /**
   * 查找命令
   */
  find(command) {
    // 提取命令（第一个以 / 开头的词）
    const match = command?.match(/^\/\S+/);
    if (!match) {
      return null;
    }

    const cmd = match[0];
    return this.commands.get(cmd) || null;
  }

  /**
   * 执行命令
   */
  async execute(input, context) {
    const command = this.find(input);
    
    if (!command) {
      return { handled: false };
    }

    try {
      const result = await command.execute(input, context);
      return { handled: true, result };
    } catch (error) {
      console.error(`❌ 命令执行失败 (${command.name}):`, error.message);
      return { handled: true, error };
    }
  }

  /**
   * 获取所有命令
   */
  getAll() {
    return Array.from(this.commands.values());
  }

  /**
   * 按分类获取命令
   */
  getByCategory(category) {
    return this.categories.get(category) || [];
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }
}

/**
 * 创建默认命令注册表
 */
export function createDefaultRegistry() {
  const registry = new CommandRegistry();

  // 基础命令
  registry.register(new Command({
    name: '/help',
    aliases: ['/?'],
    description: '显示帮助信息',
    category: 'basic',
    handler: (input, context) => handleHelp()
  }));

  registry.register(new Command({
    name: '/exit',
    aliases: ['/quit'],
    description: '退出程序',
    category: 'basic',
    handler: (input, context) => handleExit()
  }));

  registry.register(new Command({
    name: '/clear',
    description: '清除屏幕',
    category: 'basic',
    requiredContext: ['messages', 'currentSession', 'clearHistory'],
    handler: async (input, context) => await handleClear(context.messages, context.currentSession, context.clearHistory)
  }));

  registry.register(new Command({
    name: '/config',
    aliases: ['/配置'],
    description: '配置管理',
    category: 'basic',
    requiredContext: ['loadConfig', 'updateConfig', 'getActiveConfig', 'setProfileValue', 'getCcSwitchProviders', 'askQuestion', 'rl'],
    handler: async (input, context) => await handleConfig(
      input,
      context.loadConfig,
      context.updateConfig,
      context.getActiveConfig,
      context.setProfileValue,
      context.getCcSwitchProviders,
      context.askQuestion,
      context.rl
    )
  }));

  registry.register(new Command({
    name: '/system',
    description: '设置系统提示词',
    category: 'basic',
    requiredContext: ['activeConfig', 'updateConfig', 'setProfileValue', 'loadConfig'],
    handler: async (input, context) => await handleSystem(
      input,
      context.activeConfig,
      context.updateConfig,
      context.setProfileValue,
      context.loadConfig
    )
  }));

  registry.register(new Command({
    name: '/init',
    aliases: ['/初始化配置'],
    description: '初始化配置文件',
    category: 'basic',
    requiredContext: ['initProjectConfigFile'],
    handler: (input, context) => handleInit(context.initProjectConfigFile)
  }));

  registry.register(new Command({
    name: '/config-wizard',
    aliases: ['/配置向导'],
    description: '交互式配置向导',
    category: 'basic',
    requiredContext: ['askQuestion'],
    handler: async (input, context) => await handleConfigWizard(context.askQuestion)
  }));

  registry.register(new Command({
    name: '/reload',
    aliases: ['/重新加载'],
    description: '重新加载配置 (从 CC Switch)',
    category: 'basic',
    requiredContext: ['loadConfig', 'getActiveConfig'],
    handler: async (input, context) => await handleReload(context.loadConfig, context.getActiveConfig)
  }));

  // 会话命令
  registry.register(new Command({
    name: '/session',
    description: '会话管理',
    category: 'session',
    requiredContext: ['currentSession', 'messages', 'saveHistory', 'loadHistory', 'updateConfig', 'setProfileValue', 'listSessions', 'clearHistory'],
    handler: async (input, context) => await handleSession(
      input,
      context.currentSession,
      context.messages,
      context.saveHistory,
      context.loadHistory,
      context.updateConfig,
      context.setProfileValue,
      context.listSessions,
      context.clearHistory
    )
  }));

  registry.register(new Command({
    name: '/history',
    description: '查看历史记录',
    category: 'session',
    requiredContext: ['messages', 'exportHistory'],
    handler: async (input, context) => await handleHistory(context.messages, context.exportHistory)
  }));

  // 模型命令
  registry.register(new Command({
    name: '/models',
    description: '查看可用模型',
    category: 'model',
    requiredContext: ['loadConfig', 'getActiveConfig', 'fetchModels', 'askQuestion'],
    handler: async (input, context) => await handleModels(
      context.loadConfig,
      context.getActiveConfig,
      context.fetchModels,
      context.askQuestion
    )
  }));

  registry.register(new Command({
    name: '/role',
    aliases: ['/角色'],
    description: '设置角色',
    category: 'model',
    requiredContext: ['loadConfig', 'setRole'],
    handler: async (input, context) => await handleRole(input, context.loadConfig, context.setRole)
  }));

  registry.register(new Command({
    name: '/think',
    description: '设置思考模式',
    category: 'model',
    requiredContext: ['loadConfig', 'updateConfig', 'setProfileValue', 'getActiveConfig'],
    handler: async (input, context) => await handleThink(
      input,
      context.loadConfig,
      context.updateConfig,
      context.setProfileValue,
      context.getActiveConfig
    )
  }));

  // 文件命令
  registry.register(new Command({
    name: '/scan',
    aliases: ['/当前项目结构'],
    description: '扫描项目结构',
    category: 'file',
    requiredContext: ['askQuestion', 'addToContext'],
    handler: async (input, context) => await handleScan(input, context.askQuestion, context.addToContext)
  }));

  registry.register(new Command({
    name: '/load',
    description: '加载文件',
    category: 'file',
    requiredContext: ['askQuestion', 'addToContext', 'rl'],
    handler: async (input, context) => await handleLoad(input, context.askQuestion, context.addToContext, context.rl)
  }));

  registry.register(new Command({
    name: '/paste',
    description: '粘贴内容',
    category: 'file',
    handler: (input, context) => handlePaste()
  }));

  registry.register(new Command({
    name: '/copy',
    description: '复制内容',
    category: 'file',
    requiredContext: ['messages', 'copyToClipboard'],
    handler: async (input, context) => await handleCopy(input, context.messages, context.copyToClipboard)
  }));

  registry.register(new Command({
    name: '/optimize',
    aliases: ['/opt'],
    description: '优化代码',
    category: 'file',
    requiredContext: ['activeConfig', 'generateCompletion', 'mainChat'],
    handler: async (input, context) => await handleOptimize(
      input,
      context.activeConfig,
      context.generateCompletion,
      context.mainChat
    )
  }));

  // Git 命令
  registry.register(new Command({
    name: '/commit',
    description: 'Git 提交',
    category: 'git',
    requiredContext: ['activeConfig', 'generateCompletion', 'askQuestion'],
    handler: async (input, context) => await handleCommit(
      context.activeConfig,
      context.generateCompletion,
      context.askQuestion
    )
  }));

  // MCP 命令
  registry.register(new Command({
    name: '/mcp',
    description: 'MCP 管理',
    category: 'mcp',
    requiredContext: ['config', 'mcpClients', 'updateConfig', 'loadConfig', 'askQuestion'],
    handler: async (input, context) => await handleMCP(
      input,
      context.config,
      context.mcpClients,
      context.updateConfig,
      context.loadConfig,
      context.askQuestion
    )
  }));

  // RAG 命令
  registry.register(new Command({
    name: '/rag',
    description: '知识库检索',
    category: 'rag',
    requiredContext: ['activeConfig'],
    handler: async (input, context) => await handleRAG(input, context.activeConfig)
  }));

  // 语音命令
  registry.register(new Command({
    name: '/voice',
    description: '语音输入',
    category: 'voice',
    requiredContext: ['askQuestion', 'mainChat', 'rl'],
    handler: async (input, context) => await handleVoice(context.askQuestion, context.mainChat, context.rl)
  }));

  registry.register(new Command({
    name: '/tts',
    description: '语音朗读',
    category: 'voice',
    requiredContext: ['messages', 'activeConfig'],
    handler: async (input, context) => {
      const result = await handleTTS(input, context.messages, context.activeConfig);
      if (result && result.toggle) {
        context.ttsEnabled = !context.ttsEnabled;
        console.log(`✅ 语音朗读 (TTS) 已${context.ttsEnabled ? "开启" : "关闭"}`);
        return undefined;
      }
      return result;
    }
  }));

  // 高级命令
  registry.register(new Command({
    name: '/auto',
    description: '自动模式',
    category: 'advanced',
    requiredContext: ['mainChat'],
    handler: async (input, context) => await handleAuto(input, context.mainChat)
  }));

  registry.register(new Command({
    name: '/open',
    description: '打开文件',
    category: 'advanced',
    handler: async (input, context) => await handleOpen(input)
  }));

  registry.register(new Command({
    name: '/context',
    description: '查看上下文',
    category: 'advanced',
    requiredContext: ['messages'],
    handler: (input, context) => handleContext(context.messages)
  }));

  registry.register(new Command({
    name: '/token',
    description: 'Token 统计',
    category: 'advanced',
    requiredContext: ['messages', 'estimateTokens', 'calculateCost'],
    handler: (input, context) => handleToken(context.messages, context.estimateTokens, context.calculateCost)
  }));

  registry.register(new Command({
    name: '/compress',
    description: '压缩对话历史',
    category: 'advanced',
    requiredContext: ['messages', 'currentSession', 'saveHistory'],
    handler: async (input, context) => {
      const result = await handleCompress(context.messages, context.currentSession, context.saveHistory);
      if (result && result.newMessages) {
        context.messages = result.newMessages;
      }
      return result;
    }
  }));

  registry.register(new Command({
    name: '/tools',
    description: '工具列表',
    category: 'advanced',
    requiredContext: ['mcpClients'],
    handler: async (input, context) => await handleTools(context.mcpClients)
  }));

  registry.register(new Command({
    name: '/editor',
    aliases: ['/edit'],
    description: '编辑器配置',
    category: 'advanced',
    handler: (input, context) => handleEditor()
  }));

  registry.register(new Command({
    name: '/review',
    description: '代码审查',
    category: 'advanced',
    requiredContext: ['activeConfig', 'generateCompletion', 'askQuestion'],
    handler: async (input, context) => await handleReview(
      context.activeConfig,
      context.generateCompletion,
      context.askQuestion
    )
  }));

  // ========== 新增功能：代码补全 ==========
  registry.register(new Command({
    name: '/complete',
    description: 'AI 代码补全',
    category: 'completion',
    requiredContext: ['activeConfig', 'generateCompletion'],
    handler: async (input, context) => await handleComplete(
      input,
      context.activeConfig,
      context.generateCompletion
    )
  }));

  registry.register(new Command({
    name: '/complete-inline',
    description: '实时代码补全',
    category: 'completion',
    requiredContext: ['activeConfig', 'generateCompletion'],
    handler: async (input, context) => await handleCompleteInline(
      input,
      context.activeConfig,
      context.generateCompletion
    )
  }));

  // ========== 新增功能：批量操作 ==========
  registry.register(new Command({
    name: '/batch-search',
    description: '批量搜索文件内容',
    category: 'batch',
    handler: async (input, context) => await handleBatchSearch(input)
  }));

  registry.register(new Command({
    name: '/batch-replace',
    description: '批量替换文件内容',
    category: 'batch',
    handler: async (input, context) => await handleBatchReplace(input)
  }));

  registry.register(new Command({
    name: '/batch-analyze',
    description: '批量分析文件',
    category: 'batch',
    requiredContext: ['activeConfig', 'generateCompletion'],
    handler: async (input, context) => await handleBatchAnalyze(
      input,
      context.activeConfig,
      context.generateCompletion
    )
  }));

  registry.register(new Command({
    name: '/batch-check',
    description: '批量语法检查',
    category: 'batch',
    handler: async (input, context) => await handleBatchCheck(input)
  }));

  // ========== 新增功能：RAG 增量索引 ==========
  registry.register(new Command({
    name: '/rag-check',
    description: '检查 RAG 索引变更',
    category: 'rag',
    handler: async (input, context) => await handleRAGIncrementalCheck(input)
  }));

  registry.register(new Command({
    name: '/rag-rebuild',
    description: '增量重建 RAG 索引',
    category: 'rag',
    requiredContext: ['generateCompletion'],
    handler: async (input, context) => await handleRAGIncrementalUpdate(
      input,
      context.generateCompletion
    )
  }));

  registry.register(new Command({
    name: '/rag-clean',
    description: '清理 RAG 索引',
    category: 'rag',
    handler: async (input, context) => await handleRAGIndexClean()
  }));

  registry.register(new Command({
    name: '/rag-stats',
    description: 'RAG 索引统计',
    category: 'rag',
    handler: async (input, context) => await handleRAGIndexStats()
  }));

  // ========== 新增功能：分支管理 ==========
  registry.register(new Command({
    name: '/branch',
    description: '会话分支管理',
    category: 'branch',
    requiredContext: ['currentSession', 'messages'],
    handler: async (input, context) => await handleBranch(input, context)
  }));

  // ========== 新增功能：成本追踪 ==========
  registry.register(new Command({
    name: '/cost',
    description: 'API 成本追踪',
    category: 'cost',
    handler: async (input, context) => await handleCost(input)
  }));

  // ========== 新增功能：成就系统 ==========
  registry.register(new Command({
    name: '/achievement',
    aliases: ['/ach'],
    description: '成就系统',
    category: 'achievement',
    handler: async (input, context) => await handleAchievement(input)
  }));

  // ========== 新增功能：安全存储 ==========
  registry.register(new Command({
    name: '/secure-store',
    aliases: ['/secure'],
    description: '安全存储管理',
    category: 'security',
    handler: async (input, context) => await handleSecureStore(input, context)
  }));

  // ========== 新增功能：审计日志 ==========
  registry.register(new Command({
    name: '/audit-log',
    aliases: ['/audit'],
    description: '审计日志',
    category: 'security',
    handler: async (input, context) => await handleAuditLog(input)
  }));

  // ========== 新增功能：自动修复 ==========
  registry.register(new Command({
    name: '/auto-fix',
    aliases: ['/fix'],
    description: '自动检测并修复错误',
    category: 'utility',
    requiredContext: ['messages'],
    handler: async (input, context) => await handleAutoFix(input, context)
  }));

  // ========== 新增功能：统计看板 ==========
  registry.register(new Command({
    name: '/dashboard',
    aliases: ['/dash'],
    description: '统计看板',
    category: 'utility',
    handler: async (input, context) => await handleDashboard(input)
  }));

  // ========== P2功能：多语言支持 ==========
  registry.register(new Command({
    name: '/language',
    aliases: ['/lang'],
    description: '语言设置',
    category: 'i18n',
    handler: async (input, context) => await handleLanguage(input.split(' ').slice(1))
  }));

  // ========== P2功能：主题系统 ==========
  registry.register(new Command({
    name: '/theme',
    aliases: ['/th'],
    description: '主题管理',
    category: 'theme',
    handler: async (input, context) => await handleTheme(input.split(' ').slice(1))
  }));

  // ========== P2功能：Web UI ==========
  registry.register(new Command({
    name: '/web',
    description: 'Web UI 管理',
    category: 'web',
    handler: async (input, context) => await handleWeb(input.split(' ').slice(1))
  }));

  // ========== 插件系统 ==========
  registry.register(new Command({
    name: '/plugin',
    aliases: ['/plugins'],
    description: '插件管理',
    category: 'plugin',
    handler: async (input, context) => await handlePlugin(input.split(' ').slice(1))
  }));

  // ========== 新增功能：对话导出 ==========
  registry.register(new Command({
    name: '/export',
    aliases: ['/save', 'export'],
    description: '导出对话历史为 Markdown 或 JSON',
    category: 'utility',
    handler: async (input, context) => await handleExportCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：对话搜索 ==========
  registry.register(new Command({
    name: '/find',
    aliases: ['/search', 'grep'],
    description: '在历史对话中搜索内容',
    category: 'utility',
    handler: async (input, context) => await handleFindCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：命令别名 ==========
  registry.register(new Command({
    name: '/alias',
    description: '管理命令别名',
    category: 'utility',
    handler: async (input, context) => await handleAliasCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：预设提示词 ==========
  registry.register(new Command({
    name: '/prompt',
    aliases: ['/preset', '/template'],
    description: '管理预设提示词',
    category: 'utility',
    handler: async (input, context) => await handlePromptCommand(input.split(' ').slice(1), context)
  }));

  return registry;
}

// 创建全局默认注册表
export const defaultRegistry = createDefaultRegistry();
