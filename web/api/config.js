/**
 * 配置管理 API 路由
 */

export function setupConfigRoutes(app) {
  /**
   * 获取配置
   */
  app.get('/api/config', (req, res) => {
    // 配置存储在客户端 localStorage
    res.json({ message: '配置数据存储在客户端' });
  });

  /**
   * 更新配置
   */
  app.put('/api/config', (req, res) => {
    // 配置更新在客户端实现
    res.json({ message: '请在客户端使用设置面板' });
  });

  /**
   * 导出配置
   */
  app.post('/api/config/export', (req, res) => {
    // 配置导出在客户端实现
    res.json({ message: '请在客户端使用导出功能' });
  });

  /**
   * 导入配置
   */
  app.post('/api/config/import', (req, res) => {
    // 配置导入在客户端实现
    res.json({ message: '请在客户端使用导入功能' });
  });
}
