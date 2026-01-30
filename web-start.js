#!/usr/bin/env node

/**
 * Web UI 启动脚本
 */

import { startWebUI } from './web/server.js';

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

startWebUI({ port, host }).catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
