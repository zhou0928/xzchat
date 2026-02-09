import fs from "node:fs";
import path from "node:path";
import { promises as fsPromises } from "node:fs";

export async function loadFileContent(filepath, options = {}) {
  const { maxSize = 50 * 1024, askQuestion = null } = options;

  if (!fs.existsSync(filepath)) {
    throw new Error(`文件不存在: ${filepath}`);
  }

  const stats = fs.statSync(filepath);
  const ext = path.extname(filepath).toLowerCase();

  // PDF 文件处理
  if (ext === ".pdf") {
    console.log("📄 正在解析 PDF...");
    try {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const buffer = fs.readFileSync(filepath);
      const data = await pdfParse(buffer);
      const content = data.text.trim();

      if (!content) {
        throw new Error("PDF 内容为空或无法提取文本");
      }

      return content;
    } catch (e) {
      throw new Error(`PDF 解析失败: ${e.message}`);
    }
  }

  // 其他文本文件处理
  if (stats.size > maxSize) {
    const sizeMB = (stats.size / 1024).toFixed(1);
    console.log(`⚠️  文件较大 (${sizeMB}KB)`);

    if (askQuestion) {
      const choice = await askQuestion("请选择 [1.加载前10KB 2.全部加载 3.取消]: ");
      if (choice.trim() === '1') {
        const fd = fs.openSync(filepath, 'r');
        const buffer = Buffer.alloc(10240);
        const read = fs.readSync(fd, buffer, 0, 10240, 0);
        fs.closeSync(fd);
        return buffer.toString('utf-8', 0, read) + "\n...(truncated)";
      } else if (choice.trim() === '2') {
        return fs.readFileSync(filepath, "utf-8");
      } else {
        throw new Error("已取消");
      }
    } else {
      // 默认返回前 10KB
      const fd = fs.openSync(filepath, 'r');
      const buffer = Buffer.alloc(10240);
      const read = fs.readSync(fd, buffer, 0, 10240, 0);
      fs.closeSync(fd);
      return buffer.toString('utf-8', 0, read) + "\n...(truncated)";
    }
  }

  return fs.readFileSync(filepath, "utf-8");
}

export function formatFileContent(filename, content) {
  return `(File Content of ${filename}):\n\`\`\`\n${content}\n\`\`\``;
}

export function isSensitiveFile(filepath) {
  const filename = path.basename(filepath).toLowerCase();
  const sensitivePatterns = [
    '.env',
    '.env.',
    '.key',
    '.pem',
    '.p12',
    '.pfx',
    'secret',
    'password',
    'private',
    'credentials',
    'api-key',
    'apikey'
  ];

  return sensitivePatterns.some(pattern => filename.includes(pattern));
}

export function createBackup(filepath) {
  const backupPath = `${filepath}.bak`;
  try {
    if (fs.existsSync(filepath)) {
      fs.copyFileSync(filepath, backupPath);
      console.log(`📦 已创建备份: ${path.basename(backupPath)}`);
      return backupPath;
    }
  } catch (e) {
    console.error(`⚠️  备份失败: ${e.message}`);
  }
  return null;
}

/**
 * 检查文件或目录是否存在
 */
export async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 确保目录存在，不存在则创建
 */
export async function ensureDir(dirPath) {
  // 处理空路径或当前目录
  if (!dirPath || dirPath === '' || dirPath === '.') {
    return;
  }

  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * 加载文件内容
 * @param {string} filePath - 文件路径
 * @param {string|null} encoding - 编码格式，null 表示返回 Buffer
 * @returns {Promise<string|Buffer>}
 */
export async function loadFile(filePath, encoding = 'utf-8') {
  const exists = await fileExists(filePath);
  if (!exists) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const stat = await fsPromises.stat(filePath);
  if (stat.isDirectory()) {
    throw new Error(`路径是目录，不是文件: ${filePath}`);
  }

  return await fsPromises.readFile(filePath, encoding);
}

/**
 * 加载文本文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>}
 */
export async function loadText(filePath) {
  return await loadFile(filePath, 'utf-8');
}

/**
 * 加载 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>}
 */
export async function loadJSON(filePath) {
  const content = await loadText(filePath);
  
  // 移除 JSON 中的注释
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  
  try {
    return JSON.parse(cleanContent);
  } catch (error) {
    throw new Error(`无效的 JSON 文件: ${filePath} - ${error.message}`);
  }
}
