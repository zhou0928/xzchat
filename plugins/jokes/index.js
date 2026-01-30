/**
 * 笑话插件
 * 获取各种笑话和趣味内容
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';

export default class JokesPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);

    this.jokeHistory = [];

    this.commands = {
      '/joke': {
        handler: this.handleJoke.bind(this),
        description: '获取一个随机笑话',
        usage: '/joke [type]',
        category: 'entertainment'
      },
      '/joke-types': {
        handler: this.handleTypes.bind(this),
        description: '列出笑话类型',
        usage: '/joke-types',
        category: 'entertainment'
      },
      '/fact': {
        handler: this.handleFact.bind(this),
        description: '获取一个有趣的事实',
        usage: '/fact',
        category: 'entertainment'
      },
      '/quote': {
        handler: this.handleQuote.bind(this),
        description: '获取一个励志名言',
        usage: '/quote',
        category: 'entertainment'
      }
    };
  }

  async onEnable(context) {
    this.context.logger.info('笑话插件已启用');
  }

  async onDisable(context) {
    this.jokeHistory = [];
    this.context.logger.info('笑话插件已禁用');
  }

  /**
   * 处理笑话命令
   */
  async handleJoke(args) {
    const type = args.trim() || 'general';

    try {
      const joke = await this.getJoke(type);
      this.jokeHistory.push({ type, joke, timestamp: new Date().toISOString() });

      return {
        success: true,
        message: `😂 ${type} 笑话:\n\n${joke}`
      };
    } catch (error) {
      return {
        error: `获取笑话失败: ${error.message}`
      };
    }
  }

  /**
   * 处理类型列表
   */
  async handleTypes() {
    const types = this.getJokeTypes();
    const message = `📋 可用的笑话类型:\n\n` +
      types.map(t => `  • ${t}`).join('\n') +
      '\n\n使用: /joke <type>';

    return {
      success: true,
      message
    };
  }

  /**
   * 处理事实命令
   */
  async handleFact() {
    try {
      const fact = await this.getFact();
      return {
        success: true,
        message: `🤓 有趣的事实:\n\n${fact}`
      };
    } catch (error) {
      return {
        error: `获取事实失败: ${error.message}`
      };
    }
  }

  /**
   * 处理名言命令
   */
  async handleQuote() {
    try {
      const quote = await this.getQuote();
      return {
        success: true,
        message: `💡 名言:\n\n"${quote.text}"\n\n— ${quote.author}`
      };
    } catch (error) {
      return {
        error: `获取名言失败: ${error.message}`
      };
    }
  }

  /**
   * 获取笑话类型
   */
  getJokeTypes() {
    return ['general', 'programming', 'dad', 'pun', 'science'];
  }

  /**
   * 获取笑话
   */
  async getJoke(type) {
    // 内置笑话库
    const jokes = this.getLocalJokes(type);
    const randomIndex = Math.floor(Math.random() * jokes.length);

    // 尝试从 API 获取
    try {
      const response = await fetch(`https://official-joke-api.appspot.com/jokes/${type}/random`);
      const data = await response.json();

      if (data.setup && data.punchline) {
        return `${data.setup}\n\n${data.punchline}`;
      }

      return jokes[randomIndex];
    } catch (error) {
      // API 失败，使用本地笑话
      return jokes[randomIndex];
    }
  }

  /**
   * 获取本地笑话
   */
  getLocalJokes(type) {
    const jokeLib = {
      general: [
        "为什么程序员不喜欢户外？\n因为有太多的 bugs！",
        "为什么 Java 程序员戴眼镜？\n因为他们看不清 C#",
        "一个 SQL 语句走进一家酒吧，走到两张桌子中间说：\n'我可以 JOIN 你们吗？'",
        "为什么程序员总是分不清万圣节和圣诞节？\n因为 Oct 31 == Dec 25"
      ],
      programming: [
        "为什么程序员总是弄混圣诞节和万圣节？\n因为 OCT 31 == DEC 25",
        "一个程序员去买杂货，妻子让他买一加仑牛奶，如果有鸡蛋，就买12个。\n程序员带回了12加仑牛奶。",
        "为什么说程序员是最乐观的？\n因为他们只说 Hello World，而不是 Goodbye World。",
        "程序员最讨厌什么？\n没有文档和注释的代码。"
      ],
      dad: [
        "我正在读一本关于反重力的书。\n简直停不下来！",
        "我今天被解雇了，因为我是吸尘器。\n我只想在吸尘器公司工作。",
        "我说了一个关于元素的笑话。\n但是没有反应。",
        "我不信任那些做楼梯的人。\n他们总是有所保留。"
      ],
      pun: [
        "我给树做了手术。\n它现在是植物人。",
        "我给鱼买了眼镜。\n现在它是近视鱼了。",
        "我给汽车买了新座椅。\n现在它是一个豪华轿车。",
        "我给植物买了新鞋子。\n现在它们是皮鞋。"
      ],
      science: [
        "为什么从不信任原子？\n因为它们组成一切。",
        "为什么物理学老师喜欢牛顿？\n因为他有很强的吸引力。",
        "为什么化学反应很激动？\n因为它们会放出气体。",
        "为什么电脑能听到你的声音？\n因为它有麦克风（microphone，也可以理解为小型的电话）。"
      ]
    };

    return jokeLib[type] || jokeLib.general;
  }

  /**
   * 获取有趣事实
   */
  async getFact() {
    const facts = [
      "蜂蜜永远不会变质。考古学家在古埃及墓穴中发现的3000年蜂蜜仍然可以食用。",
      "章鱼有三颗心脏。",
      "鲨鱼比树木更古老。",
      "香蕉是浆果，但草莓不是。",
      "月球正以每年3.8厘米的速度远离地球。",
      "人类和香蕉的DNA有50%是相同的。",
      "一只猫的一生平均可以抓到3000只老鼠。",
      "水的沸点会随着海拔升高而降低。",
      "地球的磁场会每20万年左右反转一次。",
      "人类大脑产生的电流足够点亮一个小灯泡。"
    ];

    const randomIndex = Math.floor(Math.random() * facts.length);
    return facts[randomIndex];
  }

  /**
   * 获取励志名言
   */
  async getQuote() {
    const quotes = [
      { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
      { text: "天行健，君子以自强不息。", author: "《周易》" },
      { text: "知之者不如好之者，好之者不如乐之者。", author: "孔子" },
      { text: "学而时习之，不亦说乎？", author: "孔子" },
      { text: "三人行，必有我师焉。", author: "孔子" },
      { text: "千里之行，始于足下。", author: "老子" },
      { text: "上善若水，水利万物而不争。", author: "老子" },
      { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" }
    ];

    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }
}
