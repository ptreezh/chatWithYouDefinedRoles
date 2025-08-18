// test-db-connection.js
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const db = new PrismaClient({
    log: ['query'],
  });
  
  try {
    // 尝试执行一个简单的查询
    await db.$queryRaw`SELECT 1`;
    console.log('数据库连接成功!');
    
    // 尝试查询角色表
    const characters = await db.character.findMany({
      take: 1
    });
    console.log('角色表查询成功，返回', characters.length, '条记录');
    
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  } finally {
    await db.$disconnect();
  }
}

testConnection();