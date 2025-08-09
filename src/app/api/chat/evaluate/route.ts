import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChatService } from '@/lib/chat-service'

export async function POST(request: NextRequest) {
  try {
    const { topic, chatRoomId, characterId } = await request.json()

    if (!topic || !chatRoomId || !characterId) {
      return NextResponse.json({ 
        error: 'Topic, chat room ID, and character ID are required' 
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

    // 构建上下文
    const context = recentMessages
      .reverse()
      .map(msg => {
        if (msg.senderType === 'user') {
          return `用户: ${msg.content}`
        } else if (msg.senderType === 'character') {
          const charName = msg.senderId === characterId ? character.name : '其他角色'
          return `${charName}: ${msg.content}`
        } else {
          return `系统: ${msg.content}`
        }
      })
      .join('\n')

    // 评估兴趣度
    const chatService = new ChatService()
    const evaluation = await chatService.evaluateInterest(
      character,
      topic,
      context
    )

    return NextResponse.json({ 
      message: 'Interest evaluated successfully', 
      evaluation 
    })

  } catch (error) {
    console.error('Error evaluating interest:', error)
    return NextResponse.json({ 
      error: 'Failed to evaluate interest',
      details: error.message 
    }, { status: 500 })
  }
}