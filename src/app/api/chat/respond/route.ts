import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ChatService } from '@/lib/chat-service'
import { MemoryBankManager } from '@/lib/memory-bank'

// 认证中间件
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = parseJWT(token)
  if (!payload) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub }
  })

  return user
}

function parseJWT(token: string): any {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // 认证用户
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 })
    }

    const { message, chatRoomId, characterId, temperature } = await request.json()

    if (!message || !chatRoomId || !characterId) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Message, chat room ID, and character ID are required' }
      }, { status: 400 })
    }

    // 获取角色信息并检查权限
    const character = await db.character.findUnique({
      where: { id: characterId, userId: user.id } // 确保角色属于当前用户
    })

    if (!character) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'CHARACTER_NOT_FOUND', message: 'Character not found or access denied' }
      }, { status: 404 })
    }

    // 检查聊天室权限
    const chatRoom = await db.chatRoom.findUnique({
      where: { id: chatRoomId, userId: user.id } // 确保聊天室属于当前用户
    })

    if (!chatRoom) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'CHATROOM_NOT_FOUND', message: 'Chat room not found or access denied' }
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
      success: true,
      message: 'Response generated successfully', 
      data: {
        response,
        savedMessage 
      }
    })

  } catch (error) {
    console.error('Error generating response:', error)
    return NextResponse.json({ 
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate response' },
      details: error.message 
    }, { status: 500 })
  }
}