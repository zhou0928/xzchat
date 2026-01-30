/**
 * 聊天 API 路由
 */

import fetch from 'node-fetch';

/**
 * 设置聊天 API 路由
 */
export function setupChatRoutes(app) {
  /**
   * 发送聊天消息（流式）
   */
  app.post('/api/chat', async (req, res) => {
    const { sessionId, message, settings } = req.body;

    if (!sessionId || !message || !settings) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (!settings.baseUrl || !settings.apiKey || !settings.model) {
      return res.status(400).json({ error: 'API 配置不完整' });
    }

    try {
      // 构建 API 请求
      const apiResponse = await fetch(`${settings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: message }],
          stream: true,
          temperature: settings.temperature || 0.7,
          max_tokens: settings.maxTokens || 2000
        })
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API 错误:', errorText);
        return res.status(apiResponse.status).json({
          error: `API 请求失败: ${apiResponse.status} ${apiResponse.statusText}`
        });
      }

      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // 流式转发响应
      const reader = apiResponse.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          res.write(chunk);
        }
      } finally {
        res.end();
      }

    } catch (error) {
      console.error('聊天错误:', error);
      res.status(500).json({ error: '服务器错误: ' + error.message });
    }
  });

  /**
   * 测试 API 连接
   */
  app.post('/api/test', async (req, res) => {
    const { baseUrl, apiKey, model } = req.body;

    if (!baseUrl || !apiKey) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    try {
      // 发送一个简单的测试请求
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.json({
          success: false,
          error: `API 请求失败: ${response.status} ${response.statusText}`
        });
      }

      const data = await response.json();
      res.json({
        success: true,
        message: 'API 连接成功',
        models: data.data?.map(m => m.id) || []
      });

    } catch (error) {
      console.error('测试 API 错误:', error);
      res.json({ success: false, error: error.message });
    }
  });

  /**
   * 获取可用模型列表
   */
  app.get('/api/models', async (req, res) => {
    const { baseUrl, apiKey } = req.query;

    if (!baseUrl || !apiKey) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      res.json({ models: data.data?.map(m => m.id) || [] });

    } catch (error) {
      console.error('获取模型错误:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
