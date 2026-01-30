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

/**
 * 导出命令注册表（供外部使用）
 */
export { defaultRegistry, Command, CommandRegistry, createDefaultRegistry } from "./command-registry.js";
