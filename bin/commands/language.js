/**
 * 语言命令处理器
 * 支持多语言切换
 */

import {
  setLocale,
  getLocale,
  getSupportedLanguages,
  initI18n,
  t
} from '../../lib/utils/i18n.js';

/**
 * 处理语言设置命令
 * /language [locale]
 */
export async function handleLanguage(args) {
  const [locale] = args;

  // 不带参数时显示当前语言
  if (!locale) {
    const current = getLocale();
    const languages = getSupportedLanguages();
    const lang = languages.find(l => l.code === current);
    
    console.log(`\n🌐 当前语言: ${lang?.name || current} (${current})\n`);
    
    console.log('可用语言:');
    languages.forEach(l => {
      const marker = l.code === current ? '👉 ' : '   ';
      console.log(`  ${marker}${l.name} (${l.code})`);
    });
    
    console.log('\n使用方法: /language <zh|en|ja>\n');
    return;
  }

  try {
    await setLocale(locale);
    const languages = getSupportedLanguages();
    const lang = languages.find(l => l.code === locale);
    
    console.log(`\n${t('ui.language_set', { language: lang?.name || locale })}\n`);
  } catch (error) {
    const languages = getSupportedLanguages();
    const available = languages.map(l => l.code).join(', ');
    
    console.error(`\n${t('ui.language_not_supported', { language: locale })}`);
    console.log(`${t('ui.available_languages', { languages: available })}\n`);
  }
}

/**
 * 处理 /lang 命令（简写）
 */
export async function handleLang(args) {
  return handleLanguage(args);
}

export default {
  handleLanguage,
  handleLang
};
