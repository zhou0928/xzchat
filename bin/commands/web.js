/**
 * Web UI 命令处理器
 */

/**
 * 处理Web命令
 * /web [start|stop] [port]
 */
export async function handleWeb(args) {
  const subcommand = args[0] || 'start';

  switch (subcommand) {
    case 'start': {
      try {
        // 动态导入，避免启动时加载依赖
        console.log('📦 正在加载 Web UI 模块...\n');
        const serverModule = await import('../../web/server.js');
        const { default: { WebServer } } = serverModule;
        const port = parseInt(args[1]) || 3000;

        const server = new WebServer({ port });
        await server.start();

      } catch (error) {
        console.error('\n❌ 启动失败:', error.message);
        if (error.code === 'ERR_MODULE_NOT_FOUND') {
          console.log('\n⚠️  Web UI 功能需要安装额外的依赖');
          console.log('');
          console.log('请运行以下命令安装依赖:');
          console.log('  npm install express socket.io');
          console.log('');
          console.log('安装后重新启动 xz-chat 即可使用 Web UI 功能');
        }
      }
      break;
    }
    case 'stop': {
      console.log('⏸️ Web UI 服务器已停止');
      break;
    }
    case 'help': {
      console.log(`
🌐 Web UI 命令

用法: /web <subcommand> [options]

子命令:
  start [port]  启动 Web UI 服务器 (默认端口 3000)
  stop          停止 Web UI 服务器
  help          显示帮助信息

依赖:
  express       Web 框架
  socket.io     WebSocket 库

安装依赖:
  npm install express socket.io

示例:
  /web start 3000
  /web start 8080
  /web stop

注意: Web UI 功能还在开发中
      `);
      break;
    }
    default: {
      console.log(`❌ 未知命令: ${subcommand}`);
      console.log('使用 /web help 查看帮助');
    }
  }
}

export default {
  handleWeb
};
