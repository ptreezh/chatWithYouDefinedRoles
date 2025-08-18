'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Trash2, Edit, Plus, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
}

interface CharacterTemplate {
  id: string
  name: string
  description: string
  category: string
  file: string
}

interface CharacterManagerProps {
  characters: Character[]
  onCharactersChange: (characters: Character[]) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const characterTemplates: CharacterTemplate[] = [
  {
    id: 'professional',
    name: '专业领域角色',
    description: 'AI专家、创业者、科技专家等专业人士',
    category: 'professional',
    file: 'ai_expert.txt'
  },
  {
    id: 'entertainment',
    name: '娱乐角色',
    description: '艺术家、演员等娱乐行业角色',
    category: 'entertainment',
    file: 'artist.txt'
  },
  {
    id: 'education',
    name: '教育角色',
    description: '哲学家、教师等教育相关角色',
    category: 'education',
    file: 'philosopher.txt'
  },
  {
    id: 'custom',
    name: '自定义角色',
    description: '用户自定义的各种角色',
    category: 'custom',
    file: '小智角色定义.txt'
  }
]

export default function CharacterManager({ characters, onCharactersChange, onFileUpload }: CharacterManagerProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    systemPrompt: '',
    participationLevel: 0.7,
    interestThreshold: 0.3,
    category: 'custom'
  })
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedCharacters = characters.filter(c => c.id !== characterId)
        onCharactersChange(updatedCharacters)
        toast({
          title: "删除成功",
          description: "角色已成功删除",
          duration: 3000,
        })
      } else {
        const error = await response.json()
        toast({
          title: "删除失败",
          description: error.message || "删除角色时出错",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error deleting character:', error)
      toast({
        title: "删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedCharacters.length === 0) return

    try {
      const promises = selectedCharacters.map(id => 
        fetch(`/api/characters/${id}`, { method: 'DELETE' })
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      
      if (successful > 0) {
        const updatedCharacters = characters.filter(c => !selectedCharacters.includes(c.id))
        onCharactersChange(updatedCharacters)
        setSelectedCharacters([])
        
        toast({
          title: "批量删除成功",
          description: `成功删除了 ${successful} 个角色`,
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        title: "批量删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleUpdateCharacter = async () => {
    if (!selectedCharacter) return

    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const updatedCharacter = await response.json()
        const updatedCharacters = characters.map(c => 
          c.id === selectedCharacter.id ? updatedCharacter : c
        )
        onCharactersChange(updatedCharacters)
        setSelectedCharacter(null)
        
        toast({
          title: "更新成功",
          description: "角色信息已成功更新",
          duration: 3000,
        })
      } else {
        const error = await response.json()
        toast({
          title: "更新失败",
          description: error.message || "更新角色时出错",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error updating character:', error)
      toast({
        title: "更新失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleEditCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setEditForm({
      name: character.name,
      systemPrompt: character.systemPrompt,
      participationLevel: character.participationLevel,
      interestThreshold: character.interestThreshold,
      category: character.category || 'custom'
    })
  }

  const handleUseTemplate = async (template: CharacterTemplate) => {
    try {
      const response = await fetch(`/api/characters/from-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: template.category,
          fileName: template.file
        })
      })

      if (response.ok) {
        const newCharacter = await response.json()
        onCharactersChange([...characters, newCharacter])
        toast({
          title: "创建成功",
          description: `角色 "${newCharacter.name}" 已创建`,
          duration: 3000,
        })
      } else {
        const error = await response.json()
        toast({
          title: "创建失败",
          description: error.message || "创建角色时出错",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error creating character from template:', error)
      toast({
        title: "创建失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const toggleCharacterSelection = (characterId: string) => {
    setSelectedCharacters(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  const getCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      professional: '专业领域',
      entertainment: '娱乐',
      education: '教育',
      custom: '自定义'
    }
    return categoryMap[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      professional: 'default',
      entertainment: 'secondary',
      education: 'outline',
      custom: 'destructive'
    }
    return colorMap[category] || 'default'
  }

  return (
    <div className="space-y-6">
      {/* 角色分类统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {characterTemplates.map(template => {
          const count = characters.filter(c => c.category === template.category).length
          return (
            <Card key={template.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="w-4 h-4" />
                <h3 className="font-medium text-sm">{template.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {count} 个角色
                </Badge>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 批量删除按钮 */}
      {selectedCharacters.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            已选择 {selectedCharacters.length} 个角色
          </span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            批量删除
          </Button>
        </div>
      )}

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">上传角色</TabsTrigger>
          <TabsTrigger value="manage">管理角色</TabsTrigger>
          <TabsTrigger value="templates">角色模板</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>上传角色文件</CardTitle>
              <CardDescription>
                支持 .txt、.json、.md 格式的角色文件，可以一次上传多个文件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".txt,.json,.md"
                  onChange={onFileUpload}
                  className="hidden"
                  id="file-upload-characters"
                  multiple
                  max="20"
                />
                <Button 
                  className="w-full"
                  onClick={() => document.getElementById('file-upload-characters')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  选择角色文件
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  支持 .txt, .json, .md 格式，可一次选择多个文件（最多20个）
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>角色管理</CardTitle>
              <CardDescription>
                管理已上传的角色，编辑设置或删除不需要的角色
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {characters.map((character) => (
                    <Card key={character.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedCharacters.includes(character.id)}
                            onChange={() => toggleCharacterSelection(character.id)}
                            className="rounded border-gray-300"
                          />
                          <Avatar>
                            <AvatarImage src={character.avatar} />
                            <AvatarFallback>
                              {character.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{character.name}</h4>
                              <Badge variant={getCategoryColor(character.category || 'custom') as any} className="text-xs">
                                {getCategoryName(character.category || 'custom')}
                              </Badge>
                              <Badge variant={character.isActive ? "default" : "secondary"} className="text-xs">
                                {character.isActive ? '在线' : '离线'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              阈值: {character.interestThreshold} | 积极性: {character.participationLevel}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCharacter(character)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCharacterToDelete(character.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {characters.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm mb-2">暂无角色</p>
                      <p className="text-xs">请先上传角色文件或使用模板创建角色</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>角色模板</CardTitle>
              <CardDescription>
                使用预设的角色模板快速创建角色
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characterTemplates.map((template) => (
                  <Card key={template.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(template.category)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      使用模板
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑角色对话框 */}
      <Dialog open={!!selectedCharacter} onOpenChange={() => setSelectedCharacter(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑角色设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">角色名称</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="category">角色分类</Label>
              <select
                id="category"
                value={editForm.category}
                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="professional">专业领域</option>
                <option value="entertainment">娱乐</option>
                <option value="education">教育</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div>
              <Label htmlFor="participationLevel">参与积极性 ({editForm.participationLevel})</Label>
              <Input
                id="participationLevel"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={editForm.participationLevel}
                onChange={(e) => setEditForm({...editForm, participationLevel: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="interestThreshold">兴趣阈值 ({editForm.interestThreshold})</Label>
              <Input
                id="interestThreshold"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={editForm.interestThreshold}
                onChange={(e) => setEditForm({...editForm, interestThreshold: parseFloat(e.target.value)})}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateCharacter}>保存更改</Button>
              <Button variant="outline" onClick={() => setSelectedCharacter(null)}>取消</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p>
                {selectedCharacters.length > 0 
                  ? `确定要删除选中的 ${selectedCharacters.length} 个角色吗？`
                  : "确定要删除这个角色吗？"
                }
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setCharacterToDelete(null)
                }}
              >
                取消
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedCharacters.length > 0) {
                    handleBatchDelete()
                  } else if (characterToDelete) {
                    handleDeleteCharacter(characterToDelete)
                  }
                  setDeleteDialogOpen(false)
                  setCharacterToDelete(null)
                }}
              >
                确认删除
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}