import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }

    // 检查数据库连接
    try {
      await db.$queryRaw`SELECT 1`
      health.database = 'connected'
      
      // 获取基本统计信息
      const characterCount = await db.character.count()
      const messageCount = await db.message.count()
      const themeCount = await db.character.groupBy({
        by: ['theme'],
        _count: { theme: true }
      })

      health.stats = {
        characters: characterCount,
        messages: messageCount,
        themes: themeCount.length
      }
    } catch (error) {
      health.database = 'disconnected'
      health.databaseError = error.message
    }

    // 检查Ollama服务
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(5000) // 5秒超时
      })
      
      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json()
        health.ollama = {
          status: 'connected',
          models: ollamaData.models?.length || 0,
          available: ollamaData.models?.map(m => m.name) || []
        }
      } else {
        health.ollama = {
          status: 'error',
          error: `HTTP ${ollamaResponse.status}`
        }
      }
    } catch (error) {
      health.ollama = {
        status: 'disconnected',
        error: error.message
      }
    }

    // 检查API配置
    try {
      const configPath = path.join(process.cwd(), 'config', 'api-config-user.json')
      const configExists = existsSync(configPath)
      
      if (configExists) {
        const configData = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(configData)
        
        health.apiConfig = {
          zaiConfigured: !!config.zaiApiKey,
          openaiConfigured: !!config.openaiApiKey,
          ollamaConfigured: !!config.ollamaBaseUrl
        }
      } else {
        health.apiConfig = {
          zaiConfigured: false,
          openaiConfigured: false,
          ollamaConfigured: false
        }
      }
    } catch (error) {
      health.apiConfig = {
        error: error.message
      }
    }

    // 检查存储目录
    try {
      const storagePaths = [
        path.join(process.cwd(), 'storage', 'memory_banks'),
        path.join(process.cwd(), 'characters', 'themes'),
        path.join(process.cwd(), 'characters', 'categories')
      ]
      
      const storageStatus = {}
      for (const storagePath of storagePaths) {
        try {
          await fs.access(storagePath)
          const files = await fs.readdir(storagePath)
          storageStatus[path.basename(storagePath)] = {
            status: 'accessible',
            fileCount: files.length
          }
        } catch (error) {
          storageStatus[path.basename(storagePath)] = {
            status: 'inaccessible',
            error: error.message
          }
        }
      }
      
      health.storage = storageStatus
    } catch (error) {
      health.storage = {
        error: error.message
      }
    }

    // 确定整体健康状态
    const criticalServices = ['database']
    const optionalServices = ['ollama']
    
    const criticalFailed = criticalServices.filter(service => 
      health[service] === 'disconnected' || health[service]?.status === 'disconnected'
    ).length
    
    if (criticalFailed > 0) {
      health.status = 'unhealthy'
    } else if (health.ollama?.status === 'disconnected') {
      health.status = 'degraded'
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 })
  }
}