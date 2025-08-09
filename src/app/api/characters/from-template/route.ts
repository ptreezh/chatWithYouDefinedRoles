import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MemoryBankManager } from '@/lib/memory-bank'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { category, fileName } = await request.json()
    
    if (!category || !fileName) {
      return NextResponse.json({ error: 'Category and fileName are required' }, { status: 400 })
    }

    // 构建角色文件路径
    const characterFilePath = path.join(process.cwd(), 'characters', 'categories', category, fileName)
    
    // 检查文件是否存在
    try {
      await fs.access(characterFilePath)
    } catch {
      return NextResponse.json({ error: 'Character file not found' }, { status: 404 })
    }

    // 读取文件内容
    const content = await fs.readFile(characterFilePath, 'utf-8')
    
    // 提取角色名称（使用文件名）
    const characterName = path.basename(fileName, path.extname(fileName))
    
    // 创建角色记录
    const character = await db.character.create({
      data: {
        name: characterName,
        systemPrompt: content,
        participationLevel: 0.7,
        interestThreshold: 0.3,
        isActive: true,
        category: category
      }
    })

    // 创建Memory Bank
    const memoryBankManager = new MemoryBankManager()
    await memoryBankManager.initializeStorage()
    
    const memoryBank = await memoryBankManager.createMemoryBank(
      character.id,
      character.name,
      character.systemPrompt
    )

    return NextResponse.json({
      id: character.id,
      name: character.name,
      systemPrompt: character.systemPrompt,
      participationLevel: character.participationLevel,
      interestThreshold: character.interestThreshold,
      isActive: character.isActive,
      category: character.category,
      createdAt: character.createdAt
    })

  } catch (error) {
    console.error('Error creating character from template:', error)
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
}