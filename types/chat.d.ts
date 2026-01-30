/**
 * Chat Module Type Definitions
 * 聊天模块类型定义
 */

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id?: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  showThinking?: boolean;
  tools?: any[];
  abortSignal?: AbortSignal;
  recursionLimit?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: UsageInfo;
  cost?: {
    input: number;
    output: number;
    total: number;
  };
  toolCalls?: ToolResult[];
}

export interface ToolResult {
  toolName: string;
  args: any;
  result: string | null;
  error?: string;
}

export async function chat(
  messages: ChatMessage[],
  config: any,
  options?: ChatOptions
): Promise<ChatResponse>;

export async function requestWithRetry(
  url: string,
  options: RequestInit,
  maxRetries?: number
): Promise<Response>;

export async function streamChat(
  messages: ChatMessage[],
  config: any,
  options: ChatOptions,
  onChunk: (chunk: string) => void
): Promise<ChatResponse>;

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): { input: number; output: number; total: number };
