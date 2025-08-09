'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Key, Settings, CheckCircle, AlertCircle, Cpu, Network } from 'lucide-react'

interface ApiConfig {
  zaiApiKey: string
  openaiApiKey: string
  ollamaBaseUrl: string
  ollamaModel: string
  defaultProvider: 'zai' | 'openai' | 'ollama'
}

interface OllamaModel {
  name: string
  modified_at: string
  size: number
}

export default function ApiConfigV2() {
  const [config, setConfig] = useState<ApiConfig>({
    zaiApiKey: '',
    openaiApiKey: '',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'llama2',
    defaultProvider: 'zai'
  })
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<{
    zai?: { success: boolean; message: string }
    openai?: { success: boolean; message: string }
    ollama?: { success: boolean; message: string }
  }>({})
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  useEffect(() => {
    loadConfig()
    loadOllamaModels()
  }, [])

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('apiConfig')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }

  const loadOllamaModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('http://localhost:11434/api/tags')
      if (response.ok) {
        const data = await response.json()
        setOllamaModels(data.models || [])
      }
    } catch (error) {
      console.log('Ollama not available or not running')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const saveConfig = () => {
    localStorage.setItem('apiConfig', JSON.stringify(config))
    // 更新环境变量（通过API）
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
  }

  const testApiConnection = async (provider: 'zai' | 'openai' | 'ollama') => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: provider === 'zai' ? config.zaiApiKey : 
                 provider === 'openai' ? config.openaiApiKey :
                 config.ollamaBaseUrl,
          model: provider === 'ollama' ? config.ollamaModel : undefined
        })
      })
      const result = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: result.success,
          message: result.message
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: '连接测试失败'
        }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = () => {
    saveConfig()
    setTestResults(prev => ({
      ...prev,
      save: {
        success: true,
        message: '配置已保存'
      }
    }))
    setTimeout(() => {
      setTestResults(prev => {
        const { save, ...rest } = prev
        return rest
      })
    }, 3000)
  }

  const handleRefreshOllamaModels = () => {
    loadOllamaModels()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          API 配置管理
        </CardTitle>
        <CardDescription>
          配置AI服务提供商，支持Z.ai、OpenAI和本地Ollama模型
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">服务配置</TabsTrigger>
            <TabsTrigger value="testing">连接测试</TabsTrigger>
            <TabsTrigger value="advanced">高级设置</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* 默认提供商选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">默认AI提供商</CardTitle>
                <CardDescription>
                  选择系统默认使用的AI服务提供商
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={config.defaultProvider} onValueChange={(value: any) => setConfig({...config, defaultProvider: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zai">Z.ai</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="ollama">Ollama (本地)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  当前默认: {config.defaultProvider === 'zai' ? 'Z.ai' : 
                           config.defaultProvider === 'openai' ? 'OpenAI' : 'Ollama'}
                </p>
              </CardContent>
            </Card>

            {/* Z.ai 配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Z.ai 配置
                </CardTitle>
                <CardDescription>
                  配置Z.ai API密钥以使用Z.ai服务
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="zaiApiKey">API 密钥</Label>
                  <Input
                    id="zaiApiKey"
                    type="password"
                    value={config.zaiApiKey}
                    onChange={(e) => setConfig({...config, zaiApiKey: e.target.value})}
                    placeholder="输入Z.ai API密钥"
                  />
                </div>
                <Button 
                  onClick={() => testApiConnection('zai')}
                  disabled={isTesting || !config.zaiApiKey}
                  variant="outline"
                >
                  {isTesting ? '测试中...' : '测试连接'}
                </Button>
                {testResults.zai && (
                  <Alert className={testResults.zai.success ? "border-green-200" : "border-red-200"}>
                    <AlertDescription className="flex items-center gap-2">
                      {testResults.zai.success ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      }
                      {testResults.zai.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* OpenAI 配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  OpenAI 配置
                </CardTitle>
                <CardDescription>
                  配置OpenAI API密钥以使用GPT模型
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="openaiApiKey">API 密钥</Label>
                  <Input
                    id="openaiApiKey"
                    type="password"
                    value={config.openaiApiKey}
                    onChange={(e) => setConfig({...config, openaiApiKey: e.target.value})}
                    placeholder="输入OpenAI API密钥"
                  />
                </div>
                <Button 
                  onClick={() => testApiConnection('openai')}
                  disabled={isTesting || !config.openaiApiKey}
                  variant="outline"
                >
                  {isTesting ? '测试中...' : '测试连接'}
                </Button>
                {testResults.openai && (
                  <Alert className={testResults.openai.success ? "border-green-200" : "border-red-200"}>
                    <AlertDescription className="flex items-center gap-2">
                      {testResults.openai.success ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      }
                      {testResults.openai.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Ollama 配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Ollama 配置
                </CardTitle>
                <CardDescription>
                  配置本地Ollama服务以使用开源模型
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ollamaBaseUrl">服务地址</Label>
                  <Input
                    id="ollamaBaseUrl"
                    value={config.ollamaBaseUrl}
                    onChange={(e) => setConfig({...config, ollamaBaseUrl: e.target.value})}
                    placeholder="http://localhost:11434"
                  />
                </div>
                <div>
                  <Label htmlFor="ollamaModel">模型选择</Label>
                  <div className="flex gap-2">
                    <Select value={config.ollamaModel} onValueChange={(value) => setConfig({...config, ollamaModel: value})}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingModels ? (
                          <SelectItem value="loading" disabled>加载中...</SelectItem>
                        ) : ollamaModels.length > 0 ? (
                          ollamaModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="llama2" disabled>llama2 (默认)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleRefreshOllamaModels}
                      variant="outline"
                      size="sm"
                    >
                      刷新
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ollamaModels.length > 0 ? 
                      `找到 ${ollamaModels.length} 个本地模型` : 
                      '未检测到Ollama服务，请确保Ollama正在运行'}
                  </p>
                </div>
                <Button 
                  onClick={() => testApiConnection('ollama')}
                  disabled={isTesting}
                  variant="outline"
                >
                  {isTesting ? '测试中...' : '测试连接'}
                </Button>
                {testResults.ollama && (
                  <Alert className={testResults.ollama.success ? "border-green-200" : "border-red-200"}>
                    <AlertDescription className="flex items-center gap-2">
                      {testResults.ollama.success ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      }
                      {testResults.ollama.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>连接状态</CardTitle>
                <CardDescription>
                  查看各AI服务的连接状态
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4" />
                      <span className="font-medium">Z.ai</span>
                      {testResults.zai && (
                        <Badge variant={testResults.zai.success ? "default" : "destructive"}>
                          {testResults.zai.success ? "正常" : "异常"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {testResults.zai ? testResults.zai.message : '未测试'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4" />
                      <span className="font-medium">OpenAI</span>
                      {testResults.openai && (
                        <Badge variant={testResults.openai.success ? "default" : "destructive"}>
                          {testResults.openai.success ? "正常" : "异常"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {testResults.openai ? testResults.openai.message : '未测试'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4" />
                      <span className="font-medium">Ollama</span>
                      {testResults.ollama && (
                        <Badge variant={testResults.ollama.success ? "default" : "destructive"}>
                          {testResults.ollama.success ? "正常" : "异常"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {testResults.ollama ? testResults.ollama.message : '未测试'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>高级设置</CardTitle>
                <CardDescription>
                  高级配置选项和调试信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>当前配置</Label>
                  <div className="p-3 bg-muted rounded-md text-sm font-mono">
                    <pre>{JSON.stringify(config, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <Label>系统信息</Label>
                  <div className="space-y-2 text-sm">
                    <p>• 默认提供商: {config.defaultProvider}</p>
                    <p>• Ollama模型数量: {ollamaModels.length}</p>
                    <p>• 配置状态: {Object.keys(config).filter(key => config[key as keyof ApiConfig]).length}/6 已配置</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            配置将保存在本地浏览器中
          </div>
          <Button onClick={handleSave}>
            保存配置
          </Button>
        </div>

        {testResults.save && (
          <Alert className="border-green-200">
            <AlertDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              {testResults.save.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}