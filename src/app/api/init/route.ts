import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MemoryBankManager } from '@/lib/memory-bank'

export async function GET() {
  try {
    // 检查是否已有默认聊天室
    let defaultChatRoom = await db.chatRoom.findFirst({
      where: { name: '默认聊天室' }
    })

    // 如果没有，创建一个
    if (!defaultChatRoom) {
      defaultChatRoom = await db.chatRoom.create({
        data: {
          name: '默认聊天室',
          theme: '通用聊天'
        }
      })
    }

    // 获取所有活跃角色
    const characters = await db.character.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    // 初始化Memory Bank存储
    const memoryBankManager = new MemoryBankManager()
    await memoryBankManager.initializeStorage()

    // 为每个角色确保Memory Bank存在
    for (const character of characters) {
      const existingMemory = await memoryBankManager.getMemoryBank(character.id)
      if (!existingMemory) {
        await memoryBankManager.createMemoryBank(
          character.id,
          character.name,
          character.systemPrompt
        )
      }
    }

    // 获取聊天室的消息
    const messages = await db.message.findMany({
      where: { chatRoomId: defaultChatRoom.id },
      include: {
        character: true
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ 
      chatRoom: defaultChatRoom,
      characters,
      messages 
    })

  } catch (error) {
    console.error('Error initializing chat:', error)
    
    // 如果数据库连接失败，返回默认数据
    const defaultChatRoom = {
      id: 'default-room-id',
      name: '默认聊天室',
      theme: '通用聊天'
    }
    
    return NextResponse.json({ 
      chatRoom: defaultChatRoom,
      characters: [],
      messages: [],
      isDemo: true
    })
  }
}