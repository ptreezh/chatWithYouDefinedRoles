'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Key, Settings, CheckCircle, AlertCircle } from 'lucide-react'

interface ApiConfig {
  zaiApiKey: string
  openaiApiKey: string
}

export default function ApiConfig() {
  const [config, setConfig] = useState<ApiConfig>({
    zaiApiKey: '',
    openaiApiKey: ''
  })
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<{
    zai?: { success: boolean; message: string }
    openai?: { success: boolean; message: string }
  }>({})

  useEffect(() => {
    // 从localStorage加载配置
    const savedConfig = localStorage.getItem('apiConfig')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }, [])

  const saveConfig = () => {
    localStorage.setItem('apiConfig', JSON.stringify(config))
    // 更新环境变量（通过API）
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
  }

  const testApiConnection = async (provider: 'zai' | 'openai') => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: provider === 'zai' ? config.zaiApiKey : config.openaiApiKey
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
    // 显示保存成功提示
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          API配置
        </CardTitle>
        <CardDescription>
          配置您的AI服务API密钥以启用完整的聊天功能
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="zai" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="zai">Z.ai API</TabsTrigger>
            <TabsTrigger value="openai">OpenAI API</TabsTrigger>
          </TabsList>
          
          <TabsContent value="zai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zai-key">Z.ai API密钥</Label>
              <Input
                id="zai-key"
                type="password"
                placeholder="输入您的Z.ai API密钥"
                value={config.zaiApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, zaiApiKey: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                访问 <a href="https://z.ai" target="_blank" rel="noopener noreferrer" className="underline">Z.ai官网</a> 获取您的API密钥
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => testApiConnection('zai')}
                disabled={!config.zaiApiKey || isTesting}
                variant="outline"
                size="sm"
              >
                {isTesting ? '测试中...' : '测试连接'}
              </Button>
              
              {testResults.zai && (
                <Badge variant={testResults.zai.success ? "default" : "destructive"}>
                  {testResults.zai.success ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> 成功</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> 失败</>
                  )}
                </Badge>
              )}
            </div>
            
            {testResults.zai && (
              <Alert>
                <AlertDescription>{testResults.zai.message}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="openai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API密钥</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="输入您的OpenAI API密钥"
                value={config.openaiApiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                访问 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI控制台</a> 获取您的API密钥
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => testApiConnection('openai')}
                disabled={!config.openaiApiKey || isTesting}
                variant="outline"
                size="sm"
              >
                {isTesting ? '测试中...' : '测试连接'}
              </Button>
              
              {testResults.openai && (
                <Badge variant={testResults.openai.success ? "default" : "destructive"}>
                  {testResults.openai.success ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> 成功</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> 失败</>
                  )}
                </Badge>
              )}
            </div>
            
            {testResults.openai && (
              <Alert>
                <AlertDescription>{testResults.openai.message}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div>
              {testResults.save && (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {testResults.save.message}
                </Badge>
              )}
            </div>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              保存配置
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">使用说明</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 至少需要配置一个有效的API密钥</li>
            <li>• Z.ai API是推荐的主要服务</li>
            <li>• OpenAI API可作为备用服务</li>
            <li>• 配置保存后需要重启应用才能生效</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}