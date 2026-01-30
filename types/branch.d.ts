/**
 * Branch System Type Definitions
 * 分支系统类型定义
 */

export interface Branch {
  id: string;
  name: string;
  parentId?: string;
  sessionId: string;
  messages: ChatMessage[];
  createdAt: number;
  description?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  branches: Branch[];
  currentBranchId?: string;
}

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  toolCalls?: any[];
  toolCallId?: string;
}

export async function createBranch(
  sessionId: string,
  name: string,
  parentId?: string
): Promise<Branch>;

export async function switchBranch(sessionId: string, branchId: string): Promise<void>;

export async function deleteBranch(sessionId: string, branchId: string): Promise<void>;

export async function mergeBranch(
  sessionId: string,
  branchId: string,
  targetBranchId?: string
): Promise<void>;

export async function listBranches(sessionId: string): Promise<Branch[]>;

export async function compareBranches(
  sessionId: string,
  branchId1: string,
  branchId2: string
): Promise<Array<{ type: 'added' | 'removed' | 'changed'; message: ChatMessage }>>;

export async function visualizeBranches(sessionId: string): Promise<string>;

export async function getBranch(sessionId: string, branchId: string): Promise<Branch | null>;

export async function updateBranchDescription(
  sessionId: string,
  branchId: string,
  description: string
): Promise<void>;
