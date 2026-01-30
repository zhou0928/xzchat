/**
 * E2E 测试辅助工具
 *
 * 提供E2E测试所需的通用工具函数
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { setTimeout } from 'node:timers/promises';

/**
 * 创建临时测试目录
 * @returns {Promise<string>} 临时目录路径
 */
export async function createTempDir() {
  const tempDir = path.join(os.tmpdir(), `xz-chat-e2e-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * 清理临时测试目录
 * @param {string} tempDir - 临时目录路径
 */
export async function cleanupTempDir(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // 忽略清理错误
  }
}

/**
 * 创建测试配置文件
 * @param {string} dir - 目录路径
 * @param {Object} config - 配置对象
 */
export async function createTestConfig(dir, config = {}) {
  const defaultConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.test.com/v1',
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    ...config
  };

  const configPath = path.join(dir, '.newapi-chat-config.json');
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  return configPath;
}

/**
 * 创建测试历史文件
 * @param {string} dir - 目录路径
 * @param {Array} history - 历史记录数组
 */
export async function createTestHistory(dir, history = []) {
  const historyPath = path.join(dir, 'history.json');
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  return historyPath;
}

/**
 * 执行CLI命令
 * @param {string} command - 命令字符串
 * @param {Object} options - 执行选项
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
export function executeCLI(command, options = {}) {
  return new Promise((resolve, reject) => {
    const args = command.split(' ').slice(1);
    const cliPath = path.join(process.cwd(), 'bin/cli.js');

    const child = spawn('node', [cliPath, ...args], {
      cwd: options.cwd || process.cwd(),
      env: {
        ...process.env,
        XZ_CHAT_TEST: '1'
      },
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    child.on('error', reject);

    // 设置超时
    if (options.timeout) {
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timeout after ${options.timeout}ms`));
      }, options.timeout);
    }
  });
}

/**
 * Mock fetch API
 * @param {Object} responseData - 要返回的数据
 * @returns {Function} mock fetch函数
 */
export function mockFetch(responseData) {
  global.fetch = async () => ({
    ok: true,
    json: async () => responseData
  });
}

/**
 * Mock fetch API with error
 * @param {Error|Object} error - 错误对象
 */
export function mockFetchError(error) {
  global.fetch = async () => {
    throw error;
  };
}

/**
 * Mock fetch API with status
 * @param {number} status - HTTP状态码
 * @param {string} text - 响应文本
 */
export function mockFetchStatus(status, text = '') {
  global.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => ({ error: text })
  });
}

/**
 * 恢复原始fetch
 */
export function restoreFetch() {
  delete global.fetch;
}

/**
 * 等待条件满足
 * @param {Function} condition - 条件函数
 * @param {Object} options - 选项
 * @returns {Promise<boolean>}
 */
export async function waitForCondition(condition, options = {}) {
  const {
    timeout = 5000,
    interval = 100,
    errorMessage = 'Condition not met'
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await setTimeout(interval);
  }

  throw new Error(errorMessage);
}

/**
 * 等待文件出现
 * @param {string} filePath - 文件路径
 * @param {Object} options - 选项
 */
export async function waitForFile(filePath, options = {}) {
  return waitForCondition(
    async () => {
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    },
    {
      errorMessage: `File not created: ${filePath}`,
      ...options
    }
  );
}

/**
 * 读取JSON文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>}
 */
export async function readJSON(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 写入JSON文件
 * @param {string} filePath - 文件路径
 * @param {Object} data - 数据对象
 */
export async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string}
 */
export function randomString(length = 10) {
  return Math.random().toString(36).substr(2, length);
}

/**
 * 生成随机端口号
 * @returns {number}
 */
export function randomPort() {
  return Math.floor(Math.random() * 10000) + 40000;
}

/**
 * 创建测试服务器响应
 * @param {Object} options - 响应选项
 * @returns {Object}
 */
export function createTestResponse(options = {}) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: options.content || 'Test response'
        },
        finish_reason: options.finishReason || 'stop'
      }
    ],
    usage: {
      prompt_tokens: options.promptTokens || 10,
      completion_tokens: options.completionTokens || 20,
      total_tokens: options.totalTokens || 30
    },
    model: options.model || 'gpt-3.5-turbo',
    ...options
  };
}

/**
 * 创建测试消息
 * @param {string} role - 角色
 * @param {string} content - 内容
 * @param {Object} metadata - 元数据
 * @returns {Object}
 */
export function createTestMessage(role, content, metadata = {}) {
  return {
    role,
    content,
    timestamp: Date.now(),
    ...metadata
  };
}

/**
 * 模拟聊天会话
 * @param {Array} messages - 消息数组
 * @param {Object} config - 配置
 * @returns {Promise<string>}
 */
export async function simulateChat(messages, config = {}) {
  const lastMessage = messages[messages.length - 1];
  return `Response to: ${lastMessage.content}`;
}

/**
 * 清理环境变量
 * @param {Array<string>} vars - 要清理的环境变量名
 */
export function cleanupEnvVars(vars) {
  const values = {};

  for (const varName of vars) {
    values[varName] = process.env[varName];
    delete process.env[varName];
  }

  return function restore() {
    for (const [varName, value] of Object.entries(values)) {
      if (value !== undefined) {
        process.env[varName] = value;
      }
    }
  };
}

/**
 * 设置测试环境
 * @returns {Promise<Function>} 清理函数
 */
export async function setupTestEnv() {
  const tempDir = await createTempDir();
  const originalDir = process.cwd();

  process.chdir(tempDir);

  return async function cleanup() {
    process.chdir(originalDir);
    await cleanupTempDir(tempDir);
  };
}

/**
 * 断言文件内容
 * @param {string} filePath - 文件路径
 * @param {string|RegExp} expected - 期望内容
 * @param {Object} options - 选项
 */
export async function assertFileContent(filePath, expected, options = {}) {
  const { timeout = 5000 } = options;

  await waitForFile(filePath, { timeout });

  const content = await fs.readFile(filePath, 'utf-8');

  if (expected instanceof RegExp) {
    expect(content).toMatch(expected);
  } else {
    expect(content).toContain(expected);
  }
}

/**
 * 获取测试包
 * @returns {Object}
 */
export function getTestHelpers() {
  return {
    createTempDir,
    cleanupTempDir,
    createTestConfig,
    createTestHistory,
    executeCLI,
    mockFetch,
    mockFetchError,
    mockFetchStatus,
    restoreFetch,
    waitForCondition,
    waitForFile,
    readJSON,
    writeJSON,
    fileExists,
    randomString,
    randomPort,
    createTestResponse,
    createTestMessage,
    simulateChat,
    cleanupEnvVars,
    setupTestEnv,
    assertFileContent
  };
}

export default getTestHelpers();
