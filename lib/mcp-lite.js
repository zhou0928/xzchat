import { spawn } from 'child_process';
import readline from 'readline';

export class MCPClient {
  constructor(command, args, env = {}) {
    this.command = command;
    this.args = args;
    this.env = env;
    this.process = null;
    this.requestId = 0;
    this.pending = new Map();
    this.rl = null;
    this.initialized = false;
    this.tools = [];
  }

  async connect() {
    try {
      console.log(`🔌 连接 MCP Server: ${this.command} ${this.args.join(' ')}`);
      this.process = spawn(this.command, this.args, {
        env: { ...process.env, ...this.env },
        stdio: ['pipe', 'pipe', 'inherit'] // stderr 继承以便调试
      });

      this.rl = readline.createInterface({
        input: this.process.stdout,
        terminal: false
      });

      this.rl.on('line', (line) => {
        if (!line.trim()) return;
        try {
          const msg = JSON.parse(line);
          // console.log("Received:", JSON.stringify(msg).slice(0, 100)); // Debug

          if (msg.id !== undefined && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) {
              reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              resolve(msg.result);
            }
          }
        } catch (e) {
          console.error("MCP JSON Parse Error:", e);
        }
      });
      
      this.process.on('error', (err) => {
        console.error(`MCP Process Error (${this.command}):`, err);
      });

      this.process.on('exit', (code) => {
        if (code !== 0) console.log(`MCP Server exited with code ${code}`);
      });

      // 初始化握手
      await this.initialize();
      this.initialized = true;
      console.log("✅ MCP Server 连接成功");
      
      // 获取工具列表
      await this.refreshTools();

    } catch (error) {
      console.error("MCP Connection Failed:", error);
      throw error;
    }
  }

  async request(method, params) {
    if (!this.process) throw new Error("MCP Client not connected");
    
    const id = this.requestId++;
    const msg = { jsonrpc: "2.0", id, method, params };
    const jsonStr = JSON.stringify(msg);
    // console.log("Sending:", jsonStr); // Debug
    this.process.stdin.write(jsonStr + "\n");
    
    return new Promise((resolve, reject) => {
      // 30秒超时
      const timeout = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error("MCP Request Timeout"));
        }
      }, 30000);

      this.pending.set(id, { 
        resolve: (res) => { clearTimeout(timeout); resolve(res); },
        reject: (err) => { clearTimeout(timeout); reject(err); }
      });
    });
  }

  async initialize() {
    return this.request("initialize", { 
      protocolVersion: "2024-11-05", 
      clientInfo: { name: "xiaozhou-chat", version: "1.0.0" },
      capabilities: { tools: {} } 
    });
  }

  async refreshTools() {
    const res = await this.request("tools/list", {});
    this.tools = res.tools || [];
    console.log(`🛠️  加载了 ${this.tools.length} 个工具`);
    return this.tools;
  }
  
  async callTool(name, args) {
    console.log(`🤖 调用工具: ${name}`);
    const res = await this.request("tools/call", { name, arguments: args });
    return res.content; // MCP 返回的是 content 数组
  }

  getOpenAITools() {
    return this.tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }
}
