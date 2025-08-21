import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

// JWT密钥（应该从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // 从Authorization头获取token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'INVALID_TOKEN', message: 'Missing or invalid authorization header' }
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // 验证JWT token
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      }, { status: 401 })
    }

    // 查找用户
    const user = await db.user.findUnique({
      where: { id: payload.sub }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          status: user.status,
          role: user.role,
          email_verified: user.email_verified,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    })

  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get user info' }
    }, { status: 500 })
  }
}

// 验证JWT token
function verifyJWT(token: string): any {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}