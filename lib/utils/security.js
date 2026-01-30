import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const SENSITIVE_PATTERNS = [
  // API Keys
  /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  /sk-[a-zA-Z0-9]{20,}/gi,
  /pk-[a-zA-Z0-9]{20,}/gi,
  
  // Tokens
  /token\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  /jwt\s*[:=]\s*['"][a-zA-Z0-9_.-]{20,}['"]/gi,
  /bearer\s+[a-zA-Z0-9_-]{20,}/gi,
  /authorization\s*[:=]\s*['"][bB]earer\s+[a-zA-Z0-9_-]{20,}['"]/gi,
  
  // Secrets and Passwords
  /secret\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  /password\s*[:=]\s*['"][^'"]{4,}['"]/gi,
  /passwd\s*[:=]\s*['"][^'"]{4,}['"]/gi,
  
  // Database URLs
  /mongodb\+srv:\/\/[^'"\s]{10,}/gi,
  /mysql:\/\/[^'"\s]{10,}/gi,
  /postgres:\/\/[^'"\s]{10,}/gi,
  /postgresql:\/\/[^'"\s]{10,}/gi,
  
  // Webhooks and URLs with sensitive data
  /webhook\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  /url\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  
  // Private keys patterns
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
  /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/gi,
  /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/gi,
  
  // Session IDs
  /session[_-]?id\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  /csrf[_-]?token\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  
  // Auth codes
  /auth[_-]?code\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  /refresh[_-]?token\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  
  // Access tokens
  /access[_-]?token\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  
  // Encryption keys
  /encryption[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  /aes[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/gi,
  
  // AWS credentials
  /AKIA[0-9A-Z]{16}/gi,
  
  // Generic base64 encoded data (potential secrets)
  /['"][a-zA-Z0-9+/]{40,}={0,2}['"]/gi
];

const SENSITIVE_FILE_PATTERNS = [
  /\.env$/,
  /\.env\.\w+$/,
  /\.env\.local$/,
  /\.env\.development$/,
  /\.env\.production$/,
  /\.pem$/,
  /\.p12$/,
  /\.pfx$/,
  /\.key$/,
  /\.crt$/,
  /\.cer$/,
  /secret\.(json|yaml|yml|toml)$/i,
  /secrets\.(json|yaml|yml|toml)$/i,
  /credentials\.(json|yaml|yml|toml)$/i,
  /api[-_]?key\.(json|yaml|yml|toml)$/i,
  /config\.(json|yaml|yml|toml)$/i,
  /auth\.(json|yaml|yml|toml)$/i,
  /\.ssh\/id_rsa$/,
  /\.ssh\/id_ecdsa$/,
  /\.ssh\/id_ed25519$/,
  /\.aws\/credentials$/,
  /\.aws\/config$/,
  /\.netrc$/,
  /_history$/,
  /\.bash_history$/,
  /\.zsh_history$/,
  /\.mysql_history$/,
  /\.psql_history$/
];

export function sanitizeSensitiveInfo(text, options = {}) {
  const { 
    placeholder = '[REDACTED]',
    keepPrefix = true,
    maskLength = 8,
    strictMode = false 
  } = options;

  let sanitized = text;

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      // 严格模式：全部替换
      if (strictMode) {
        return placeholder;
      }

      // 保留前缀模式（适用于 sk-, pk-, AKIA 等）
      if (keepPrefix && match.match(/^(sk-|pk-|AKIA|Bearer)/i)) {
        const prefix = match.substring(0, 6);
        const suffix = match.length > maskLength ? match.substring(match.length - maskLength) : '';
        return `${prefix}...${suffix}`;
      }

      // 保留部分信息以便调试
      if (match.includes('sk-') || match.includes('pk-')) {
        return `${match.slice(0, 6)}...${placeholder}`;
      }

      // 对于 URL 类型的敏感信息
      if (match.includes('://')) {
        try {
          const url = new URL(match);
          const host = url.host;
          const path = url.pathname;
          return `${url.protocol}//${host}${path}${placeholder}`;
        } catch (e) {
          return placeholder;
        }
      }

      // 通用情况：保留前几个字符
      if (match.length > 10) {
        return `${match.substring(0, 6)}...${placeholder}`;
      }

      return placeholder;
    });
  }

  return sanitized;
}

/**
 * 检测文本中的敏感信息
 */
export function detectSensitiveInfo(text) {
  const detected = [];
  
  for (const pattern of SENSITIVE_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      detected.push({
        pattern: pattern.source,
        match: match[0],
        index: match.index,
        length: match[0].length
      });
    }
  }

  return detected;
}

/**
 * 检查文本是否包含敏感信息
 */
export function hasSensitiveInfo(text) {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * 脱敏对象（递归）
 */
export function sanitizeObject(obj, options = {}) {
  if (typeof obj === 'string') {
    return sanitizeSensitiveInfo(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // 跳过敏感字段名
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value, options);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * 检查字段名是否敏感
 */
function isSensitiveKey(key) {
  const sensitiveKeys = [
    'password', 'passwd', 'secret', 'token', 'apikey', 'api_key',
    'access_token', 'refresh_token', 'auth_token', 'session_id',
    'csrf_token', 'private_key', 'public_key', 'authorization',
    'webhook', 'database_url', 'db_url', 'connection_string'
  ];

  return sensitiveKeys.some(sensitive => 
    key.toLowerCase().includes(sensitive)
  );
}

export function isSensitiveFile(filepath) {
  const filename = path.basename(filepath);
  return SENSITIVE_FILE_PATTERNS.some(pattern => pattern.test(filename));
}

export function validatePath(inputPath, baseDir = process.cwd(), options = {}) {
  const { allowSymlinks = false, followSymlinks = false } = options;
  let safePath = inputPath;

  // 处理 ~ 路径
  if (safePath.startsWith("~")) {
    safePath = path.join(os.homedir(), safePath.slice(1));
  }

  // 转换为绝对路径
  if (!path.isAbsolute(safePath)) {
    safePath = path.resolve(baseDir, safePath);
  }

  // 规范化路径
  safePath = path.normalize(safePath);

  // 检查路径遍历攻击
  const relative = path.relative(baseDir, safePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`访问被拒绝: 路径超出允许范围 (${inputPath})`);
  }

  // 检查符号链接
  if (!allowSymlinks && isSymlink(safePath)) {
    throw new Error(`访问被拒绝: 符号链接不被允许 (${safePath})`);
  }

  // 如果需要追踪符号链接
  if (followSymlinks) {
    const resolved = resolveSymlinks(safePath);
    // 重新检查解析后的路径
    const resolvedRelative = path.relative(baseDir, resolved);
    if (resolvedRelative.startsWith('..') || path.isAbsolute(resolvedRelative)) {
      throw new Error(`访问被拒绝: 符号链接指向允许范围之外 (${safePath} -> ${resolved})`);
    }
    safePath = resolved;
  }

  // 检查敏感文件
  if (isSensitiveFile(safePath)) {
    console.warn(`⚠️  警告: 尝试访问敏感文件 ${path.basename(safePath)}`);
  }

  return safePath;
}

/**
 * 检查是否是符号链接
 */
export function isSymlink(filePath) {
  try {
    const stats = fs.lstatSync(filePath);
    return stats.isSymbolicLink();
  } catch (e) {
    return false;
  }
}

/**
 * 解析符号链接到真实路径
 */
export function resolveSymlinks(filePath, maxDepth = 10) {
  try {
    let resolvedPath = filePath;
    let depth = 0;

    while (isSymlink(resolvedPath) && depth < maxDepth) {
      const target = fs.readlinkSync(resolvedPath);
      
      if (path.isAbsolute(target)) {
        resolvedPath = target;
      } else {
        resolvedPath = path.resolve(path.dirname(resolvedPath), target);
      }
      
      depth++;
    }

    if (depth >= maxDepth) {
      throw new Error(`符号链接解析深度超过限制 (${maxDepth})`);
    }

    return resolvedPath;
  } catch (e) {
    return filePath;
  }
}

/**
 * 检查符号链接是否安全
 */
export function isSymlinkSafe(filePath, baseDir = process.cwd()) {
  try {
    const resolvedPath = resolveSymlinks(filePath);
    const relative = path.relative(baseDir, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  } catch (e) {
    return false;
  }
}

export function createSecureError(message, originalError = null) {
  const error = new Error(sanitizeSensitiveInfo(message));

  if (originalError) {
    error.stack = sanitizeSensitiveInfo(originalError.stack || '');
    error.code = originalError.code;
    error.status = originalError.status;
  }

  return error;
}

export function validateCommand(command) {
  const dangerousCommands = [
    'rm -rf',
    'rm -r /',
    'dd',
    'mkfs',
    'format',
    'del /f /s /q',
    'sudo rm',
    'chmod 777 /'
  ];

  const commandLower = command.toLowerCase().trim();

  for (const dangerous of dangerousCommands) {
    if (commandLower.includes(dangerous)) {
      return {
        safe: false,
        reason: `检测到危险命令: ${dangerous}`
      };
    }
  }

  return { safe: true };
}
