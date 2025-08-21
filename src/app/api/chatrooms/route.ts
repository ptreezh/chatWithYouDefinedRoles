import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

export async function GET(request: NextRequest) {
  try {
    // 认证用户
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 })
    }

    // 获取用户的所有聊天室
    const chatRooms = await db.chatRoom.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: { chatRooms } 
    })

  } catch (error) {
    console.error('Error fetching chat rooms:', error)
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch chat rooms' }
    }, { status: 500 })
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

    const { name, theme } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VALIDATION_ERROR', message: 'Chat room name is required' }
      }, { status: 400 })
    }

    // 创建聊天室
    const chatRoom = await db.chatRoom.create({
      data: {
        name: name.trim(),
        theme: theme || null,
        userId: user.id,
        isActive: true
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Chat room created successfully',
      data: { chatRoom }
    })

  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create chat room' }
    }, { status: 500 })
  }
}