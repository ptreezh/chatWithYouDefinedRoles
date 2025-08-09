'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LocalModel {
  id: string
  name: string
  provider: 'ollama' | 'lmstudio' | 'transformers'
  baseUrl: string
  parameters: {
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }
}

interface ModelConfigProps {
  onModelSelect?: (model: LocalModel) => void
  selectedModel?: string
}

export function ModelConfig({ onModelSelect, selectedModel }: ModelConfigProps) {
  const [models, setModels] = useState<LocalModel[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newModel, setNewModel] = useState({
    name: '',
    baseUrl: 'http://127.0.0.1:11434',
    provider: 'ollama' as const
  })

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    console.log('[BUILD DEBUG] Starting models load...')
    try {
      console.log('[BUILD DEBUG] Fetching from /api/models')
      const response = await fetch('/api/models')
      console.log('[BUILD DEBUG] /api/models response status:', response.status)
      const data = await response.json()
      console.log('[BUILD DEBUG] /api/models response data:', data)
      
      if (data.success) {
        setModels(data.models || [])
        setAvailableModels(data.availableModels || [])
      }
    } catch (error) {
      console.error('[BUILD DEBUG] 加载模型失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const testModel = async (modelId: string) => {
    setTesting(modelId)
    console.log('[BUILD DEBUG] Testing model:', modelId)
    try {
      console.log('[BUILD DEBUG] POST to /api/models with test action')
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', modelId })
      })
      console.log('[BUILD DEBUG] /api/models test response status:', response.status)
      
      const data = await response.json()
      console.log('[BUILD DEBUG] /api/models test response data:', data)
      setTestResults(prev => ({
        ...prev,
        [modelId]: data.success
      }))
    } catch (error) {
      console.error('[BUILD DEBUG] Model test failed:', error)
      setTestResults(prev => ({
        ...prev,
        [modelId]: false
      }))
    } finally {
      setTesting(null)
    }
  }

  const handleModelSelect = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      onModelSelect?.(model)
    }
  }

  const updateModelParameter = (modelId: string, param: string, value: any) => {
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, parameters: { ...model.parameters, [param]: value } }
        : model
    ))
  }

  const saveModelConfig = async (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (!model) return

    console.log('[BUILD DEBUG] Saving model config for:', modelId)
    try {
      console.log('[BUILD DEBUG] POST to /api/models with update action')
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', modelId, config: model })
      })
      console.log('[BUILD DEBUG] /api/models update response status:', response.status)
      
      if (response.ok) {
        console.log('[BUILD DEBUG] Model config saved successfully')
      }
    } catch (error) {
      console.error('[BUILD DEBUG] 保存模型配置失败:', error)
    }
  }

  const addCustomModel = async () => {
    if (!newModel.name) return

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          config: newModel 
        })
      })
      
      if (response.ok) {
        setShowAddForm(false)
        setNewModel({
          name: '',
          baseUrl: 'http://127.0.0.1:11434',
          provider: 'ollama'
        })
        loadModels()
      }
    } catch (error) {
      console.error('添加模型失败:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">加载模型配置中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>本地模型配置</CardTitle>
          <CardDescription>
            选择和配置本地部署的AI模型
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 模型选择 */}
          <div className="space-y-2">
            <Label>选择模型</Label>
            <Select value={selectedModel} onValueChange={handleModelSelect}>
              <SelectTrigger>
                <SelectValue placeholder="选择一个模型" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <Badge variant="outline">{model.provider}</Badge>
                      {testResults[model.id] === true && (
                        <Badge variant="default" className="bg-green-500">已连接</Badge>
                      )}
                      {testResults[model.id] === false && (
                        <Badge variant="destructive">连接失败</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 模型列表 */}
          <div className="space-y-4">
            {models.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{model.name}</h3>
                    <p className="text-sm text-muted-foreground">{model.baseUrl}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testModel(model.id)}
                      disabled={testing === model.id}
                    >
                      {testing === model.id ? '测试中...' : '测试连接'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveModelConfig(model.id)}
                    >
                      保存
                    </Button>
                  </div>
                </div>

                {/* 参数配置 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>温度 (Temperature)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={model.parameters.temperature}
                      onChange={(e) => updateModelParameter(model.id, 'temperature', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>最大令牌 (Max Tokens)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="8192"
                      value={model.parameters.maxTokens}
                      onChange={(e) => updateModelParameter(model.id, 'maxTokens', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Top P</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={model.parameters.topP}
                      onChange={(e) => updateModelParameter(model.id, 'topP', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>频率惩罚</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={model.parameters.frequencyPenalty}
                      onChange={(e) => updateModelParameter(model.id, 'frequencyPenalty', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* 添加自定义模型 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">添加自定义模型</h3>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? '取消' : '添加模型'}
              </Button>
            </div>

            {showAddForm && (
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>模型名称</Label>
                    <Input
                      placeholder="例如: My Custom Model"
                      value={newModel.name}
                      onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>服务地址</Label>
                    <Input
                      placeholder="http://127.0.0.1:11434"
                      value={newModel.baseUrl}
                      onChange={(e) => setNewModel(prev => ({ ...prev, baseUrl: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={addCustomModel}>
                    添加模型
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* 状态信息 */}
          {availableModels.length > 0 && (
            <Alert>
              <AlertDescription>
                检测到 {availableModels.length} 个本地Ollama模型可用。
                请确保Ollama服务正在运行 (http://127.0.0.1:11434)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}