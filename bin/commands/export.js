import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * 导出对话历史
 * 支持导出为 Markdown 或 JSON 格式
 */
export async function handleExportCommand(args, context) {
  const { messages, currentSession, rl, askQuestion } = context;

  if (args[0] === 'help') {
    console.log(`
📝 /export - 导出对话历史

用法:
  /export [format] [filename]

格式:
  md    - 导出为 Markdown (默认)
  json  - 导出为 JSON

示例:
  /export                    # 导出为 Markdown，自动命名
  /export md chat.md       # 导出为指定文件名
  /export json history.json # 导出为 JSON

导出位置: ~/Downloads/xzchat-exports/
`);
    return true;
  }

  // 确定格式
  const format = args[0]?.toLowerCase();
  let exportFormat = 'md';
  if (format === 'json' || format === 'md') {
    exportFormat = format;
  }

  // 确定文件名
  let filename = args[1];
  if (!filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeSessionName = currentSession.replace(/[^a-zA-Z0-9]/g, '-');
    filename = `xzchat-${safeSessionName}-${timestamp}.${exportFormat}`;
  }

  // 创建导出目录
  const exportDir = path.join(os.homedir(), 'Downloads', 'xzchat-exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filePath = path.join(exportDir, filename);

  // 导出内容
  let content = '';
  if (exportFormat === 'md') {
    content = exportToMarkdown(messages, currentSession);
  } else {
    content = exportToJSON(messages, currentSession);
  }

  // 写入文件
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 对话已导出到: ${filePath}`);
    console.log(`📊 导出 ${messages.length} 条消息`);
    console.log(`📁 格式: ${exportFormat.toUpperCase()}`);
  } catch (error) {
    console.error(`❌ 导出失败: ${error.message}`);
  }

  return true;
}

/**
 * 导出为 Markdown 格式
 */
function exportToMarkdown(messages, sessionName) {
  const lines = [];

  lines.push(`# xzChat 对话导出`);
  lines.push(`\n**会话名称:** ${sessionName}`);
  lines.push(`**导出时间:** ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`**消息数量:** ${messages.length}`);
  lines.push(`\n---\n`);

  for (const msg of messages) {
    const role = msg.role;
    const content = msg.content || '';

    if (role === 'user') {
      lines.push(`\n## 👤 用户`);
    } else if (role === 'assistant') {
      lines.push(`\n## 🤖 助手`);
    } else if (role === 'system') {
      lines.push(`\n## ⚙️ 系统`);
    } else {
      lines.push(`\n## ${role}`);
    }

    // 处理多模态内容（图片等）
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'text') {
          lines.push(`\n${part.text}`);
        } else if (part.type === 'image_url') {
          lines.push(`\n📷 [图片附件]`);
        }
      }
    } else {
      lines.push(`\n${content}`);
    }

    // 添加元数据
    if (msg.timestamp) {
      const time = new Date(msg.timestamp).toLocaleString('zh-CN');
      lines.push(`\n*时间: ${time}*`);
    }

    lines.push(`\n---`);
  }

  lines.push(`\n*由 xzChat 导出*`);
  return lines.join('\n');
}

/**
 * 导出为 JSON 格式
 */
function exportToJSON(messages, sessionName) {
  const data = {
    metadata: {
      sessionName,
      exportTime: new Date().toISOString(),
      messageCount: messages.length,
      version: '2.4.0'
    },
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || null
    }))
  };

  return JSON.stringify(data, null, 2);
}

/**
 * 注册导出命令
 */
export const exportCommands = [
  {
    name: 'export',
    aliases: ['save', 'export'],
    description: '导出对话历史为 Markdown 或 JSON',
    usage: '/export [format] [filename]',
    handler: handleExportCommand
  }
];
