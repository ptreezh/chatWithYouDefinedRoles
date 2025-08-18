/**
 * @fileoverview Jest单元测试配置
 * TestCraft AI - 单元测试专用配置
 * 专注于角色兴趣匹配算法、工具函数、核心业务逻辑测试
 */

module.exports = {
  displayName: 'unit-tests',
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.spec.ts'
  ],
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    '!src/lib/**/*.d.ts',
    '!src/lib/socket.ts', // Socket.IO测试在集成测试层
    '!src/lib/db.ts'    // 数据库测试在集成测试层
  ],
  
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/lib/chat-service.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // 模块映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 转换配置
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // 测试超时
  testTimeout: 10000,
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup/unit-setup.ts'],
  
  // 忽略文件
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.next/',
    '<rootDir>/dist\\Chat4-Portable/'
  ],
  
  // 模块忽略
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/dist\\Chat4-Portable/'
  ],
  
  // 模块路径解析
  moduleDirectories: ['node_modules', 'src'],
  
  // 测试并发配置
  maxWorkers: '50%',
  
  // 详细输出
  verbose: true,
  
  // 测试报告格式
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './reports/unit-tests',
      filename: 'index.html',
      expand: true,
      openReport: false
    }]
  ]
};