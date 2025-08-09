import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { chatRoomId } = await request.json()
    
    if (!chatRoomId) {
      return NextResponse.json({ 
        success: false, 
        message: '聊天室ID不能为空' 
      }, { status: 400 })
    }

    // 删除聊天室中的所有消息
    await db.message.deleteMany({
      where: { chatRoomId }
    })

    return NextResponse.json({ 
      success: true, 
      message: '聊天记录已清空' 
    })
  } catch (error) {
    console.error('Error clearing chat:', error)
    return NextResponse.json(
      { success: false, message: '清空聊天记录失败' },
      { status: 500 }
    )
  }
}