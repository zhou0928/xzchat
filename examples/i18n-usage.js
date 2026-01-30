/**
 * 国际化(i18n)系统使用示例
 */

import {
  I18n,
  i18n,
  t,
  setLocale,
  getLocale,
  createNamespace,
  formatNumber,
  formatDate,
  formatCurrency,
  plural
} from '../lib/i18n/index.js';

// 示例1: 基本使用
console.log('=== 示例1: 基本使用 ===\n');

// 加载翻译
i18n.load('zh-CN', {
  app: {
    name: 'xzChat',
    welcome: '欢迎使用 {{name}}'
  },
  messages: {
    error: {
      notFound: '未找到: {{item}}'
    }
  }
});

i18n.load('en-US', {
  app: {
    name: 'xzChat',
    welcome: 'Welcome to {{name}}'
  },
  messages: {
    error: {
      notFound: 'Not found: {{item}}'
    }
  }
});

// 翻译文本
console.log(t('app.name'));
console.log(t('app.welcome', { name: 'xzChat' }));
console.log(t('messages.error.notFound', { item: '文件' }));

// 示例2: 语言切换
console.log('\n=== 示例2: 语言切换 ===\n');

console.log('当前语言:', getLocale());
console.log('欢迎信息:', t('app.welcome', { name: 'xzChat' }));

setLocale('en-US');
console.log('当前语言:', getLocale());
console.log('欢迎信息:', t('app.welcome', { name: 'xzChat' }));

setLocale('zh-CN');

// 示例3: 嵌套键
console.log('\n=== 示例3: 嵌套键 ===\n');

i18n.load('zh-CN', {
  commands: {
    session: {
      summary: '管理会话',
      subcommands: {
        list: '列出所有会话',
        new: '创建新会话'
      }
    }
  }
});

console.log(t('commands.session.summary'));
console.log(t('commands.session.subcommands.list'));
console.log(t('commands.session.subcommands.new'));

// 示例4: 命名空间
console.log('\n=== 示例4: 命名空间 ===\n');

const tCommands = createNamespace('commands.session');
console.log(tCommands('summary'));
console.log(tCommands('subcommands.list'));

const tMessages = createNamespace('messages.error');
console.log(tMessages('notFound', { item: '配置文件' }));

// 示例5: 复数形式
console.log('\n=== 示例5: 复数形式 ===\n');

i18n.load('zh-CN', {
  item: '1 项',
  items: '{{count}} 项'
});

console.log(plural(1, 'item', 'items'));
console.log(plural(5, 'item', 'items', { count: 5 }));

// 示例6: 格式化函数
console.log('\n=== 示例6: 格式化函数 ===\n');

// 数字格式化
console.log('中文数字:', formatNumber(1234567.89));
console.log('英文数字:', formatNumber(1234567.89, {}, 'en-US'));

// 日期格式化
const now = new Date();
console.log('中文日期:', formatDate(now, { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
}));
console.log('英文日期:', formatDate(now, { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
}, 'en-US'));

// 货币格式化
console.log('中文货币:', formatCurrency(1234.56, 'CNY'));
console.log('英文货币:', formatCurrency(1234.56, 'USD', {}, 'en-US'));

// 示例7: 批量翻译
console.log('\n=== 示例7: 批量翻译 ===\n');

i18n.load('zh-CN', {
  welcome: '欢迎',
  goodbye: '再见',
  thanks: '谢谢'
});

const translations = i18n.translateBatch(['welcome', 'goodbye', 'thanks']);
console.log('批量翻译结果:', translations);

// 示例8: 从目录加载翻译
console.log('\n=== 示例8: 从目录加载翻译 ===\n');

const instance = new I18n();
instance.init({
  localeDirectory: './lib/i18n/locales',
  defaultLocale: 'zh-CN'
});

console.log('当前语言:', instance.getLocale());
console.log('应用名称:', instance.t('app.name'));
console.log('欢迎信息:', instance.t('app.welcome'));

instance.setLocale('en-US');
console.log('当前语言:', instance.getLocale());
console.log('应用名称:', instance.t('app.name'));
console.log('欢迎信息:', instance.t('app.welcome'));

// 示例9: 检查翻译是否存在
console.log('\n=== 示例9: 检查翻译是否存在 ===\n');

console.log("'app.name' 存在:", i18n.exists('app.name'));
console.log("'app.nonexistent' 存在:", i18n.exists('app.nonexistent'));

// 示例10: 获取语言名称
console.log('\n=== 示例10: 获取语言名称 ===\n');

console.log("zh-CN 的名称(中文):", i18n.getLanguageName('zh-CN', 'zh-CN'));
console.log("zh-CN 的名称(英文):", i18n.getLanguageName('zh-CN', 'en-US'));
console.log("en-US 的名称(中文):", i18n.getLanguageName('en-US', 'zh-CN'));
console.log("en-US 的名称(英文):", i18n.getLanguageName('en-US', 'en-US'));

// 示例11: 回退机制
console.log('\n=== 示例11: 回退机制 ===\n');

const instance2 = new I18n({
  defaultLocale: 'en-US',
  fallbackLocale: 'zh-CN'
});

instance2.load('zh-CN', {
  hello: '你好',
  world: '世界'
});

instance2.load('en-US', {
  hello: 'Hello'
  // 缺少 'world' 翻译
});

instance2.setLocale('en-US');
console.log("'hello' (en-US):", instance2.t('hello'));
console.log("'world' (回退到 zh-CN):", instance2.t('world'));

// 示例12: 自定义实例
console.log('\n=== 示例12: 自定义实例 ===\n');

const customI18n = new I18n({
  defaultLocale: 'en-US',
  availableLocales: ['en-US', 'fr-FR'],
  fallbackLocale: 'en-US',
  cacheTranslations: true
});

customI18n.load('en-US', {
  app: {
    name: 'My App'
  }
});

customI18n.load('fr-FR', {
  app: {
    name: 'Mon App'
  }
});

console.log('自定义实例 - 英文:', customI18n.t('app.name'));
customI18n.setLocale('fr-FR');
console.log('自定义实例 - 法文:', customI18n.t('app.name'));

// 示例13: 导出和重置
console.log('\n=== 示例13: 导出和重置 ===\n');

const translationsExport = i18n.exportTranslations('zh-CN');
console.log('导出的翻译(前3个键):', Object.keys(translationsExport).slice(0, 3));

i18n.load('zh-CN', { temp: '临时' });
console.log('临时翻译:', i18n.t('temp'));

i18n.reset();
console.log('重置后是否存在 temp:', i18n.exists('temp'));
console.log('重置后语言:', i18n.getLocale());

// 示例14: 在命令行应用中使用
console.log('\n=== 示例14: 在命令行应用中使用 ===\n');

class CLIApp {
  constructor() {
    this.i18n = new I18n();
    this.initTranslations();
  }

  initTranslations() {
    this.i18n.init({
      localeDirectory: './lib/i18n/locales',
      defaultLocale: 'zh-CN',
      autoDetect: true
    });
  }

  showWelcome() {
    console.log(this.i18n.t('app.welcome'));
    console.log(this.i18n.t('app.name'), this.i18n.t('app.version'));
  }

  showHelp() {
    console.log(this.i18n.t('commands.help.usage'));
    console.log(this.i18n.t('commands.session.summary'));
  }

  setLanguage(locale) {
    if (this.i18n.setLocale(locale)) {
      console.log(this.i18n.t('config.languageChanged', { 
        language: this.i18n.getLanguageName(locale) 
      }));
    }
  }
}

const app = new CLIApp();
app.showWelcome();
app.showHelp();

// 示例15: 插件国际化支持
console.log('\n=== 示例15: 插件国际化支持 ===\n');

// 为插件创建独立的命名空间
const pluginT = createNamespace('plugins');

i18n.load('zh-CN', {
  plugins: {
    timer: {
      started: '计时器已启动: {{seconds}}秒',
      stopped: '计时器已停止',
      elapsed: '已用时间: {{seconds}}秒'
    },
    weather: {
      querying: '查询天气...',
      result: '{{city}} 天气: {{condition}} {{temp}}°C'
    }
  }
});

console.log(pluginT('timer.started', { seconds: 60 }));
console.log(pluginT('weather.result', { city: '北京', condition: '晴', temp: 25 }));

// 切换到英文
i18n.load('en-US', {
  plugins: {
    timer: {
      started: 'Timer started: {{seconds}}s',
      stopped: 'Timer stopped',
      elapsed: 'Elapsed time: {{seconds}}s'
    },
    weather: {
      querying: 'Querying weather...',
      result: '{{city}} weather: {{condition}} {{temp}}°C'
    }
  }
});

i18n.setLocale('en-US');
const pluginTEn = createNamespace('plugins');
console.log(pluginTEn('timer.started', { seconds: 30 }));
console.log(pluginTEn('weather.result', { city: 'London', condition: 'Sunny', temp: 18 }));

console.log('\n=== 所有示例完成 ===');
