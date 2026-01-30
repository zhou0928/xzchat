
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { searchCodebase } from "./rag.js";
import { createBackup } from "./utils/file-loader.js";
import { validatePath, validateCommand, isSensitiveFile } from "./utils/security.js";

// 扫描目录辅助函数
export function getFileList(dir, ignoreList = [], depth = 0) {
  if (depth > 10) return []; // Recursion limit
  
  let currentIgnoreList = [...ignoreList];

  // 默认忽略列表
  const defaultIgnore = ["node_modules", ".git", "dist", "coverage", ".DS_Store", ".env", ".next", "build", "*.log", "*.lock"];
  
  // 在根目录尝试读取 .gitignore
  if (depth === 0) {
    try {
      const gitignorePath = path.join(dir, ".gitignore");
      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, "utf-8");
        const gitIgnorePatterns = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          .map(line => line.replace(/^\//, "").replace(/\/$/, ""));
        currentIgnoreList = [...currentIgnoreList, ...gitIgnorePatterns];
      }
    } catch (e) {
      // ignore error
    }
  }

  const ignore = [...defaultIgnore, ...currentIgnoreList];
  
  let results = [];
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    // Sort: directories first, then files
    files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });
    
    for (const file of files) {
      // Check ignore
      const shouldIgnore = ignore.some(pattern => {
          if (pattern === file.name) return true;
          if (pattern.startsWith("*") && file.name.endsWith(pattern.slice(1))) return true;
          if (pattern.endsWith("*") && file.name.startsWith(pattern.slice(0, -1))) return true;
          return false;
      });
      
      if (shouldIgnore) continue;

      if (file.isDirectory()) {
        const subFiles = getFileList(path.join(dir, file.name), currentIgnoreList, depth + 1);
        results = results.concat(subFiles.map(f => path.join(file.name, f)));
      } else {
        results.push(file.name);
      }
    }
  } catch (e) {
    // ignore access errors
  }
  return results;
}

export function scanDir(dir, ignoreList = [], prefix = "", depth = 0) {
  if (depth > 10) return ""; // Recursion limit
  
  let currentIgnoreList = [...ignoreList];

  // 默认忽略列表
  const defaultIgnore = ["node_modules", ".git", "dist", "coverage", ".DS_Store", ".env", ".next", "build", "*.log", "*.lock"];
  
  // 在根目录尝试读取 .gitignore
  if (depth === 0) {
    try {
      const gitignorePath = path.join(dir, ".gitignore");
      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, "utf-8");
        const gitIgnorePatterns = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          .map(line => line.replace(/^\//, "").replace(/\/$/, ""));
        currentIgnoreList = [...currentIgnoreList, ...gitIgnorePatterns];
      }
    } catch (e) {
      // ignore error
    }
  }

  const ignore = [...defaultIgnore, ...currentIgnoreList];
  
  let output = "";
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    // Sort: directories first, then files
    files.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });
    
    for (const file of files) {
      // Check ignore (support simple globs)
      const shouldIgnore = ignore.some(pattern => {
          if (pattern === file.name) return true;
          if (pattern.startsWith("*") && file.name.endsWith(pattern.slice(1))) return true;
          if (pattern.endsWith("*") && file.name.startsWith(pattern.slice(0, -1))) return true;
          return false;
      });
      
      if (shouldIgnore) continue;

      if (file.isDirectory()) {
        output += `${prefix}- ${file.name}/\n`;
        output += scanDir(path.join(dir, file.name), currentIgnoreList, `${prefix}  `, depth + 1);
      } else {
        output += `${prefix}- ${file.name}\n`;
      }
    }
  } catch (e) {
    // ignore access errors
  }
  return output;
}

export const builtInTools = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "读取本地文件的内容。当用户要求查看文件、分析代码或重构文件时使用。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "文件的相对或绝对路径" },
          start_line: { type: "integer", description: "起始行号 (从1开始，可选)" },
          end_line: { type: "integer", description: "结束行号 (可选)" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_files",
      description: "在项目中搜索包含特定关键词的文件。返回匹配的文件路径和行号。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词 (不区分大小写)" },
          path: { type: "string", description: "搜索目录，默认为当前目录" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "将内容写入本地文件。用于生成代码、重构文件或保存配置。会覆盖现有文件。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "文件的相对或绝对路径" },
          content: { type: "string", description: "要写入的文件内容" }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "edit_file",
      description: "智能修改文件内容。用于局部修改、修复 Bug 或添加代码片段，避免全量覆盖。请提供文件中原有的代码片段作为 old_content。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "文件路径" },
          old_content: { type: "string", description: "文件中现有的代码片段 (搜索目标)" },
          new_content: { type: "string", description: "替换后的新代码片段" }
        },
        required: ["path", "old_content", "new_content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "列出目录下的文件和子目录。用于探索项目结构。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "目录路径，默认为当前目录" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "在终端中执行 Shell 命令。用于安装依赖、运行测试、构建项目等。请谨慎使用。",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "要执行的 Shell 命令" }
        },
        required: ["command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_url",
      description: "从指定的 URL 获取内容。用于阅读在线文档、网页或 API 响应。",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "目标 URL (http/https)" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "使用搜索引擎搜索互联网。当需要获取最新资讯、解决未知错误或查找文档时使用。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "semantic_search",
      description: "基于向量的语义搜索。当用户问 '认证逻辑在哪里?' 或 '如何处理错误?' 等概念性问题时使用。需要先建立索引。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索问题或描述" }
        },
        required: ["query"]
      }
    }
  }
];

// Map-based handlers for better maintainability
const handlers = {
  async read_file(args) {
    try {
      const filepath = validatePath(args.path);

      if (!fs.existsSync(filepath)) {
        return `Error: File not found: ${filepath}`;
      }

      // 敏感文件检查
      if (isSensitiveFile(filepath)) {
        return `⚠️  警告: 这是一个敏感文件。请确认你要读取此文件。`;
      }

      let content = fs.readFileSync(filepath, "utf-8");

      if (args.start_line || args.end_line) {
        const lines = content.split('\n');
        const start = (args.start_line || 1) - 1;
        const end = args.end_line || lines.length;
        content = lines.slice(start, end).join('\n');
        return `(File Content of ${args.path} lines ${start+1}-${end}):\n${content}`;
      }

      return `(File Content of ${args.path}):\n${content}`;
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },

  async search_files(args) {
    const query = args.query.toLowerCase();
    const dir = path.resolve(process.cwd(), args.path || ".");
    
    // 使用 scanDir 的逻辑来遍历文件，但这里我们需要读取内容
    // 为避免性能问题，我们限制搜索深度和文件大小
    
    function searchRecursive(currentDir, depth = 0) {
        if (depth > 5) return [];
        let results = [];
        try {
            const files = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(currentDir, file.name);
                
                // Ignore common binary/system dirs
                if (file.name.startsWith(".") || file.name === "node_modules" || file.name === "dist" || file.name === "build") continue;
                
                if (file.isDirectory()) {
                    results = results.concat(searchRecursive(fullPath, depth + 1));
                } else {
                    // Check extension (skip images, binaries)
                    const ext = path.extname(file.name).toLowerCase();
                    if ([".jpg", ".png", ".exe", ".bin", ".lock", ".pdf"].includes(ext)) continue;

                    try {
                        const content = fs.readFileSync(fullPath, "utf-8");
                        const lines = content.split('\n');
                        lines.forEach((line, index) => {
                            if (line.toLowerCase().includes(query)) {
                                // Return relative path
                                const relPath = path.relative(process.cwd(), fullPath);
                                results.push(`${relPath}:${index + 1}: ${line.trim().slice(0, 100)}`);
                            }
                        });
                    } catch (e) {
                        logger.debug('文件读取错误，跳过', { file: fullPath, error: e.message });
                    }
                }
            }
        } catch (e) {
            logger.debug('目录搜索错误', { dir, error: e.message });
        }
        return results;
    }

    const matches = searchRecursive(dir);
    if (matches.length === 0) return "No matches found.";
    // Limit results
    return `Found ${matches.length} matches:\n${matches.slice(0, 50).join('\n')}${matches.length > 50 ? `\n...and ${matches.length - 50} more` : ""}`;
  },

  async write_file(args) {
    try {
      const filepath = validatePath(args.path);
      const dir = path.dirname(filepath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 自动备份机制
      createBackup(filepath);

      fs.writeFileSync(filepath, args.content, "utf-8");
      console.log(`💾 AI 已写入文件: ${args.path}`);
      return `Success: File written to ${args.path}`;
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },

  async edit_file(args) {
    try {
      const filepath = validatePath(args.path);

      if (!fs.existsSync(filepath)) {
        return `Error: File not found: ${filepath}`;
      }

      let content = fs.readFileSync(filepath, "utf-8");

      if (!content.includes(args.old_content)) {
        return `Error: old_content not found in ${args.path}. Please ensure exact match.`;
      }

      // 自动备份机制
      createBackup(filepath);

      // Replace first occurrence
      const newFileContent = content.replace(args.old_content, args.new_content);
      fs.writeFileSync(filepath, newFileContent, "utf-8");

      console.log(`✏️  AI 已修改文件: ${args.path}`);
      return `Success: File edited successfully.`;
    } catch (e) {
      return `Error: ${e.message}`;
    }
  },

  async list_dir(args) {
    const dirpath = path.resolve(process.cwd(), args.path || ".");
    if (!fs.existsSync(dirpath)) return `Error: Directory not found: ${dirpath}`;
    // Use scanDir logic but non-recursive or shallow?
    // The original list_dir was just fs.readdirSync.
    // Let's keep it simple for list_dir, maybe just 1 level.
    const files = fs.readdirSync(dirpath);
    return `(Directory Listing of ${args.path || "."}):\n${files.join("\n")}`;
  },

  async run_command(args, context) {
    const cmd = args.command;

    // 安全检查
    const validation = validateCommand(cmd);
    if (!validation.safe) {
      return `Error: ${validation.reason}`;
    }

    // 请求用户确认
    if (context && context.confirmCommand) {
      const approved = await context.confirmCommand(cmd);
      if (!approved) return "Error: User denied command execution.";
    } else {
      console.log(`⚠️  Warning: Executing command without confirmation mechanism: ${cmd}`);
    }

    console.log(`> Executing: ${cmd}`);
    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          resolve(`Error: ${error.message}\nStderr: ${stderr}`);
        } else {
          resolve(`Output:\n${stdout}\n${stderr ? `Stderr: ${stderr}` : ""}`);
        }
      });
    });
  },

  async read_url(args) {
    const url = args.url;
    console.log(`🌐 正在读取 URL: ${url}`);
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        
        if (!res.ok) {
            return `Error: Failed to fetch URL (${res.status} ${res.statusText})`;
        }
        
        const contentType = res.headers.get("content-type") || "";
        const text = await res.text();
        
        if (contentType.includes("application/json")) {
            return text.slice(0, 20000); // Limit JSON size
        }
        
        if (contentType.includes("text/html")) {
            // Simple HTML to text
            let clean = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, "");
            clean = clean.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, "");
            clean = clean.replace(/<[^>]+>/g, "\n");
            clean = clean.replace(/\n\s*\n/g, "\n").trim();
            
            if (clean.length > 15000) {
                return clean.slice(0, 15000) + "\n...(truncated)";
            }
            return clean;
        }
        
        return text.slice(0, 15000);
    } catch (e) {
        return `Error: ${e.message}`;
    }
  },

  async search_web(args) {
    const query = args.query;
    console.log(`🔍 正在搜索: ${query}`);
    try {
        // 使用 DuckDuckGo HTML 版 (无需 API Key)
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        
        if (!res.ok) return `Error: Search failed (${res.status})`;
        
        const html = await res.text();
        
        // 简单的 HTML 解析，提取结果
        // DDG HTML 结构: <div class="result__body"> ... <a class="result__a">Title</a> ... <a class="result__snippet">Snippet</a>
        
        // 移除无关的 script/style
        let clean = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, "");
        clean = clean.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, "");
        
        // 提取结果块
        const results = [];
        const regex = /<div[^>]*class="[^"]*result__body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = regex.exec(clean)) !== null) {
            const block = match[1];
            // 提取标题
            const titleMatch = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
            // 提取链接
            const linkMatch = /href="([^"]*)"/i.exec(titleMatch?.[0] || "");
            // 提取摘要
            const snippetMatch = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
            
            if (titleMatch && linkMatch) {
                const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
                const link = linkMatch[1];
                const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "";
                
                // DDG links sometimes are redirected, try to clean if possible, but raw is fine
                // decodeURIComponent logic might be needed for ddg URLs
                
                results.push(`- [${title}](${link})\n  ${snippet}`);
            }
        }
        
        if (results.length === 0) {
            // Fallback: simple text extraction if regex fails
             clean = clean.replace(/<[^>]+>/g, "\n").replace(/\n\s*\n/g, "\n").trim();
             return `Search Results (Raw Text):\n${clean.slice(0, 5000)}`;
        }
        
        return `Search Results for "${query}":\n\n${results.slice(0, 8).join("\n\n")}`;
    } catch (e) {
        return `Error: ${e.message}`;
    }
  },

  async semantic_search(args, context) {
      if (!context || !context.config) return "Error: Config not available";
      try {
          const results = await searchCodebase(args.query, process.cwd(), context.config);
          if (results.length === 0) return "No matches found. (Have you run /rag index?)";
          
          return results.map(r => `File: ${r.file}\nScore: ${r.score.toFixed(3)}\nContent:\n${r.content}\n---`).join("\n");
      } catch (e) {
          return `Error: ${e.message}`;
      }
  }
};

export async function handleBuiltInTool(name, args, context) {
  const handler = handlers[name];
  if (handler) {
    return await handler(args, context);
  }
  return null;
}
