/**
 * RAG Module Type Definitions
 * RAG（检索增强生成）模块类型定义
 */

export interface Chunk {
  file: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
}

export interface RAGSearchOptions {
  topK?: number;
  useCache?: boolean;
}

export interface RAGSearchResult extends Chunk {
  score: number;
}

export interface BatchEmbeddingOptions {
  concurrency?: number;
  delay?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface BatchEmbeddingResult {
  results: (number[] | null)[];
  errors: Array<{ index: number; error: string }>;
}

export interface IndexOptions {
  concurrency?: number;
  showProgress?: boolean;
}

export async function indexCodebase(
  dir: string,
  config: any,
  options?: IndexOptions
): Promise<number>;

export async function loadIndex(dir: string): Promise<Chunk[] | null>;

export async function searchCodebase(
  query: string,
  dir: string,
  config: any,
  options?: RAGSearchOptions
): Promise<RAGSearchResult[]>;

export function clearRAGCache(): void;

export function getRAGStats(): {
  embedding: any;
  index: any;
};

export async function fetchEmbedding(text: string, config: any): Promise<number[]>;

export async function batchFetchEmbeddings(
  texts: string[],
  config: any,
  options?: BatchEmbeddingOptions
): Promise<BatchEmbeddingResult>;
