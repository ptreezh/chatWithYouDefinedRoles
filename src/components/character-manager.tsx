'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Trash2, User, Bot, Plus } from 'lucide-react'

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

interface CharacterManagerProps {
  characters: Character[]
  onCharactersChange: (characters: Character[]) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function CharacterManager({ characters, onCharactersChange, onFileUpload }: CharacterManagerProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    systemPrompt: '',
    participationLevel: 0.7,
    interestThreshold: 0.3
  })

  const handleDeleteCharacter = async (characterId: string) => {
    console.log('[BUILD DEBUG] Deleting character:', characterId)
    try {
      console.log('[BUILD DEBUG] DELETE to /api/characters/${characterId}')
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'DELETE'
      })
      console.log('[BUILD DEBUG] /api/characters/${characterId} delete response status:', response.status)

      if (response.ok) {
        const updatedCharacters = characters.filter(c => c.id !== characterId)
        onCharactersChange(updatedCharacters)
        console.log('[BUILD DEBUG] Character deleted successfully')
      } else {
        console.log('[BUILD DEBUG] /api/characters/${characterId} delete response not ok:', response.statusText)
      }
    } catch (error) {
      console.error('[BUILD DEBUG] Error deleting character:', error)
    }
  }

  const handleToggleActive = async (characterId: string, isActive: boolean) => {
    console.log('[BUILD DEBUG] Toggling character:', characterId, 'to active:', isActive)
    try {
      console.log('[BUILD DEBUG] PATCH to /api/characters/${characterId}')
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive })
      })
      console.log('[BUILD DEBUG] /api/characters/${characterId} toggle response status:', response.status)

      if (response.ok) {
        const updatedCharacters = characters.map(c => 
          c.id === characterId ? { ...c, isActive } : c
        )
        onCharactersChange(updatedCharacters)
        console.log('[BUILD DEBUG] Character toggled successfully')
      } else {
        console.log('[BUILD DEBUG] /api/characters/${characterId} toggle response not ok:', response.statusText)
      }
    } catch (error) {
      console.error('[BUILD DEBUG] Error toggling character:', error)
    }
  }

  const handleEditCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setEditForm({
      name: character.name,
      systemPrompt: character.systemPrompt,
      participationLevel: character.participationLevel,
      interestThreshold: character.interestThreshold
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedCharacter) return

    console.log('[BUILD DEBUG] Saving character edit:', selectedCharacter.id)
    try {
      console.log('[BUILD DEBUG] PATCH to /api/characters/${selectedCharacter.id}')
      const response = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })
      console.log('[BUILD DEBUG] /api/characters/${selectedCharacter.id} save response status:', response.status)

      if (response.ok) {
        const updatedCharacters = characters.map(c => 
          c.id === selectedCharacter.id ? { ...c, ...editForm } : c
        )
        onCharactersChange(updatedCharacters)
        setSelectedCharacter(null)
        console.log('[BUILD DEBUG] Character saved successfully')
      } else {
        console.log('[BUILD DEBUG] /api/characters/${selectedCharacter.id} save response not ok:', response.statusText)
      }
    } catch (error) {
      console.error('[BUILD DEBUG] Error updating character:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* 文件上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            上传角色文件
          </CardTitle>
          <CardDescription>
            支持 .txt, .json, .md 格式，可一次选择多个文件（最多20个）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".txt,.json,.md"
            onChange={onFileUpload}
            className="hidden"
            id="file-upload-manager"
            multiple
            max="20"
          />
          <Button 
            className="w-full"
            onClick={() => document.getElementById('file-upload-manager')?.click()}
          >
            <Plus className="w-4 h-4 mr-2" />
            选择角色文件
          </Button>
        </CardContent>
      </Card>

      {/* 角色列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              角色列表
            </span>
            <Badge variant="outline">
              {characters.filter(c => c.isActive).length} / {characters.length} 活跃
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {characters.map((character) => (
                <Card key={character.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={character.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {character.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{character.name}</h4>
                          <Badge variant={character.isActive ? "default" : "secondary"} className="text-xs">
                            {character.isActive ? '在线' : '离线'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(character.id, !character.isActive)}
                          >
                            {character.isActive ? '禁用' : '启用'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCharacter(character)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCharacter(character.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          阈值: {character.interestThreshold} | 积极性: {character.participationLevel}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {character.systemPrompt.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {characters.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">暂无角色</p>
                  <p className="text-sm">上传角色文件开始使用</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 编辑角色对话框 */}
      <Dialog open={!!selectedCharacter} onOpenChange={() => setSelectedCharacter(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          
          {selectedCharacter && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">角色名称</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-prompt">系统提示词</Label>
                <textarea
                  id="edit-prompt"
                  className="w-full p-3 border rounded-md min-h-[200px] resize-vertical"
                  value={editForm.systemPrompt}
                  onChange={(e) => setEditForm(prev => ({ ...prev, systemPrompt: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-participation">积极性 (0-1)</Label>
                  <Input
                    id="edit-participation"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editForm.participationLevel}
                    onChange={(e) => setEditForm(prev => ({ ...prev, participationLevel: parseFloat(e.target.value) }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-threshold">兴趣阈值 (0-1)</Label>
                  <Input
                    id="edit-threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editForm.interestThreshold}
                    onChange={(e) => setEditForm(prev => ({ ...prev, interestThreshold: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCharacter(null)}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}