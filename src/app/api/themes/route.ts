import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// 获取所有主题
export async function GET() {
  try {
    const themesPath = path.join(process.cwd(), 'characters', 'themes')
    
    try {
      const themes = await fs.readdir(themesPath)
      const themeInfo = []
      
      for (const theme of themes) {
        const themePath = path.join(themesPath, theme)
        const stats = await fs.stat(themePath)
        
        if (stats.isDirectory()) {
          const files = await fs.readdir(themePath)
          const characterFiles = files.filter(file => 
            file.endsWith('.txt') || file.endsWith('.json') || file.endsWith('.md')
          )
          
          themeInfo.push({
            name: theme,
            characterCount: characterFiles.length,
            createdAt: stats.birthtime,
            lastModified: stats.mtime
          })
        }
      }
      
      return NextResponse.json({
        themes: themeInfo.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      })
    } catch {
      return NextResponse.json({ themes: [] })
    }
    
  } catch (error) {
    console.error('Error getting themes:', error)
    return NextResponse.json({ error: 'Failed to get themes' }, { status: 500 })
  }
}

// 创建新主题
export async function POST(request: NextRequest) {
  try {
    const { themeName } = await request.json()
    
    if (!themeName) {
      return NextResponse.json({ error: 'Theme name is required' }, { status: 400 })
    }
    
    // 清理主题名称，移除特殊字符
    const cleanThemeName = themeName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    const themePath = path.join(process.cwd(), 'characters', 'themes', cleanThemeName)
    
    try {
      await fs.mkdir(themePath, { recursive: true })
      
      return NextResponse.json({
        success: true,
        theme: {
          name: cleanThemeName,
          characterCount: 0,
          createdAt: new Date(),
          lastModified: new Date()
        }
      })
    } catch (error) {
      if (error.code === 'EEXIST') {
        return NextResponse.json({ error: 'Theme already exists' }, { status: 400 })
      }
      throw error
    }
    
  } catch (error) {
    console.error('Error creating theme:', error)
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 })
  }
}

// 删除主题
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const themeName = searchParams.get('theme')
    
    if (!themeName) {
      return NextResponse.json({ error: 'Theme name is required' }, { status: 400 })
    }
    
    const themePath = path.join(process.cwd(), 'characters', 'themes', themeName)
    
    try {
      await fs.rm(themePath, { recursive: true, force: true })
      
      return NextResponse.json({
        success: true,
        message: `Theme '${themeName}' deleted successfully`
      })
    } catch (error) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
      }
      throw error
    }
    
  } catch (error) {
    console.error('Error deleting theme:', error)
    return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 })
  }
}