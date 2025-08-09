'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Trash2, User, Bot, Plus, Folder, FolderOpen, FileText, Settings } from 'lucide-react'

interface Theme {
  name: string
  characterCount: number
  createdAt: Date
  lastModified: Date
}

interface Character {
  id: string
  name: string
  systemPrompt: string
  avatar?: string
  modelConfig?: string
  participationLevel: number
  interestThreshold: number
  isActive: boolean
  category?: string
  theme?: string
}

interface ThemeManagerProps {
  characters: Character[]
  onCharactersChange: (characters: Character[]) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  currentTheme?: string
  onThemeChange?: (theme: string) => void
}

export default function ThemeManager({ 
  characters, 
  onCharactersChange, 
  onFileUpload, 
  currentTheme,
  onThemeChange 
}: ThemeManagerProps) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme || 'default')
  const [newThemeName, setNewThemeName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    console.log('[BUILD DEBUG] Starting themes load...')
    try {
      console.log('[BUILD DEBUG] Fetching from /api/themes')
      const response = await fetch('/api/themes')
      console.log('[BUILD DEBUG] /api/themes response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('[BUILD DEBUG] /api/themes response data:', data)
        setThemes(data.themes || [])
      } else {
        console.log('[BUILD DEBUG] /api/themes response not ok:', response.statusText)
      }
    } catch (error) {
      console.error('[BUILD DEBUG] Error loading themes:', error)
    }
  }

  const createTheme = async () => {
    if (!newThemeName.trim()) return

    setIsLoading(true)
    console.log('[BUILD DEBUG] Creating theme:', newThemeName)
    try {
      console.log('[BUILD DEBUG] POST to /api/themes')
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeName: newThemeName })
      })
      console.log('[BUILD DEBUG] /api/themes create response status:', response.status)

      if (response.ok) {
        const newTheme = await response.json()
        console.log('[BUILD DEBUG] /api/themes create response data:', newTheme)
        setThemes([...themes, newTheme.theme])
        setNewThemeName('')
      } else {
        console.log('[BUILD DEBUG] /api/themes create response not ok:', response.statusText)
      }
    } catch (error) {
      console.error('[BUILD DEBUG] Error creating theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTheme = async (themeName: string) => {
    console.log('[BUILD DEBUG] Deleting theme:', themeName)
    try {
      console.log('[BUILD DEBUG] DELETE to /api/themes with theme:', themeName)
      const response = await fetch(`/api/themes?theme=${encodeURIComponent(themeName)}`, {
        method: 'DELETE'
      })
      console.log('[BUILD DEBUG] /api/themes delete response status:', response.status)

      if (response.ok) {
        setThemes(themes.filter(t => t.name !== themeName))
        if (selectedTheme === themeName) {
          setSelectedTheme('default')
          onThemeChange?.('default')
        }
        console.log('[BUILD DEBUG] Theme deleted successfully')
      } else {
        console.log('[BUILD DEBUG] /api/themes delete response not ok:', response.statusText)
      }
    } catch (error) {
      console.error('[BUILD DEBUG] Error deleting theme:', error)
    }
  }

  const handleThemeSelect = (themeName: string) => {
    setSelectedTheme(themeName)
    onThemeChange?.(themeName)
  }

  const handleThemeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 为上传添加主题信息
    const files = event.target.files
    if (!files || files.length === 0) return

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('file', file)
    })
    
    if (selectedTheme && selectedTheme !== 'default') {
      formData.append('theme', selectedTheme)
    }

    // 模拟表单提交
    const fakeEvent = {
      target: {
        files: files
      }
    } as any

    // 调用原有的上传处理
    onFileUpload(fakeEvent)
  }

  const getThemeCharacters = (themeName: string) => {
    if (themeName === 'default') {
      return characters.filter(c => !c.theme || c.theme === 'default')
    }
    return characters.filter(c => c.theme === themeName)
  }

  return (
    <div className="space-y-6">
      {/* 主题选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            对话主题管理
          </CardTitle>
          <CardDescription>
            创建和管理对话主题，为主题上传专门的角色
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 当前主题 */}
            <div>
              <Label>当前主题</Label>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-sm">
                  {selectedTheme === 'default' ? '默认' : selectedTheme}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({getThemeCharacters(selectedTheme).length} 个角色)
                </span>
              </div>
            </div>

            {/* 主题列表 */}
            <div>
              <Label>选择主题</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                <Button
                  variant={selectedTheme === 'default' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleThemeSelect('default')}
                  className="justify-start"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  默认
                </Button>
                {themes.map((theme) => (
                  <Button
                    key={theme.name}
                    variant={selectedTheme === theme.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeSelect(theme.name)}
                    className="justify-between"
                  >
                    <span className="truncate">{theme.name}</span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {theme.characterCount}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* 创建新主题 */}
            <div className="flex gap-2">
              <Input
                placeholder="输入新主题名称"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createTheme()}
              />
              <Button 
                onClick={createTheme}
                disabled={!newThemeName.trim() || isLoading}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主题角色管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            主题角色管理
          </CardTitle>
          <CardDescription>
            为当前主题上传和管理角色文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">上传角色</TabsTrigger>
              <TabsTrigger value="manage">管理角色</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".txt,.json,.md"
                  onChange={handleThemeUpload}
                  className="hidden"
                  id="theme-file-upload"
                  multiple
                  max="20"
                />
                <Button 
                  className="w-full"
                  onClick={() => document.getElementById('theme-file-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  上传角色到主题 "{selectedTheme === 'default' ? '默认' : selectedTheme}"
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  支持 .txt, .json, .md 格式，可一次选择多个文件（最多20个）
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {getThemeCharacters(selectedTheme).map((character) => (
                    <Card key={character.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={character.avatar} />
                            <AvatarFallback>
                              {character.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{character.name}</h4>
                              <Badge variant={character.isActive ? "default" : "secondary"} className="text-xs">
                                {character.isActive ? '在线' : '离线'}
                              </Badge>
                              {character.theme && (
                                <Badge variant="outline" className="text-xs">
                                  {character.theme}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              阈值: {character.interestThreshold} | 积极性: {character.participationLevel}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            // 这里应该调用删除角色的API
                            const updatedCharacters = characters.filter(c => c.id !== character.id)
                            onCharactersChange(updatedCharacters)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {getThemeCharacters(selectedTheme).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm mb-2">该主题暂无角色</p>
                      <p className="text-xs">请上传角色文件到当前主题</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 主题统计 */}
      <Card>
        <CardHeader>
          <CardTitle>主题统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{themes.length}</div>
              <div className="text-sm text-muted-foreground">自定义主题</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{getThemeCharacters('default').length}</div>
              <div className="text-sm text-muted-foreground">默认角色</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {themes.reduce((sum, theme) => sum + theme.characterCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">主题角色总数</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}