/**
 * @fileoverview 单元测试设置文件
 * TestCraft AI - 单元测试环境初始化
 */

import { jest } from '@jest/globals';

// 全局测试配置
beforeAll(() => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'unit';
  
  // 禁用控制台输出，除非DEBUG模式
  if (!process.env.DEBUG) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterAll(() => {
  // 清理测试环境
  jest.restoreAllMocks();
});

// Mock全局对象
Object.defineProperty(global, 'fetch', {
  writable: true,
  value: jest.fn(),
});

// 测试工具函数
global.testUtils = {
  mockApiResponse: (response: any) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => response,
      text: async () => JSON.stringify(response),
      status: 200,
      statusText: 'OK'
    });
  },
  
  mockApiError: (status: number, message: string) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
      statusText: message,
      json: async () => ({ error: message })
    });
  },
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};