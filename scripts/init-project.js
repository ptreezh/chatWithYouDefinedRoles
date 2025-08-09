#!/usr/bin/env node

/**
 * 项目初始化脚本
 * 用于Windows环境下的项目初始化
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始初始化Chat4项目...');

try {
  // 1. 安装依赖
  console.log('📦 安装依赖...');
  execSync('npm install', { stdio: 'inherit', timeout: 300000 });
  
  // 2. 生成Prisma客户端
  console.log('🔧 生成Prisma客户端...');
  execSync('npx prisma generate', { stdio: 'inherit', timeout: 120000 });
  
  // 3. 推送数据库结构
  console.log('🗄️ 初始化数据库...');
  execSync('npx prisma db push', { stdio: 'inherit', timeout: 60000 });
  
  // 4. 检查环境变量
  console.log('🔍 检查环境配置...');
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ .env文件不存在，创建默认配置...');
    const defaultEnv = `# Database
DATABASE_URL="file:./db/custom.db"

# API Keys (optional - will be configured via UI)
ZAI_API_KEY=""
OPENAI_API_KEY=""

# Ollama Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gemma3:latest"

# Network Proxy Configuration
HTTP_PROXY="http://127.0.0.1:7897"
HTTPS_PROXY="http://127.0.0.1:7897"

# Localhost configuration (no proxy)
NO_PROXY="localhost,127.0.0.1,*.local"`;
    fs.writeFileSync(envPath, defaultEnv);
  }
  
  console.log('✅ 项目初始化完成！');
  console.log('');
  console.log('📋 下一步操作:');
  console.log('1. 启动Ollama服务: ollama serve');
  console.log('2. 拉取模型: ollama pull gemma3:latest');
  console.log('3. 启动项目: npm run dev');
  console.log('4. 访问: http://127.0.0.1:3000');
  
} catch (error) {
  console.error('❌ 初始化失败:', error.message);
  console.log('');
  console.log('🔧 手动解决方案:');
  console.log('1. 运行: npm install');
  console.log('2. 运行: npx prisma generate');
  console.log('3. 运行: npx prisma db push');
  console.log('4. 运行: npm run dev');
}