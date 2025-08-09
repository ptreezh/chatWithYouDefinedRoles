import { NextRequest, NextResponse } from 'next/server'

// 本地模型配置
export interface LocalModel {
  id: string
  name: string
  provider: 'ollama' | 'lmstudio' | 'transformers'
  baseUrl: string
  apiKey?: string
  parameters: {
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }
}

// 默认本地模型配置
const defaultLocalModels: LocalModel[] = [
  {
    id: 'ollama-llama3',
    name: 'Llama 3 (Ollama)',
    provider: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    parameters: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  },
  {
    id: 'ollama-qwen',
    name: 'Qwen 7B Chat (Ollama)',
    provider: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    parameters: {
      temperature: 0.8,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  },
  {
    id: 'ollama-mistral',
    name: 'Mistral Instruct (Ollama)',
    provider: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    parameters: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  }
]

// 模型配置存储
let modelConfigs: LocalModel[] = [...defaultLocalModels]

export async function GET() {
  try {
    // 获取Ollama可用模型
    const ollamaResponse = await fetch('http://127.0.0.1:11434/api/tags')
    let availableModels = defaultLocalModels
    
    if (ollamaResponse.ok) {
      const ollamaData = await ollamaResponse.json()
      
      // 更新可用模型列表
      availableModels = ollamaData.models.map((model: any) => ({
        id: `ollama-${model.name.replace(':', '-')}`,
        name: `${model.name} (Ollama)`,
        provider: 'ollama' as const,
        baseUrl: 'http://127.0.0.1:11434',
        parameters: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      }))
      
      // 更新配置
      modelConfigs = availableModels
    }
    
    return NextResponse.json({
      success: true,
      models: modelConfigs,
      availableModels: availableModels,
      defaultModels: defaultLocalModels,
      count: modelConfigs.length
    })
    
  } catch (error) {
    console.error('获取本地模型列表失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      models: defaultLocalModels,
      count: defaultLocalModels.length,
      message: '无法连接到本地模型服务，显示默认配置'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, modelId, config } = await request.json()
    
    switch (action) {
      case 'update':
        // 更新模型配置
        const modelIndex = modelConfigs.findIndex(m => m.id === modelId)
        if (modelIndex === -1) {
          return NextResponse.json({
            error: 'Model not found'
          }, { status: 404 })
        }
        
        modelConfigs[modelIndex] = { ...modelConfigs[modelIndex], ...config }
        break
        
      case 'add':
        // 添加新模型
        const newModel: LocalModel = {
          id: config.id || `custom-${Date.now()}`,
          name: config.name,
          provider: config.provider || 'ollama',
          baseUrl: config.baseUrl || 'http://127.0.0.1:11434',
          parameters: {
            temperature: 0.7,
            maxTokens: 2048,
            topP: 0.9,
            frequencyPenalty: 0,
            presencePenalty: 0,
            ...config.parameters
          }
        }
        
        modelConfigs.push(newModel)
        break
        
      case 'remove':
        // 移除模型
        modelConfigs = modelConfigs.filter(m => m.id !== modelId)
        break
        
      case 'test':
        // 测试模型连接
        const testModel = modelConfigs.find(m => m.id === modelId)
        if (!testModel) {
          return NextResponse.json({
            error: 'Model not found'
          }, { status: 404 })
        }
        
        const testResponse = await fetch(`${testModel.baseUrl}/api/tags`)
        return NextResponse.json({
          success: testResponse.ok,
          model: testModel,
          status: testResponse.ok ? 'connected' : 'disconnected'
        })
        
      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      models: modelConfigs,
      action: action
    })
    
  } catch (error) {
    console.error('模型配置操作失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}