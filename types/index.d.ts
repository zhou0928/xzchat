/**
 * xzChat TypeScript Type Definitions
 * 类型定义文件，为JavaScript项目提供类型提示
 */

declare module 'xz-chat' {
  // ========== Config Module ==========
  interface ProfileConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }

  interface Config {
    apiKey: string;
    baseUrl: string;
    model: string;
    provider: string;
    profiles: Record<string, ProfileConfig>;
    currentProfile: string;
    roles?: Record<string, string>;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    embeddingModel?: string;
    showThinking?: boolean;
  }

  interface ProviderPreset {
    baseUrl: string;
    model: string;
  }

  interface CcSwitchProvider {
    id: string;
    name: string;
    appType: string;
    baseUrl?: string;
    apiKey?: string;
    model?: string;
  }

  // ========== Chat Module ==========
  type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

  interface ChatMessage {
    role: MessageRole;
    content: string;
    toolCalls?: ToolCall[];
    toolCallId?: string;
  }

  interface ToolCall {
    id?: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }

  interface UsageInfo {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }

  interface ChatOptions {
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    showThinking?: boolean;
    tools?: any[];
    abortSignal?: AbortSignal;
  }

  interface ChatResponse {
    message: ChatMessage;
    usage?: UsageInfo;
    cost?: {
      input: number;
      output: number;
      total: number;
    };
  }

  // ========== Tools Module ==========
  interface Tool {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
      };
    };
  }

  interface ToolResult {
    toolName: string;
    args: any;
    result: string | null;
    error?: string;
  }

  // ========== RAG Module ==========
  interface Chunk {
    file: string;
    chunkIndex: number;
    content: string;
    embedding: number[];
  }

  interface RAGSearchOptions {
    topK?: number;
    useCache?: boolean;
  }

  interface RAGSearchResult extends Chunk {
    score: number;
  }

  interface BatchEmbeddingOptions {
    concurrency?: number;
    delay?: number;
    retryCount?: number;
    retryDelay?: number;
  }

  interface BatchEmbeddingResult {
    results: (number[] | null)[];
    errors: Array<{ index: number; error: string }>;
  }

  interface IndexOptions {
    concurrency?: number;
    showProgress?: boolean;
  }

  // ========== History Module ==========
  interface HistoryItem {
    id: string;
    messages: ChatMessage[];
    timestamp: number;
    title?: string;
  }

  interface HistoryStats {
    totalMessages: number;
    totalCost: number;
    mostUsedModel: string;
  }

  // ========== Branch System ==========
  interface Branch {
    id: string;
    name: string;
    parentId?: string;
    sessionId: string;
    messages: ChatMessage[];
    createdAt: number;
    description?: string;
  }

  interface Session {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
    branches: Branch[];
    currentBranchId?: string;
  }

  // ========== Cache Module ==========
  interface CacheOptions {
    maxSize?: number;
    ttl?: number;
  }

  interface CacheEntry<T = any> {
    value: T;
    timestamp: number;
    hits: number;
  }

  interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }

  // ========== Cost Tracker ==========
  interface CostEntry {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    timestamp: number;
  }

  interface CostStats {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    byModel: Record<string, CostStats>;
  }

  // ========== Logger Module ==========
  type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

  interface LoggerOptions {
    level?: LogLevel;
    enableFile?: boolean;
    logDir?: string;
  }

  interface LoggerContext {
    [key: string]: any;
  }

  // ========== Security Module ==========
  interface PathValidationOptions {
    allowAbsolute?: boolean;
    allowedDirs?: string[];
  }

  interface CommandValidationResult {
    valid: boolean;
    warning?: string;
    blocked?: boolean;
  }

  // ========== Errors Module ==========
  class XZChatError extends Error {
    code: string;
    details?: any;

    constructor(message: string, code?: string, details?: any);
  }

  class ConfigError extends XZChatError {
    constructor(message: string, details?: any);
  }

  class APIError extends XZChatError {
    statusCode?: number;
    endpoint?: string;

    constructor(message: string, statusCode?: number, details?: any);
  }

  class FileSystemError extends XZChatError {
    path?: string;

    constructor(message: string, path?: string, details?: any);
  }

  class NetworkError extends XZChatError {
    constructor(message: string, details?: any);
  }

  class ValidationError extends XZChatError {
    field?: string;

    constructor(message: string, field?: string, details?: any);
  }

  // ========== UI Module ==========
  interface SpinnerOptions {
    text?: string;
    pattern?: string;
  }

  interface StreamPrinterOptions {
    showProgress?: boolean;
  }

  // ========== MCP Lite ==========
  interface MCPServer {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }

  interface MCPMessage {
    id?: number | string;
    method?: string;
    result?: any;
    error?: any;
    params?: any;
  }

  // ========== Messages Module ==========
  interface MessageParams {
    [key: string]: string | number | boolean;
  }

  // ========== Validation Module ==========
  interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
  }

  interface SchemaRule {
    type: string;
    required?: boolean;
    default?: any;
    validate?: (value: any) => boolean;
    message?: string;
  }

  interface ConfigSchema {
    [key: string]: SchemaRule;
  }

  // ========== File Operations ==========
  interface FileLoadOptions {
    maxSize?: number;
    encoding?: BufferEncoding;
    withBackup?: boolean;
  }

  interface BackupOptions {
    maxBackups?: number;
    backupDir?: string;
  }

  // ========== Git Integration ==========
  interface GitCommit {
    hash: string;
    author: string;
    date: string;
    message: string;
  }

  interface GitDiffOptions {
    files?: string[];
    staged?: boolean;
  }

  // ========== Token Module ==========
  interface TokenStats {
    model: string;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  }

  // ========== CLI ==========
  interface CLIOptions {
    [key: string]: any;
  }

  interface CommandContext {
    config: Config;
    sessionId?: string;
    branchId?: string;
    cwd: string;
  }

  // ========== Export all interfaces ==========
  export type {
    ProfileConfig,
    Config,
    ProviderPreset,
    CcSwitchProvider,
    MessageRole,
    ChatMessage,
    ToolCall,
    UsageInfo,
    ChatOptions,
    ChatResponse,
    Tool,
    ToolResult,
    Chunk,
    RAGSearchOptions,
    RAGSearchResult,
    BatchEmbeddingOptions,
    BatchEmbeddingResult,
    IndexOptions,
    HistoryItem,
    HistoryStats,
    Branch,
    Session,
    CacheOptions,
    CacheEntry,
    CacheStats,
    CostEntry,
    CostStats,
    LogLevel,
    LoggerOptions,
    LoggerContext,
    PathValidationOptions,
    CommandValidationResult,
    SpinnerOptions,
    StreamPrinterOptions,
    MCPServer,
    MCPMessage,
    MessageParams,
    ValidationResult,
    SchemaRule,
    ConfigSchema,
    FileLoadOptions,
    BackupOptions,
    GitCommit,
    GitDiffOptions,
    TokenStats,
    CLIOptions,
    CommandContext
  };

  export class XZChatError {}
  export class ConfigError extends XZChatError {}
  export class APIError extends XZChatError {}
  export class FileSystemError extends XZChatError {}
  export class NetworkError extends XZChatError {}
  export class ValidationError extends XZChatError {}
}
