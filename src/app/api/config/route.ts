import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import path from 'path'

// 配置文件路径
const CONFIG_FILE_PATH = path.join(process.cwd(), 'api-config-user.json')

// 读取配置
function readConfig() {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const configData = readFileSync(CONFIG_FILE_PATH, 'utf-8')
      return JSON.parse(configData)
    }
  } catch (error) {
    console.error('Error reading config file:', error)
  }
  return {}
}

// 写入配置
function writeConfig(config: any) {
  try {
    writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2))
    // 同时更新环境变量
    if (config.zaiApiKey) {
      process.env.ZAI_API_KEY = config.zaiApiKey
    }
    if (config.openaiApiKey) {
      process.env.OPENAI_API_KEY = config.openaiApiKey
    }
    
    // 如果配置了ZAI API密钥，同时创建.z-ai-config文件供ZAI SDK使用
    if (config.zaiApiKey && config.zaiApiKey !== 'demo-key-for-testing') {
      const zaiConfigPath = path.join(process.cwd(), '.z-ai-config')
      const zaiConfig = {
        baseUrl: 'https://api.z.ai/v1',
        apiKey: config.zaiApiKey,
        chatId: config.chatId || '',
        userId: config.userId || ''
      }
      
      try {
        writeFileSync(zaiConfigPath, JSON.stringify(zaiConfig, null, 2))
        console.log('ZAI配置文件已创建:', zaiConfigPath)
      } catch (writeError) {
        console.error('创建ZAI配置文件失败:', writeError)
      }
    }
  } catch (error) {
    console.error('Error writing config file:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { zaiApiKey, openaiApiKey } = await request.json()
    
    console.log('收到API配置请求:', {
      zaiApiKey: zaiApiKey ? '已提供' : '未提供',
      openaiApiKey: openaiApiKey ? '已提供' : '未提供',
      zaiKeyLength: zaiApiKey ? zaiApiKey.length : 0,
      openaiKeyLength: openaiApiKey ? openaiApiKey.length : 0
    })
    
    // 读取现有配置
    const config = readConfig()
    console.log('当前配置:', {
      hasZaiKey: !!config.zaiApiKey,
      hasOpenAIKey: !!config.openaiApiKey,
      isDemo: config.zaiApiKey === 'demo-key-for-testing'
    })
    
    // 更新配置
    if (zaiApiKey !== undefined) {
      config.zaiApiKey = zaiApiKey
      process.env.ZAI_API_KEY = zaiApiKey
    }
    if (openaiApiKey !== undefined) {
      config.openaiApiKey = openaiApiKey
      process.env.OPENAI_API_KEY = openaiApiKey
    }
    
    // 保存配置
    writeConfig(config)
    
    console.log('配置已更新:', {
      zaiConfigured: !!config.zaiApiKey && config.zaiApiKey !== 'demo-key-for-testing',
      openaiConfigured: !!config.openaiApiKey && config.openaiApiKey !== 'demo-openai-key-for-testing',
      isDemo: config.zaiApiKey === 'demo-key-for-testing'
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'API配置已更新' 
    })
  } catch (error) {
    console.error('Error updating API config:', error)
    return NextResponse.json(
      { success: false, message: '更新配置失败' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const config = readConfig()
    
    // 如果配置文件中有值，也更新到环境变量
    if (config.zaiApiKey) {
      process.env.ZAI_API_KEY = config.zaiApiKey
    }
    if (config.openaiApiKey) {
      process.env.OPENAI_API_KEY = config.openaiApiKey
    }
    
    const status = {
      zaiConfigured: !!config.zaiApiKey && config.zaiApiKey !== 'demo-key-for-testing',
      openaiConfigured: !!config.openaiApiKey && config.openaiApiKey !== 'demo-openai-key-for-testing',
      isDemo: config.zaiApiKey === 'demo-key-for-testing'
    }
    
    console.log('API配置状态查询:', status)
    console.log('配置文件内容:', {
      zaiApiKey: config.zaiApiKey ? '已设置' : '未设置',
      openaiApiKey: config.openaiApiKey ? '已设置' : '未设置',
      zaiIsDemo: config.zaiApiKey === 'demo-key-for-testing',
      openaiIsDemo: config.openaiApiKey === 'demo-openai-key-for-testing'
    })
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting config:', error)
    return NextResponse.json(
      { success: false, message: '获取配置失败' },
      { status: 500 }
    )
  }
}