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
import { handle as handleSnippetCommand } from "./snippet.js";
import { handle as handleTodoCommand } from "./todo.js";
import { handle as handleRemindCommand } from "./remind.js";
import { handle as handleBookmarkCommand } from "./bookmark.js";
import { handle as handleChartCommand } from "./chart.js";
import { handle as handleEnvCommand } from "./env.js";
import { handle as handleStatsCommand } from "./stats.js";
import { handle as handleKeybindCommand } from "./keybind.js";
import { handle as handlePersonaCommand } from "./persona.js";
import { handle as handleWorkflowCommand } from "./workflow.js";
import { handle as handleNoteCommand } from "./note.js";
import { handle as handleCronCommand } from "./cron.js";
import { handle as handleTemplateCommand } from "./template.js";
import { handle as handleSearchCommand } from "./search.js";
import { handle as handleBackupCommand } from "./backup.js";
import { handle as handleWatchCommand } from "./watch.js";
import { handle as handleShareCommand } from "./share.js";
import { handle as handleMacroCommand } from "./macro.js";
import { handle as handleLearnCommand } from "./learn.js";
import { handle as handleProjectCommand } from "./project.js";
import { handle as handleSyncCommand } from "./sync.js";
import { handle as handleMarketCommand } from "./market.js";
import { handle as handleImageCommand } from "./image.js";

// 新增功能导入
import { handle as handleQuickCommand } from "./quick.js";
import { handle as handleRefactorCommand } from "./refactor.js";
import { handle as handlePerfCommand } from "./perf.js";
import { handle as handleDebugCommand } from "./debug.js";
import { handle as handleDbCommand } from "./db.js";
import { handle as handleApiCommand } from "./api.js";
import { handle as handleWikiCommand } from "./wiki.js";
import { handle as handleDeployCommand } from "./deploy.js";
import { handle as handleFindUpgradeCommand } from "./find-upgrade.js";
import { handle as handleKanbanCommand } from "./kanban.js";

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
  // ========== /help: 显示帮助信息 ==========
  registry.register(new Command({
    name: '/help',
    aliases: ['/?'],
    description: '显示帮助信息',
    category: 'basic',
    handler: (input, context) => handleHelp()
  }));

  // ========== /exit: 退出程序 ==========
  registry.register(new Command({
    name: '/exit',
    aliases: ['/quit'],
    description: '退出程序',
    category: 'basic',
    handler: (input, context) => handleExit()
  }));

  // ========== /clear: 清除屏幕 ==========
  registry.register(new Command({
    name: '/clear',
    description: '清除屏幕',
    category: 'basic',
    requiredContext: ['messages', 'currentSession', 'clearHistory'],
    handler: async (input, context) => await handleClear(context.messages, context.currentSession, context.clearHistory)
  }));

  // ========== /config: 配置管理 ==========
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

  // ========== /system: 设置系统提示词 ==========
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

  // ========== /init: 初始化配置文件 ==========
  registry.register(new Command({
    name: '/init',
    aliases: ['/初始化配置'],
    description: '初始化配置文件',
    category: 'basic',
    requiredContext: ['initProjectConfigFile'],
    handler: (input, context) => handleInit(context.initProjectConfigFile)
  }));

  // ========== /config-wizard: 交互式配置向导 ==========
  registry.register(new Command({
    name: '/config-wizard',
    aliases: ['/配置向导'],
    description: '交互式配置向导',
    category: 'basic',
    requiredContext: ['askQuestion'],
    handler: async (input, context) => await handleConfigWizard(context.askQuestion)
  }));

  // ========== /reload: 重新加载配置 ==========
  registry.register(new Command({
    name: '/reload',
    aliases: ['/重新加载'],
    description: '重新加载配置 (从 CC Switch)',
    category: 'basic',
    requiredContext: ['loadConfig', 'getActiveConfig'],
    handler: async (input, context) => await handleReload(context.loadConfig, context.getActiveConfig)
  }));

  // 会话命令
  // ========== /session: 会话管理 ==========
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

  // ========== /history: 查看历史记录 ==========
  registry.register(new Command({
    name: '/history',
    description: '查看历史记录',
    category: 'session',
    requiredContext: ['messages', 'exportHistory'],
    handler: async (input, context) => await handleHistory(context.messages, context.exportHistory)
  }));

  // 模型命令
  // ========== /models: 查看可用模型 ==========
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

  // ========== /role: 设置角色 ==========
  registry.register(new Command({
    name: '/role',
    aliases: ['/角色'],
    description: '设置角色',
    category: 'model',
    requiredContext: ['loadConfig', 'setRole'],
    handler: async (input, context) => await handleRole(input, context.loadConfig, context.setRole)
  }));

  // ========== /think: 设置思考模式 ==========
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
  // ========== /scan: 扫描项目结构 ==========
  registry.register(new Command({
    name: '/scan',
    aliases: ['/当前项目结构'],
    description: '扫描项目结构',
    category: 'file',
    requiredContext: ['askQuestion', 'addToContext'],
    handler: async (input, context) => await handleScan(input, context.askQuestion, context.addToContext)
  }));

  // ========== /load: 加载文件 ==========
  registry.register(new Command({
    name: '/load',
    description: '加载文件',
    category: 'file',
    requiredContext: ['askQuestion', 'addToContext', 'rl'],
    handler: async (input, context) => await handleLoad(input, context.askQuestion, context.addToContext, context.rl)
  }));

  // ========== /paste: 粘贴内容 ==========
  registry.register(new Command({
    name: '/paste',
    description: '粘贴内容',
    category: 'file',
    handler: (input, context) => handlePaste()
  }));

  // ========== /copy: 复制内容 ==========
  registry.register(new Command({
    name: '/copy',
    description: '复制内容',
    category: 'file',
    requiredContext: ['messages', 'copyToClipboard'],
    handler: async (input, context) => await handleCopy(input, context.messages, context.copyToClipboard)
  }));

  // ========== /optimize: 优化代码 ==========
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
  // ========== /commit: Git 提交 ==========
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
  // ========== /mcp: MCP 管理 ==========
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
  // ========== /rag: 知识库检索 ==========
  registry.register(new Command({
    name: '/rag',
    description: '知识库检索',
    category: 'rag',
    requiredContext: ['activeConfig'],
    handler: async (input, context) => await handleRAG(input, context.activeConfig)
  }));

  // 语音命令
  // ========== /voice: 语音输入 ==========
  registry.register(new Command({
    name: '/voice',
    description: '语音输入',
    category: 'voice',
    requiredContext: ['askQuestion', 'mainChat', 'rl'],
    handler: async (input, context) => await handleVoice(context.askQuestion, context.mainChat, context.rl)
  }));

  // ========== /tts: 语音朗读 ==========
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
  // ========== /auto: 自动模式 ==========
  registry.register(new Command({
    name: '/auto',
    description: '自动模式',
    category: 'advanced',
    requiredContext: ['mainChat'],
    handler: async (input, context) => await handleAuto(input, context.mainChat)
  }));

  // ========== /open: 打开文件 ==========
  registry.register(new Command({
    name: '/open',
    description: '打开文件',
    category: 'advanced',
    handler: async (input, context) => await handleOpen(input)
  }));

  // ========== /context: 查看上下文 ==========
  registry.register(new Command({
    name: '/context',
    description: '查看上下文',
    category: 'advanced',
    requiredContext: ['messages'],
    handler: (input, context) => handleContext(context.messages)
  }));

  // ========== /token: Token 统计 ==========
  registry.register(new Command({
    name: '/token',
    description: 'Token 统计',
    category: 'advanced',
    requiredContext: ['messages', 'estimateTokens', 'calculateCost'],
    handler: (input, context) => handleToken(context.messages, context.estimateTokens, context.calculateCost)
  }));

  // ========== /compress: 压缩对话历史 ==========
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

  // ========== /tools: 工具列表 ==========
  registry.register(new Command({
    name: '/tools',
    description: '工具列表',
    category: 'advanced',
    requiredContext: ['mcpClients'],
    handler: async (input, context) => await handleTools(context.mcpClients)
  }));

  // ========== /editor: 编辑器配置 ==========
  registry.register(new Command({
    name: '/editor',
    aliases: ['/edit'],
    description: '编辑器配置',
    category: 'advanced',
    handler: (input, context) => handleEditor()
  }));

  // ========== /review: 代码审查 ==========
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
  // ========== /complete: AI 代码补全 ==========
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

  // ========== /complete-inline: 实时代码补全 ==========
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
  // ========== /batch-search: 批量搜索文件内容 ==========
  registry.register(new Command({
    name: '/batch-search',
    description: '批量搜索文件内容',
    category: 'batch',
    handler: async (input, context) => await handleBatchSearch(input)
  }));

  // ========== /batch-replace: 批量替换文件内容 ==========
  registry.register(new Command({
    name: '/batch-replace',
    description: '批量替换文件内容',
    category: 'batch',
    handler: async (input, context) => await handleBatchReplace(input)
  }));

  // ========== /batch-analyze: 批量分析文件 ==========
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

  // ========== /batch-check: 批量语法检查 ==========
  registry.register(new Command({
    name: '/batch-check',
    description: '批量语法检查',
    category: 'batch',
    handler: async (input, context) => await handleBatchCheck(input)
  }));

  // ========== 新增功能：RAG 增量索引 ==========
  // ========== /rag-check: 检查 RAG 索引变更 ==========
  registry.register(new Command({
    name: '/rag-check',
    description: '检查 RAG 索引变更',
    category: 'rag',
    handler: async (input, context) => await handleRAGIncrementalCheck(input)
  }));

  // ========== /rag-rebuild: 增量重建 RAG 索引 ==========
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

  // ========== /rag-clean: 清理 RAG 索引 ==========
  registry.register(new Command({
    name: '/rag-clean',
    description: '清理 RAG 索引',
    category: 'rag',
    handler: async (input, context) => await handleRAGIndexClean()
  }));

  // ========== /rag-stats: RAG 索引统计 ==========
  registry.register(new Command({
    name: '/rag-stats',
    description: 'RAG 索引统计',
    category: 'rag',
    handler: async (input, context) => await handleRAGIndexStats()
  }));

  // ========== 新增功能：分支管理 ==========
  // ========== /branch: 会话分支管理 ==========
  registry.register(new Command({
    name: '/branch',
    description: '会话分支管理',
    category: 'branch',
    requiredContext: ['currentSession', 'messages'],
    handler: async (input, context) => await handleBranch(input, context)
  }));

  // ========== 新增功能：成本追踪 ==========
  // ========== /cost: API 成本追踪 ==========
  registry.register(new Command({
    name: '/cost',
    description: 'API 成本追踪',
    category: 'cost',
    handler: async (input, context) => await handleCost(input)
  }));

  // ========== 新增功能：成就系统 ==========
  // ========== /achievement: 成就系统 ==========
  registry.register(new Command({
    name: '/achievement',
    aliases: ['/ach'],
    description: '成就系统',
    category: 'achievement',
    handler: async (input, context) => await handleAchievement(input)
  }));

  // ========== 新增功能：安全存储 ==========
  // ========== /secure-store: 安全存储管理 ==========
  registry.register(new Command({
    name: '/secure-store',
    aliases: ['/secure'],
    description: '安全存储管理',
    category: 'security',
    handler: async (input, context) => await handleSecureStore(input, context)
  }));

  // ========== 新增功能：审计日志 ==========
  // ========== /audit-log: 审计日志 ==========
  registry.register(new Command({
    name: '/audit-log',
    aliases: ['/audit'],
    description: '审计日志',
    category: 'security',
    handler: async (input, context) => await handleAuditLog(input)
  }));

  // ========== 新增功能：自动修复 ==========
  // ========== /auto-fix: 自动检测并修复错误 ==========
  registry.register(new Command({
    name: '/auto-fix',
    aliases: ['/fix'],
    description: '自动检测并修复错误',
    category: 'utility',
    requiredContext: ['messages'],
    handler: async (input, context) => await handleAutoFix(input, context)
  }));

  // ========== 新增功能：统计看板 ==========
  // ========== /dashboard: 统计看板 ==========
  registry.register(new Command({
    name: '/dashboard',
    aliases: ['/dash'],
    description: '统计看板',
    category: 'utility',
    handler: async (input, context) => await handleDashboard(input)
  }));

  // ========== P2功能：多语言支持 ==========
  // ========== /language: 语言设置 ==========
  registry.register(new Command({
    name: '/language',
    aliases: ['/lang'],
    description: '语言设置',
    category: 'i18n',
    handler: async (input, context) => await handleLanguage(input.split(' ').slice(1))
  }));

  // ========== P2功能：主题系统 ==========
  // ========== /theme: 主题管理 ==========
  registry.register(new Command({
    name: '/theme',
    aliases: ['/th'],
    description: '主题管理',
    category: 'theme',
    handler: async (input, context) => await handleTheme(input.split(' ').slice(1))
  }));

  // ========== P2功能：Web UI ==========
  // ========== /web: Web UI 管理 ==========
  registry.register(new Command({
    name: '/web',
    description: 'Web UI 管理',
    category: 'web',
    handler: async (input, context) => await handleWeb(input.split(' ').slice(1))
  }));

  // ========== 插件系统 ==========
  // ========== /plugin: 插件管理 ==========
  registry.register(new Command({
    name: '/plugin',
    aliases: ['/plugins'],
    description: '插件管理',
    category: 'plugin',
    handler: async (input, context) => await handlePlugin(input.split(' ').slice(1))
  }));

  // ========== 新增功能：对话导出 ==========
  // ========== /export: 导出对话历史为 Markdown 或 JSON ==========
  registry.register(new Command({
    name: '/export',
    aliases: ['/save', 'export'],
    description: '导出对话历史为 Markdown 或 JSON',
    category: 'utility',
    handler: async (input, context) => await handleExportCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：对话搜索 ==========
  // ========== /find: 在历史对话中搜索内容 ==========
  registry.register(new Command({
    name: '/find',
    aliases: ['/search', 'grep'],
    description: '在历史对话中搜索内容',
    category: 'utility',
    handler: async (input, context) => await handleFindCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：命令别名 ==========
  // ========== /alias: 管理命令别名 ==========
  registry.register(new Command({
    name: '/alias',
    description: '管理命令别名',
    category: 'utility',
    handler: async (input, context) => await handleAliasCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：预设提示词 ==========
  // ========== /prompt: 管理预设提示词 ==========
  registry.register(new Command({
    name: '/prompt',
    aliases: ['/preset', '/template'],
    description: '管理预设提示词',
    category: 'utility',
    handler: async (input, context) => await handlePromptCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：代码片段管理 ==========
  // ========== /snippet: 代码片段管理 ==========
  registry.register(new Command({
    name: '/snippet',
    aliases: ['代码片段', 'snip'],
    description: '代码片段管理',
    category: 'utility',
    handler: async (input, context) => await handleSnippetCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：任务管理 ==========
  // ========== /todo: 任务管理 ==========
  registry.register(new Command({
    name: '/todo',
    aliases: ['任务', 'task'],
    description: '任务管理',
    category: 'utility',
    handler: async (input, context) => await handleTodoCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：定时提醒 ==========
  // ========== /remind: 定时提醒 ==========
  registry.register(new Command({
    name: '/remind',
    aliases: ['提醒', 'timer'],
    description: '定时提醒',
    category: 'utility',
    handler: async (input, context) => await handleRemindCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：书签系统 ==========
  // ========== /bookmark: 书签系统 ==========
  registry.register(new Command({
    name: '/bookmark',
    aliases: ['书签', 'bm'],
    description: '书签系统',
    category: 'utility',
    handler: async (input, context) => await handleBookmarkCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：数据可视化 ==========
  // ========== /chart: 数据可视化 ==========
  registry.register(new Command({
    name: '/chart',
    aliases: ['图表'],
    description: '数据可视化',
    category: 'utility',
    handler: async (input, context) => await handleChartCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：环境变量管理 ==========
  // ========== /env: 环境变量管理 ==========
  registry.register(new Command({
    name: '/env',
    aliases: ['环境变量', 'environ'],
    description: '环境变量管理',
    category: 'utility',
    handler: async (input, context) => await handleEnvCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：AI性能统计 ==========
  // ========== /stats: AI 性能统计 ==========
  registry.register(new Command({
    name: '/stats',
    aliases: ['统计'],
    description: 'AI 性能统计',
    category: 'utility',
    handler: async (input, context) => await handleStatsCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：快捷键绑定 ==========
  // ========== /keybind: 快捷键绑定 ==========
  registry.register(new Command({
    name: '/keybind',
    aliases: ['快捷键', 'kb'],
    description: '快捷键绑定',
    category: 'utility',
    handler: async (input, context) => await handleKeybindCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：AI人格训练 ==========
  // ========== /persona: AI 人格训练 ==========
  registry.register(new Command({
    name: '/persona',
    aliases: ['人格', 'personality'],
    description: 'AI 人格训练',
    category: 'utility',
    handler: async (input, context) => await handlePersonaCommand(input.split(' ').slice(1), context)
  }));


  // ========== /workflow: 工作流自动化 ==========
  registry.register(new Command({
    name: '/workflow',
    aliases: ['workflow', '工作流'],
    description: '工作流自动化',
    category: 'automation',
    handler: async (input, context) => await handleWorkflowCommand(input.split(' ').slice(1), context)
  }));

  // ========== /note: 笔记系统 ==========
  registry.register(new Command({
    name: '/note',
    aliases: ['笔记'],
    description: '笔记系统',
    category: 'productivity',
    handler: async (input, context) => await handleNoteCommand(input.split(' ').slice(1), context)
  }));

  // ========== /cron: 定时任务管理 ==========
  registry.register(new Command({
    name: '/cron',
    aliases: ['定时任务'],
    description: '定时任务管理',
    category: 'automation',
    handler: async (input, context) => await handleCronCommand(input.split(' ').slice(1), context)
  }));

  // ========== /template: 模板系统 ==========
  registry.register(new Command({
    name: '/template',
    aliases: ['模板'],
    description: '模板系统',
    category: 'productivity',
    handler: async (input, context) => await handleTemplateCommand(input.split(' ').slice(1), context)
  }));

  // ========== /search: 搜索增强 ==========
  registry.register(new Command({
    name: '/search',
    aliases: ['高级搜索'],
    description: '搜索增强',
    category: 'search',
    handler: async (input, context) => await handleSearchCommand(input.split(' ').slice(1), context)
  }));

  // ========== /backup: 数据备份 ==========
  registry.register(new Command({
    name: '/backup',
    aliases: ['备份'],
    description: '数据备份',
    category: 'utility',
    handler: async (input, context) => await handleBackupCommand(input.split(' ').slice(1), context)
  }));

  // ========== /watch: 文件监控 ==========
  registry.register(new Command({
    name: '/watch',
    aliases: ['监控'],
    description: '文件监控',
    category: 'utility',
    handler: async (input, context) => await handleWatchCommand(input.split(' ').slice(1), context)
  }));

  // ========== /share: 团队协作 ==========
  registry.register(new Command({
    name: '/share',
    aliases: ['分享'],
    description: '团队协作',
    category: 'collaboration',
    handler: async (input, context) => await handleShareCommand(input.split(' ').slice(1), context)
  }));

  // ========== /macro: 命令别名 ==========
  registry.register(new Command({
    name: '/macro',
    aliases: ['宏'],
    description: '命令别名',
    category: 'productivity',
    handler: async (input, context) => await handleMacroCommand(input.split(' ').slice(1), context)
  }));

  // ========== /learn: AI学习模式 ==========
  registry.register(new Command({
    name: '/learn',
    aliases: ['学习模式'],
    description: 'AI学习模式',
    category: 'ai',
    handler: async (input, context) => await handleLearnCommand(input.split(' ').slice(1), context)
  }));

  // ========== /image: 多模态输入 ==========
  registry.register(new Command({
    name: '/image',
    aliases: ['图片'],
    description: '多模态输入',
    category: 'ai',
    handler: async (input, context) => await handleImageCommand(input.split(' ').slice(1), context)
  }));

  // ========== /project: 项目管理 ==========
  registry.register(new Command({
    name: '/project',
    aliases: ['项目'],
    description: '项目管理',
    category: 'project',
    handler: async (input, context) => await handleProjectCommand(input.split(' ').slice(1), context)
  }));

  // ========== /sync: 配置同步 ==========
  registry.register(new Command({
    name: '/sync',
    aliases: ['同步'],
    description: '配置同步',
    category: 'utility',
    handler: async (input, context) => await handleSyncCommand(input.split(' ').slice(1), context)
  }));

  // ========== /market: 扩展市场 ==========
  registry.register(new Command({
    name: '/market',
    aliases: ['市场'],
    description: '扩展市场',
    category: 'plugin',
    handler: async (input, context) => await handleMarketCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：快捷命令管理器 ==========
  // ========== /quick: 快捷命令管理器 ==========
  registry.register(new Command({
    name: '/quick',
    aliases: ['快捷命令'],
    description: '快捷命令管理器',
    category: 'utility',
    handler: async (input, context) => await handleQuickCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：代码重构助手 ==========
  // ========== /refactor: 代码重构助手 ==========
  registry.register(new Command({
    name: '/refactor',
    aliases: ['重构'],
    description: '代码重构助手',
    category: 'development',
    handler: async (input, context) => await handleRefactorCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：性能分析器 ==========
  // ========== /perf: 性能分析器 ==========
  registry.register(new Command({
    name: '/perf',
    aliases: ['性能'],
    description: '性能分析器',
    category: 'development',
    handler: async (input, context) => await handlePerfCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：调试助手 ==========
  // ========== /debug: 调试助手 ==========
  registry.register(new Command({
    name: '/debug',
    aliases: ['调试'],
    description: '调试助手',
    category: 'development',
    handler: async (input, context) => await handleDebugCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：数据库工具 ==========
  // ========== /db: 数据库工具 ==========
  registry.register(new Command({
    name: '/db',
    aliases: ['数据库'],
    description: '数据库工具',
    category: 'development',
    handler: async (input, context) => await handleDbCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：API测试工具 ==========
  // ========== /api: API测试工具 ==========
  registry.register(new Command({
    name: '/api',
    aliases: ['API'],
    description: 'API测试工具',
    category: 'development',
    handler: async (input, context) => await handleApiCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：团队知识库 ==========
  // ========== /wiki: 团队知识库 ==========
  registry.register(new Command({
    name: '/wiki',
    aliases: ['知识库'],
    description: '团队知识库',
    category: 'collaboration',
    handler: async (input, context) => await handleWikiCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：自动化部署 ==========
  // ========== /deploy: 自动化部署 ==========
  registry.register(new Command({
    name: '/deploy',
    aliases: ['部署'],
    description: '自动化部署',
    category: 'deployment',
    handler: async (input, context) => await handleDeployCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：智能搜索优化 ==========
  // ========== /find-upgrade: 智能搜索优化 ==========
  registry.register(new Command({
    name: '/find-upgrade',
    aliases: ['智能搜索'],
    description: '智能搜索优化',
    category: 'development',
    handler: async (input, context) => await handleFindUpgradeCommand(input.split(' ').slice(1), context)
  }));

  // ========== 新增功能：任务看板 ==========
  // ========== /kanban: 任务看板 ==========
  registry.register(new Command({
    name: '/kanban',
    aliases: ['看板'],
    description: '任务看板',
    category: 'productivity',
    handler: async (input, context) => await handleKanbanCommand(input.split(' ').slice(1), context)
  }));

  // ========== V3.1.0 新增功能 ==========
  // AI/智能化功能
  // ========== /ask: AI问答 ==========
  registry.register(new Command({
    name: '/ask',
    aliases: ['问答'],
    description: 'AI问答',
    category: 'ai',
    handler: async (input, context) => await import('./ask.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // ========== /code-review: 代码审查 ==========
  registry.register(new Command({
    name: '/code-review',
    aliases: ['审查'],
    description: '代码审查',
    category: 'ai',
    handler: async (input, context) => await import('./code-review.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // ========== /summarize: 文档摘要 ==========
  registry.register(new Command({
    name: '/summarize',
    aliases: ['摘要'],
    description: '文档摘要',
    category: 'ai',
    handler: async (input, context) => await import('./summarize.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // ========== /explain: 代码解释 ==========
  registry.register(new Command({
    name: '/explain',
    aliases: ['解释'],
    description: '代码解释',
    category: 'ai',
    handler: async (input, context) => await import('./explain.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // 开发工具增强
  // ========== /docker: Docker管理 ==========
  registry.register(new Command({
    name: '/docker',
    aliases: ['容器'],
    description: 'Docker管理',
    category: 'devops',
    handler: async (input, context) => await import('./docker.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // ========== /k8s: Kubernetes管理 ==========
  registry.register(new Command({
    name: '/k8s',
    aliases: ['kubernetes'],
    description: 'Kubernetes管理',
    category: 'devops',
    handler: async (input, context) => await import('./k8s.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // ========== /ci-cd: CI/CD管理 ==========
  registry.register(new Command({
    name: '/ci-cd',
    aliases: ['cicd'],
    description: 'CI/CD管理',
    category: 'devops',
    handler: async (input, context) => await import('./ci-cd.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // ========== /proxy: 代理管理 ==========
  registry.register(new Command({
    name: '/proxy',
    aliases: ['代理'],
    description: '代理管理',
    category: 'devops',
    handler: async (input, context) => await import('./proxy.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // 数据分析模块
  // ========== /metrics: 性能指标 ==========
  registry.register(new Command({
    name: '/metrics',
    aliases: ['指标'],
    description: '性能指标',
    category: 'analytics',
    handler: async (input, context) => await import('./metrics.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  // ========== /analyze: 项目分析 ==========
  registry.register(new Command({
    name: '/analyze',
    aliases: ['分析'],
    description: '项目分析',
    category: 'analytics',
    handler: async (input, context) => await import('./analyze.js').then(m => m.handle(input.split(' ').slice(1), context))
  }));

  return registry;
}

// 创建全局默认注册表
export const defaultRegistry = createDefaultRegistry();
