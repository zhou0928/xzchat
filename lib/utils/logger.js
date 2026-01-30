import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'INFO';
    this.enableFile = options.enableFile !== false;
    this.logDir = options.logDir || path.join(os.homedir(), '.newapi-chat-logs');

    if (this.enableFile) {
      this.ensureLogDir();
    }
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `xzchat-${date}.log`);
  }

  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0
      ? ` ${JSON.stringify(context)}`
      : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  writeToFile(message) {
    if (!this.enableFile) return;

    try {
      const logFile = this.getLogFilePath();
      fs.appendFileSync(logFile, message + '\n', 'utf-8');
    } catch (e) {
      // 静默失败，避免日志错误影响主程序
    }
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  log(level, message, context = {}) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, context);
    this.writeToFile(formatted);

    const colors = {
      DEBUG: '\x1b[90m',  // 灰色
      INFO: '\x1b[36m',   // 青色
      WARN: '\x1b[33m',   // 黄色
      ERROR: '\x1b[31m'   // 红色
    };

    const reset = '\x1b[0m';
    console.log(`${colors[level]}${formatted}${reset}`);
  }

  debug(message, context) {
    this.log('DEBUG', message, context);
  }

  info(message, context) {
    this.log('INFO', message, context);
  }

  warn(message, context) {
    this.log('WARN', message, context);
  }

  error(message, context) {
    this.log('ERROR', message, context);
  }

  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.level = level;
    }
  }
}

export const logger = new Logger({
  level: process.env.XZCHAT_LOG_LEVEL || 'INFO'
});

export default Logger;
