// 最简Jest配置
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};