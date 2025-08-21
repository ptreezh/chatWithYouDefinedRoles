#!/usr/bin/env node

/**
 * 简化的服务器启动脚本
 * 处理Prisma客户端初始化问题
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动Chat4多用户服务器...\n');

// 首先尝试生成Prisma客户端
console.log('📦 正在生成Prisma客户端...');
const prismaProcess = spawn('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

prismaProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Prisma客户端生成成功\n');
    startServer();
  } else {
    console.log('❌ Prisma客户端生成失败，尝试直接启动服务器...\n');
    startServer();
  }
});

prismaProcess.on('error', (error) => {
  console.log('❌ Prisma客户端生成出错:', error.message);
  console.log('🔄 尝试直接启动服务器...\n');
  startServer();
});

function startServer() {
  console.log('🌐 启动开发服务器...');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  serverProcess.on('close', (code) => {
    console.log(`\n📋 服务器进程结束，退出码: ${code}`);
  });
  
  serverProcess.on('error', (error) => {
    console.log('❌ 服务器启动失败:', error.message);
  });
  
  // 给服务器一些启动时间
  setTimeout(() => {
    console.log('\n💡 服务器启动中...');
    console.log('🌐 请访问: http://localhost:3000');
    console.log('🔍 健康检查: http://localhost:3000/api/health');
    console.log('\n📝 测试命令:');
    console.log('   node scripts/test-multiuser-simple.js');
  }, 3000);
}