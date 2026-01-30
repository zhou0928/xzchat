/**
 * 工具注册表
 * 统一管理所有工具的定义和处理器
 */
export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.handlers = new Map();
    this.categories = new Map();
  }

  /**
   * 注册工具
   */
  register(tool) {
    const { name, handler, category = 'general' } = tool;

    // 注册工具定义
    this.tools.set(name, tool);

    // 注册处理器
    if (handler) {
      this.handlers.set(name, handler);
    }

    // 添加到分类
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(tool);
  }

  /**
   * 批量注册工具
   */
  registerMany(tools) {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * 查找工具
   */
  find(name) {
    return this.tools.get(name) || null;
  }

  /**
   * 执行工具
   */
  async execute(name, args, context) {
    const handler = this.handlers.get(name);
    
    if (!handler) {
      throw new Error(`工具 "${name}" 没有处理器`);
    }

    return await handler(args, context);
  }

  /**
   * 获取所有工具
   */
  getAll() {
    return Array.from(this.tools.values());
  }

  /**
   * 按分类获取工具
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

  /**
   * 转换为 OpenAI 格式
   */
  toOpenAIFormat(category) {
    const tools = category ? this.getByCategory(category) : this.getAll();
    
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters || {
          type: 'object',
          properties: {},
          required: []
        }
      }
    }));
  }

  /**
   * 验证工具调用
   */
  validateToolCall(call) {
    const tool = this.find(call.function?.name);
    
    if (!tool) {
      return { valid: false, error: `工具 "${call.function?.name}" 不存在` };
    }

    // 参数验证
    const args = call.function?.arguments || {};
    const parameters = tool.parameters || { type: 'object', properties: {}, required: [] };
    
    // 检查必需参数
    if (parameters.required && Array.isArray(parameters.required)) {
      for (const requiredParam of parameters.required) {
        if (!(requiredParam in args)) {
          return { 
            valid: false, 
            error: `缺少必需参数: ${requiredParam}` 
          };
        }
      }
    }
    
    // 检查参数类型
    if (parameters.properties) {
      for (const [paramName, paramDef] of Object.entries(parameters.properties)) {
        if (paramName in args) {
          const value = args[paramName];
          const expectedType = paramDef.type;
          
          // 简单类型检查
          if (expectedType === 'string' && typeof value !== 'string') {
            return { 
              valid: false, 
              error: `参数 "${paramName}" 应为字符串类型` 
            };
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            return { 
              valid: false, 
              error: `参数 "${paramName}" 应为数字类型` 
            };
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            return { 
              valid: false, 
              error: `参数 "${paramName}" 应为布尔类型` 
            };
          }
          if (expectedType === 'array' && !Array.isArray(value)) {
            return { 
              valid: false, 
              error: `参数 "${paramName}" 应为数组类型` 
            };
          }
          if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            return { 
              valid: false, 
              error: `参数 "${paramName}" 应为对象类型` 
            };
          }
        }
      }
    }
    
    return { valid: true };
  }
}

/**
 * 创建默认工具注册表
 */
export function createDefaultToolRegistry() {
  const registry = new ToolRegistry();

  // 文件系统工具
  registry.register({
    name: 'read_file',
    description: '读取文件内容',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: '文件路径'
        }
      },
      required: ['file_path']
    },
    handler: async (args, context) => {
      const { readFile } = await import('../../lib/utils/read-file.js');
      return await readFile(args.file_path);
    }
  });

  registry.register({
    name: 'write_file',
    description: '写入文件内容',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: '文件路径'
        },
        content: {
          type: 'string',
          description: '文件内容'
        }
      },
      required: ['file_path', 'content']
    },
    handler: async (args, context) => {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(args.file_path, args.content, 'utf-8');
      return { success: true };
    }
  });

  registry.register({
    name: 'list_files',
    description: '列出目录内容',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: '目录路径'
        },
        recursive: {
          type: 'boolean',
          description: '是否递归',
          default: false
        }
      },
      required: ['directory']
    },
    handler: async (args, context) => {
      const { listFiles } = await import('../../lib/utils/file-utils.js');
      return await listFiles(args.directory, args.recursive);
    }
  });

  registry.register({
    name: 'search_content',
    description: '搜索文件内容',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: '搜索模式'
        },
        directory: {
          type: 'string',
          description: '搜索目录'
        }
      },
      required: ['pattern', 'directory']
    },
    handler: async (args, context) => {
      const { searchContent } = await import('../../lib/utils/search-utils.js');
      return await searchContent(args.pattern, args.directory);
    }
  });

  // Git 工具
  registry.register({
    name: 'git_status',
    description: '查看 Git 状态',
    category: 'git',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (args, context) => {
      const { execSync } = await import('node:child_process');
      try {
        const output = execSync('git status --porcelain', { encoding: 'utf-8' });
        return { status: output.trim() };
      } catch (e) {
        return { error: e.message };
      }
    }
  });

  registry.register({
    name: 'git_diff',
    description: '查看 Git 差异',
    category: 'git',
    parameters: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: '文件路径（可选）'
        }
      },
      required: []
    },
    handler: async (args, context) => {
      const { execSync } = await import('node:child_process');
      try {
        const cmd = args.file ? `git diff ${args.file}` : 'git diff';
        const output = execSync(cmd, { encoding: 'utf-8' });
        return { diff: output };
      } catch (e) {
        return { error: e.message };
      }
    }
  });

  // Shell 工具（受限）
  registry.register({
    name: 'run_command',
    description: '执行命令（受限）',
    category: 'shell',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: '要执行的命令'
        }
      },
      required: ['command']
    },
    handler: async (args, context) => {
      const { CommandSandbox } = await import('../../lib/utils/command-sandbox.js');
      const sandbox = new CommandSandbox({ dryRun: false });
      
      try {
        const result = await sandbox.execute(args.command, {
          cwd: process.cwd(),
          captureOutput: true
        });
        return result;
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  });

  // Web 工具
  registry.register({
    name: 'web_search',
    description: '搜索网络',
    category: 'web',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询'
        },
        max_results: {
          type: 'number',
          description: '最大结果数量',
          default: 5
        }
      },
      required: ['query']
    },
    handler: async (args, context) => {
      try {
        // 使用内置的 web_search 工具
        const { webSearch } = await import('../../lib/utils/web-utils.js');
        const results = await webSearch(args.query, {
          maxResults: args.max_results || 5
        });
        return { results };
      } catch (e) {
        return { error: e.message || '网络搜索失败' };
      }
    }
  });

  return registry;
}

/**
 * 创建全局默认工具注册表
 */
export const defaultToolRegistry = createDefaultToolRegistry();
