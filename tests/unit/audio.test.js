/**
 * 音频处理模块单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  textToSpeech,
  playAudio,
  recordAudio,
  listAudioDevices
} from '../../lib/audio.js';

describe('音频处理模块', () => {
  describe('textToSpeech', () => {
    it('应该转换文本为语音', async () => {
      // Mock TTS
      const mockTTS = vi.fn().mockResolvedValue(Buffer.from('audio data'));
      global.textToSpeechMock = mockTTS;

      const result = await textToSpeech('Hello world');
      expect(result).toBeDefined();
      expect(mockTTS).toHaveBeenCalledWith('Hello world');

      delete global.textToSpeechMock;
    });

    it('应该支持不同语言', async () => {
      const mockTTS = vi.fn().mockResolvedValue(Buffer.from('audio'));
      global.textToSpeechMock = mockTTS;

      await textToSpeech('你好', { language: 'zh-CN' });
      expect(mockTTS).toHaveBeenCalledWith('你好', { language: 'zh-CN' });

      delete global.textToSpeechMock;
    });

    it('应该处理空文本', async () => {
      const mockTTS = vi.fn().mockResolvedValue(Buffer.from(''));
      global.textToSpeechMock = mockTTS;

      const result = await textToSpeech('');
      expect(result).toBeDefined();

      delete global.textToSpeechMock;
    });

    it('应该处理特殊字符', async () => {
      const mockTTS = vi.fn().mockResolvedValue(Buffer.from('audio'));
      global.textToSpeechMock = mockTTS;

      await textToSpeech('Test @#$%^&*()');
      expect(mockTTS).toHaveBeenCalled();

      delete global.textToSpeechMock;
    });
  });

  describe('playAudio', () => {
    it('应该播放音频', async () => {
      const mockPlay = vi.fn().mockResolvedValue();
      global.playAudioMock = mockPlay;

      const audioBuffer = Buffer.from('audio data');
      await playAudio(audioBuffer);
      expect(mockPlay).toHaveBeenCalledWith(audioBuffer);

      delete global.playAudioMock;
    });

    it('应该支持指定音量', async () => {
      const mockPlay = vi.fn().mockResolvedValue();
      global.playAudioMock = mockPlay;

      const audioBuffer = Buffer.from('audio data');
      await playAudio(audioBuffer, { volume: 0.8 });
      expect(mockPlay).toHaveBeenCalledWith(audioBuffer, { volume: 0.8 });

      delete global.playAudioMock;
    });

    it('应该处理空音频缓冲', async () => {
      const mockPlay = vi.fn().mockResolvedValue();
      global.playAudioMock = mockPlay;

      const audioBuffer = Buffer.from('');
      await playAudio(audioBuffer);
      expect(mockPlay).toHaveBeenCalled();

      delete global.playAudioMock;
    });
  });

  describe('recordAudio', () => {
    it('应该开始录音', async () => {
      const mockRecord = vi.fn().mockResolvedValue(Buffer.from('recorded audio'));
      global.recordAudioMock = mockRecord;

      const result = await recordAudio(5); // 5秒
      expect(result).toBeDefined();
      expect(mockRecord).toHaveBeenCalledWith(5);

      delete global.recordAudioMock;
    });

    it('应该支持自定义采样率', async () => {
      const mockRecord = vi.fn().mockResolvedValue(Buffer.from('audio'));
      global.recordAudioMock = mockRecord;

      await recordAudio(5, { sampleRate: 16000 });
      expect(mockRecord).toHaveBeenCalledWith(5, { sampleRate: 16000 });

      delete global.recordAudioMock;
    });

    it('应该处理录音中断', async () => {
      const mockRecord = vi.fn().mockRejectedValue(new Error('Recording interrupted'));
      global.recordAudioMock = mockRecord;

      await expect(recordAudio(5)).rejects.toThrow('Recording interrupted');

      delete global.recordAudioMock;
    });
  });

  describe('listAudioDevices', () => {
    it('应该列出音频设备', async () => {
      const mockList = vi.fn().mockResolvedValue([
        { id: '1', name: 'Default Device', type: 'output' },
        { id: '2', name: 'Speaker', type: 'output' }
      ]);
      global.listAudioDevicesMock = mockList;

      const devices = await listAudioDevices();
      expect(devices).toHaveLength(2);
      expect(devices[0].name).toBe('Default Device');

      delete global.listAudioDevicesMock;
    });

    it('应该处理设备列表为空', async () => {
      const mockList = vi.fn().mockResolvedValue([]);
      global.listAudioDevicesMock = mockList;

      const devices = await listAudioDevices();
      expect(devices).toEqual([]);

      delete global.listAudioDevicesMock;
    });

    it('应该区分输入和输出设备', async () => {
      const mockList = vi.fn().mockResolvedValue([
        { id: '1', name: 'Mic', type: 'input' },
        { id: '2', name: 'Speaker', type: 'output' }
      ]);
      global.listAudioDevicesMock = mockList;

      const devices = await listAudioDevices();
      const inputs = devices.filter(d => d.type === 'input');
      const outputs = devices.filter(d => d.type === 'output');

      expect(inputs).toHaveLength(1);
      expect(outputs).toHaveLength(1);

      delete global.listAudioDevicesMock;
    });
  });

  describe('错误处理', () => {
    it('应该处理TTS服务不可用', async () => {
      const mockTTS = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      global.textToSpeechMock = mockTTS;

      await expect(textToSpeech('Test')).rejects.toThrow('Service unavailable');

      delete global.textToSpeechMock;
    });

    it('应该处理音频播放失败', async () => {
      const mockPlay = vi.fn().mockRejectedValue(new Error('Playback failed'));
      global.playAudioMock = mockPlay;

      const audioBuffer = Buffer.from('audio');
      await expect(playAudio(audioBuffer)).rejects.toThrow('Playback failed');

      delete global.playAudioMock;
    });

    it('应该处理设备列表查询失败', async () => {
      const mockList = vi.fn().mockRejectedValue(new Error('Device query failed'));
      global.listAudioDevicesMock = mockList;

      await expect(listAudioDevices()).rejects.toThrow('Device query failed');

      delete global.listAudioDevicesMock;
    });
  });

  describe('边界情况', () => {
    it('应该处理超长文本', async () => {
      const mockTTS = vi.fn().mockResolvedValue(Buffer.from('audio'));
      global.textToSpeechMock = mockTTS;

      const longText = 'A'.repeat(10000);
      await textToSpeech(longText);
      expect(mockTTS).toHaveBeenCalledWith(longText);

      delete global.textToSpeechMock;
    });

    it('应该处理多语言文本', async () => {
      const mockTTS = vi.fn().mockResolvedValue(Buffer.from('audio'));
      global.textToSpeechMock = mockTTS;

      const mixedText = 'Hello 世界 こんにちは';
      await textToSpeech(mixedText);
      expect(mockTTS).toHaveBeenCalledWith(mixedText);

      delete global.textToSpeechMock;
    });

    it('应该处理零秒录音', async () => {
      const mockRecord = vi.fn().mockResolvedValue(Buffer.from(''));
      global.recordAudioMock = mockRecord;

      const result = await recordAudio(0);
      expect(result).toBeDefined();
      expect(mockRecord).toHaveBeenCalledWith(0);

      delete global.recordAudioMock;
    });
  });
});
