import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { textToSpeech, playAudio } from "../../lib/audio.js";

/**
 * /voice 命令 - 语音输入
 */
export async function handleVoice(askQuestion, mainChat, rl) {
  try {
    // Check for sox/rec
    try {
      execSync("rec --version", { stdio: "ignore" });
    } catch (e) {
      try {
        execSync("sox --version", { stdio: "ignore" });
      } catch (e2) {
        console.log("❌ 未检测到录音工具 (sox/rec)。");
        console.log("请先安装 sox: brew install sox (macOS) or sudo apt install sox (Linux)");
        return true;
      }
    }

    console.log("🎙️  准备录音... (按回车键停止)");
    const record = (await import("node-record-lpcm16")).default;
    const tempFile = path.resolve(os.tmpdir(), `voice_${Date.now()}.wav`);
    const fileStream = fs.createWriteStream(tempFile, { encoding: 'binary' });

    const recording = record.record({
      sampleRate: 16000,
      threshold: 0,
      verbose: false,
      recordProgram: 'rec',
      silence: '10.0',
    });

    recording.stream().pipe(fileStream);

    // Wait for Enter
    await askQuestion("🔴 正在录音... (按回车结束) ");

    recording.stop();
    console.log("⏹️  录音结束，正在转写...");

    // Wait a bit for file close
    await new Promise(r => setTimeout(r, 500));

    // Transcribe
    const FormData = (await import("form-data")).default;
    const fetch = (await import("node-fetch")).default;
    const activeConfig = (await import("../../lib/config.js")).getActiveConfig(
      (await import("../../lib/config.js")).loadConfig()
    );

    const formData = new FormData();
    const buffer = fs.readFileSync(tempFile);
    formData.append("file", buffer, { filename: "voice.wav", contentType: "audio/wav" });
    formData.append("model", "whisper-1");

    let transUrl = activeConfig.baseUrl;
    if (transUrl.endsWith("/")) transUrl = transUrl.slice(0, -1);
    const url = `${transUrl}/audio/transcriptions`;

    const headers = {
      "Authorization": `Bearer ${activeConfig.apiKey}`,
      ...formData.getHeaders()
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error (${res.status}): ${text}`);
    }

    const json = await res.json();
    const text = json.text;

    if (text) {
      console.log(`📝 转写结果: ${text}`);
      const ans = await askQuestion("发送吗? (y/n) ");
      if (ans.trim().toLowerCase() === 'y') {
        await mainChat(text);
      } else {
        console.log("🚫 已取消");
      }
    } else {
      console.log("⚠️  未获取到转写内容");
    }

    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

  } catch (e) {
    console.error("❌ 语音输入失败:", e.message);
  }
  return true;
}

/**
 * /tts 命令 - 文本转语音
 */
export async function handleTTS(input, messages, activeConfig) {
  const parts = input.split(/\s+/);
  const sub = parts.slice(1).join(" ");

  if (!sub) {
    return { toggle: true };
  } else if (sub === "last") {
    const lastMsg = messages.slice().reverse().find(m => m.role === 'assistant' && m.content);
    if (lastMsg) {
      console.log("🔊 正在朗读...");
      try {
        const file = await textToSpeech(lastMsg.content, activeConfig);
        await playAudio(file);
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {
        console.error("❌ TTS 失败:", e.message);
      }
    } else {
      console.log("⚠️  没有可朗读的消息");
    }
  } else {
    console.log("🔊 正在朗读...");
    try {
      const file = await textToSpeech(sub, activeConfig);
      await playAudio(file);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (e) {
      console.error("❌ TTS 失败:", e.message);
    }
  }
  return true;
}
