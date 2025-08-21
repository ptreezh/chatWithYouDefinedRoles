#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于生成Prisma客户端和创建必要的表结构
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function initDatabase() {
  console.log('🗄️ 初始化数据库...\n');

  try {
    // 1. 生成Prisma客户端
    console.log('1. 生成Prisma客户端...');
    try {
      await execAsync('npx prisma generate');
      console.log('✅ Prisma客户端生成成功');
    } catch (error) {
      console.log('❌ Prisma客户端生成失败:', error.message);
      return;
    }

    // 2. 推送数据库schema
    console.log('\n2. 推送数据库schema...');
    try {
      await execAsync('npx prisma db push');
      console.log('✅ 数据库schema推送成功');
    } catch (error) {
      console.log('❌ 数据库schema推送失败:', error.message);
      return;
    }

    console.log('\n🎉 数据库初始化完成！');
    console.log('💡 现在可以启动服务器: npm run dev');
    
  } catch (error) {
    console.error('❌ 数据库初始化过程中发生错误:', error.message);
  }
}

// 运行初始化
initDatabase();