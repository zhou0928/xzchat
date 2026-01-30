
import process from "node:process";

export class Spinner {
  constructor(text = "思考中...") {
    this.text = text;
    this.chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    this.index = 0;
    this.timer = null;
  }
  start() {
    if (this.timer) return;
    process.stdout.write("\x1b[?25l"); // Hide cursor
    
    // 立即打印第一帧
    process.stdout.write(`\r\x1b[36m${this.chars[this.index]} ${this.text}\x1b[0m`);
    this.index = (this.index + 1) % this.chars.length;

    this.timer = setInterval(() => {
      process.stdout.write(`\r\x1b[36m${this.chars[this.index]} ${this.text}\x1b[0m`);
      this.index = (this.index + 1) % this.chars.length;
    }, 80);
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      process.stdout.write("\r\x1b[K"); // Clear line
      process.stdout.write("\x1b[?25h"); // Show cursor
    }
  }
}

export class StreamPrinter {
  constructor() {
    this.buffer = "";
    this.isPrinting = false;
    this.resolveIdle = null;
    this.timer = null;
    this.isThinking = false;
  }

  add(text) {
    if (!text) return;
    
    let formattedText = text;
    
    // Simple tag handling
    if (formattedText.includes("<think>")) {
       formattedText = formattedText.replace(/<think>/g, "\n\x1b[90m> Thinking...\n");
       this.isThinking = true;
    }
    
    if (formattedText.includes("</think>")) {
       formattedText = formattedText.replace(/<\/think>/g, "\n\x1b[0m\n");
       this.isThinking = false;
    }
    
    this.buffer += formattedText;
    this.start();
  }

  start() {
    if (this.isPrinting) return;
    this.isPrinting = true;
    this.printLoop();
  }

  printLoop() {
    if (this.buffer.length === 0) {
      this.isPrinting = false;
      if (this.resolveIdle) {
        this.resolveIdle();
        this.resolveIdle = null;
      }
      return;
    }

    // 动态速度控制
    const len = this.buffer.length;
    let count = 1;
    let delay = 5; // 基础 5ms/字

    // 激进加速策略
    if (len > 200) { count = 50; delay = 1; }
    else if (len > 50) { count = 10; delay = 2; }
    else if (len > 20) { count = 5; delay = 3; }
    else if (len > 5) { count = 2; delay = 4; }

    // 使用迭代器确保不切断 Unicode 字符
    let charIndex = 0;
    let charCount = 0;
    for (const char of this.buffer) {
        charIndex += char.length;
        charCount++;
        if (charCount >= count) break;
    }
    
    const splitIndex = charIndex;
    const chunk = this.buffer.slice(0, splitIndex);
    this.buffer = this.buffer.slice(splitIndex);
    
    process.stdout.write(chunk);

    this.timer = setTimeout(() => this.printLoop(), delay);
  }

  stop() {
    if (this.isPrinting) {
        this.isPrinting = false;
        this.buffer = "";
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.resolveIdle) {
            this.resolveIdle();
            this.resolveIdle = null;
        }
    }
  }

  async waitIdle() {
    if (!this.isPrinting && this.buffer.length === 0) return;
    return new Promise(resolve => {
      this.resolveIdle = resolve;
    });
  }
}
