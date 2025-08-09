const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')
  
  try {
    // 检查是否已有默认聊天室
    let defaultChatRoom = await prisma.chatRoom.findFirst({
      where: { name: '默认聊天室' }
    })

    // 如果没有，创建一个
    if (!defaultChatRoom) {
      defaultChatRoom = await prisma.chatRoom.create({
        data: {
          name: '默认聊天室',
          theme: '通用聊天'
        }
      })
      console.log('创建默认聊天室成功')
    }

    console.log('数据库初始化完成!')
    console.log('聊天室ID:', defaultChatRoom.id)
    
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()