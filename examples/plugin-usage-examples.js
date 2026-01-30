/**
 * xzChat 插件使用示例
 * 演示所有插件的功能
 */

// ============================================
// 1. Timer Plugin（计时器）示例
// ============================================

console.log('=== Timer Plugin 示例 ===\n');

// 创建一个60秒的计时器
console.log('/timer 60 倒计时完成');
// 输出: ⏰ 倒计时完成（60秒后）

// 创建一个5分钟的提醒
console.log('/timer 300 记得休息一下');
// 输出: ⏰ 记得休息一下（5分钟后）

// 查看所有活动计时器
console.log('/timers');
// 输出: 活动计时器 (2个):
//        1. 创建时间: 2026-01-29 12:00:00
//        2. 创建时间: 2026-01-29 12:05:00

// ============================================
// 2. Weather Plugin（天气查询）示例
// ============================================

console.log('\n=== Weather Plugin 示例 ===\n');

// 查询北京天气
console.log('/weather 北京');
// 输出: 🌤️ 北京, 中国
//        温度: 15°C
//        天气: 晴朗
//        湿度: 45%
//        风速: 12 km/h

// 查询伦敦天气
console.log('/weather London');
// 输出: 🌤️ London, GB
//        温度: 12°C
//        天气: 多云
//        湿度: 78%
//        风速: 8 km/h

// ============================================
// 3. Translator Plugin（翻译）示例
// ============================================

console.log('\n=== Translator Plugin 示例 ===\n');

// 英文翻译成中文
console.log('/translate en:zh Hello World');
// 输出: 🌐 翻译结果:
//        你好世界

// 中文翻译成英文
console.log('/translate zh:en 你好世界');
// 输出: 🌐 翻译结果:
//        Hello World

// 日语翻译成中文
console.log('/translate ja:zh こんにちは');
// 输出: 🌐 翻译结果:
//        你好

// 列出支持的语言
console.log('/languages');
// 输出: 📚 支持的语言:
//        zh    - 中文
//        en    - 英语
//        ja    - 日语
//        ko    - 韩语
//        ...

// ============================================
// 4. Calculator Plugin（计算器）示例
// ============================================

console.log('\n=== Calculator Plugin 示例 ===\n');

// 基本运算
console.log('/calc 2 + 2');
// 输出: 🔢 计算结果:
//        2 + 2 = 4

console.log('/calc 10 * 5 - 3');
// 输出: 🔢 计算结果:
//        10 * 5 - 3 = 47

// 科学计算
console.log('/calc sqrt(16) + sin(30)');
// 输出: 🔢 计算结果:
//        sqrt(16) + sin(30) = 6.5

console.log('/calc pow(2, 10)');
// 输出: 🔢 计算结果:
//        pow(2, 10) = 1024

// 使用变量
console.log('/calc-var pi = 3.14159');
// 输出: ✅ 变量已设置: pi = 3.14159

console.log('/calc pi * 2');
// 输出: 🔢 计算结果:
//        pi * 2 = 6.28318

console.log('/calc-var radius = 5');
// 输出: ✅ 变量已设置: radius = 5

console.log('/calc pi * pow(radius, 2)');
// 输出: 🔢 计算结果:
//        pi * pow(radius, 2) = 78.53975

// 查看历史
console.log('/calc-history');
// 输出: 📜 计算历史 (最近 5 条):
//        5. 2 + 2 = 4
//        4. 10 * 5 - 3 = 47
//        3. sqrt(16) + sin(30) = 6.5
//        ...

// 列出所有变量
console.log('/calc-vars');
// 输出: 📊 变量列表:
//        pi = 3.14159
//        radius = 5

// ============================================
// 5. Jokes Plugin（笑话）示例
// ============================================

console.log('\n=== Jokes Plugin 示例 ===\n');

// 获取随机笑话
console.log('/joke');
// 输出: 😂 general 笑话:
//        为什么程序员不喜欢户外？
//        因为有太多的 bugs！

// 获取编程笑话
console.log('/joke programming');
// 输出: 😂 programming 笑话:
//        一个程序员去买杂货，妻子让他买一加仑牛奶，
//        如果有鸡蛋，就买12个。程序员带回了12加仑牛奶。

// 获取冷笑话
console.log('/joke dad');
// 输出: 😂 dad 笑话:
//        我正在读一本关于反重力的书。
//        简直停不下来！

// 获取有趣事实
console.log('/fact');
// 输出: 🤓 有趣的事实:
//        蜂蜜永远不会变质。考古学家在古埃及墓穴中
//        发现的3000年蜂蜜仍然可以食用。

// 获取励志名言
console.log('/quote');
// 输出: 💡 名言:
//        "千里之行，始于足下。"
//
//        — 老子

// 列出笑话类型
console.log('/joke-types');
// 输出: 📋 可用的笑话类型:
//        • general
//        • programming
//        • dad
//        • pun
//        • science
//
//        使用: /joke <type>

// ============================================
// 6. Notes Plugin（笔记）示例
// ============================================

console.log('\n=== Notes Plugin 示例 ===\n');

// 添加笔记
console.log('/note 今天要完成：写代码、测试、部署');
// 输出: 📝 笔记已添加 (ID: 1706520123456)
//        今天要完成：写代码、测试、部署

console.log('/note 买牛奶 #生活');
// 输出: 📝 笔记已添加 (ID: 1706520123457)
//        买牛奶

// 列出笔记
console.log('/notes 5');
// 输出: 📒 笔记列表 (显示 5/5 条):
//
//        1. [1706520123457] 买牛奶 [生活]
//           2026-01-29 12:00:00
//
//        2. [1706520123456] 今天要完成：写代码、测试、部署
//           2026-01-29 11:55:00
//        ...

// 搜索笔记
console.log('/note-search 写代码');
// 输出: 🔍 搜索结果 "写代码" (1 条):
//
//        1. [1706520123456] 今天要完成：写代码、测试、部署
//           2026-01-29 11:55:00

console.log('/note-search #生活');
// 输出: 🔍 搜索结果 "#生活" (1 条):
//
//        1. [1706520123457] 买牛奶
//           2026-01-29 12:00:00

// 删除笔记
console.log('/note-delete 1706520123457');
// 输出: 🗑️ 笔记已删除:
//        买牛奶

// 导出笔记
console.log('/note-export json');
// 输出: 📤 笔记已导出到:
//        /Users/user/exports/notes.json
//
//        格式: json

console.log('/note-export md');
// 输出: 📤 笔记已导出到:
//        /Users/user/exports/notes.md
//
//        格式: md

// ============================================
// 7. Search Plugin（搜索）示例
// ============================================

console.log('\n=== Search Plugin 示例 ===\n');

// 通用搜索
console.log('/search how to learn javascript');
// 输出: 🔍 搜索: how to learn javascript
//
//        🌐 打开链接:
//        https://www.google.com/search?q=how+to+learn+javascript

// Google 搜索
console.log('/google javascript tutorial');
// 输出: 🔍 Google 搜索: javascript tutorial
//
//        📋 搜索结果:
//
//        1. JavaScript Tutorial - W3Schools
//           https://www.w3schools.com/js/
//           Well organized and easy to understand Web building tutorials...
//
//        2. JavaScript MDN
//           https://developer.mozilla.org/en-US/docs/Web/JavaScript
//           JavaScript (JS) is a lightweight...
//
//        🌐 完整搜索: https://www.google.com/search?q=javascript+tutorial

// GitHub 搜索
console.log('/github vuejs');
// 输出: 🐱 GitHub 搜索: vuejs
//
//        📋 搜索结果:
//
//        1. vuejs/vue
//           ⭐ 207123 🍴 34256
//           https://github.com/vuejs/vue
//           🖖 Vue.js - The Progressive JavaScript Framework
//
//        2. vuejs/core
//           ⭐ 45678 🍴 8901
//           https://github.com/vuejs/core
//           🖖 Vue 3 core library
//
//        🌐 完整搜索: https://github.com/search?q=vuejs

// Stack Overflow 搜索
console.log('/stack async await javascript');
// 输出: 📚 Stack Overflow 搜索: async await javascript
//
//        🌐 打开链接:
//        https://stackoverflow.com/search?q=async+await+javascript

// DuckDuckGo 搜索
console.log('/duckduckgo privacy tools');
// 输出: 🦆 DuckDuckGo 搜索: privacy tools
//
//        📋 搜索结果:
//
//        1. Privacy Tools
//           https://privacytools.io/
//           Encryption against global mass surveillance...
//
//        🌐 完整搜索: https://duckduckgo.com/?q=privacy+tools

console.log('\n=== 所有示例完成 ===');
