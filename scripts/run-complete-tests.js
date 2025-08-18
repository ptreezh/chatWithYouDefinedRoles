#!/usr/bin/env node

/**
 * 完整测试运行脚本
 * 启动服务器，运行所有测试，然后关闭服务器
 */

const { spawn, exec } = require('child_process');
const path = require('path');

async function runCompleteTestSuite() {
  console.log('🚀 Starting complete test suite...');
  
  let serverProcess;
  
  try {
    // 1. 启动服务器
    console.log('Starting server...');
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    // 监听服务器输出
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[Server] ${output}`);
      
      // 检查服务器是否启动完成
      if (output.includes('Ready on http://') || output.includes('Listening on')) {
        console.log('✅ Server started successfully');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(`[Server Error] ${output}`);
    });
    
    // 等待服务器启动
    console.log('Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
    
    // 2. 运行测试
    console.log('Running Playwright tests...');
    const testProcess = spawn('npx', ['playwright', 'test', 'tests/complete-suite.test.ts'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    // 等待测试完成
    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ All tests passed');
          resolve();
        } else {
          console.log(`❌ Tests failed with code ${code}`);
          reject(new Error(`Tests failed with code ${code}`));
        }
      });
    });
    
  } catch (error) {
    console.error('Error during test execution:', error);
    throw error;
  } finally {
    // 3. 关闭服务器
    if (serverProcess) {
      console.log('Stopping server...');
      serverProcess.kill();
      
      // 等待进程完全结束
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Server stopped');
    }
  }
  
  console.log('🎉 Complete test suite finished!');
}

// 如果直接运行此脚本，则执行测试套件
if (require.main === module) {
  runCompleteTestSuite().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runCompleteTestSuite };