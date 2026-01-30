/**
 * 示例插件: 天气查询
 * 演示如何创建调用外部 API 的插件
 */

import { BasePlugin } from '../../lib/plugins/plugin-system.js';
import fetch from 'node-fetch';

export default class WeatherPlugin extends BasePlugin {
  constructor(metadata, context) {
    super(metadata, context);
    this.commands = {
      '/weather': {
        handler: this.handleWeatherCommand.bind(this),
        description: '查询天气信息',
        usage: '/weather <city>',
        category: 'information',
      },
    };

    this.hooks = {
      'message:send': this.onMessageSend.bind(this),
    };
  }

  async onEnable(context) {
    this.context.logger.info('Weather plugin enabled');
  }

  async handleWeatherCommand(args) {
    if (!args || args.trim() === '') {
      return { error: '请输入城市名称,例如: /weather 北京' };
    }

    try {
      // 使用免费的天气 API (Open-Meteo)
      // 这里需要先获取城市坐标
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args)}&count=1&language=zh`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        return { error: `未找到城市: ${args}` };
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // 获取天气数据
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      const current = weatherData.current;
      const weatherCode = this._getWeatherDescription(current.weather_code);

      const message = `🌤️ ${name}, ${country}\n` +
                     `温度: ${current.temperature_2m}°C\n` +
                     `天气: ${weatherCode}\n` +
                     `湿度: ${current.relative_humidity_2m}%\n` +
                     `风速: ${current.wind_speed_10m} km/h`;

      return {
        success: true,
        message,
      };

    } catch (error) {
      this.context.logger.error('Weather fetch error:', error);
      return { error: '获取天气信息失败,请稍后重试' };
    }
  }

  async onMessageSend(data) {
    // 可以在发送消息前做一些处理
    return data;
  }

  _getWeatherDescription(code) {
    const weatherCodes = {
      0: '晴朗',
      1: '主要晴朗',
      2: '部分多云',
      3: '多云',
      45: '雾',
      48: '沉积雾',
      51: '小雨',
      53: '中雨',
      55: '大雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      80: '阵雨',
      81: '阵雨',
      82: '暴风雨',
      95: '雷雨',
      96: '雷雨伴有冰雹',
      99: '强雷雨伴有冰雹',
    };
    return weatherCodes[code] || '未知';
  }
}
