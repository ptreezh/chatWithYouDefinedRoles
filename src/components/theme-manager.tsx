'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, CheckCircle2, Plus, Upload, Trash2, Users } from 'lucide-react'
import { Theme } from '@prisma/client'

interface ThemeWithCharacters extends Theme {
  characters: Array<{
    id: string
    name: string
    category: string
  }>
}

export function ThemeManager() {
  const [themes, setThemes] = useState<ThemeWithCharacters[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('default')
  const [newThemeName, setNewThemeName] = useState('')
  const [characterTemplates, setCharacterTemplates] = useState<Array<{category: string, files: string[]}>>([])
  const [selectedTemplate, setSelectedTemplate] = useState<{category: string, file: string} | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadThemes()
    loadCharacterTemplates()
  }, [])

  const loadThemes = async () => {
    try {
      const response = await fetch('/api/themes')
      if (response.ok) {
        const data = await response.json()
        setThemes(data.themes || [])
      }
    } catch (error) {
      toast({
        title: "加载主题失败",
        description: "无法加载主题列表",
        variant: "destructive"
      })
    }
  }

  const loadCharacterTemplates = async () => {
    try {
      const categories = ['professional', 'entertainment', 'education', 'custom']
      const templates = []
      
      for (const category of categories) {
        const response = await fetch('/api/characters/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.characters && Array.isArray(data.characters)) {
            templates.push({
              category: data.category,
              files: data.characters.map((char: any) => char.fileName)
            })
          }
        }
      }
      
      setCharacterTemplates(templates)
    } catch (error) {
      toast({
        title: "加载模板失败",
        description: "无法加载角色模板",
        variant: "destructive"
      })
    }
  }

  const createTheme = async () => {
    if (!newThemeName.trim()) {
      toast({
        title: "主题名称不能为空",
        description: "请输入主题名称",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeName: newThemeName })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "主题创建成功",
          description: `主题 "${newThemeName}" 已创建`,
          icon: <CheckCircle2 className="h-4 w-4" />
        })
        setNewThemeName('')
        loadThemes()
      } else {
        const error = await response.json()
        toast({
          title: "创建失败",
          description: error.error || "无法创建主题",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const deleteTheme = async (themeId: string, themeName: string) => {
    if (themeName === 'default') {
      toast({
        title: "无法删除默认主题",
        description: "默认主题不能被删除",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/themes/${themeId}`, { method: 'DELETE' })
      if (response.ok) {
        toast({
          title: "主题删除成功",
          description: `主题 "${themeName}" 已删除`,
          icon: <CheckCircle2 className="h-4 w-4" />
        })
        loadThemes()
      } else {
        toast({
          title: "删除失败",
          description: "无法删除主题",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const createCharacterFromTemplate = async () => {
    if (!selectedTemplate || !selectedTheme) {
      toast({
        title: "选择不完整",
        description: "请选择模板和主题",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/characters/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedTemplate.category,
          fileName: selectedTemplate.file,
          theme: selectedTheme
        })
      })

      if (response.ok) {
        toast({
          title: "角色创建成功",
          description: `角色已添加到主题 "${selectedTheme}"`,
          icon: <CheckCircle2 className="h-4 w-4" />
        })
        loadThemes()
        setSelectedTemplate(null)
      } else {
        const error = await response.json()
        toast({
          title: "创建失败",
          description: error.error || "无法创建角色",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  const deleteCharacterFromTheme = async (characterId: string, characterName: string) => {
    try {
      const response = await fetch(`/api/characters/${characterId}`, { method: 'DELETE' })
      if (response.ok) {
        toast({
          title: "角色删除成功",
          description: `角色 "${characterName}" 已删除`,
          icon: <CheckCircle2 className="h-4 w-4" />
        })
        loadThemes()
      } else {
        toast({
          title: "删除失败",
          description: "无法删除角色",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: "网络错误",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>主题管理</CardTitle>
          <CardDescription>创建和管理聊天主题</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme-name">新主题名称</Label>
              <div className="flex gap-2">
                <Input
                  id="theme-name"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="输入主题名称"
                />
                <Button onClick={createTheme}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建主题
                </Button>
              </div>
            </div>

            <div>
              <Label>选择主题</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="选择主题" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map(theme => (
                    <SelectItem key={theme.id} value={theme.name}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>选择角色模板</Label>
              <div className="space-y-2">
                {characterTemplates.map(category => (
                  <div key={category.category} className="border rounded p-2">
                    <h4 className="font-medium mb-2">{category.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.files.map(file => (
                        <Button
                          key={file}
                          variant={selectedTemplate?.file === file ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTemplate({ category: category.category, file })}
                        >
                          {file.replace('.txt', '')}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={createCharacterFromTemplate}
              disabled={!selectedTemplate || !selectedTheme}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加到主题
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>主题角色管理</CardTitle>
          <CardDescription>管理主题中的角色</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {themes.map(theme => (
              <div key={theme.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">{theme.name}</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTheme(theme.id, theme.name)}
                    disabled={theme.name === 'default'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {(!theme.characters || theme.characters.length === 0) ? (
                    <p className="text-sm text-muted-foreground">暂无角色</p>
                  ) : (
                    (theme.characters ?? []).map(character => (
                      <div key={character.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{character.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({character.category})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCharacterFromTheme(character.id, character.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}