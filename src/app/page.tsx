'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bot, User, Upload, MessageSquare, Settings, Trash2, Key, Users } from 'lucide-react'
import ApiConfigV2 from '@/components/api-config-v2'
import CharacterManager from '@/components/character-manager'
import { ThemeManager } from '@/components/theme-manager'

import { getToken } from '@/lib/auth';

interface Character {
  id: string
  name: string
  systemPrompt: string
  avatar?: string
  modelConfig?: string
  participationLevel: number
  interestThreshold: number
  isActive: boolean
}

interface Message {
  id: string
  content: string
  senderType: 'user' | 'character' | 'system'
  senderId?: string
  character?: Character
  createdAt: string
  interestScore?: number
  participationReason?: string
}

import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [chatTheme, setChatTheme] = useState('')
  const [chatRoom, setChatRoom] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTopic, setCurrentTopic] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTheme, setCurrentTheme] = useState('default')
  const [apiStatus, setApiStatus] = useState({
    zaiConfigured: false,
    openaiConfigured: false,
    ollamaConfigured: false,
    isDemo: false
  })

  // 死循环检测相关状态
  const [recentReplies, setRecentReplies] = useState<string[]>([])
  const [temperatureOverride, setTemperatureOverride] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
    }
  }, [router]);
  
  // 自动滚动相关
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // 监听消息变化，自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初始化聊天室
  useEffect(() => {
    const initializeChat = async () => {
      console.log('[BUILD DEBUG] Starting chat initialization...')
      try {
        console.log('[BUILD DEBUG] Fetching from /api/init')
        const response = await fetch('/api/init')
        console.log('[BUILD DEBUG] /api/init response status:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('[BUILD DEBUG] /api/init response data:', data)
          setChatRoom(data.chatRoom)
          setCharacters(data.characters)
          setMessages(data.messages)
          setChatTheme(data.chatRoom.theme || '')
          
          // 如果是演示模式，设置状态
          if (data.isDemo) {
            setApiStatus(prev => ({ ...prev, isDemo: true }))
          }
        } else {
          console.log('[BUILD DEBUG] /api/init response not ok:', response.statusText)
        }
      } catch (error) {
        console.error('[BUILD DEBUG] Error initializing chat:', error)
        
        // 如果完全无法连接，设置演示模式
        setApiStatus(prev => ({ ...prev, isDemo: true }))
        setChatRoom({
          id: 'default-room-id',
          name: '默认聊天室',
          theme: '通用聊天'
        })
      }
    }

    const checkApiStatus = async () => {
      console.log('[BUILD DEBUG] Starting API status check...')
      try {
        console.log('[BUILD DEBUG] Fetching from /api/config')
        const response = await fetch('/api/config')
        console.log('[BUILD DEBUG] /api/config response status:', response.status)
        if (response.ok) {
          const status = await response.json()
          console.log('[BUILD DEBUG] /api/config response data:', status)
          setApiStatus(status)
        } else {
          console.log('[BUILD DEBUG] /api/config response not ok:', response.statusText)
        }
      } catch (error) {
        console.error('[BUILD DEBUG] Error checking API status:', error)
      }
    }

    initializeChat()
    checkApiStatus()
  }, [])

  // 重置温度参数，避免影响后续对话
  useEffect(() => {
    if (temperatureOverride !== null && !isProcessing) {
      const timer = setTimeout(() => {
        setTemperatureOverride(null)
      }, 5000) // 5秒后重置温度
      return () => clearTimeout(timer)
    }
  }, [temperatureOverride, isProcessing])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatRoom) return
    
    // 检查是否有活跃角色
    const activeCharacters = characters.filter(c => c.isActive)
    if (activeCharacters.length === 0) {
      // 不显示系统提示，只在控制台记录
      console.log('没有活跃角色，无法发送消息')
      return
    }

    setIsLoading(true)
    
    try {
      // 添加用户消息到界面
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputMessage,
        senderType: 'user',
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMessage])
      
      const topic = inputMessage.trim()
      setCurrentTopic(topic)
      setInputMessage('')

      // 轮询每个角色，评估兴趣度并生成回复
      await processCharacterResponses(topic)

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const processCharacterResponses = async (topic: string) => {
    setIsProcessing(true)
    
    const activeCharacters = characters.filter(c => c.isActive)
    
    // 如果没有活跃角色，直接返回，不显示任何提示
    if (activeCharacters.length === 0) {
      setIsProcessing(false)
      return
    }
    
    let respondedCharacters = 0
    const characterEvaluations: Array<{
      character: Character
      evaluation: any
      score: number
    }> = []

    // 第一轮：评估所有角色对话题的兴趣度
    for (const character of activeCharacters) {
      try {
        const evaluationResponse = await fetch('/api/chat/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            chatRoomId: chatRoom.id,
            characterId: character.id
          }),
        })

        if (evaluationResponse.ok) {
          const evaluationData = await evaluationResponse.json()
          const evaluation = evaluationData.evaluation
          
          characterEvaluations.push({
            character,
            evaluation,
            score: evaluation.score || 0.5 // 默认分数，确保有值
          })
        }
      } catch (error) {
        console.error(`Error evaluating character ${character.name}:`, error)
      }
    }

    // 按兴趣度排序
    characterEvaluations.sort((a, b) => b.score - a.score)

    // 强制选择至少2个角色参与（如果有的话）
    const minParticipants = Math.min(2, activeCharacters.length)
    const participantsToSelect = Math.max(minParticipants, characterEvaluations.filter(c => c.evaluation.shouldParticipate).length)
    
    // 选择参与的角色：优先选择真正感兴趣的，如果不够2个，则选择兴趣度最高的
    let selectedParticipants = characterEvaluations
      .filter(c => c.evaluation.shouldParticipate)
      .slice(0, participantsToSelect)

    // 如果感兴趣的少于2个，补充兴趣度最高的角色
    if (selectedParticipants.length < minParticipants && characterEvaluations.length > selectedParticipants.length) {
      const remainingCharacters = characterEvaluations
        .filter(c => !selectedParticipants.some(sp => sp.character.id === c.character.id))
        .slice(0, minParticipants - selectedParticipants.length)
      
      selectedParticipants = [...selectedParticipants, ...remainingCharacters]
    }

    // 让选中的角色生成回复
    for (const { character, evaluation, score } of selectedParticipants) {
      try {
        const responseResponse = await fetch('/api/chat/respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: topic,
            chatRoomId: chatRoom.id,
            characterId: character.id,
            temperature: temperatureOverride || undefined
          }),
        })

        if (responseResponse.ok) {
          const responseData = await responseResponse.json()
          let finalResponse = responseData.response
          
          // 应用死循环检测和替换
          finalResponse = checkAndReplaceDeadLoop(finalResponse)
          
          const characterMessage: Message = {
            id: Date.now().toString() + '_' + character.id,
            content: finalResponse,
            senderType: 'character',
            senderId: character.id,
            character: character,
            createdAt: new Date().toISOString(),
            interestScore: score,
            participationReason: evaluation.shouldParticipate ? evaluation.reason : '强制参与以保持对话活跃'
          }
          
          setMessages(prev => [...prev, characterMessage])
          respondedCharacters++
        }

        // 添加短暂延迟，让对话更自然
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error processing character ${character.name}:`, error)
      }
    }

    setIsProcessing(false)
  }

  const handleSetTheme = () => {
    if (!chatTheme.trim() || !chatRoom) return

    // 检查是否有活跃角色
    const activeCharacters = characters.filter(c => c.isActive)
    if (activeCharacters.length === 0) {
      console.log('没有活跃角色，无法设置主题讨论')
      return
    }

    // 不再显示主题设置的系统提示，避免干扰聊天室
    console.log(`聊天主题已设置为: ${chatTheme}`)
    
    // 触发角色开始讨论主题
    setTimeout(() => {
      processCharacterResponses(`让我们开始讨论"${chatTheme}"这个主题吧！`)
    }, 1500)
  }

  const handleClearChat = async () => {
    if (!chatRoom) return

    try {
      const response = await fetch('/api/chat/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatRoomId: chatRoom.id
        }),
      })

      if (response.ok) {
        setMessages([])
        setCurrentTopic('')
        console.log('聊天记录已清空')
      }
    } catch (error) {
      console.error('Error clearing chat:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const token = getToken();
    if (!token) {
      // This should ideally not happen due to the page guard, but as a fallback
      console.error('No auth token found. Please log in.');
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('file', file);
    });

    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('Failed to upload character files');
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: '角色文件上传失败，请检查文件格式或重新登录。',
          senderType: 'system',
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const data = await response.json();
      
      // Refetch characters to sync data
      const charactersResponse = await fetch('/api/characters', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (charactersResponse.ok) {
        const charactersData = await charactersResponse.json();
        // NOTE: The backend returns { success: true, data: { characters: [...] } }
        if (charactersData.success) {
          setCharacters(charactersData.data.characters);
        } else {
           throw new Error(charactersData.error?.message || 'Failed to fetch characters');
        }
        
        const successMessage: Message = {
          id: Date.now().toString(),
          content: `成功上传 ${data.results.successful.length} 个角色！`,
          senderType: 'system',
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, successMessage]);
      }
      
    } catch (error) {
      console.error('Error processing file uploads:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: '角色文件上传失败，请检查文件格式或网络连接。',
        senderType: 'system',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    event.target.value = '';
  };

  const handleCharactersChange = (newCharacters: Character[]) => {
    setCharacters(newCharacters)
  }

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    // 根据主题过滤角色
    if (theme === 'default') {
      // 显示所有默认角色
      setCharacters(prev => prev.map(c => ({ ...c, isActive: !c.theme || c.theme === 'default' })))
    } else {
      // 只显示当前主题的角色
      setCharacters(prev => prev.map(c => ({ 
        ...c, 
        isActive: c.theme === theme 
      })))
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 死循环检测和替换功能
  const checkAndReplaceDeadLoop = (reply: string): string => {
    const antiLoopResponses = [
      "不要鹦鹉学舌啦！",
      "无聊吧你们",
      "复读机来了，风紧扯呼~",
      "哎，换点创意的玩法行吗",
      "这个话题我们已经聊过了，换个角度如何？",
      "感觉我们在原地打转，来点新思路吧！",
      "重复是学习的敌人，让我们突破思维的牢笼",
      "同样的回答听三遍，我的AI芯片都要过热了"
    ]

    // 更新最近回复记录
    setRecentReplies(prev => {
      const newReplies = [...prev, reply].slice(-3) // 保留最近3次
      
      // 检查是否连续三次相同
      if (newReplies.length === 3 && newReplies.every(r => r === newReplies[0])) {
        // 随机选择替换回复
        const randomReply = antiLoopResponses[Math.floor(Math.random() * antiLoopResponses.length)]
        
        // 随机调整温度（模拟模型参数变化）
        const newTemp = 0.7 + (Math.random() - 0.5) * 0.4 // 0.5-0.9范围
        setTemperatureOverride(newTemp)
        
        // 清空历史记录，重新开始计数
        return []
      }
      
      return newReplies
    })

    return reply
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 antialiased text-gray-800 dark:text-gray-200">
      {/* 侧边栏 */}
      <div className={`w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static absolute z-20 h-full`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            虚拟角色聊天室
          </h2>
          <Button 
              variant="ghost" 
              size="sm"
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setSidebarOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
        </div>

        <Tabs defaultValue="characters" className="flex-1">
          <TabsList className="grid w-full grid-cols-4 m-2">
            <TabsTrigger value="characters">角色</TabsTrigger>
            <TabsTrigger value="themes">主题</TabsTrigger>
            <TabsTrigger value="manage">管理</TabsTrigger>
            <TabsTrigger value="settings">设置</TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">角色列表</h3>
              <div className="text-xs text-muted-foreground">
                {characters.filter(c => c.isActive).length} 个角色
              </div>
            </div>

            {/* 添加角色上传按钮 */}
            <div className="space-y-2">
              <input
                type="file"
                accept=".txt,.json,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-characters"
                multiple
                max="20"
              />
              <Button 
                className="w-full"
                onClick={() => document.getElementById('file-upload-characters')?.click()}
                data-testid="character-upload-button"
              >
                <Upload className="w-4 h-4 mr-2" />
                上传角色文件
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                支持 .txt, .json, .md 格式，可一次选择多个文件（最多20个）
              </p>
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-2">
                {characters.map((character) => (
                  <Card key={character.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={character.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {character.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{character.name}</h4>
                          <Badge variant={character.isActive ? "default" : "secondary"} className="text-xs">
                            {character.isActive ? '在线' : '离线'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          阈值: {character.interestThreshold} | 积极性: {character.participationLevel}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {characters.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-2">暂无角色</p>
                    <p className="text-xs">点击上方按钮上传角色文件开始使用</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="themes" className="p-4">
            <ThemeManager 
              characters={characters}
              onCharactersChange={handleCharactersChange}
              onFileUpload={handleFileUpload}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />
          </TabsContent>

          <TabsContent value="manage" className="p-4">
            <CharacterManager 
              characters={characters}
              onCharactersChange={handleCharactersChange}
              onFileUpload={handleFileUpload}
            />
          </TabsContent>

          <TabsContent value="settings" className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">聊天主题</h3>
              <div className="space-y-2">
                <Input
                  value={chatTheme}
                  onChange={(e) => setChatTheme(e.target.value)}
                  placeholder="设置聊天主题"
                />
                <Button onClick={handleSetTheme} className="w-full" disabled={!chatTheme.trim() || characters.filter(c => c.isActive).length === 0}>
                  设置主题
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">聊天管理</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleClearChat}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空聊天记录
                </Button>
                <p className="text-xs text-muted-foreground">
                  清空所有聊天记录，重新开始对话
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">API配置</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    配置API密钥
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>API配置</DialogTitle>
                  </DialogHeader>
                  <ApiConfigV2 />
                </DialogContent>
              </Dialog>
              <p className="text-xs text-muted-foreground mt-1">
                配置AI服务API密钥以启用完整功能
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">系统状态</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm">
                    {isProcessing ? '处理中...' : '系统就绪'}
                  </span>
                </div>
                {currentTopic && (
                  <p className="text-xs text-muted-foreground">
                    当前话题: {currentTopic}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col relative">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">聊天室</h2>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">
                {characters.filter(c => c.isActive).length} 个角色在线
              </Badge>
              {chatTheme && (
                <Badge variant="secondary">
                  {chatTheme}
                </Badge>
              )}
              {apiStatus.isDemo && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  演示模式
                </Badge>
              )}
              {!apiStatus.isDemo && !apiStatus.zaiConfigured && !apiStatus.openaiConfigured && (
                <Badge variant="destructive">
                  未配置API
                </Badge>
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4 messages-container scroll-container" id="messages-container">
            <div className="space-y-4">
              {messages.filter(m => m.senderType !== 'system').map((message, index) => (
                    <div key={message.id || `message-${index}`} className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                        message.senderType === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        <div className="character-name mb-1">
                          {message.senderType === 'user' ? '你' : message.character?.name || 'AI助手'}
                        </div>
                        <div className="message-content">{message.content}</div>
                        <div className="text-xs opacity-70 mt-2">
                          {new Date(message.createdAt).toLocaleTimeString()}
                          {message.senderType !== 'user' && (
                            <span className="ml-2 model-name">
                              {message.character?.modelConfig ? 
                                message.character.modelConfig.split(':').pop() : 
                                'default'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              {messages.filter(m => m.senderType !== 'system').length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">开始对话</p>
                  <p className="text-sm">上传角色文件后发送消息开始聊天</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="fixed-bottom-input p-4 border-t">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder={characters.filter(c => c.isActive).length === 0 ? "请先上传角色文件..." : "输入消息..."}
                disabled={isLoading || isProcessing || characters.filter(c => c.isActive).length === 0}
                className="flex-1 input-large"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || isProcessing || !inputMessage.trim() || characters.filter(c => c.isActive).length === 0}
                className="button-large"
              >
                {isLoading ? '发送中...' : '发送'}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {isLoading ? (
                <span>发送消息中...</span>
              ) : characters.filter(c => c.isActive).length === 0 ? (
                <span>请先上传角色文件以开始对话</span>
              ) : (
                <span>按 Enter 键快速发送消息</span>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}