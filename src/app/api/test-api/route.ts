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

// 创建ZAI配置文件
function createZaiConfig(apiKey: string) {
  try {
    const zaiConfigPath = path.join(process.cwd(), '.z-ai-config')
    const zaiConfig = {
      baseUrl: 'https://api.z.ai/v1',
      apiKey: apiKey,
      chatId: '',
      userId: ''
    }
    
    writeFileSync(zaiConfigPath, JSON.stringify(zaiConfig, null, 2))
    console.log('ZAI配置文件已创建:', zaiConfigPath)
    return true
  } catch (error) {
    console.error('创建ZAI配置文件失败:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'API密钥不能为空' 
      })
    }

    if (provider === 'zai') {
      // 测试Z.ai API
      try {
        // 先创建ZAI配置文件
        if (!createZaiConfig(apiKey)) {
          return NextResponse.json({ 
            success: false, 
            message: '创建ZAI配置文件失败' 
          })
        }
        
        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const zai = await ZAI.create()
        
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'user', content: '请回复"连接测试成功"' }
          ],
          max_tokens: 10
        })
        
        if (completion.choices && completion.choices[0] && completion.choices[0].message) {
          return NextResponse.json({ 
            success: true, 
            message: 'Z.ai API连接成功',
            response: completion.choices[0].message.content
          })
        } else {
          return NextResponse.json({ 
            success: false, 
            message: 'Z.ai API响应格式异常' 
          })
        }
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          message: `Z.ai API连接失败: ${error.message}` 
        })
      }
    } else if (provider === 'openai') {
      // 测试OpenAI API
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: '请回复"连接测试成功"' }],
            max_tokens: 10
          })
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({ 
            success: true, 
            message: 'OpenAI API连接成功',
            response: data.choices[0]?.message?.content
          })
        } else {
          const errorData = await response.json()
          return NextResponse.json({ 
            success: false, 
            message: `OpenAI API连接失败: ${errorData.error?.message || response.status}` 
          })
        }
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          message: `OpenAI API连接失败: ${error.message}` 
        })
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: '不支持的API提供商' 
    })
  } catch (error) {
    console.error('Error testing API:', error)
    return NextResponse.json(
      { success: false, message: 'API测试失败' },
      { status: 500 }
    )
  }
}