import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { existsSync, unlinkSync } from 'fs'
import path from 'path'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.systemPrompt !== undefined) updateData.systemPrompt = body.systemPrompt
    if (body.participationLevel !== undefined) updateData.participationLevel = body.participationLevel
    if (body.interestThreshold !== undefined) updateData.interestThreshold = body.interestThreshold
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedCharacter = await db.character.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true, 
      character: updatedCharacter 
    })
  } catch (error) {
    console.error('Error updating character:', error)
    return NextResponse.json(
      { success: false, message: '更新角色失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 删除角色的记忆银行文件
    const character = await db.character.findUnique({
      where: { id }
    })

    if (character?.memoryBankPath) {
      try {
        if (existsSync(character.memoryBankPath)) {
          unlinkSync(character.memoryBankPath)
        }
      } catch (error) {
        console.error('Error deleting memory bank file:', error)
      }
    }

    // 删除角色
    await db.character.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      message: '角色已删除' 
    })
  } catch (error) {
    console.error('Error deleting character:', error)
    return NextResponse.json(
      { success: false, message: '删除角色失败' },
      { status: 500 }
    )
  }
}