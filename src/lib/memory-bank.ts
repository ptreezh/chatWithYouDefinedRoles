import fs from 'fs/promises'
import path from 'path'

export interface MemoryBank {
  characterId: string
  characterName: string
  systemPrompt: string
  personalSummary: string
  keyMemories: KeyMemory[]
  conversationHistory: ConversationHistory[]
  personalityTraits: PersonalityTraits
  lastUpdated: string
}

export interface KeyMemory {
  type: 'opinion' | 'fact' | 'experience' | 'preference'
  topic: string
  content: string
  timestamp: string
  importance: number
}

export interface ConversationHistory {
  topic: string
  myView: string
  timestamp: string
  contextSummary: string
}

export interface PersonalityTraits {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

export class MemoryBankManager {
  private storagePath: string

  constructor(storagePath: string = './storage/memory_banks') {
    this.storagePath = storagePath
  }

  async initializeStorage(): Promise<void> {
    try {
      await fs.access(this.storagePath)
    } catch {
      await fs.mkdir(this.storagePath, { recursive: true })
    }
  }

  async createMemoryBank(
    characterId: string,
    characterName: string,
    systemPrompt: string
  ): Promise<MemoryBank> {
    const memoryBank: MemoryBank = {
      characterId,
      characterName,
      systemPrompt,
      personalSummary: `我是${characterName}，一个具有独特个性的AI角色。`,
      keyMemories: [],
      conversationHistory: [],
      personalityTraits: {
        openness: 0.7,
        conscientiousness: 0.6,
        extraversion: 0.5,
        agreeableness: 0.7,
        neuroticism: 0.3
      },
      lastUpdated: new Date().toISOString()
    }

    await this.saveMemoryBank(characterId, memoryBank)
    return memoryBank
  }

  async getMemoryBank(characterId: string): Promise<MemoryBank | null> {
    try {
      const filePath = this.getMemoryBankPath(characterId)
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      return null
    }
  }

  async saveMemoryBank(characterId: string, memoryBank: MemoryBank): Promise<void> {
    const filePath = this.getMemoryBankPath(characterId)
    memoryBank.lastUpdated = new Date().toISOString()
    await fs.writeFile(filePath, JSON.stringify(memoryBank, null, 2))
  }

  async addKeyMemory(
    characterId: string,
    memory: Omit<KeyMemory, 'timestamp'>
  ): Promise<void> {
    const memoryBank = await this.getMemoryBank(characterId)
    if (!memoryBank) return

    const keyMemory: KeyMemory = {
      ...memory,
      timestamp: new Date().toISOString()
    }

    memoryBank.keyMemories.push(keyMemory)
    await this.saveMemoryBank(characterId, memoryBank)
  }

  async addConversationHistory(
    characterId: string,
    history: Omit<ConversationHistory, 'timestamp'>
  ): Promise<void> {
    const memoryBank = await this.getMemoryBank(characterId)
    if (!memoryBank) return

    const conversationRecord: ConversationHistory = {
      ...history,
      timestamp: new Date().toISOString()
    }

    memoryBank.conversationHistory.push(conversationRecord)
    await this.saveMemoryBank(characterId, memoryBank)
  }

  async getRelevantMemories(
    characterId: string,
    topic: string,
    limit: number = 5
  ): Promise<KeyMemory[]> {
    const memoryBank = await this.getMemoryBank(characterId)
    if (!memoryBank) return []

    // 简单的关键词匹配来查找相关记忆
    const topicKeywords = topic.toLowerCase().split(/\s+/)
    
    const scoredMemories = memoryBank.keyMemories.map(memory => {
      const memoryText = memory.content.toLowerCase()
      const score = topicKeywords.reduce((acc, keyword) => {
        return acc + (memoryText.includes(keyword) ? 1 : 0)
      }, 0)
      return { memory, score }
    })

    return scoredMemories
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory)
  }

  async getRecentConversationHistory(
    characterId: string,
    limit: number = 3
  ): Promise<ConversationHistory[]> {
    const memoryBank = await this.getMemoryBank(characterId)
    if (!memoryBank) return []

    return memoryBank.conversationHistory
      .slice(-limit)
      .reverse()
  }

  async updatePersonalSummary(characterId: string, newSummary: string): Promise<void> {
    const memoryBank = await this.getMemoryBank(characterId)
    if (!memoryBank) return

    memoryBank.personalSummary = newSummary
    await this.saveMemoryBank(characterId, memoryBank)
  }

  async updatePersonalityTraits(
    characterId: string,
    traits: Partial<PersonalityTraits>
  ): Promise<void> {
    const memoryBank = await this.getMemoryBank(characterId)
    if (!memoryBank) return

    memoryBank.personalityTraits = { ...memoryBank.personalityTraits, ...traits }
    await this.saveMemoryBank(characterId, memoryBank)
  }

  private getMemoryBankPath(characterId: string): string {
    return path.join(this.storagePath, `${characterId}.json`)
  }
}