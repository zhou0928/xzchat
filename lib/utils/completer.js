/**
 * 命令补全模块
 * 提供Tab自动补全功能
 */

import { loadConfig } from '../config.js';
import { getFileList } from '../tools.js';
import { listBranches } from './branch-manager.js';

// 命令列表
export const COMMANDS = [
  '/help',
  '/h',
  '/clear',
  '/exit',
  '/quit',
  '/q',

  // 会话管理
  '/session',
  '/s',
  '/new',
  '/list',
  '/ls',

  // 分支管理
  '/branch',
  '/b',
  '/switch',
  '/merge',

  // 文件操作
  '/load',
  '/l',
  '/scan',
  '/read',
  '/write',
  '/edit',
  '/search',

  // 历史管理
  '/undo',
  '/retry',
  '/continue',
  '/c',

  // Git操作
  '/git',
  '/commit',
  '/log',
  '/diff',

  // RAG搜索
  '/index',
  '/rag',

  // 配置管理
  '/config',
  '/role',
  '/r',
  '/token',

  // 其他
  '/stats',
  '/cost'
];

// 命令参数定义
export const COMMAND_ARGS = {
  '/session': ['list', 'use', 'new', 'delete', 'clone', 'search', 'export'],
  '/s': ['list', 'use', 'new', 'delete', 'clone', 'search', 'export'],
  '/branch': ['list', 'create', 'switch', 'delete', 'merge', 'compare'],
  '/b': ['list', 'create', 'switch', 'delete', 'merge', 'compare'],
  '/load': ['--create-backup', '--no-backup'],
  '/l': ['--create-backup', '--no-backup'],
  '/scan': ['--depth', '--ignore'],
  '/search': ['--case-sensitive', '--type'],
  '/git': ['status', 'add', 'commit', 'log', 'diff', 'push', 'pull'],
  '/config': ['init', 'get', 'set', 'list', 'validate', 'repair'],
  '/role': ['list', 'set', 'use', 'delete'],
  '/r': ['list', 'set', 'use', 'delete'],
  '/index': ['--concurrency', '--force', '--no-progress'],
  '/rag': ['--top-k', '--no-cache'],
  '/stats': ['--detailed'],
  '/token': ['--by-model', '--reset']
};

// 文件扩展名映射
const FILE_EXTENSIONS = {
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.cpp': 'C++',
  '.c': 'C',
  '.h': 'C Header',
  '.css': 'CSS',
  '.html': 'HTML',
  '.jsx': 'React',
  '.tsx': 'React TypeScript',
  '.vue': 'Vue',
  '.yml': 'YAML',
  '.yaml': 'YAML',
  '.xml': 'XML',
  '.txt': 'Text'
};

/**
 * 获取当前目录文件列表
 */
async function getCurrentFiles() {
  try {
    const files = getFileList(process.cwd());
    return files;
  } catch (error) {
    return [];
  }
}

/**
 * 获取可用会话列表
 */
async function getAvailableSessions() {
  try {
    const sessions = await listSessions();
    return sessions.map(s => s.id);
  } catch (error) {
    return [];
  }
}

/**
 * 获取指定会话的分支列表
 */
async function getAvailableBranches(sessionId) {
  try {
    const branches = await listBranches(sessionId);
    return branches.map(b => b.id);
  } catch (error) {
    return [];
  }
}

/**
 * 获取可用配置profiles
 */
function getAvailableProfiles() {
  try {
    const config = loadConfig();
    return Object.keys(config.profiles || {});
  } catch (error) {
    return [];
  }
}

/**
 * 获取可用roles
 */
function getAvailableRoles() {
  try {
    const config = loadConfig();
    return Object.keys(config.roles || {});
  } catch (error) {
    return [];
  }
}

/**
 * 命令补全主函数
 */
export function completeCommand(line) {
  // 如果不是命令，返回空
  if (!line.startsWith('/')) {
    return [];
  }

  const parts = line.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  // 补全命令
  if (args.length === 0) {
    const matches = COMMANDS.filter(cmd =>
      cmd.startsWith(command) && cmd !== command
    );
    return matches;
  }

  // 补全参数
  const argDef = COMMAND_ARGS[command];
  if (argDef) {
    const currentArg = args[args.length - 1];

    // 如果当前参数是选项（以-开头）
    if (currentArg && currentArg.startsWith('-')) {
      const matches = argDef.filter(arg =>
        arg.startsWith(currentArg) && arg.startsWith('-')
      );
      return matches;
    }

    // 如果当前参数不是选项
    if (!currentArg || !currentArg.startsWith('-')) {
      // 如果是第一个参数，补全子命令
      if (args.length === 1) {
        const matches = argDef.filter(arg =>
          arg.startsWith(currentArg) && !arg.startsWith('-')
        );
        return matches;
      }
    }
  }

  // 特定命令的智能补全
  if (command === '/load' || command === '/l') {
    return completeFile(line);
  }

  if (command === '/session' || command === '/s') {
    const subCommand = args[0];
    if (subCommand === 'use' || subCommand === 'delete' || subCommand === 'clone') {
      return completeSession(line);
    }
  }

  if (command === '/branch' || command === '/b') {
    const subCommand = args[0];
    if (subCommand === 'switch' || subCommand === 'delete') {
      return completeBranch(line);
    }
  }

  if (command === '/role' || command === '/r') {
    const subCommand = args[0];
    if (subCommand === 'use' || subCommand === 'delete') {
      return completeRole(line);
    }
  }

  if (command === '/config') {
    const subCommand = args[0];
    if (subCommand === 'set') {
      return completeConfigKey(line);
    }
  }

  return [];
}

/**
 * 文件路径补全
 */
async function completeFile(line) {
  const parts = line.trim().split(/\s+/);
  const path = parts[parts.length - 1] || '';
  const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '.';

  try {
    const files = await getCurrentFiles();
    const matches = files.filter(file =>
      file.startsWith(path) && file !== path
    );

    // 添加目录标记
    return matches.map(file => {
      return file;
    });
  } catch (error) {
    return [];
  }
}

/**
 * 会话ID补全
 */
async function completeSession(line) {
  const parts = line.trim().split(/\s+/);
  const sessionId = parts[parts.length - 1] || '';

  try {
    const sessions = await getAvailableSessions();
    const matches = sessions.filter(id =>
      id.startsWith(sessionId) && id !== sessionId
    );
    return matches;
  } catch (error) {
    return [];
  }
}

/**
 * 分支ID补全
 */
async function completeBranch(line) {
  const parts = line.trim().split(/\s+/);
  const branchId = parts[parts.length - 1] || '';

  try {
    // 需要获取当前会话ID
    const config = loadConfig();
    const sessionId = config.currentProfile || 'default';
    const branches = await getAvailableBranches(sessionId);
    const matches = branches.filter(id =>
      id.startsWith(branchId) && id !== branchId
    );
    return matches;
  } catch (error) {
    return [];
  }
}

/**
 * Role补全
 */
function completeRole(line) {
  const parts = line.trim().split(/\s+/);
  const roleName = parts[parts.length - 1] || '';

  try {
    const roles = getAvailableRoles();
    const matches = roles.filter(name =>
      name.startsWith(roleName) && name !== roleName
    );
    return matches;
  } catch (error) {
    return [];
  }
}

/**
 * 配置key补全
 */
function completeConfigKey(line) {
  const parts = line.trim().split(/\s+/);
  const key = parts[parts.length - 1] || '';

  const configKeys = [
    'apiKey',
    'baseUrl',
    'model',
    'provider',
    'temperature',
    'maxTokens',
    'systemPrompt',
    'embeddingModel'
  ];

  const matches = configKeys.filter(k =>
    k.startsWith(key) && k !== key
  );

  return matches;
}

/**
 * 创建REPL补全器（用于Node.js readline）
 */
export function createCompleter() {
  return async (line) => {
    const matches = await completeCommand(line);

    // 添加原始命令到匹配列表（用于 readline）
    const completions = matches.map(match => {
      if (line.trim().split(/\s+/).length === 1) {
        // 补全命令
        return match + ' ';
      } else {
        // 补全参数
        return line.trim() + ' ' + match;
      }
    });

    return [completions, line];
  };
}

/**
 * 格式化补全结果为提示
 */
export function formatCompletionSuggestions(matches, maxCount = 10) {
  if (matches.length === 0) {
    return '没有匹配的补全';
  }

  const display = matches.slice(0, maxCount);
  const moreCount = matches.length - maxCount;

  let output = '可用选项:\n';
  display.forEach((match, index) => {
    output += `  ${index + 1}. ${match}\n`;
  });

  if (moreCount > 0) {
    output += `  ... 还有 ${moreCount} 个选项\n`;
  }

  return output;
}

export default {
  COMMANDS,
  COMMAND_ARGS,
  completeCommand,
  createCompleter,
  formatCompletionSuggestions
};
