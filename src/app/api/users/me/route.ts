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
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user profile' }
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 认证用户
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 })
    }

    const { name, avatar } = await request.json()

    // 只允许更新特定字段
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar

    // 更新用户信息
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          status: updatedUser.status,
          role: updatedUser.role,
          email_verified: updatedUser.email_verified,
          last_login_at: updatedUser.last_login_at,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      }
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update user profile' }
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 认证用户
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 })
    }

    // 删除用户的所有相关数据（级联删除）
    await db.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'User account deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user account' }
    }, { status: 500 })
  }
}