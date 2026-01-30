/**
 * Errors Module Type Definitions
 * 错误模块类型定义
 */

export interface ErrorDetails {
  [key: string]: any;
}

export class XZChatError extends Error {
  code: string;
  details?: ErrorDetails;

  constructor(message: string, code?: string, details?: ErrorDetails);
}

export class ConfigError extends XZChatError {
  constructor(message: string, details?: ErrorDetails);
}

export class APIError extends XZChatError {
  statusCode?: number;
  endpoint?: string;

  constructor(message: string, statusCode?: number, details?: ErrorDetails);
}

export class FileSystemError extends XZChatError {
  path?: string;

  constructor(message: string, path?: string, details?: ErrorDetails);
}

export class NetworkError extends XZChatError {
  constructor(message: string, details?: ErrorDetails);
}

export class ValidationError extends XZChatError {
  field?: string;

  constructor(message: string, field?: string, details?: ErrorDetails);
}

export function handleError(error: Error, context?: string): void;

export function getErrorMessage(error: Error): string;

export function isRetryableError(error: Error): boolean;

export function formatError(error: Error, verbose?: boolean): string;
