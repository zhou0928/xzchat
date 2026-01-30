/**
 * Logger Module Type Definitions
 * 日志模块类型定义
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LoggerOptions {
  level?: LogLevel;
  enableFile?: boolean;
  logDir?: string;
}

export interface LoggerContext {
  [key: string]: any;
}

export class Logger {
  constructor(options?: LoggerOptions);

  setLevel(level: LogLevel): void;

  debug(message: string, context?: LoggerContext): void;

  info(message: string, context?: LoggerContext): void;

  warn(message: string, context?: LoggerContext): void;

  error(message: string, context?: LoggerContext): void;
}

export const logger: Logger;
