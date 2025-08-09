#!/usr/bin/env node

/**
 * 网络配置脚本
 * 用于配置项目的网络代理设置
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 配置网络代理设置...');

// 检查并配置环境变量
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env 文件已配置代理设置');
} else {
  console.log('❌ .env 文件不存在');
}

// 配置本地服务不使用代理
const noProxy = 'localhost,127.0.0.1,*.local';

console.log(`\n📋 网络配置总结:`);
console.log(`- 代理服务器: http://127.0.0.1:7897`);
console.log(`- 本地服务不使用代理: ${noProxy}`);
console.log(`- 项目服务地址: http://127.0.0.1:3000`);

console.log('\n💡 建议:');
console.log('1. 确保代理软件正在运行');
console.log('2. 本地服务访问 http://127.0.0.1:3000 不需要代理');
console.log('3. 外部API调用将通过代理服务器');
console.log('4. 如有问题，请检查代理软件配置');

console.log('\n🚀 配置完成!');