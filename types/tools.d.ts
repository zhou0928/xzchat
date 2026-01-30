/**
 * Tools Module Type Definitions
 * 工具模块类型定义
 */

export interface Tool {
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

export interface ToolResult {
  toolName: string;
  args: any;
  result: string | null;
  error?: string;
}

export const builtInTools: Tool[];

export function getFileList(
  dir: string,
  ignoreList?: string[],
  depth?: number
): string[];

export function scanDir(
  dir: string,
  ignoreList?: string[],
  prefix?: string,
  depth?: number
): string;

export async function readFile(
  path: string,
  startLine?: number,
  endLine?: number
): Promise<string>;

export async function writeFile(
  path: string,
  content: string,
  options?: { createBackup?: boolean }
): Promise<void>;

export async function editFile(
  path: string,
  edits: Array<{ oldText: string; newText: string }>
): Promise<void>;

export async function executeCommand(
  command: string,
  options?: { timeout?: number; cwd?: string }
): Promise<{ stdout: string; stderr: string; code: number }>;

export async function searchInFiles(
  query: string,
  dir: string,
  options?: { filePattern?: string; caseSensitive?: boolean }
): Promise<Array<{ file: string; line: number; content: string }>>;

export async function analyzeGitLog(
  maxCommits?: number
): Promise<Array<{ hash: string; author: string; date: string; message: string; }>>;

export async function generateGitCommit(
  diff: string
): Promise<string>;
