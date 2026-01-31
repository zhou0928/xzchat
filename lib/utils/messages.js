/**
 * 命令帮助和错误消息管理器
 * 提供统一、友好的命令提示和错误消息
 */

/**
 * 命令帮助信息
 */
export const COMMAND_HELP = {
  // 会话命令
  session: {
    summary: '管理会话',
    subcommands: {
      list: '列出所有会话',
      use: '/session use <name|index> - 切换到指定会话',
      new: '/session new <name> - 创建并切换到新会话',
      delete: '/session delete <name> - 删除会话',
      clone: '/session clone <src> <tgt> - 克隆会话',
      search: '/session search <keyword> - 搜索所有会话中的内容',
      export: '/session export <name> [format] - 导出会话 (md/json/txt)'
    },
    examples: [
      '/session list',
      '/session use 1',
      '/session new feature-x',
      '/session search API'
    ],
    tips: [
      '使用数字索引快速切换会话',
      '默认会话不可删除，但可以用 /clear 清空',
      '支持搜索所有会话的历史内容'
    ]
  },

  // 分支命令
  branch: {
    summary: '管理对话分支',
    subcommands: {
      list: '/branch list - 列出所有分支',
      create: '/branch create <desc> - 创建新分支',
      switch: '/branch switch <id> - 切换到指定分支',
      delete: '/branch delete <id> - 删除分支',
      compare: '/branch compare <id1> <id2> - 比较两个分支',
      merge: '/branch merge <src> <dst> - 合并分支',
      tree: '/branch tree - 显示分支树结构',
      cleanup: '/branch cleanup - 清理孤立分支'
    },
    examples: [
      '/branch create 尝试新方案',
      '/branch list',
      '/branch compare branch_1 branch_2',
      '/branch merge branch_1 main'
    ],
    tips: [
      '分支可以在对话的任意点创建',
      '支持并行探索不同的实现方案',
      '合并时可以选择不同的模式'
    ]
  },

  // 文件命令
  load: {
    summary: '加载文件到上下文',
    usage: '/load [file]',
    examples: [
      '/load',
      '/load README.md',
      '/load src/app.js'
    ],
    tips: [
      '不指定文件时进入交互式选择',
      '会显示文件大小和类型',
      '敏感文件会有安全警告'
    ]
  },

  open: {
    summary: '用默认程序打开文件',
    usage: '/open <file>',
    examples: [
      '/open README.md',
      '/open src/index.js'
    ],
    tips: [
      '使用系统默认程序打开文件',
      '支持图片、文本、代码等类型'
    ]
  },

  scan: {
    summary: '扫描项目结构',
    usage: '/scan',
    tips: [
      '自动扫描当前目录结构',
      '大型项目会询问是否加载',
      '以目录树格式显示'
    ]
  },

  // Git 命令
  commit: {
    summary: '生成 Git 提交信息',
    examples: [
      '/commit'
    ],
    tips: [
      '自动分析代码变更',
      '生成符合规范的提交信息',
      '支持编辑后提交'
    ]
  },

  review: {
    summary: 'AI 代码审查',
    examples: [
      '/review'
    ],
    tips: [
      '分析暂存区或工作区变更',
      '检查 Bug、风格、安全性',
      '提供建议和改进方案'
    ]
  },

  // 编辑器命令
  editor: {
    summary: '打开外部编辑器',
    usage: '/editor',
    tips: [
      '使用 $EDITOR 环境变量指定的编辑器',
      '默认使用 vi',
      '适合编写长文本'
    ]
  },

  // RAG 命令
  index: {
    summary: '建立代码索引',
    usage: '/index [dir]',
    examples: [
      '/index',
      '/index ./src'
    ],
    tips: [
      '支持并行处理，速度更快',
      '自动缓存嵌入向量',
      '大型项目请等待完成'
    ]
  },

  search: {
    summary: '搜索代码库',
    usage: '/search <query>',
    examples: [
      '/search API 配置',
      '/search 异步函数'
    ],
    tips: [
      '使用向量相似度搜索',
      '返回最相关的代码片段',
      '需要先建立索引'
    ]
  },

  // Token 和成本命令
  token: {
    summary: '查看 Token 使用和成本',
    subcommands: {
      current: '/token current - 查看当前统计',
      history: '/token history - 查看历史记录',
      daily: '/token daily - 查看每日统计',
      model: '/token model - 查看按模型统计',
      export: '/token export <file> - 导出为 CSV',
      reset: '/token reset - 重置当前统计',
      all: '/token all - 查看所有统计',
      clear: '/token clear - 清空所有数据'
    },
    examples: [
      '/token current',
      '/token daily',
      '/token export stats.csv'
    ],
    tips: [
      '自动追踪所有 API 调用',
      '支持多维度统计分析',
      '可导出为 CSV 格式'
    ]
  },

  // 插件系统命令
  plugin: {
    summary: '插件管理系统',
    subcommands: {
      list: '/plugin list - 列出所有插件',
      load: '/plugin load <name> - 加载插件',
      unload: '/plugin unload <name> - 卸载插件',
      enable: '/plugin enable <name> - 启用插件',
      disable: '/plugin disable <name> - 禁用插件',
      info: '/plugin info <name> - 显示插件详细信息',
      scan: '/plugin scan - 扫描插件目录',
      reload: '/plugin reload <name> - 重新加载插件',
      validate: '/plugin validate <name> - 验证插件代码质量',
      marketplace: '/plugin marketplace - 访问插件市场',
      install: '/plugin install <name> - 安装插件',
      search: '/plugin search <keyword> - 搜索插件',
      update: '/plugin update <name> - 更新插件',
      uninstall: '/plugin uninstall <name> - 卸载并删除插件',
      performance: '/plugin performance - 查看插件性能统计',
      cache: '/plugin cache - 管理插件缓存',
      deps: '/plugin deps <name> - 查看插件依赖关系',
      history: '/plugin history <name> - 查看插件版本历史',
      restore: '/plugin restore <name> <version> - 恢复插件版本'
    },
    examples: [
      '/plugin list',
      '/plugin load example-timer',
      '/plugin enable example-timer',
      '/plugin info example-timer',
      '/plugin validate example-timer',
      '/plugin marketplace'
    ],
    tips: [
      '插件可以扩展命令、钩子和中间件',
      '支持热加载，无需重启程序',
      '使用验证确保插件代码质量',
      '性能监控帮助优化插件性能',
      '支持插件依赖管理和版本控制',
      '使用缓存提升加载速度',
      '插件市场提供丰富的插件资源'
    ]
  },

  // 其他命令
  clear: {
    summary: '清空当前会话',
    usage: '/clear',
    tips: [
      '清空后不能撤销',
      '只清空当前会话消息'
    ]
  },

  undo: {
    summary: '撤销最后一条消息',
    usage: '/undo',
    tips: [
      '可以多次撤销',
      '只撤销用户和 AI 的对话'
    ]
  },

  retry: {
    summary: '重试最后一条 AI 回复',
    usage: '/retry',
    tips: [
      '使用相同输入重新生成',
      '适合获取不同的回复'
    ]
  },

  continue: {
    summary: '继续生成 AI 回复',
    usage: '/continue',
    tips: [
      '当回复被截断时使用',
      '会在原回复基础上继续'
    ]
  },

  config: {
    summary: '管理配置',
    subcommands: {
      list: '/config list - 列出所有配置',
      get: '/config get <key> - 获取配置值',
      set: '/config set <key> <value> - 设置配置值',
      profile: '/config profile - 查看当前配置文件'
    },
    examples: [
      '/config list',
      '/config set model gpt-4',
      '/config get apiKey'
    ],
    tips: [
      '支持热更新配置',
      '修改后立即生效'
    ]
  },

  help: {
    summary: '显示帮助信息',
    usage: '/help [command]',
    examples: [
      '/help',
      '/help session',
      '/help token'
    ],
    tips: [
      '不带参数显示所有命令',
      '带参数显示指定命令的详细帮助'
    ]
  }
};

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  // 通用错误
  UNKNOWN_COMMAND: '📖 未知命令，使用 /help 查看帮助',
  INVALID_ARGUMENTS: '参数无效，请检查命令格式',
  MISSING_ARGUMENT: '缺少必要参数',
  OPERATION_CANCELLED: '操作已取消',
  OPERATION_FAILED: '操作失败',

  // 文件相关错误
  FILE_NOT_FOUND: '文件不存在: {file}',
  FILE_ACCESS_DENIED: '文件访问被拒绝',
  FILE_TOO_LARGE: '文件过大，已自动截取',
  INVALID_PATH: '路径格式错误',
  SENSITIVE_FILE: '⚠️  这是一个敏感文件，请确认是否要继续',

  // Git 相关错误
  GIT_NOT_FOUND: '当前目录不是 Git 仓库',
  GIT_NO_CHANGES: '没有检测到代码变更',
  GIT_COMMIT_FAILED: 'Git 提交失败',
  GIT_DIFF_FAILED: '获取 Git 变更失败',

  // 会话相关错误
  SESSION_NOT_FOUND: '会话不存在',
  SESSION_DELETE_CURRENT: '不能删除当前正在使用的会话',
  SESSION_DELETE_DEFAULT: '不能删除默认会话',
  SESSION_INVALID_INDEX: '会话索引超出范围',

  // 分支相关错误
  BRANCH_NOT_FOUND: '分支不存在',
  BRANCH_DELETE_CURRENT: '不能删除当前分支',
  BRANCH_MERGE_FAILED: '分支合并失败',

  // 配置相关错误
  CONFIG_NOT_FOUND: '配置项不存在',
  CONFIG_INVALID_VALUE: '配置值无效',
  CONFIG_LOAD_FAILED: '加载配置失败',

  // 网络相关错误
  NETWORK_ERROR: '网络连接失败',
  API_ERROR: 'API 调用失败',
  RATE_LIMITED: '⚠️  API 速率限制，请稍后重试',
  TIMEOUT: '请求超时',

  // RAG 相关错误
  INDEX_NOT_FOUND: '索引不存在，请先运行 /index',
  INDEX_FAILED: '索引创建失败',
  SEARCH_FAILED: '搜索失败',

  // 输入验证错误
  INVALID_API_KEY: 'API Key 格式无效',
  INVALID_URL: 'URL 格式无效',
  INVALID_MODEL: '模型名称无效',
  EMPTY_INPUT: '输入不能为空',
  INPUT_TOO_LONG: '输入过长，已自动截取',

  // 权限相关错误
  PERMISSION_DENIED: '权限不足',
  OPERATION_NOT_ALLOWED: '不允许执行此操作',

  // 自定义错误格式化
  format(error, context = {}) {
    let message = this[error] || '未知错误';
    
    // 替换上下文变量
    for (const [key, value] of Object.entries(context)) {
      message = message.replace(`{${key}}`, value);
    }
    
    return message;
  }
};

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  SESSION_CREATED: '✅ 会话已创建: {name}',
  SESSION_SWITCHED: '✅ 已切换到会话: {name} (记录数: {count})',
  SESSION_DELETED: '✅ 已删除会话: {name}',
  SESSION_CLONED: '✅ 已克隆会话: {src} → {tgt}',
  SESSION_CLEARED: '✅ 当前会话已清空',

  BRANCH_CREATED: '✅ 分支已创建: {id}',
  BRANCH_SWITCHED: '✅ 已切换到分支: {id}',
  BRANCH_DELETED: '✅ 已删除分支: {id}',
  BRANCH_MERGED: '✅ 分支已合并: {src} → {dst}',

  FILE_LOADED: '✅ 已加载文件: {file}',
  FILE_SAVED: '✅ 已保存文件: {file}',
  FILE_OPENED: '✅ 已打开: {file}',

  GIT_COMMITTED: '✅ 提交成功!',
  GIT_STAGED: '✅ 已暂存所有变更',

  INDEX_CREATED: '✅ 索引完成！共 {chunks} 个块',
  SEARCH_COMPLETED: '✅ 搜索完成，找到 {count} 个结果',

  CONFIG_UPDATED: '✅ 配置已更新: {key} = {value}',
  CONFIG_LOADED: '✅ 配置已加载',

  UNDONE: '✅ 已撤销',
  RETRIED: '✅ 已重试',
  CONTINUED: '✅ 已继续生成',

  format(message, context = {}) {
    let msg = this[message] || '✅ 操作成功';
    
    for (const [key, value] of Object.entries(context)) {
      msg = msg.replace(`{${key}}`, value);
    }
    
    return msg;
  }
};

/**
 * 警告消息
 */
export const WARNING_MESSAGES = {
  LARGE_FILE: '⚠️  文件较大 (~{size} KB)，可能影响性能',
  LARGE_PROJECT: '⚠️  项目结构较大 (~{tokens} tokens)，确定要加载吗?',
  NO_API_KEY: '⚠️  未配置 API Key，请先设置',
  NO_CHANGES: '⚠️  没有检测到变更',
  EXPIRED_CACHE: '⚠️  缓存已过期',
  PARTIAL_FAILURE: '⚠️  部分操作失败',
  SLOW_RESPONSE: '⚠️  响应较慢，请耐心等待',
  RATE_LIMITED: '⚠️  API 速率限制，请稍后重试',

  format(message, context = {}) {
    let msg = this[message] || '⚠️  警告';
    
    for (const [key, value] of Object.entries(context)) {
      msg = msg.replace(`{${key}}`, value);
    }
    
    return msg;
  }
};

/**
 * 信息消息
 */
export const INFO_MESSAGES = {
  LOADING: '📥 正在加载...',
  SAVING: '💾 正在保存...',
  PROCESSING: '⏳ 正在处理...',
  SEARCHING: '🔍 正在搜索...',
  THINKING: '🤔 正在思考...',
  GENERATING: '🤖 正在生成...',
  ANALYZING: '🔬 正在分析...',
  INDEXING: '📚 正在建立索引...',
  FETCHING: '🌐 正在获取数据...',
  WAITING: '⏸️  正在等待...',

  format(message, context = {}) {
    let msg = this[message] || 'ℹ️  信息';
    
    for (const [key, value] of Object.entries(context)) {
      msg = msg.replace(`{${key}}`, value);
    }
    
    return msg;
  }
};

/**
 * 显示命令帮助
 */
export function showCommandHelp(command) {
  const help = COMMAND_HELP[command];
  
  if (!help) {
    console.log(`❌ 未找到命令 "${command}" 的帮助信息`);
    showAllCommands();
    return;
  }

  console.log(`\n📖 ${command} - ${help.summary}`);
  console.log('─'.repeat(50));

  if (help.usage) {
    console.log(`\n用法:\n  ${help.usage}`);
  }

  if (help.subcommands) {
    console.log('\n子命令:');
    Object.values(help.subcommands).forEach(sub => {
      console.log(`  ${sub}`);
    });
  }

  if (help.examples) {
    console.log('\n示例:');
    help.examples.forEach(example => {
      console.log(`  ${example}`);
    });
  }

  if (help.tips) {
    console.log('\n💡 提示:');
    help.tips.forEach(tip => {
      console.log(`  • ${tip}`);
    });
  }
}

/**
 * 显示所有命令
 */
export function showAllCommands() {
  console.log('\n📖 可用命令:\n');
  console.log('📂 会话管理:');
  console.log('  /session       - 管理会话');
  console.log('  /clear         - 清空当前会话');
  console.log('  /undo          - 撤销最后一条消息');
  console.log('  /retry         - 重试最后一条回复');
  console.log('  /continue      - 继续生成回复');

  console.log('\n🌳 分支管理:');
  console.log('  /branch        - 管理对话分支');

  console.log('\n📄 文件操作:');
  console.log('  /load          - 加载文件到上下文');
  console.log('  /open          - 打开文件');
  console.log('  /scan          - 扫描项目结构');
  console.log('  /editor        - 打开外部编辑器');

  console.log('\n🔍 代码搜索 (RAG):');
  console.log('  /index         - 建立代码索引');
  console.log('  /search        - 搜索代码库');

  console.log('\n🐙 Git 操作:');
  console.log('  /commit        - 生成 Git 提交信息');
  console.log('  /review        - AI 代码审查');
  console.log('  /log           - 查看 Git 历史');

  console.log('\n💰 成本追踪:');
  console.log('  /token         - 查看 Token 使用和成本');

  console.log('\n⚙️  配置:');
  console.log('  /config        - 管理配置');

  console.log('\n🔌 插件系统:');
  console.log('  /plugin        - 插件管理');
  console.log('    /plugin list        - 列出所有插件');
  console.log('    /plugin load        - 加载插件');
  console.log('    /plugin enable      - 启用插件');
  console.log('    /plugin disable     - 禁用插件');
  console.log('    /plugin info        - 插件详细信息');
  console.log('    /plugin validate    - 验证插件质量');
  console.log('    /plugin marketplace  - 插件市场');
  console.log('    /plugin performance - 性能监控');

  console.log('\n❓ 帮助:');
  console.log('  /help          - 显示帮助信息');
  console.log('  /exit          - 退出程序');

  console.log('\n💡 使用 /help <command> 查看命令详细帮助\n');
}

/**
 * 显示错误信息
 */
export function showError(error, context = {}) {
  console.error(`\n❌ ${ERROR_MESSAGES.format(error, context)}`);
}

/**
 * 显示成功信息
 */
export function showSuccess(message, context = {}) {
  console.log(`\n${SUCCESS_MESSAGES.format(message, context)}`);
}

/**
 * 显示警告信息
 */
export function showWarning(message, context = {}) {
  console.log(`\n${WARNING_MESSAGES.format(message, context)}`);
}

/**
 * 显示信息
 */
export function showInfo(message, context = {}) {
  console.log(INFO_MESSAGES.format(message, context));
}

/**
 * 格式化列表显示
 */
export function formatList(items, options = {}) {
  const {
    prefix = '  ',
    separator = ' - ',
    numbered = false
  } = options;

  return items.map((item, index) => {
    let line = prefix;
    
    if (numbered) {
      line += `[${index + 1}] `;
    }
    
    if (typeof item === 'string') {
      line += item;
    } else if (item.name) {
      line += item.name;
      if (item.description) {
        line += separator + item.description;
      }
    } else {
      line += JSON.stringify(item);
    }
    
    return line;
  }).join('\n');
}

/**
 * 格式化表格显示
 */
export function formatTable(headers, rows, options = {}) {
  const { padding = 2 } = options;
  
  // 计算每列的最大宽度
  const widths = headers.map((header, i) => {
    const maxWidth = rows.reduce((max, row) => {
      const cell = String(row[i] || '');
      return Math.max(max, cell.length);
    }, header.length);
    return maxWidth + padding;
  });

  // 生成分隔线
  const separator = '─' + widths.map(w => '─'.repeat(w)).join('┼') + '─';

  // 生成表头
  const headerRow = '│' + headers.map((h, i) => 
    h.padEnd(widths[i] - 1)
  ).join('│') + '│';

  // 生成数据行
  const dataRows = rows.map(row => {
    return '│' + row.map((cell, i) => 
      String(cell || '').padEnd(widths[i] - 1)
    ).join('│') + '│';
  });

  return {
    header: separator + '\n' + headerRow + '\n' + separator,
    rows: dataRows.map(r => r + '\n' + separator).join('\n'),
    full: separator + '\n' + headerRow + '\n' + separator + '\n' + dataRows.map(r => r + '\n' + separator).join('\n')
  };
}
