import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { farewells } from "./constants.js";
import { sanitizePath } from "../../lib/utils.js";

export { sanitizePath };

/**
 * Git 提交
 */
export function gitCommit(message) {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['commit', '-m', message], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Git commit failed with code ${code}`));
    });
  });
}

/**
 * 打印告别信息
 */
export function printFarewell() {
  const hour = new Date().getHours();
  let pool = [...farewells.default];

  // 根据时间段添加特定文案
  if (hour >= 22 || hour < 5) {
    pool = pool.concat(farewells.lateNight);
    // 深夜增加权重，让深夜文案更容易出现
    pool = pool.concat(farewells.lateNight);
  } else if (hour >= 5 && hour < 9) {
    pool = pool.concat(farewells.earlyMorning);
    pool = pool.concat(farewells.earlyMorning);
  }

  // 15% 概率加入极客/幽默文案
  if (Math.random() < 0.15) {
    pool = pool.concat(farewells.geek);
  }

  const msg = pool[Math.floor(Math.random() * pool.length)];
  console.log(`\n${msg}`);
}

/**
 * 检查更新
 */
export async function checkUpdate() {
  try {
    const packagePath = path.join(path.dirname(fs.realpathSync(process.argv[1])), '../package.json');
    const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const fetch = (await import("node-fetch")).default;
    const res = await fetch("https://registry.npmjs.org/xiaozhou-chat/latest", { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data.version !== version) {
        console.log(`\n\x1b[33m╭──────────────────────────────────────────────╮`);
        console.log(`│                                              │`);
        console.log(`│   Update available! ${version} -> \x1b[32m${data.version}\x1b[33m          │`);
        console.log(`│   Run \x1b[36mnpm install -g xiaozhou-chat\x1b[33m to update   │`);
        console.log(`│                                              │`);
        console.log(`╰──────────────────────────────────────────────╯\x1b[0m\n`);
      }
    }
  } catch (e) {
    // ignore update check error
  }
}

/**
 * 自动补全函数
 */
export function completer(line) {
  const { commands } = import("./constants.js");
  const hits = commands.filter((c) => c.startsWith(line));
  return [hits.length ? hits : commands, line];
}
