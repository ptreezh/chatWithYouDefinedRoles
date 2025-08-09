import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

// 获取所有角色分类
export async function GET() {
  try {
    const categories = [
      {
        id: 'professional',
        name: '专业领域',
        description: 'AI专家、创业者、科技专家等专业人士',
        count: 0
      },
      {
        id: 'entertainment',
        name: '娱乐',
        description: '艺术家、演员等娱乐行业角色',
        count: 0
      },
      {
        id: 'education',
        name: '教育',
        description: '哲学家、教师等教育相关角色',
        count: 0
      },
      {
        id: 'custom',
        name: '自定义',
        description: '用户自定义的各种角色',
        count: 0
      }
    ]

    // 获取数据库中每个分类的角色数量
    const characterCounts = await db.character.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    })

    // 更新分类计数
    characterCounts.forEach(count => {
      const category = categories.find(c => c.id === count.category)
      if (category) {
        category.count = count._count.id
      }
    })

    // 获取文件系统中的角色文件
    const categoriesPath = path.join(process.cwd(), 'characters', 'categories')
    const fileCounts: { [key: string]: number } = {}

    for (const category of categories) {
      try {
        const categoryPath = path.join(categoriesPath, category.id)
        const files = await fs.readdir(categoryPath)
        const characterFiles = files.filter(file => 
          file.endsWith('.txt') || file.endsWith('.json') || file.endsWith('.md')
        )
        fileCounts[category.id] = characterFiles.length
      } catch {
        fileCounts[category.id] = 0
      }
    }

    return NextResponse.json({
      categories: categories.map(cat => ({
        ...cat,
        fileCount: fileCounts[cat.id] || 0
      }))
    })

  } catch (error) {
    console.error('Error getting categories:', error)
    return NextResponse.json({ error: 'Failed to get categories' }, { status: 500 })
  }
}

// 获取指定分类的角色文件
export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json()
    
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const categoryPath = path.join(process.cwd(), 'characters', 'categories', category)
    
    try {
      const files = await fs.readdir(categoryPath)
      const characterFiles = files.filter(file => 
        file.endsWith('.txt') || file.endsWith('.json') || file.endsWith('.md')
      )

      const characterList = []
      
      for (const file of characterFiles) {
        const filePath = path.join(categoryPath, file)
        const stats = await fs.stat(filePath)
        
        characterList.push({
          name: path.basename(file, path.extname(file)),
          fileName: file,
          extension: path.extname(file),
          size: stats.size,
          createdAt: stats.birthtime,
          category: category
        })
      }

      return NextResponse.json({
        category,
        characters: characterList.sort((a, b) => a.name.localeCompare(b.name))
      })

    } catch {
      return NextResponse.json({
        category,
        characters: []
      })
    }

  } catch (error) {
    console.error('Error getting category characters:', error)
    return NextResponse.json({ error: 'Failed to get category characters' }, { status: 500 })
  }
}