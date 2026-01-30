/**
 * Web 工具模块
 * 提供网络搜索、URL 获取等功能
 */

/**
 * 搜索网络
 * @param {string} query - 搜索查询
 * @param {object} options - 选项
 * @param {number} options.maxResults - 最大结果数量
 * @returns {Promise<Array>} 搜索结果
 */
export async function webSearch(query, options = {}) {
  const { maxResults = 5 } = options;

  try {
    // 使用 DuckDuckGo 搜索 API（无需密钥）
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=0`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xzChat/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`);
    }

    const data = await response.json();
    const results = [];

    // 处理相关主题（Abstracts）
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: extractTitle(topic.Text),
            url: topic.FirstURL,
            snippet: topic.Text
          });
          
          if (results.length >= maxResults) break;
        }
      }
    }

    // 如果结果不足，添加官方结果（Abstract）
    if (results.length < maxResults && data.AbstractURL && data.Abstract) {
      results.push({
        title: data.Heading || data.AbstractText || '搜索结果',
        url: data.AbstractURL,
        snippet: data.Abstract
      });
    }

    return results.slice(0, maxResults);
  } catch (error) {
    throw new Error(`网络搜索失败: ${error.message}`);
  }
}

/**
 * 从文本中提取标题（第一行或前50个字符）
 * @param {string} text - 文本
 * @returns {string} 标题
 */
function extractTitle(text) {
  if (!text) return '搜索结果';
  
  const lines = text.split('\n');
  const firstLine = lines[0].trim();
  
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...';
  }
  
  return firstLine || '搜索结果';
}

/**
 * 获取 URL 内容
 * @param {string} url - URL
 * @returns {Promise<string>} 页面内容（markdown 格式）
 */
export async function fetchUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xzChat/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const html = await response.text();
    
    // 简单的 HTML 到 Markdown 转换
    return htmlToMarkdown(html);
  } catch (error) {
    throw new Error(`获取 URL 内容失败: ${error.message}`);
  }
}

/**
 * 简单的 HTML 到 Markdown 转换
 * @param {string} html - HTML 内容
 * @returns {string} Markdown 内容
 */
function htmlToMarkdown(html) {
  let markdown = html;

  // 移除脚本和样式
  markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 转换标题
  markdown = markdown.replace(/<h1\b[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2\b[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3\b[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4\b[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5\b[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6\b[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // 转换段落
  markdown = markdown.replace(/<p\b[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // 转换加粗和斜体
  markdown = markdown.replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b\b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em\b[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i\b[^>]*>(.*?)<\/i>/gi, '*$1*');

  // 转换代码
  markdown = markdown.replace(/<code\b[^>]*>(.*?)<\/code>/gi, '`$1`');
  markdown = markdown.replace(/<pre\b[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```');

  // 转换链接
  markdown = markdown.replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // 转换列表
  markdown = markdown.replace(/<ul\b[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol\b[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li\b[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // 移除所有其他标签
  markdown = markdown.replace(/<[^>]+>/g, '');

  // 清理空白
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

/**
 * 解析 URL
 * @param {string} url - URL 字符串
 * @returns {object} 解析后的 URL 对象
 */
export function parseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      origin: parsed.origin
    };
  } catch (error) {
    throw new Error(`URL 解析失败: ${error.message}`);
  }
}

/**
 * 验证 URL
 * @param {string} url - URL 字符串
 * @returns {boolean} 是否有效
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
