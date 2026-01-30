
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { findProjectRoot } from "./config.js";

const projectRoot = findProjectRoot();
const homeHistoryFile = path.join(os.homedir(), ".newapi-chat-history.json");
const projectHistoryFile = path.join(projectRoot, ".newapi-chat-history.json");

function canWriteProjectDir() {
  try {
    fs.accessSync(projectRoot, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function getBaseDir() {
  return canWriteProjectDir() ? projectRoot : os.homedir();
}

function getHistoryFileForSession(sessionName) {
  const baseDir = getBaseDir();
  if (!sessionName || sessionName === "default") {
    return canWriteProjectDir() ? projectHistoryFile : homeHistoryFile;
  }
  const safe = String(sessionName).replace(/[^a-zA-Z0-9_\-]/g, "_");
  return path.join(baseDir, `.newapi-chat-history-${safe}.json`);
}

export function loadHistory(sessionName) {
  const target = sessionName ? getHistoryFileForSession(sessionName) : (canWriteProjectDir() ? projectHistoryFile : homeHistoryFile);
  if (!fs.existsSync(target)) return [];
  try {
    return JSON.parse(fs.readFileSync(target, "utf-8"));
  } catch {
    return [];
  }
}

export function saveHistory(messages, sessionName) {
  const target = sessionName ? getHistoryFileForSession(sessionName) : (canWriteProjectDir() ? projectHistoryFile : homeHistoryFile);
  // 简单的自动截断保护 (保留最近 500 条)
  // 如果需要更复杂的压缩，由外部调用 compress
  const toSave = messages.length > 500 ? messages.slice(-500) : messages;
  fs.writeFileSync(target, JSON.stringify(toSave, null, 2));
}

export function clearHistory(sessionName) {
  const target = sessionName ? getHistoryFileForSession(sessionName) : (canWriteProjectDir() ? projectHistoryFile : homeHistoryFile);
  fs.writeFileSync(target, JSON.stringify([], null, 2));
}

export function listSessions() {
  const baseDir = getBaseDir();
  if (!fs.existsSync(baseDir)) return [];
  const files = fs.readdirSync(baseDir);
  const sessions = [];
  for (const f of files) {
    if (f === ".newapi-chat-history.json") {
      sessions.push("default");
    } else if (f.startsWith(".newapi-chat-history-") && f.endsWith(".json")) {
      const name = f.slice(".newapi-chat-history-".length, -".json".length);
      sessions.push(name);
    }
  }
  return Array.from(new Set(sessions));
}

export function exportHistory(messages) {
  if (!messages.length) return "（暂无历史）";
  
  const md = messages.map((m) => {
    const role = m.role === "user" ? "你" : "助手";
    return `### ${role}\n\n${m.content}\n`;
  }).join("\n");

  const dir = canWriteProjectDir() ? projectRoot : os.homedir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(dir, `newapi-chat-history-${timestamp}.md`);
  
  fs.writeFileSync(file, md, "utf-8");
  console.log(`✅ 历史记录已导出至: ${file}`);
  return file;
}
