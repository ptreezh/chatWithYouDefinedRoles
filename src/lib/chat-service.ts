import { Character, Message } from '@prisma/client'
import { MemoryBankManager, KeyMemory, ConversationHistory } from './memory-bank'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { calculateSimilarity } from './utils';

async function getOllamaModels(): Promise<string[]> {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`);
    if (!response.ok) {
      console.error(`Failed to fetch Ollama models: ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    const models = data.models.map((m: any) => m.name);
    const filteredModels = models.filter((modelName: string) => {
      const lowerCaseName = modelName.toLowerCase();
      return !lowerCaseName.includes('embed') && !lowerCaseName.includes('embedding') && !lowerCaseName.includes('code') && !lowerCaseName.includes('coder');
    });
    return filteredModels;
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
}

export interface ModelConfig {
  provider: 'zai' | 'openai' | 'anthropic' | 'custom' | 'ollama'
  model: string
  apiKey?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
}

export interface InterestEvaluation {
  score: number
  reason: string
  shouldParticipate: boolean
}

// 读取API配置（优先环境变量，其次用户配置文件，最后默认值）
function getApiConfig() {
  try {
    const rootConfigPath = path.join(process.cwd(), 'api-config-user.json')
    const altConfigPath = path.join(process.cwd(), 'config', 'api-config-user.json')
    const configPath = existsSync(rootConfigPath)
      ? rootConfigPath
      : existsSync(altConfigPath)
        ? altConfigPath
        : ''

    if (configPath) {
      const configData = readFileSync(configPath, 'utf-8')
      const fileConfig = JSON.parse(configData)

      // 仅在环境变量未设置时，从配置文件注入到环境变量，避免覆盖部署环境
      if (fileConfig.zaiApiKey && !process.env.ZAI_API_KEY) {
        process.env.ZAI_API_KEY = fileConfig.zaiApiKey
      }
      if (fileConfig.openaiApiKey && !process.env.OPENAI_API_KEY) {
        process.env.OPENAI_API_KEY = fileConfig.openaiApiKey
      }
      if (fileConfig.ollamaBaseUrl && !process.env.OLLAMA_BASE_URL) {
        process.env.OLLAMA_BASE_URL = fileConfig.ollamaBaseUrl
      }
      if (fileConfig.ollamaModel && !process.env.OLLAMA_MODEL) {
        process.env.OLLAMA_MODEL = fileConfig.ollamaModel
      }

      // 如果配置了有效的ZAI API密钥，写入.z-ai-config供SDK使用（优先使用env中的有效值）
      const effectiveZaiKey = process.env.ZAI_API_KEY || fileConfig.zaiApiKey
      if (effectiveZaiKey && effectiveZaiKey !== 'demo-key-for-testing') {
        const zaiConfigPath = path.join(process.cwd(), '.z-ai-config')
        const zaiConfig = {
          baseUrl: 'https://api.z.ai/v1',
          apiKey: effectiveZaiKey,
          chatId: fileConfig.chatId || '',
          userId: fileConfig.userId || ''
        }
        try {
          writeFileSync(zaiConfigPath, JSON.stringify(zaiConfig, null, 2))
          console.log('ZAI配置文件已创建:', zaiConfigPath)
        } catch (writeError) {
          console.error('创建ZAI配置文件失败:', writeError)
        }
      }

      console.log('ChatService读取API配置:', {
        zaiApiKey: (process.env.ZAI_API_KEY || fileConfig.zaiApiKey) ? '已设置' : '未设置',
        openaiApiKey: (process.env.OPENAI_API_KEY || fileConfig.openaiApiKey) ? '已设置' : '未设置',
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL || fileConfig.ollamaBaseUrl || '默认',
        ollamaModel: process.env.OLLAMA_MODEL || fileConfig.ollamaModel || '默认',
        source: configPath.endsWith('config\\api-config-user.json') ? 'config/api-config-user.json' : 'api-config-user.json'
      })

      return fileConfig
    }
  } catch (error) {
    console.error('Error reading API config:', error)
  }
  return {}
}

export class ChatService {
  private memoryBankManager: MemoryBankManager
  private availableOllamaModels: string[] = []
  private recentResponses: string[] = [] // 用于存储最近的回复，进行重复检测

  constructor() {
    this.memoryBankManager = new MemoryBankManager()
    // 初始化时读取API配置（不会覆盖已有环境变量）
    getApiConfig()
    this.initOllamaModels()
  }

  private async initOllamaModels() {
    this.availableOllamaModels = await getOllamaModels()
  }

  async evaluateInterest(
    character: Character,
    topic: string,
    context: string
  ): Promise<InterestEvaluation> {
    // 获取角色的Memory Bank
    const memoryBank = await this.memoryBankManager.getMemoryBank(character.id)
    if (!memoryBank) {
      return {
        score: 0.5,
        reason: '角色尚未初始化记忆',
        shouldParticipate: Math.random() > 0.5
      }
    }

    // 检查是否为演示模式
    if (process.env.ZAI_API_KEY === 'demo-key-for-testing') {
      return this.generateDemoInterestEvaluation(character, topic, context);
    }

    // 构建兴趣度评估提示
    const evaluationPrompt = `
你是一个角色兴趣度评估专家。请评估以下角色对当前话题的兴趣度。

角色信息：
- 名称：${character.name}
- 系统提示词：${character.systemPrompt}
- 性格特征：开放性${memoryBank.personalityTraits.openness}，尽责性${memoryBank.personalityTraits.conscientiousness}，外向性${memoryBank.personalityTraits.extraversion}，宜人性${memoryBank.personalityTraits.agreeableness}，神经质${memoryBank.personalityTraits.neuroticism}

当前话题：${topic}
对话上下文：${context}

请基于角色的设定、性格特征和话题的相关性，评估该角色对这个话题的兴趣度。
请以JSON格式返回评估结果：
{
  "score": 0.0到1.0之间的数值,
  "reason": "详细的评估理由",
  "shouldParticipate": true/false
}

评估标准：
- 0.0-0.2: 兴趣很低，不建议参与
- 0.2-0.5: 中等兴趣，可以参与
- 0.5-1.0: 高度兴趣，建议参与

考虑因素：
1. 话题与角色专业领域的相关性
2. 话题与角色性格的匹配度
3. 角色在类似话题上的历史参与度
4. 角色的参与积极性设定（${character.participationLevel}）
`

    try {
      // 重新读取API配置以确保使用最新的密钥
      const apiConfig = getApiConfig()
      
      // 优先使用ZAI SDK进行兴趣度评估
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: '你是一个专业的角色兴趣度评估专家。' },
          { role: 'user', content: evaluationPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })

      const sdkResponse = completion.choices[0]?.message?.content
      if (sdkResponse) {
        const result = JSON.parse(sdkResponse)
        const shouldParticipate = result.score >= character.interestThreshold
        return {
          score: result.score,
          reason: result.reason,
          shouldParticipate
        }
      }
    } catch (error) {
      console.error('Error evaluating interest with ZAI SDK:', error)
      
      // 如果ZAI SDK失败，尝试使用OpenAI API
      const apiConfig = getApiConfig()
      const openaiApiKey = apiConfig.openaiApiKey || process.env.OPENAI_API_KEY
      if (openaiApiKey && openaiApiKey !== 'demo-openai-key-for-testing') {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: '你是一个专业的角色兴趣度评估专家。' },
                { role: 'user', content: evaluationPrompt }
              ],
              temperature: 0.3,
              max_tokens: 500
            })
          })

          if (response.ok) {
            const data = await response.json()
            const apiResponse = data.choices[0]?.message?.content
            if (apiResponse) {
              const result = JSON.parse(apiResponse)
              // 考虑角色的兴趣阈值
              const shouldParticipate = result.score >= character.interestThreshold
              return {
                score: result.score,
                reason: result.reason,
                shouldParticipate
              }
            }
          }
        } catch (openaiError) {
          console.error('Error evaluating interest with OpenAI API:', openaiError)
        }
      }
    }

    // 降级处理：基于简单规则评估
    const baseScore = Math.random() * 0.6 + 0.2 // 0.2-0.8
    const adjustedScore = Math.min(1.0, baseScore * character.participationLevel)
    const shouldParticipate = adjustedScore >= Math.max(0.3, character.interestThreshold - 0.1) // 降低门槛

    return {
      score: adjustedScore,
      reason: '基于规则的降级评估',
      shouldParticipate
    }
  }

  private generateDemoInterestEvaluation(character: Character, topic: string, context: string): InterestEvaluation {
    // 演示模式：基于角色名称和话题生成兴趣度评估
    const topicLower = topic.toLowerCase();
    const characterName = character.name.toLowerCase();
    
    let score = 0.5; // 默认中等兴趣
    let reason = '对该话题有一定兴趣';
    
    // 根据角色名称和话题匹配度调整兴趣度
    if (characterName.includes('科技') || characterName.includes('ai') || characterName.includes('专家')) {
      if (topicLower.includes('科技') || topicLower.includes('ai') || topicLower.includes('人工智能')) {
        score = 0.8 + Math.random() * 0.2; // 0.8-1.0
        reason = '话题与专业领域高度相关，非常感兴趣';
      } else if (topicLower.includes('未来') || topicLower.includes('创新')) {
        score = 0.6 + Math.random() * 0.3; // 0.6-0.9
        reason = '话题与科技发展趋势相关，很感兴趣';
      }
    }
    
    if (characterName.includes('心理') || characterName.includes('咨询')) {
      if (topicLower.includes('心理') || topicLower.includes('情绪') || topicLower.includes('情感')) {
        score = 0.8 + Math.random() * 0.2; // 0.8-1.0
        reason = '话题与专业领域高度相关，非常感兴趣';
      } else if (topicLower.includes('人生') || topicLower.includes('成长')) {
        score = 0.6 + Math.random() * 0.3; // 0.6-0.9
        reason = '话题与个人成长相关，很感兴趣';
      }
    }
    
    if (characterName.includes('创业') || characterName.includes('商业') || characterName.includes('导师')) {
      if (topicLower.includes('创业') || topicLower.includes('商业') || topicLower.includes('投资')) {
        score = 0.8 + Math.random() * 0.2; // 0.8-1.0
        reason = '话题与专业领域高度相关，非常感兴趣';
      } else if (topicLower.includes('职业') || topicLower.includes('管理')) {
        score = 0.6 + Math.random() * 0.3; // 0.6-0.9
        reason = '话题与职业发展相关，很感兴趣';
      }
    }
    
    if (characterName.includes('艺术') || characterName.includes('文艺') || characterName.includes('文化')) {
      if (topicLower.includes('艺术') || topicLower.includes('文化') || topicLower.includes('文学')) {
        score = 0.8 + Math.random() * 0.2; // 0.8-1.0
        reason = '话题与专业领域高度相关，非常感兴趣';
      } else if (topicLower.includes('创意') || topicLower.includes('设计')) {
        score = 0.6 + Math.random() * 0.3; // 0.6-0.9
        reason = '话题与创意表达相关，很感兴趣';
      }
    }
    
    // 如果没有特别匹配，随机生成兴趣度
    if (score === 0.5) {
      score = 0.3 + Math.random() * 0.5; // 0.3-0.8
      reason = '对该话题有一定兴趣，愿意参与讨论';
    }
    
    const shouldParticipate = score >= character.interestThreshold;
    
    return {
      score,
      reason,
      shouldParticipate
    };
  }

  async generateResponse(
    character: Character,
    message: string,
    context: string,
    recentMessages: Message[],
    temperature?: number,
    forceRegenerate: boolean = false, // 新增参数，指示是否强制重新生成
    newPromptPrefix: string = '' // 新增参数，用于添加新的提示前缀
  ): Promise<{ response: string; memorySnapshot: any }> {
    // 获取角色的Memory Bank
    const memoryBank = await this.memoryBankManager.getMemoryBank(character.id)
    if (!memoryBank) {
      throw new Error('角色记忆银行未找到')
    }

    // 获取相关记忆和最近对话历史
    const relevantMemories = await this.memoryBankManager.getRelevantMemories(
      character.id,
      this.extractTopic(message),
      3
    )
    const recentHistory = await this.memoryBankManager.getRecentConversationHistory(
      character.id,
      2
    )

    // 解析模型配置
    const modelConfig = this.parseModelConfig(character.modelConfig)
    if (temperature !== undefined) {
      modelConfig.temperature = temperature
    }

    let response = ''
    let finalResponsePrompt = '';
    let shouldRegenerate = forceRegenerate;
    let memorySnapshot: any = null; // ensure accessible after loop

    do {
      shouldRegenerate = false; // 每次循环开始时重置

      // 构建回复生成的提示
      let currentResponsePrompt = `
你是一个名为${character.name}的AI角色。请基于以下信息生成回复：

角色设定：
${character.systemPrompt}

个人总结：
${memoryBank.personalSummary}

相关记忆：
${relevantMemories.map(mem => `- ${mem.content}`).join('\n')}

完整对话历史：
${recentMessages.reverse().map(msg => `${msg.senderType === 'user' ? '用户' : character.name}: ${msg.content} (话题: ${msg.topic || '未知'})`).join('\n')}

随机选择的对话线索：
${this.getRandomMessageContext(recentMessages, character.name)}

最近对话历史（记忆）：
${recentHistory.map(hist => `- 关于${hist.topic}：${hist.myView}`).join('\n')}

当前话题：${this.extractTopic(message)}
对话上下文：${context}
用户消息：${message}

请以${character.name}的身份回复这条消息。要求：
1. 保持与角色设定的一致性
2. 考虑相关的历史记忆和观点
3. 确保回复逻辑连贯，不与之前的观点矛盾
4. 体现角色的性格特征
5. 回复要自然、流畅，符合对话场景

请直接回复内容，不要包含任何解释或思考过程。
`;

      if (newPromptPrefix) {
        currentResponsePrompt = `${newPromptPrefix} ${currentResponsePrompt}`;
        newPromptPrefix = ''; // 使用后清空，避免下次重复添加
      }
      finalResponsePrompt = currentResponsePrompt;

      try {
        // 根据配置调用不同的AI服务
        switch (modelConfig.provider) {
        case 'zai':
          response = await this.callZAI(finalResponsePrompt, modelConfig)
          break
        case 'openai':
          response = await this.callOpenAI(finalResponsePrompt, modelConfig)
          break
        case 'anthropic':
          response = await this.callAnthropic(finalResponsePrompt, modelConfig)
          break
        case 'ollama':
          response = await this.callOllama(finalResponsePrompt, modelConfig)
          break
        case 'custom':
          response = await this.callCustomAPI(finalResponsePrompt, modelConfig)
          break
        default:
          response = await this.callZAI(finalResponsePrompt, modelConfig)
      }
    } catch (error) {
      console.error('Error generating response:', error)
      // Fallback: generate a local demo response to avoid breaking the chat flow
      response = this.generateDemoResponse(finalResponsePrompt)
    }

    // 创建记忆快照
    memorySnapshot = {
      relevantMemories,
      recentHistory,
      personalityTraits: memoryBank.personalityTraits,
      systemPrompt: character.systemPrompt
    }

    // 更新角色的记忆银行
    await this.updateCharacterMemory(character.id, message, response, context)

    // 添加到最近回复列表，并进行重复检测
    this.recentResponses.push(response);
    const SIMILARITY_THRESHOLD = 0.6; // 相似度阈值，降低以提高敏感度
    const REPEAT_CHECK_COUNT = 3; // 检查最近3次回复

    if (this.recentResponses.length >= REPEAT_CHECK_COUNT) {
      const recent = this.recentResponses.slice(-REPEAT_CHECK_COUNT);
      let isRepeating = true;
      for (let i = 0; i < recent.length - 1; i++) {
        const similarity = calculateSimilarity(recent[i], recent[i + 1]);
        if (similarity < SIMILARITY_THRESHOLD) {
          isRepeating = false;
          break;
        }
      }

      if (isRepeating) {
        console.warn('检测到连续重复回复，尝试更改上下文并重新生成。');
        // 更改上下文，例如添加一个随机的引导语或改变话题
        const randomContexts = [
          '换个角度思考一下，', 
          '我们来聊聊别的吧，', 
          '你觉得这个怎么样？', 
          '这让我想到了一个问题：'
        ];
        const newContext = randomContexts[Math.floor(Math.random() * randomContexts.length)];
        // 清空 recentResponses，避免再次触发
        this.recentResponses = [];
        // 准备重新生成回复，将新的上下文添加到原始提示词中
        // 这里不直接返回，而是让外部逻辑（或递归调用）处理重新生成
        const result = { response: `(系统检测到重复，已尝试调整话题) ${response}`, memorySnapshot, forceRegenerate: true, newPromptPrefix: newContext };
        if (result.forceRegenerate) {
          shouldRegenerate = true;
          // 如果需要重新生成，则不更新记忆和 recentResponses，直接进入下一次循环
          continue; 
        }
      }
    }

    } while (shouldRegenerate);

    return { response, memorySnapshot: memorySnapshot };
  }

  private getRandomMessageContext(messages: Message[], characterName: string): string {
    if (messages.length === 0) {
      return '无可用对话线索。'
    }
    const lastFiveMessages = messages.slice(Math.max(0, messages.length - 5));
    const randomIndex = Math.floor(Math.random() * lastFiveMessages.length);
    const selectedMessage = lastFiveMessages[randomIndex];
    return `${selectedMessage.senderType === 'user' ? '用户' : characterName}: ${selectedMessage.content} (话题: ${selectedMessage.topic || '未知'})`;
  }

  private async updateCharacterMemory(
    characterId: string,
    userMessage: string,
    response: string,
    context: string
  ): Promise<void> {
    const topic = this.extractTopic(userMessage)
    
    // 添加关键记忆（提取回复中的重要观点）
    const keyMemory: Omit<KeyMemory, 'timestamp'> = {
      type: 'opinion',
      topic,
      content: this.extractKeyOpinion(response),
      importance: 0.7
    }
    await this.memoryBankManager.addKeyMemory(characterId, keyMemory)

    // 添加对话历史
    const conversationHistory: Omit<ConversationHistory, 'timestamp'> = {
      topic,
      myView: response,
      contextSummary: context.substring(0, 200) + '...'
    }
    await this.memoryBankManager.addConversationHistory(characterId, conversationHistory)
  }

  private extractTopic(text: string): string {
    // 简单的主题提取
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim())
    return sentences[0]?.trim() || text.substring(0, 50)
  }

  private extractKeyOpinion(response: string): string {
    // 提取回复中的关键观点
    const sentences = response.split(/[。！？.!?]/).filter(s => s.trim())
    return sentences[0]?.trim() || response.substring(0, 100)
  }

  private parseModelConfig(configString?: string): ModelConfig {
    const defaultConfig: ModelConfig = {
      provider: 'ollama', // 默认使用本地Ollama模型
      model: process.env.OLLAMA_MODEL || 'llama3:latest',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      temperature: 0.7,
      maxTokens: 2048
    }

    if (!configString) return defaultConfig

    try {
      const parsed = JSON.parse(configString)
      return { ...defaultConfig, ...parsed }
    } catch {
      return defaultConfig
    }
  }

  private async callZAI(prompt: string, config: ModelConfig): Promise<string> {
    try {
      console.log('ChatService.callZAI 开始调用...')
      
      // 读取配置（不覆盖已有环境变量）并确定最终API Key
      const apiConfig = getApiConfig()
      const zaiApiKey = process.env.ZAI_API_KEY || apiConfig.zaiApiKey
      
      console.log('ZAI调用前的配置检查:', {
        envZaiKey: process.env.ZAI_API_KEY ? '已设置' : '未设置',
        configZaiKey: apiConfig.zaiApiKey ? '已设置' : '未设置',
        isDemo: zaiApiKey === 'demo-key-for-testing',
        finalKeyPrefix: zaiApiKey ? zaiApiKey.substring(0, 8) + '...' : '未设置'
      })
      
      // 检查是否为演示模式
      if (zaiApiKey === 'demo-key-for-testing' || !zaiApiKey) {
        console.log('检测到演示模式或未配置真实密钥，返回模拟回复')
        return this.generateDemoResponse(prompt);
      }

      // 确保环境变量可供SDK读取（如果尚未设置）
      if (!process.env.ZAI_API_KEY) {
        process.env.ZAI_API_KEY = zaiApiKey
      }
      
      // 使用ZAI SDK调用大模型
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      
      console.log('尝试创建ZAI实例...')
      const zai = await ZAI.create()
      
      console.log('ZAI SDK创建完成，准备发送请求...')
      console.log('ZAI实例信息:', {
        hasApiKey: !!zai.apiKey,
        apiKeyPrefix: zai.apiKey ? zai.apiKey.substring(0, 8) + '...' : '未设置',
        envKey: process.env.ZAI_API_KEY ? process.env.ZAI_API_KEY.substring(0, 8) + '...' : '未设置'
      })
      
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: '你是一个智能助手，能够根据用户的提示词生成符合角色设定的回复。请严格按照角色设定来回答问题。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000
      })
      
      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('Empty response from AI model')
      }
      
      console.log('ZAI API调用成功，回复长度:', response.length)
      return response
    } catch (error) {
      console.error('ZAI API call failed:', error)
      
      // 如果ZAI失败，尝试使用OpenAI作为备用
      const apiConfig = getApiConfig()
      const openaiApiKey = process.env.OPENAI_API_KEY || apiConfig.openaiApiKey
      if (openaiApiKey && openaiApiKey !== 'demo-openai-key-for-testing') {
        try {
          console.log('尝试使用OpenAI作为备用...')
          return await this.callOpenAI(prompt, {
            ...config,
            apiKey: openaiApiKey
          })
        } catch (openaiError) {
          console.error('OpenAI fallback failed:', openaiError)
        }
      }
      
      // 如果都失败了，返回演示回复
      console.log('所有API调用失败，返回演示回复')
      return this.generateDemoResponse(prompt)
    }
  }

  private generateDemoResponse(prompt: string): string {
    // 演示模式：根据提示词生成模拟回复
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('科技') || promptLower.includes('ai') || promptLower.includes('人工智能')) {
      return '作为一个科技专家，我认为人工智能的发展正在改变我们的生活方式。从机器学习到深度学习，技术的进步让我们能够解决更复杂的问题。不过，我们也要注意技术发展带来的伦理问题，确保AI的发展能够造福人类。';
    }
    
    if (promptLower.includes('心理') || promptLower.includes('情绪') || promptLower.includes('情感')) {
      return '从心理咨询的角度来看，情绪管理是每个人都需要学习的重要技能。我建议您可以通过冥想、运动或者与朋友交流来调节情绪。记住，寻求帮助是勇敢的表现，不要独自承受压力。';
    }
    
    if (promptLower.includes('创业') || promptLower.includes('商业') || promptLower.includes('投资')) {
      return '作为一名创业者，我想说的是，创业不仅仅是有一个好点子，更重要的是执行力。市场验证、团队建设、资金管理，每一个环节都很关键。我的建议是：从小处着手，快速迭代，不断学习和调整。';
    }
    
    if (promptLower.includes('艺术') || promptLower.includes('文化') || promptLower.includes('文学')) {
      return '艺术是人类情感的表达，通过不同的艺术形式，我们能够传达内心深处的感受。无论是绘画、音乐还是文学，每一种艺术形式都有其独特的魅力。我鼓励大家多接触艺术，丰富自己的精神世界。';
    }
    
    // 默认回复
    return '这是一个很有趣的话题！我认为每个问题都有多个角度值得探讨。从我的经验来看，重要的是保持开放的心态，不断学习和思考。您对这个话题有什么特别的看法吗？';
  }

  private async callOpenAI(prompt: string, config: ModelConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private async callAnthropic(prompt: string, config: ModelConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0]?.text || ''
  }

  private async callOllama(prompt: string, config: ModelConfig): Promise<string> {
    try {
      const baseUrl = config.baseUrl || 'http://127.0.0.1:11434'
      let model = config.model || process.env.OLLAMA_MODEL; // Changed from 'llama3:latest'

      // 如果没有指定模型，则随机选择一个对话模型
      if (!model) {
        if (this.availableOllamaModels.length > 0) {
          model = this.availableOllamaModels[Math.floor(Math.random() * this.availableOllamaModels.length)];
          console.log(`随机选择Ollama模型: ${model}`);
        } else {
          throw new Error('未找到可用的Ollama对话模型。');
        }
      }
      
      console.log('Calling Ollama API:', { baseUrl, model })
      
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model, // Use the potentially new 'model' variable
          prompt: prompt,
          stream: false,
          options: {
            temperature: config.temperature || 0.7,
            num_predict: config.maxTokens || 2048,
            top_p: 0.9, // Preserve from original
            repeat_penalty: 1.1 // Preserve from original
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      return data.response || ''
    } catch (error) {
      console.error('Ollama API call failed:', error)
      throw new Error(`Ollama API call failed: ${error.message}`)
    }
  }

  private async callCustomAPI(prompt: string, config: ModelConfig): Promise<string> {
    if (!config.baseUrl) {
      throw new Error('Base URL is required for custom API')
    }

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      body: JSON.stringify({
        model: config.model || 'custom',
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000
      })
    })

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || data.content || ''
  }
}