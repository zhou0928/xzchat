/**
 * P2 功能使用示例
 * 演示多语言、主题、数据库和协作功能的使用
 */

import { t, setLocale, getSupportedLanguages } from '../lib/utils/i18n.js';
import {
  getThemeInstance,
  setTheme,
  formatSuccess,
  formatError,
  formatWarning,
  formatInfo
} from '../lib/utils/themes.js';
import { createDatabase, getDatabaseManager } from '../lib/utils/database.js';
import {
  getSessionSharer,
  getTeamKnowledgeBase,
  SessionExporter
} from '../lib/utils/collaboration.js';

console.log('═══════════════════════════════════════════════════════');
console.log('           xzChat P2 功能使用示例');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================
// 1. 多语言支持 (i18n)
// ============================================
console.log('📚 示例 1: 多语言支持\n');

// 查看支持的语言
const languages = getSupportedLanguages();
console.log('支持的语言:');
languages.forEach(lang => {
  console.log(`  ${lang.name} (${lang.code})`);
});

// 切换语言
await setLocale('en');
console.log(`\n${t('ui.welcome')}`);
console.log(`${t('ui.version', { version: '1.0.0' })}`);

// 切换回中文
await setLocale('zh');
console.log(`${t('ui.welcome')}\n`);

// ============================================
// 2. 主题系统
// ============================================
console.log('🎨 示例 2: 主题系统\n');

const theme = getThemeInstance();

// 设置主题
setTheme('minimal');
console.log('已切换到极简主题\n');

// 使用主题格式化函数
console.log('消息格式化示例:');
console.log(`  ${formatSuccess('操作成功')}`);
console.log(`  ${formatError('操作失败')}`);
console.log(`  ${formatWarning('警告信息')}`);
console.log(`  ${formatInfo('提示信息')} `);

// 查看主题信息
const themes = theme.listThemes();
console.log(`\n可用主题数: ${themes.length}`);
themes.slice(0, 3).forEach(t => {
  console.log(`  - ${t.name} (${t.key})`);
});

// ============================================
// 3. 数据库支持
// ============================================
console.log('🗄️  示例 3: 数据库支持\n');

// 创建数据库
const db = await createDatabase('example-data', { type: 'json' });
console.log('数据库已创建');

// 存储数据
await db.set('user', {
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: new Date().toISOString()
});
console.log('用户数据已保存');

// 读取数据
const user = await db.get('user');
console.log(`读取到用户: ${user.name}`);

// 批量操作
await db.batch({
  'session-1': { id: 1, name: '工作' },
  'session-2': { id: 2, name: '学习' },
  'session-3': { id: 3, name: '娱乐' }
});
console.log('批量数据已保存');

// 查询数据
const results = await db.query((value) => value.name && value.name.includes('学习'));
console.log(`查询结果: 找到 ${results.length} 条记录`);

// 获取所有数据
const all = await db.getAll();
console.log(`数据库中共有 ${Object.keys(all).length} 条记录\n`);

// ============================================
// 4. 数据库管理器
// ============================================
console.log('📊 示例 4: 数据库管理器\n');

const manager = getDatabaseManager();

// 获取多个数据库
const sessionsDB = await manager.getDatabase('sessions');
const usersDB = await manager.getDatabase('users');
const configDB = await manager.getDatabase('config');

console.log('已创建多个数据库:');
console.log(`  ${await sessionsDB.get('name') || 'sessions'}`);
console.log(`  ${await usersDB.get('name') || 'users'}`);
console.log(`  ${await configDB.get('name') || 'config'}\n`);

// ============================================
// 5. 会话分享
// ============================================
console.log('🔗 示例 5: 会话分享\n');

const sharer = getSessionSharer();

// 创建分享链接
const sessionData = {
  name: '示例会话',
  messages: [
    { role: 'user', content: '你好，介绍一下自己' },
    { role: 'assistant', content: '你好！我是xzChat，一个AI助手...' }
  ]
};

const share = await sharer.generateShareLink('session-123', sessionData, {
  password: 'secret123',
  expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后
  readonly: true
});

console.log('分享链接已创建:');
console.log(`  ID: ${share.shareId}`);
console.log(`  链接: ${share.link}`);
console.log(`  过期: ${share.expiry}`);
console.log(`  密码: ${share.password}\n`);

// 列出所有分享
const shares = await sharer.listShares();
console.log(`当前共有 ${shares.length} 个分享`);

// ============================================
// 6. 团队知识库
// ============================================
console.log('📖 示例 6: 团队知识库\n');

const kb = getTeamKnowledgeBase();

// 添加知识条目
await kb.addEntry('API使用说明', 'xzChat 提供了丰富的API接口...', {
  category: '文档',
  tags: ['api', '文档'],
  author: '管理员'
});
console.log('知识条目已添加');

// 搜索知识
const entries = await kb.searchEntries('API', { category: '文档' });
console.log(`搜索结果: 找到 ${entries.length} 条相关条目`);

// 查看统计
const stats = await kb.getStats();
console.log('\n知识库统计:');
console.log(`  总条目数: ${stats.totalEntries}`);
console.log(`  类别数: ${Object.keys(stats.categories).length}`);
console.log(`  标签数: ${Object.keys(stats.tags).length}\n`);

// ============================================
// 7. 会话导出
// ============================================
console.log('📤 示例 7: 会话导出\n');

const session = {
  name: '我的会话',
  createdAt: new Date().toISOString(),
  messages: [
    { role: 'user', content: '如何使用xzChat?' },
    { role: 'assistant', content: 'xzChat 是一个强大的AI助手...' }
  ]
};

// 导出为不同格式
const jsonExport = SessionExporter.exportJSON(session);
const mdExport = SessionExporter.exportMarkdown(session);
const txtExport = SessionExporter.exportText(session);
const htmlExport = SessionExporter.exportHTML(session);

console.log('会话已导出为多种格式:');
console.log(`  JSON: ${jsonExport.length} 字符`);
console.log(`  Markdown: ${mdExport.length} 字符`);
console.log(`  纯文本: ${txtExport.length} 字符`);
console.log(`  HTML: ${htmlExport.length} 字符\n`);

// ============================================
// 8. 综合示例
// ============================================
console.log('🚀 示例 8: 综合使用场景\n');

// 场景：团队协作开发
const teamKB = getTeamKnowledgeBase();
const teamDB = await manager.getDatabase('team-data');

// 1. 记录开发规范
await teamKB.addEntry('代码规范', '使用ESLint进行代码检查...', {
  category: '开发',
  tags: ['规范', '代码'],
  author: 'Team'
});

// 2. 保存会话到数据库
await teamDB.set('review-session', {
  name: '代码审查会话',
  date: new Date().toISOString(),
  participants: ['Alice', 'Bob']
});

// 3. 分享会话给团队
const reviewShare = await sharer.generateShareLink('review-1', {
  messages: [{ role: 'user', content: '请审查这段代码' }]
}, { readonly: true });

// 4. 使用国际化提示
console.log(`${t('success.session_created', { name: '审查会话' })}`);
console.log(formatSuccess('分享已创建'));

console.log('\n═══════════════════════════════════════════════════════');
console.log('           示例完成！');
console.log('═══════════════════════════════════════════════════════\n');

// 清理
await manager.closeAll();
