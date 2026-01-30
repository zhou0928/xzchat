import { defaultRegistry } from "./command-registry.js";

/**
 * 执行命令（使用命令注册表）
 * @param {string} input - 用户输入
 * @param {object} context - 执行上下文
 * @returns {object} - 执行结果 { handled: boolean, result: any }
 */
export async function executeCommand(input, context) {
  return await defaultRegistry.execute(input, context);
}

/**
 * 导出所有命令处理器（供外部直接调用）
 */
export * from "./basic.js";
export * from "./session.js";
export * from "./model.js";
export * from "./file.js";
export * from "./git.js";
export * from "./mcp.js";
export * from "./rag.js";
export * from "./voice.js";
export * from "./advanced.js";
export * from "./export.js";
export * from "./find.js";
export * from "./alias.js";
export * from "./prompt.js";
export * from "./snippet.js";
export * from "./todo.js";
export * from "./remind.js";
export * from "./bookmark.js";
export * from "./chart.js";
export * from "./env.js";
export * from "./stats.js";
export * from "./keybind.js";
export * from "./persona.js";
export * from "./workflow.js";
export * from "./note.js";
export * from "./cron.js";
export * from "./template.js";
export * from "./search.js";
export * from "./backup.js";
export * from "./watch.js";
export * from "./share.js";
export * from "./macro.js";
export * from "./learn.js";
export * from "./project.js";
export * from "./sync.js";
export * from "./market.js";
export * from "./image.js";
export * from "./quick.js";
export * from "./refactor.js";
export * from "./perf.js";
export * from "./debug.js";
export * from "./db.js";
export * from "./api.js";
export * from "./wiki.js";
export * from "./deploy.js";
export * from "./find-upgrade.js";
export * from "./kanban.js";

/**
 * 导出命令注册表（供外部使用）
 */
export { defaultRegistry, Command, CommandRegistry, createDefaultRegistry } from "./command-registry.js";
