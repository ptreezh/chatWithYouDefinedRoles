import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChatService } from '@/lib/chat-service'
import { MemoryBankManager } from '@/lib/memory-bank'

export async function POST(request: NextRequest) {
  try {
    const { message, chatRoomId, characterId, temperature } = await request.json()

    if (!message || !chatRoomId || !characterId) {
      return NextResponse.json({ 
        error: 'Message, chat room ID, and character ID are required' 
      }, { status: 400 })
    }

    // 获取角色信息
    const character = await db.character.findUnique({
      where: { id: characterId }
    })

    if (!character) {
      return NextResponse.json({ 
        error: 'Character not found' 
      }, { status: 404 })
    }

    // 获取最近的对话历史作为上下文
    const recentMessages = await db.message.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // 将用户消息作为直接上下文，完整的对话历史将在chat-service中处理
    const context = message;

    // 生成回复
    const chatService = new ChatService()
    const { response, memorySnapshot } = await chatService.generateResponse(
      character,
      message,
      context,
      recentMessages,
      temperature,
      null, // forceRegenerate 初始为 null
      '' // newPromptPrefix 初始为空字符串
    )

    // 保存消息到数据库
    const savedMessage = await db.message.create({
      data: {
        content: response,
        senderType: 'character',
        senderId: characterId,
        chatRoomId,
        memorySnapshot: JSON.stringify(memorySnapshot)
      }
    })

    return NextResponse.json({ 
      message: 'Response generated successfully', 
      response,
      savedMessage 
    })

  } catch (error) {
    console.error('Error generating response:', error)
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error.message 
    }, { status: 500 })
  }
}