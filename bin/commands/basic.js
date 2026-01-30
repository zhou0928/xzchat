import { printFarewell } from "../utils/helpers.js";
import { runConfigWizard } from "../../lib/utils/config-wizard.js";

/**
 * /help 命令
 */
export function handleHelp() {
  const colors = [
    "\x1b[1;31m", // Red
    "\x1b[1;32m", // Green
    "\x1b[1;33m", // Yellow
    "\x1b[1;34m", // Blue
    "\x1b[1;35m", // Magenta
    "\x1b[1;36m", // Cyan
  ];
  const rc = () => colors[Math.floor(Math.random() * colors.length)];

  console.log(`
${rc()}## 🛠️  NewAPI Chat CLI 帮助\x1b[0m

${rc()}### 基础命令\x1b[0m
- \`/config\`: 查看或修改配置 (别名: \`/配置\`)
- \`/config-wizard\`: 交互式配置向导 (别名: \`/配置向导\`)
- \`/reload\`: 重新加载配置 (CC Switch 切换后使用，别名: \`/重新加载\`)
- \`/init\`: 初始化项目配置 (别名: \`/初始化配置\`)
- \`/profile\`: 切换配置环境 (别名: \`/切换模型\`)
- \`/system\`: 设置系统提示词
- \`/language\`: 设置语言 (别名: \`/lang\`, 支持 zh/en/ja)
- \`/theme\`: 主题管理 (别名: \`/th\`)
- \`/plugin\`: 插件管理 (别名: \`/plugins\`)
- \`/clear\`: 清空对话历史
- \`/exit\`: 退出程序
- \`/session\`: 管理多会话 (new/use/list)

${rc()}### 文件操作\x1b[0m
- \`/scan\`: 扫描项目结构 (别名: \`/当前项目结构\`)
- \`/load <file>\`: 加载文件 (支持 .txt, .pdf 等)
- \`/optimize <file>\`: 深度分析并优化指定文件 (别名: \`/opt\`)
- \`/save [index] <filename>\`: 保存 AI 代码块
- \`/paste\`: 多行粘贴模式

${rc()}### 高级\x1b[0m
- \`/mcp\`: 管理 MCP 服务器
- \`/auto\`: 进入智能体模式 (Agent Mode)
- \`/commit\`: 生成 Git Commit Message
- \`/compress\`: 压缩对话历史
- \`/token\`: 估算 Token 消耗
- \`/copy\`: 复制上一次 AI 回复的代码或内容
- \`/editor\`: 调用系统编辑器输入多行内容
- \`/review\`: 对当前暂存区的代码进行 AI Code Review
- \`/models\`: 列出当前接口可用模型
- \`/role\`: 切换或管理角色预设 (别名: \`/角色\`)
- \`/think\`: 开启/关闭 DeepSeek 思考过程显示
- \`/tts\`: 开启/关闭 语音输出
- \`/rag\`: 知识库操作 (index/search)

${rc()}### 🆕 AI 代码补全\x1b[0m
- \`/complete <file>:<line>\`: AI 补全指定行代码
  示例: \`/complete src/index.js:25\`
  示例: \`/complete src/utils.ts\` (补全整个文件)
- \`/complete-inline <code>\`: 实时代码补全

${rc()}### 🆕 批量操作\x1b[0m
- \`/batch-search <pattern> <file-pattern>\`: 批量搜索文件内容
  示例: \`/batch-search TODO *.js\`
- \`/batch-replace <old> <new> <file-pattern>\`: 批量替换
  示例: \`/batch-replace var const "*.js"\`
- \`/batch-analyze <file-pattern> [prompt]\`: 批量分析文件
  示例: \`/batch-analyze lib/ 代码质量\`
- \`/batch-check <file-pattern>\`: 批量语法检查
  示例: \`/batch-check lib/**/*.ts\`

${rc()}### 🆕 RAG 增量索引\x1b[0m
- \`/rag-check\`: 检查文件变更
- \`/rag-rebuild\`: 增量重建索引 (只更新变更文件)
- \`/rag-clean\`: 清理索引
- \`/rag-stats\`: 索引统计信息

${rc()}### 🆕 工作流自动化\x1b[0m
- \`/workflow list\`: 列出所有工作流
- \`/workflow get <id>\`: 查看工作流详情
- \`/workflow add <id> <name> [desc]\`: 创建工作流
- \`/workflow update <id> <field> <value>\`: 更新工作流
- \`/workflow run <id> [vars]\`: 执行工作流
- \`/workflow history [id]\`: 查看执行历史
- \`/workflow export/import\`: 导出/导入工作流

${rc()}### 🆕 笔记系统\x1b[0m
- \`/note list\`: 列出笔记
- \`/note get <id>\`: 查看笔记
- \`/note add <title> [content]\`: 创建笔记
- \`/note search <keyword>\`: 搜索笔记
- \`/note tag <id> add/remove <tag>\`: 管理标签
- \`/note export/import\`: 导出/导入笔记

${rc()}### 🆕 定时任务\x1b[0m
- \`/cron list\`: 列出所有任务
- \`/cron add <id> <name> <expr> <cmd>\`: 创建任务
- \`/cron enable/disable <id>\`: 启用/禁用任务
- \`/cron presets\`: 查看预设模板
- \`/cron logs [id]\`: 查看执行日志

${rc()}### 🆕 模板系统\x1b[0m
- \`/template list\`: 列出所有模板
- \`/template get <id>\`: 查看模板
- \`/template add <id> <name> <category> <prompt>\`: 创建模板
- \`/template use <id> [vars]\`: 使用模板
- \`/template validate <id>\`: 验证模板

${rc()}### 🆕 搜索增强\x1b[0m
- \`/search query <keyword>\`: 执行搜索
- \`/search history [limit]\`: 搜索历史
- \`/search popular [limit]\`: 热门搜索
- \`/search suggest <prefix>\`: 搜索建议
- \`/search index\`: 重建索引

${rc()}### 🆕 数据备份\x1b[0m
- \`/backup create [--encrypt]\`: 创建完整备份
- \`/backup incremental <id>\`: 创建增量备份
- \`/backup restore <id> [--preview]\`: 恢复备份
- \`/backup list\`: 列出备份
- \`/backup clean [days]\`: 清理旧备份

${rc()}### 🆕 文件监控\x1b[0m
- \`/watch list\`: 列出监控
- \`/watch add <id> <path> <cmd>\`: 创建监控
- \`/watch enable/disable <id>\`: 启用/禁用监控
- \`/watch diff <file1> <file2>\`: 文件差异对比
- \`/watch logs <id>\`: 查看监控日志

${rc()}### 🆕 团队协作\x1b[0m
- \`/share list\`: 列出分享
- \`/share session/branch/bookmark/note <id>\`: 分享内容
- \`/share unshare <id>\`: 取消分享
- \`/share comment <id> add <content>\`: 添加评论
- \`/share popular [limit]\`: 热门分享

${rc()}### 🆕 命令别名\x1b[0m
- \`/macro list\`: 列出所有宏
- \`/macro get <name>\`: 查看宏
- \`/macro add <name> <desc> --cmd "cmd"\`: 创建宏
- \`/macro run <name> [params]\`: 执行宏
- \`/macro validate <name>\`: 验证宏

${rc()}### 🆕 AI 学习模式\x1b[0m
- \`/learn record <category> <key> <value>\`: 记录偏好
- \`/learn get <category> <key>\`: 获取偏好
- \`/learn suggest\`: 获取智能建议
- \`/learn stats\`: 学习统计
- \`/learn export/import\`: 导出/导入学习数据

${rc()}### 🆕 多模态输入\x1b[0m
- \`/image describe <path>\`: 图片描述
- \`/image ocr <path>\`: 文字识别
- \`/image chart <path>\`: 图表分析
- \`/image generate <prompt>\`: 图片生成
- \`/image edit <path> <prompt>\`: 图片编辑

${rc()}### 🆕 项目管理\x1b[0m
- \`/project list\`: 列出项目
- \`/project get <id>\`: 查看项目
- \`/project create <name> [path]\`: 创建项目
- \`/project switch <id>\`: 切换项目

${rc()}### 🆕 配置同步\x1b[0m
- \`/sync list\`: 列出同步源
- \`/sync add <name> <provider> [repo]\`: 添加同步源
- \`/sync sync\`: 手动同步
- \`/sync start/stop\`: 启动/停止自动同步
- \`/sync conflicts\`: 查看冲突

${rc()}### 🆕 扩展市场\x1b[0m
- \`/market search <keyword>\`: 搜索插件
- \`/market install <id>\`: 安装插件
- \`/market list\`: 列出插件
- \`/market trending/top-rated\`: 热门/高分插件
- \`/market recommend\`: 推荐插件

${rc()}### 🆕 快捷命令管理\x1b[0m
- \`/quick list\`: 列出所有快捷命令
- \`/quick get <name>\`: 查看命令详情
- \`/quick add <name> <desc>\`: 创建快捷命令
- \`/quick update <name> <field> <value>\`: 更新命令
- \`/quick run <name> [vars...]\`: 执行命令

${rc()}### 🆕 代码重构助手\x1b[0m
- \`/refactor analyze <file>\`: 分析代码质量
- \`/refactor suggest <file> [pat]\`: 获取重构建议
- \`/refactor apply <file> <pat>\`: 应用重构
- \`/refactor patterns\`: 列出所有重构模式
- \`/refactor check <file>\`: 快速质量检查

${rc()}### 🆕 性能分析器\x1b[0m
- \`/perf start [label]\`: 开始性能监控
- \`/perf stop [label]\`: 停止监控并显示报告
- \`/perf report [label]\`: 查看详细报告
- \`/perf compare <l1> <l2>\`: 比较两个会话
- \`/perf bottlenecks\`: 识别性能瓶颈

${rc()}### 🆕 调试助手\x1b[0m
- \`/debug analyze <error>\`: 分析错误
- \`/debug trace <file>\`: 生成代码追踪
- \`/debug breakpoint <file> <line>\`: 设置断点
- \`/debug log <type> <content>\`: 记录日志
- \`/debug fix <error>\`: 生成修复代码

${rc()}### 🆕 数据库工具\x1b[0m
- \`/db query <sql>\`: 分析SQL查询
- \`/db model <name> [fields]\`: 生成数据模型
- \`/db migration <action> <table>\`: 生成迁移脚本
- \`/db schema <file>\`: 分析数据库架构
- \`/db validate <sql>\`: 验证SQL

${rc()}### 🆕 API测试工具\x1b[0m
- \`/api test <url> [method]\`: 测试API请求
- \`/api save <name> <config>\`: 保存请求配置
- \`/api list\`: 列出保存的请求
- \`/api run <name>\`: 执行保存的请求
- \`/api docs [file]\`: 生成API文档

${rc()}### 🆕 团队知识库\x1b[0m
- \`/wiki list\`: 列出所有文档
- \`/wiki get <id>\`: 查看文档
- \`/wiki add <title> <content>\`: 创建文档
- \`/wiki search <keyword>\`: 搜索文档
- \`/wiki export [file]\`: 导出知识库

${rc()}### 🆕 自动化部署\x1b[0m
- \`/deploy list\`: 列出部署环境
- \`/deploy add <name> <plat> [url]\`: 添加部署环境
- \`/deploy deploy <name>\`: 执行部署
- \`/deploy rollback <name>\`: 回滚部署
- \`/deploy logs <name>\`: 查看日志

${rc()}### 🆕 智能搜索\x1b[0m
- \`/find-upgrade search <query> [path]\`: 普通搜索
- \`/find-upgrade semantic <query>\`: 语义搜索
- \`/find-upgrade references <target>\`: 查找引用
- \`/find-upgrade trace <file>\`: 依赖追踪
- \`/find-upgrade rebuild\`: 重建索引

${rc()}### 🆕 任务看板\x1b[0m
- \`/kanban board [name]\`: 查看看板
- \`/kanban add [board] <title> [pri]\`: 添加任务
- \`/kanban move <id> <column>\`: 移动任务
- \`/kanban update <id> <field> <val>\`: 更新任务
- \`/kanban stats\`: 统计信息

${rc()}### 💡 提示\x1b[0m
- 使用 \`/help\` 查看此帮助信息
- 使用 \`/<command> help\` 查看特定命令的详细帮助
- 使用 Tab 键自动补全命令
- 按 Ctrl+C 退出程序
- 更多功能持续更新中...
`);
  return true; // 返回 true 表示需要调用 rl.prompt()
}

/**
 * /exit 或 /quit 命令
 */
export function handleExit() {
  printFarewell();
  process.exit(0);
}

/**
 * /clear 命令
 */
export async function handleClear(messages, currentSession, clearHistory) {
  messages.length = 0;
  clearHistory(currentSession);
  console.log(`🧹 会话 '${currentSession}' 的历史记录已清空`);
  return true;
}

/**
 * /config 命令
 */
export async function handleConfig(input, loadConfig, updateConfig, getActiveConfig, setProfileValue, getCcSwitchProviders, askQuestion, rl) {
  const parts = input.trim().split(/\s+/);

  if (parts.length === 1) {
    // 查看配置
    let config = loadConfig();
    let activeConfig = getActiveConfig(config);
    console.log("当前配置:", JSON.stringify(activeConfig, null, 2));

    // 尝试从 CC Switch 获取可用配置
    const providers = getCcSwitchProviders();
    if (providers && providers.length > 0) {
      console.log("\n🔄 检测到 CC Switch 配置，请选择要导入的配置 (输入序号):");
      providers.forEach((p, idx) => {
        console.log(`${idx + 1}. [${p.appType}] ${p.name || "Unknown"} (${p.baseUrl})`);
      });
      console.log("0. 取消");

      const ans = await askQuestion("\n请选择 (默认 0): ");
      const choice = parseInt(ans.trim(), 10);

      if (choice > 0 && choice <= providers.length) {
        const selected = providers[choice - 1];
        // 应用配置
        updateConfig("provider", selected.appType || "openai");
        updateConfig("baseUrl", selected.baseUrl);
        updateConfig("apiKey", selected.apiKey || "");
        if (selected.model) {
          updateConfig("model", selected.model);
        }

        // 同步到当前 Profile
        config = loadConfig();
        if (config.currentProfile) {
          setProfileValue(config.currentProfile, "baseUrl", selected.baseUrl);
          setProfileValue(config.currentProfile, "apiKey", selected.apiKey || "");
          if (selected.model) {
            setProfileValue(config.currentProfile, "model", selected.model);
          }
        }

        config = loadConfig();
        activeConfig = getActiveConfig(config);
        console.log(`✅ 已应用配置: ${selected.name} (${selected.baseUrl})`);
      } else {
        console.log("已取消");
      }
    }

    console.log("\n用法: /config <key> <value>");
    return true;
  }

  // 设置配置
  const key = parts[1];
  const value = parts.slice(2).join(" ");

  if (!value) {
    console.log("用法: /config <key> <value>");
    return true;
  }

  let config = loadConfig();

  // 特殊处理 provider
  if (key === "provider") {
    const getProviderDefaults = (await import("../../lib/config.js")).getProviderDefaults;
    updateConfig(key, value);
    const preset = getProviderDefaults(value);
    if (preset.baseUrl) {
      updateConfig("baseUrl", preset.baseUrl);
      if (config.currentProfile) {
        setProfileValue(config.currentProfile, "baseUrl", preset.baseUrl);
      }
      console.log(`✅ Provider '${value}' 已设置默认 Base URL: ${preset.baseUrl}`);
    }
    if (preset.model) {
      updateConfig("model", preset.model);
      if (config.currentProfile) {
        setProfileValue(config.currentProfile, "model", preset.model);
      }
      console.log(`✅ Provider '${value}' 已设置默认模型: ${preset.model}`);
    }
    if (!preset.baseUrl && !preset.model) {
      console.log(`✅ Provider 已更新为: ${value}`);
    }
  } else {
    updateConfig(key, value);
    console.log(`✅ 已更新 ${key} = ${value}`);
  }
  config = loadConfig();
  return true;
}

/**
 * /system 命令
 */
export async function handleSystem(input, activeConfig, updateConfig, setProfileValue, loadConfig) {
  const prompt = input.slice(7).trim();
  if (!prompt) {
    console.log("当前系统提示词:", activeConfig.systemPrompt || "(未设置)");
    console.log("用法: /system <prompt>");
    return true;
  }
  updateConfig("systemPrompt", prompt);
  let config = loadConfig();
  if (config.currentProfile) {
    setProfileValue(config.currentProfile, "systemPrompt", prompt);
  }
  console.log("✅ 系统提示词已更新");
  return true;
}

/**
 * /init 命令
 */
export function handleInit(initProjectConfigFile) {
  initProjectConfigFile();
  return true;
}

/**
 * /config-wizard 命令 - 交互式配置向导
 */
export async function handleConfigWizard(askQuestion) {
  try {
    await runConfigWizard(askQuestion);
  } catch (error) {
    console.error(`❌ 配置向导出错: ${error.message}`);
  }
  return true;
}

/**
 * /reload 命令 - 重新加载配置
 * 用于在 CC Switch 切换后重新读取配置
 */
export async function handleReload(loadConfig, getActiveConfig) {
  console.log("🔄 正在重新加载配置...\n");

  try {
    // 清除 CC Switch 缓存
    const { ccSwitchUnreachable } = await import("../../lib/config.js");
    if (typeof ccSwitchUnreachable !== 'undefined') {
      ccSwitchUnreachable = false;
    }

    // 重新加载配置
    const config = loadConfig();
    const activeConfig = getActiveConfig(config);

    console.log("✅ 配置已重新加载\n");
    console.log("📋 当前配置:");
    console.log(`   Provider: ${activeConfig.provider}`);
    console.log(`   Provider Name: ${activeConfig.providerName || "N/A"}`);
    console.log(`   Base URL: ${activeConfig.baseUrl}`);
    console.log(`   Model: ${activeConfig.model}`);

    if (activeConfig.baseUrl?.includes('tribiosapi.top')) {
      console.log(`   📍 配置来源: CC Switch`);
    }

    console.log("\n💡 提示: 新的配置将在下次对话中生效");
  } catch (error) {
    console.error(`❌ 重新加载配置失败: ${error.message}`);
  }

  return true;
}
