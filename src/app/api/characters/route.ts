import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MemoryBankManager } from '@/lib/memory-bank'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('file') as File[]
    const theme = formData.get('theme') as string || 'default'
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = []
    
    // 创建主题目录（如果指定了主题）
    let themeDir = 'custom'
    if (theme && theme !== 'default') {
      themeDir = `themes/${theme}`
    }
    const themePath = path.join(process.cwd(), 'characters', 'categories', themeDir)
    try {
      await fs.mkdir(themePath, { recursive: true })
    } catch (error) {
      console.error('Error creating theme directory:', error)
    }
    
    for (const file of files) {
      try {
        // 读取文件内容
        const content = await file.text()
        
        // 提取角色名称（使用文件名）
        const characterName = file.name.replace(/\.[^/.]+$/, '') // 移除文件扩展名
        
        // 保存角色文件到对应目录
        const fileName = file.name
        const filePath = path.join(process.cwd(), 'characters', 'categories', themeDir, fileName)
        
        // 确保目录存在
        const dirPath = path.dirname(filePath)
        console.log('Creating directory:', dirPath)
        await fs.mkdir(dirPath, { recursive: true })
        
        console.log('Writing file to:', filePath)
        await fs.writeFile(filePath, content, 'utf-8')
        
        // 创建角色记录
        const character = await db.character.create({
          data: {
            name: characterName,
            systemPrompt: content,
            participationLevel: 0.7,
            interestThreshold: 0.3,
            isActive: true,
            category: theme === 'default' ? 'custom' : 'theme',
            theme: theme,
            filePath: `${themeDir}/${fileName}`
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

        results.push({
          success: true,
          character: {
            ...character,
            memoryBank
          }
        })
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        results.push({
          success: false,
          fileName: file.name,
          error: error.message
        })
      }
    }

    const successfulUploads = results.filter(r => r.success)
    const failedUploads = results.filter(r => !r.success)

    return NextResponse.json({ 
      message: `Processed ${files.length} files. ${successfulUploads.length} successful, ${failedUploads.length} failed.`,
      results: {
        successful: successfulUploads,
        failed: failedUploads
      }
    })

  } catch (error) {
    console.error('Error uploading characters:', error)
    return NextResponse.json({ 
      error: 'Failed to upload characters' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const theme = searchParams.get('theme')
    
    let whereClause = { isActive: true }
    if (theme) {
      whereClause = { isActive: true, theme: theme }
    }
    
    const characters = await db.character.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ characters })
  } catch (error) {
    console.error('Error fetching characters:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch characters' 
    }, { status: 500 })
  }
}