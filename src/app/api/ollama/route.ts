import { NextRequest, NextResponse } from 'next/server'

// Ollama API配置（优先环境变量）
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest'

export async function GET() {
  try {
    // 获取本地Ollama模型列表
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 格式化模型列表
    const models = data.models.map((model: any) => ({
      name: model.name,
      modified_at: model.modified_at,
      size: model.size
    }))
    
    return NextResponse.json({
      success: true,
      models: models,
      count: models.length,
      baseUrl: OLLAMA_BASE_URL,
      defaultModel: DEFAULT_MODEL
    })
    
  } catch (error) {
    console.error('获取Ollama模型列表失败:', error)
    
    // 如果Ollama不可用，返回一些默认模型
    const defaultModels = [
      { name: DEFAULT_MODEL, modified_at: new Date().toISOString(), size: 0 },
      { name: 'qwen:7b-chat', modified_at: new Date().toISOString(), size: 0 },
      { name: 'mistral:instruct', modified_at: new Date().toISOString(), size: 0 }
    ]
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      models: defaultModels,
      count: defaultModels.length,
      message: 'Ollama服务不可用，显示默认模型列表',
      baseUrl: OLLAMA_BASE_URL,
      defaultModel: DEFAULT_MODEL
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { model, prompt, options = {} } = await request.json()
    
    const finalModel = model || DEFAULT_MODEL

    if (!finalModel || !prompt) {
      return NextResponse.json({
        error: 'Model and prompt are required'
      }, { status: 400 })
    }
    
    // 调用Ollama生成API
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: finalModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          ...options
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Ollama generation error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      response: data.response,
      model: finalModel,
      done: data.done,
      total_duration: data.total_duration,
      load_duration: data.load_duration,
      baseUrl: OLLAMA_BASE_URL
    })
    
  } catch (error) {
    console.error('Ollama生成失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      baseUrl: OLLAMA_BASE_URL,
      defaultModel: DEFAULT_MODEL
    }, { status: 500 })
  }
}