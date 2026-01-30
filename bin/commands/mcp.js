import { MCPClient } from "../../lib/mcp-lite.js";

/**
 * /mcp 命令 - 管理 MCP 服务器
 */
export async function handleMCP(input, config, mcpClients, updateConfig, loadConfig, askQuestion) {
  const parts = input.trim().split(/\s+/);
  const sub = parts[1];

  if (!sub || sub === "list") {
    console.log("\n🔌 已配置的 MCP Servers:");
    if (mcpClients.size === 0) {
      console.log("  (暂无)");
    } else {
      mcpClients.forEach((client, name) => {
        const status = client.initialized ? "✅" : "❌";
        const toolCount = client.initialized ? client.tools.length : 0;
        console.log(`  ${status} ${name} (${toolCount} tools)`);
        if (client.initialized && toolCount > 0) {
          client.tools.forEach(t => {
            console.log(`    - ${t.name}`);
          });
        }
      });
    }
    console.log("\n用法:");
    console.log("  /mcp list                      列出所有服务器");
    console.log("  /mcp install <name> <cmd>      安装服务器");
    console.log("  /mcp remove <name>             移除服务器");
    return true;
  }

  if (sub === "install") {
    const name = parts[2];
    const command = parts[3];
    const args = parts.slice(4);

    if (!name || !command) {
      console.log("用法: /mcp install <name> <command> [args...]");
      console.log("示例: /mcp install sqlite npx -y @modelcontextprotocol/server-sqlite --database my.db");
      return true;
    }

    console.log(`🔌 正在配置并连接 MCP Server: ${name}...`);

    // Update config
    const mcpConfig = config.mcpServers || {};
    mcpConfig[name] = { command, args, env: {} };
    updateConfig("mcpServers", mcpConfig);

    // Initialize client
    try {
      const client = new MCPClient(command, args);
      await client.connect();
      mcpClients.set(name, client);
      console.log(`✅ MCP Server '${name}' 已安装并连接成功！`);
    } catch (e) {
      console.error(`❌ 连接失败: ${e.message}`);
      console.log("⚠️  配置已保存，请检查命令是否正确，或重启后重试。");
    }
    return true;
  }

  if (sub === "remove") {
    const name = parts[2];
    if (!name) {
      console.log("用法: /mcp remove <name>");
      return true;
    }

    const mcpConfig = config.mcpServers || {};
    delete mcpConfig[name];
    updateConfig("mcpServers", mcpConfig);

    if (mcpClients.has(name)) {
      mcpClients.delete(name);
    }

    console.log(`✅ MCP Server '${name}' 已移除`);
    return true;
  }

  console.log("未知子命令: " + sub);
  return true;
}
