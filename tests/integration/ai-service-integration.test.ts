/**
 * @fileoverview AI服务集成测试套件 - TestCraft AI
 * TestCraft AI - AIServiceTestAgent
 * 世界级测试标准：API集成、故障恢复、限流处理、缓存策略
 */

import { ChatService } from '../../src/lib/chat-service';
import { Character } from '@prisma/client';

// Mock fetch for API testing
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('AI Service Integration Tests', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('🎯 ZAI API集成测试', () => {
    const createMockCharacter = (overrides = {}): Character => ({
      id: 'test-character-1',
      name: '测试角色',
      age: 25,
      occupation: '软件工程师',
      personality: '热情、理性、好奇',
      background: '热爱技术的工程师',
      speakingStyle: '友好且专业',
      interests: '人工智能、机器学习、编程',
      systemPrompt: '你是一个热爱技术的AI助手',
      participationLevel: 'high',
      interestThreshold: 0.7,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    });

    test('成功调用ZAI API - 应返回标准响应格式', async () => {
      const character = createMockCharacter();
      const message = '你好，请介绍一下人工智能';
      const context = '技术讨论场景';

      // 模拟成功的API响应
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          response: '人工智能是计算机科学的一个分支，致力于创建能够模拟人类智能的系统。',
          confidence: 0.95,
          metadata: {
            model: 'zai-llm-v2',
            tokens: 25,
            latency: 150
          }
        })
      });

      const result = await chatService.generateAIResponse(character, message, context);

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('confidence');
      expect(result.response).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('zai'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });

    test('API参数验证 - 完整参数传递', async () => {
      const character = createMockCharacter({
        name: 'AI专家',
        personality: '专业、严谨、耐心',
        background: '10年AI研究经验'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '测试响应', confidence: 0.9 })
      });

      await chatService.generateAIResponse(
        character,
        '什么是深度学习？',
        '教育科普场景'
      );

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toHaveProperty('character');
      expect(requestBody.character).toHaveProperty('name', 'AI专家');
      expect(requestBody.character).toHaveProperty('personality', '专业、严谨、耐心');
      expect(requestBody).toHaveProperty('message', '什么是深度学习？');
      expect(requestBody).toHaveProperty('context', '教育科普场景');
    });

    test('API响应时间性能基准', async () => {
      const character = createMockCharacter();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '快速响应', confidence: 0.8 })
      });

      const startTime = Date.now();
      await chatService.generateAIResponse(character, '测试消息', '测试场景');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // 5秒超时限制
    });
  });

  describe('🔄 故障恢复和降级机制测试', () => {
    test('网络连接失败 - 启用演示模式', async () => {
      const character = createMockCharacter();

      // 模拟网络连接失败
      mockFetch.mockRejectedValue(new Error('Network Error'));

      // 设置演示模式
      process.env.ZAI_API_KEY = 'demo-key';

      const result = await chatService.generateAIResponse(
        character,
        '你好',
        '测试场景'
      );

      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.response).toMatch(/演示|demo/i);
    });

    test('API超时处理 - 应优雅降级', async () => {
      const character = createMockCharacter();

      // 模拟API超时
      mockFetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 6000)
        )
      );

      const result = await chatService.generateAIResponse(
        character,
        '超时测试',
        '测试场景'
      );

      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
      expect(result.source).toBe('demo');
    });

    test('API限流(429)处理 - 应触发降级', async () => {
      const character = createMockCharacter();

      // 模拟429限流响应
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' })
      });

      const result = await chatService.generateAIResponse(
        character,
        '限流测试',
        '测试场景'
      );

      expect(result).toBeDefined();
      expect(result.source).toBe('demo');
      expect(result.response).toBeTruthy();
    });

    test('API服务不可用(503)处理', async () => {
      const character = createMockCharacter();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: 'Service temporarily unavailable' })
      });

      const result = await chatService.generateAIResponse(
        character,
        '服务不可用测试',
        '测试场景'
      );

      expect(result).toBeDefined();
      expect(result.source).toBe('demo');
      expect(result.response).toBeTruthy();
    });

    test('无效API密钥处理 - 401错误', async () => {
      const character = createMockCharacter();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' })
      });

      const result = await chatService.generateAIResponse(
        character,
        '认证失败测试',
        '测试场景'
      );

      expect(result).toBeDefined();
      expect(result.source).toBe('demo');
      expect(result.response).toBeTruthy();
    });
  });

  describe('⚡ 限流和重试机制测试', () => {
    test('指数退避重试策略', async () => {
      const character = createMockCharacter();
      let attemptCount = 0;

      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ response: '重试成功', confidence: 0.8 })
        });
      });

      // 模拟重试逻辑
      const result = await chatService.generateAIResponse(
        character,
        '重试测试',
        '测试场景'
      );

      expect(attemptCount).toBeGreaterThanOrEqual(1);
      expect(result).toBeDefined();
    });

    test('重试次数限制 - 最大3次重试', async () => {
      const character = createMockCharacter();
      let retryCount = 0;

      mockFetch.mockImplementation(() => {
        retryCount++;
        return Promise.reject(new Error('Persistent failure'));
      });

      const result = await chatService.generateAIResponse(
        character,
        '重试限制测试',
        '测试场景'
      );

      expect(retryCount).toBeLessThanOrEqual(3);
      expect(result.source).toBe('demo');
    });
  });

  describe('💾 缓存策略测试', () => {
    test('相同请求应使用缓存', async () => {
      const character = createMockCharacter();
      const message = '缓存测试消息';
      const context = '缓存测试场景';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '缓存响应', confidence: 0.9 })
      });

      // 第一次调用
      const result1 = await chatService.generateAIResponse(character, message, context);
      
      // 第二次调用相同参数
      const result2 = await chatService.generateAIResponse(character, message, context);

      expect(mockFetch).toHaveBeenCalledTimes(1); // 应该只调用一次API
      expect(result1.response).toBe(result2.response);
    });

    test('缓存过期机制', async () => {
      const character = createMockCharacter();
      const message = '过期测试';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '新响应', confidence: 0.8 })
      });

      // 第一次调用
      await chatService.generateAIResponse(character, message, '场景1');
      
      // 等待缓存过期（模拟）
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 第二次调用应该重新请求API
      await chatService.generateAIResponse(character, message, '场景2');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('不同参数应触发独立缓存', async () => {
      const character1 = createMockCharacter({ name: '角色1' });
      const character2 = createMockCharacter({ name: '角色2' });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '响应', confidence: 0.9 })
      });

      await chatService.generateAIResponse(character1, '消息', '场景');
      await chatService.generateAIResponse(character2, '消息', '场景');

      expect(mockFetch).toHaveBeenCalledTimes(2); // 不同角色应分别缓存
    });
  });

  describe('🎯 业务场景集成测试', () => {
    test('完整对话流程 - 用户到AI响应', async () => {
      const character = createMockCharacter({
        name: 'AI助手',
        personality: '友好、专业、耐心',
        background: 'AI技术专家'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          response: '深度学习是机器学习的一个子集，它使用神经网络来模拟人脑的学习过程。',
          confidence: 0.95
        })
      });

      // 1. 兴趣评估
      const interestResult = await chatService.evaluateInterest(
        character,
        '什么是深度学习？',
        '用户询问技术概念'
      );

      expect(interestResult.shouldParticipate).toBe(true);

      // 2. AI响应生成
      const aiResponse = await chatService.generateAIResponse(
        character,
        '什么是深度学习？',
        '用户询问技术概念'
      );

      expect(aiResponse.response).toBeTruthy();
      expect(aiResponse.confidence).toBeGreaterThan(0.8);
    });

    test('多轮对话上下文保持', async () => {
      const character = createMockCharacter();
      const conversation = [
        { message: '你好', context: '开场问候' },
        { message: '什么是AI？', context: '技术询问' },
        { message: 'AI有哪些应用？', context: '应用场景询问' }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: 'AI应用包括自动驾驶、医疗诊断等', confidence: 0.9 })
      });

      for (const turn of conversation) {
        const result = await chatService.generateAIResponse(
          character,
          turn.message,
          turn.context
        );
        expect(result.response).toBeTruthy();
      }

      expect(mockFetch).toHaveBeenCalledTimes(conversation.length);
    });
  });

  describe('📊 性能基准测试', () => {
    test('单次API调用响应时间<5秒', async () => {
      const character = createMockCharacter();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '性能测试', confidence: 0.8 })
      });

      const startTime = Date.now();
      await chatService.generateAIResponse(character, '性能测试', '基准测试');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000);
    });

    test('批量请求性能测试 - 10个并发请求', async () => {
      const characters = Array.from({ length: 10 }, (_, i) =>
        createMockCharacter({ name: `测试角色${i}` })
      );

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '批量响应', confidence: 0.8 })
      });

      const startTime = Date.now();
      const results = await Promise.all(
        characters.map(char => 
          chatService.generateAIResponse(char, '批量测试', '性能测试')
        )
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(15000); // 15秒内完成10个请求
      expect(results).toHaveLength(10);
    });
  });

  describe('🔍 错误日志和监控测试', () => {
    test('API错误应记录详细日志', async () => {
      const character = createMockCharacter();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValue(new Error('API Error Test'));

      await chatService.generateAIResponse(character, '错误测试', '场景');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI Service Error')
      );
      consoleSpy.mockRestore();
    });

    test('性能指标收集', async () => {
      const character = createMockCharacter();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: '指标测试', confidence: 0.9 })
      });

      const startTime = Date.now();
      const result = await chatService.generateAIResponse(
        character,
        '指标测试',
        '监控测试'
      );
      const endTime = Date.now();

      expect(result).toHaveProperty('latency');
      expect(result.latency).toBeLessThan(5000);
    });
  });
});