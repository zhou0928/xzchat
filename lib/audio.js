
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import fetch from "node-fetch";

// TTS Support
export async function textToSpeech(text, config) {
    if (!config.apiKey) {
        throw new Error("API Key is missing for TTS");
    }
    
    // Auto-detect endpoint
    let baseUrl = config.baseUrl;
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    
    // Adjust URL logic:
    // If baseUrl ends in /v1, use /v1/audio/speech
    // If not, append /v1/audio/speech or /audio/speech depending on provider
    // Standard OpenAI: https://api.openai.com/v1/audio/speech
    let url;
    if (baseUrl.includes("/v1")) {
        url = baseUrl.replace(/\/chat\/completions$/, "").replace(/\/$/, "") + "/audio/speech";
        // If baseUrl was https://api.openai.com/v1, now it is https://api.openai.com/v1/audio/speech
        // If baseUrl was https://api.openai.com/v1/chat/completions, replace fixed it.
    } else {
        url = `${baseUrl}/v1/audio/speech`;
    }

    // Double check URL structure
    if (url.includes("/v1/v1")) url = url.replace("/v1/v1", "/v1");
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: "alloy"
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`TTS API Error (${response.status}): ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const tempFile = path.join(os.tmpdir(), `speech-${Date.now()}.mp3`);
    fs.writeFileSync(tempFile, buffer);
    
    return tempFile;
}

export async function playAudio(filePath) {
    const platform = os.platform();
    let command;
    let args = [];

    if (platform === "darwin") {
        command = "afplay";
        args = [filePath];
    } else if (platform === "linux") {
        // Try mpg123 or aplay
        command = "mpg123"; // MP3 player
        args = [filePath];
        // Check if mpg123 exists? Or try play/aplay (aplay doesn't play mp3 usually)
        // Fallback check? For now assume user has it or warn.
    } else if (platform === "win32") {
        // Powershell to play sound
        command = "powershell";
        args = ["-c", `(New-Object Media.SoundPlayer "${filePath}").PlaySync()`];
        // Note: SoundPlayer only supports WAV. For MP3 on Windows CLI without external tools is hard.
        // We might need to start the default media player?
        // Let's use 'start' command
        command = "cmd";
        args = ["/c", "start", filePath]; 
        // This opens the player but doesn't wait. It's okay-ish.
    } else {
        throw new Error(`Audio playback not supported on ${platform}`);
    }

    return new Promise((resolve, reject) => {
        const proc = exec(`${command} "${filePath}"`, (err) => {
            if (err) {
                // Ignore error on windows 'start' as it might return quickly
                if (platform === "win32") resolve();
                else reject(err);
            } else {
                resolve();
            }
        });
    });
}
